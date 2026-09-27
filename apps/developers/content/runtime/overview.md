---
title: Runtime architecture
description: The native support Prismio programs link, how to see it in a built program, the boundary with compiler builtins and standard modules, and the runtime's ownership obligations.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-23"
tags: [runtime, architecture, native]
related: [runtime/supported-surface, runtime/allocation-arenas-rc-and-cycles, llvm/runtime-ir-and-optimization]
---

## What the runtime is for

LLVM IR can add numbers and branch. It cannot, by itself, grow a list, count references to a shared value, start a thread, or open a file. Generated code needs somebody to do those things, and in Prismio that somebody is the **runtime**: a small body of C, under `runtime/` in the compiler checkout, that is linked into every program.

It supplies what cannot be expressed as ordinary portable Prismio, or what has to coordinate directly with the compiler's generated representations and with the operating system.

Two C files are the runtime proper, and every program links them. The rest of `runtime/` is the compiler's own native half — its LLVM bridge, its allocation solver, its build driver — and never reaches a program.

## See what a program links

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let mut names: Vec<String>
    names.push("alpha".concat("-one"))
    names.push("beta".concat("-two"))
    println(names[1])
    return 0
}
```

`--verify` builds the program against an instrumented runtime that keeps a ledger of every allocation, and prints it on exit:

```bash
prismio run owned.psm --verify
```

```text
Built owned
beta-two
aif-verify: 2 allocated, 2 released, 0 leaked, 0 violation(s)
aif-memory: 120 allocated bytes, 120 released bytes, 0 live bytes, 120 peak live bytes
aif-memory-sizes: <=16:0 <=32:0 <=64:2 <=128:0 <=256:0 <=512:0 <=1024:0 <=4096:0 >4096:0
aif-arena: 1 object(s), 16 byte(s), 1 region(s) on reporting thread
```

The two `concat` results are the two allocations; both were released, and nothing leaked.

The runtime ships as LLVM bitcode beside the compiler, in an instrumented and an ordinary build:

```bash
ls .prismio/build/lib/runtime/
```

```text
lang_runtime.bc
lang_runtime.verify.bc
program_support.bc
program_support.verify.bc
```

That bitcode is merged into the program *before* optimisation, so a runtime function can be inlined like any other, and one nothing calls is deleted. The built executable defines only what it uses — 36 text symbols here, among them:

```bash
prismio build owned.psm -o owned && nm owned | grep ' T '
```

```text
000000010000156c T _arena_pop
00000001000014fc T _arena_push
0000000100000c88 T _concat__String_String
0000000100001a60 T _cyc_release
00000001000019f0 T _cyc_retain
00000001000021f0 T _list_push
00000001000022b0 T _list_push_grow
0000000100002a24 T _list_push_str
0000000100002680 T _list_release
0000000100000670 T _main
00000001000009f8 T _println__String
```

`list_push` and `arena_push` came from `lang_runtime.c` — `names.push(...)` compiles to the first; `concat` and `println` are standard-library Prismio that arrived the same way.

## What a runtime failure looks like

Where the runtime detects misuse it cannot recover from, it prints a `runtime error:` line and exits with status 1. A slice past the end of its Vec, from `tests/fixture_slice_bounds.psm`:

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let mut values: Vec<Int> = []
    values.push(1)
    let invalid = values[0..<2]
    return invalid.length
}
```

```text
Built slice_bounds
runtime error: slice range [0..<2] is outside collection length 1
error[P1012]: slice_bounds exited with a failure status
```

The first line is the runtime (`prismio_slice_check`); the second is `prismio run` reporting the exit status.

**Not every out-of-range access fails.** `list_get` with an index outside the list returns a zero value — `0` for a `Vec<Int>`, an empty string for a `Vec<String>` — rather than stopping the program. That is a deliberate single-compare fast path on the hottest read in the language, documented at its definition in `lang_runtime.c`. Slices are checked; plain element reads are not.

For ownership mistakes, the `--verify` ledger is the failure output: a non-zero `leaked` or `violation(s)` count names the problem even when the program's own output is correct.

## Three surfaces a program can reach

A program reaches native code in one of three ways, and they are not interchangeable:

- **Compiler builtins** are operations whose semantics and lowering belong to the compiler, such as reading the carried length of a tagged string. They look like calls and are not functions.
- **Standard modules** (`std.*`) provide the supported application APIs, implemented in Prismio where possible, and wrap every runtime symbol an application has business calling.
- **Foreign `extern fn` declarations** connect to C-compatible symbols, and must state their ownership behaviour. They are for foreign code an application brings itself, not for reaching into the Prismio runtime.

Moving a helper into C makes it opaque to ordinary analysis. Pretending a representation operation is an extern creates a symbol and ABI that should not exist. [Builtins, standard modules, and foreign code](/runtime/supported-surface) is the full map of what a program can call, and who owns what it returns.

## Runtime compatibility

The runtime and compiler ship as a matched toolchain. Internal layouts and symbols are not a stable cross-version ABI. Packaged applications merge the runtime bitcode modules discovered relative to the compiler executable, plus native inputs declared by their UMS (Unified Manifest System) target.

Runtime changes require compiler tests, native link tests, verifier coverage where relevant, and platform validation. A successful C compilation alone does not prove ownership or ABI agreement.

## If you are changing the runtime

### Which file owns what

| File | Major entry points | Ownership | Linked into programs? |
| --- | --- | --- | --- |
| `lang_runtime.c` | `rt_base_alloc`, strings, arenas, RC, cycles, lists, DataView, slices, profiling | Language data representations and memory mechanisms | yes |
| `program_support.c` | files, paths, process execution, CLI args, tasks, channels | Operating-system services and executable support | yes |
| `build_driver.c` | compiler output paths, runtime discovery, object cache, linking, promotion, embedded toolchain sources | Native build and installed-toolchain mechanics | no |
| `aif_support.c` | AIF graph, solver, layout, placement, reports | Native analysis engine used by the self-hosted compiler | no |
| `llvm-api-backend.c` | `ir_*` implementation | LLVM object ownership and IR construction | no |
| `ir_symbols.c` | names, declarations, scoped bindings, drop lists | Native tables needed during self-hosted lowering | no |

The public declarations are collected in `prismio_runtime.h`, `prismio_platform.h`, and `prismio_llvm.h`. `prismio_runtime.h` also carries `PRISMIO_HOST_ABI`, the version of the pairing between what a compiler generation emits and what the runtime it links defines.

### Allocation entry points

`rt_base_alloc`, `rt_base_realloc`, and `rt_free` are the ordinary base allocator seam. An allocation returned to Prismio goes through `rt_base_alloc`; an internal temporary the runtime frees itself does not. `rt_alloc` routes through the current arena hint when one is active. Compiler-selected mechanisms call `arena_alloc`, `rc_alloc`, or `cyc_alloc` directly through LLVM bridge helpers.

`prismio_memory_threads_enable` turns on thread-safe memory state before spawned work can overlap. `prismio_memory_thread_enter` marks a worker, and `prismio_memory_thread_cleanup` releases its thread-local arenas and pools. Generated code must not call the single-threaded RC (reference counting) path after a value has become cross-thread.

### What source can see

Some symbols are implementation details called only by generated IR: `rc_retain`, `list_push_slot`, `prismio_slice_check`, or `data_view_add_column`. Others back compiler builtins. The `std.*` modules provide the supported source-facing layer for ordinary programs. The compiler's `irRuntimeProvides` table controls which undeclared runtime helpers may be synthesised as LLVM declarations.

### Adding a C function

It needs an explicit caller:

- a standard module declares it with a reviewed FFI contract;
- a compiler builtin emits it through `src/ir`; or
- a build or tooling module declares it for compiler-process use.

Then update the public header, the embedded and runtime build inputs, the platform implementation or rejection, the ownership summary, link tests, the installed-runtime hash, and the packaged-toolchain test. An unused C symbol is not an API. [Add a runtime or standard-library API](/cookbook/add-a-runtime-or-stdlib-api) walks through it.
