---
title: Add a runtime or standard-library API
description: Choose the correct Prismio implementation layer, specify ownership, connect native symbols, and prove behavior across targets.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-25"
tags: [cookbook, runtime, stdlib]
related: [runtime/supported-surface, aif/ffi-contracts, llvm/llvm-c-bridge, runtime/overview, runtime/library-artifacts, tooling/compiler-host-and-promotion]
---

## What this page is for

A new capability for Prismio programs can be built in five different places — a portable `std/*.psm` function, a compiler builtin, a runtime (C) function, an LLVM bridge call, or a foreign `extern fn` an application brings itself — and picking the wrong one costs more than a rewrite. Put an algorithm in C and it becomes opaque to every Prismio-level analysis the compiler runs on it, including allocation inference. Get the ownership contract on a native return value wrong and the mistake does not show up as a crash; it shows up as a leak or a double-free that the language's own guarantees were supposed to make impossible. This page is the checklist for getting both of those right, in order: which layer owns the operation, how to state what it does to memory, and how to prove the answer holds.

Prefer `std/*.psm` for algorithms and supported application programming interfaces (APIs) expressible in Prismio. Reserve compiler builtins for representation-aware operations that lower directly to existing IR (intermediate representation). Use C for platform services, architecture intrinsics, LLVM objects, or narrow adapters Prismio cannot yet express.

## See it work

`--verify` builds a program against an instrumented runtime that keeps a ledger of every allocation a `std.*` function makes on the application's behalf, and prints it on exit. This is what proves a new producing API — one that hands the caller an owned value — does not leak:

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

```bash
prismio run ledger.psm --verify
```

```text
Built ledger
beta-two
aif-verify: 2 allocated, 2 released, 0 leaked, 0 violation(s)
aif-memory: 120 allocated bytes, 120 released bytes, 0 live bytes, 120 peak live bytes
aif-memory-sizes: <=16:0 <=32:0 <=64:2 <=128:0 <=256:0 <=512:0 <=1024:0 <=4096:0 >4096:0
aif-arena: 1 object(s), 16 byte(s), 1 region(s) on reporting thread
```

Both `.concat()` calls are the two allocations `std.string` makes; the ledger shows both released and nothing leaked. If your new API is the kind that returns an owned value, this is the check that has to come back clean — `0 leaked, 0 violation(s)` — before anything else about it matters.

## What failure looks like

`parseFfiContract()` accepts parameter contracts (`borrow`, `retain`, `retain_in(k)`, `consume`, `out`) and return contracts (`alias`, `produce(free_fn)`), and `semaCheckExternContracts()` rejects a contract used in the wrong position before allocation inference ever runs. Writing a parameter contract where a return contract belongs is a common slip:

<!-- prismio-check: fail -->
```prismio
extern fn bad_get_name() -> String borrow

fn main() -> Int {
    return 0
}
```

```bash
prismio check bad_contract.psm
```

```text
error[P4108]: `borrow` is a parameter contract and cannot appear on a return type
 --> bad_contract.psm:1:11
  |
1 | extern fn bad_get_name() -> String borrow
  |           ^^^^^^^^^^^^
  note: returns take `alias` or `produce(free_fn)`
error: aborting due to 1 previous error
```

The same function also catches a `retain_in(k)` that names an out-of-range argument or names itself, a `Slice` or `DataView` crossing the boundary without explicit marshalling, and a string-only contract applied to a non-`String` parameter — each with its own code in the `P41xx` family. Getting one of these rejections is the cheap failure. The expensive one is a contract that type-checks but is a lie: see **Native boundary** below.

## A worked example: a return that is a borrow, not a gift

`std/process.psm` declares the command-line argument accessor as:

```prismio
public extern fn cli_arg(index: Int) -> String alias
```

`cli_arg` hands back a pointer *into* `argv` — memory the operating system gave the process, not memory Prismio allocated. `alias` says exactly that: the caller may read it, but nothing about calling this function transfers ownership. Had it been declared `produce`, semantic analysis would trust that the returned pointer came from an allocator matching the named deallocator, and something downstream would eventually call that deallocator on `argv` itself. That is not a hypothetical: it is the specific mistake `produce`/`alias` exists to make impossible to express by accident, because a wrong declaration here is a contract violation baked into every caller, not a bug that shows up where the extern was written.

The general form: for an allocating return, every success and failure path must return storage the named deallocator accepts — a function that sometimes returns a string literal cannot honestly be declared `produce(free)`, because freeing a literal is the same class of bug as freeing `argv`. For an `alias`, document who owns the value and the event that invalidates it.

## Choose the owning layer

| Need | Owner | Typical integration |
| --- | --- | --- |
| Portable algorithm over public values | `std/*.psm` | Importable Prismio function |
| Representation-aware primitive | sema + `src/ir` | Recognized builtin lowered to IR/runtime call |
| Managed allocation or collection operation | `runtime/lang_runtime.c` | `extern fn` plus AIF (Adaptive Inference Framework) contract |
| Arguments, files, processes, diagnostics | `runtime/program_support.c` | Platform adapter plus std wrapper |
| LLVM construction | `runtime/llvm-api-backend.c` | Numeric-handle `ir_*` bridge only |
| Object emission and native linking | `runtime/build_driver.c` | Compiler-only driver API |

Do not place an application API directly in the LLVM bridge. Bridge functions manipulate compiler objects and are linked into the *compiler*; program runtime functions are linked into *generated applications* — mixing the two blurs a boundary that the rest of the toolchain assumes is solid.

### Who may call it

A program reaches the library through methods, operators and the few free functions a module keeps `public`. Everything else is `internal` — visible within `std` and nowhere else, which is the package rule applied to the `std` package:

- **A String or Char operation** is a method in `impl String` / `impl Char`. Its body may live in an `internal fn str…` that other `std` code shares; the method is the only spelling a program sees.
- **A runtime entry point a method lowers to** (a new `list_*` builtin, say) is refused when a program writes it: add its name and the method to write to `semaRuntimeCallSpelling` in `src/sema/vec.psm`.
- **A raw `extern fn`** that a wrapper exists for is declared `internal extern fn` in its std module, so the wrapper's ownership contract is the only way in.

## Native boundary

Declare the exact C-compatible signature. State whether each pointer-shaped parameter borrows, consumes, escapes, or aliases, and whether the return is static, borrowed, or newly produced with a named deallocator, using the contracts shown failing and succeeding above. Add the contract to the compiler's known table when it is a shipped runtime symbol — see **Name tables that must agree**, next.

An allocation returned to a Prismio caller goes through `rt_base_alloc`; an internal temporary the runtime frees itself does not. That seam is declared in `runtime/prismio_runtime.h`, and it is the other half of the ownership question: `produce`/`alias` states the contract at the Prismio boundary, `rt_base_alloc` is what makes a *produced* value the kind of allocation the ownership analysis can actually track on the way back out.

## Name tables that must agree

The allocation inference the compiler runs and the independent oracle it is checked against (see [the AIF differential](/testing/aif-differential)) each keep their own list of which foreign calls produce a value and which merely borrow one. A new runtime or standard-library symbol that allocates has to be added to the compiler's side of that list, or the two can classify the same call differently and the differential will not tell you why until it fails on an unrelated program:

| Compiler (Prismio) | Oracle (Python) |
| --- | --- |
| `aifCompilerBuiltinContract` (`src/aif/contracts.psm`) | `FFI_CONTRACTS` (`aif/prototype/aif.py`) |
| `aifRuntimeContract` (`src/aif/contracts.psm`) | `FFI_CONTRACTS` (`aif/prototype/aif.py`) |
| `aifFfiProduces` (`src/aif/contracts.psm`) | `FFI_RETURNS_PRODUCE` (`aif/prototype/aif.py`) |

### A Float operation: one table, not five

A numeric builtin normally touches five places: sema's return type and argument check, codegen's emission, the flat-List guard's safe-function table, `aifCompilerBuiltinContract`, and the oracle's `FFI_CONTRACTS`. If one of them is missing, the failure is silent. The guard declines every loop that calls it, or AIF stops bracketing the caller, and the suite stays green. `std.math`'s Float functions avoid this with one family, `__builtin_f64_<op>`, tabled once in `src/common/float_builtins.psm`:

| Reader | What it takes from the table |
| --- | --- |
| `src/sema/builtins.psm` | `floatBuiltinArity(name)` — a non-zero arity means "Float operands, Float result" |
| `src/ir/expr.psm` | `floatBuiltinSymbol(name)` — the LLVM intrinsic, or the libm name where LLVM has none |
| `src/ir/module.psm` | `floatBuiltinOp(i)` enumerates every name into the guard-safe table |
| `src/aif/contracts.psm` | every name is `AIF_FFI_BORROW` |
| `aif/prototype/aif.py` | `F64_BUILTIN_ARITY` generates the oracle's entries |

Adding `erf`, say, means adding one line to `floatBuiltinOp`, its name to the libm branch of `floatBuiltinSymbol`, one word to the oracle's tuple, and a method in `std/math.psm`. Because `src/` never imports `std.math`, the seed never compiles it, so a new operation needs no seed refresh.

**Choose the symbol for the weakest target, not this machine.** An intrinsic with no instruction on a target becomes a C call named after it. On an x86-64 without SSE4.1, which is the CPU a Linux or Windows build targets, `llvm.floor.f64` becomes `floor`, and `llvm.roundeven.f64` becomes C23's `roundeven`, which the Windows UCRT does not export. That is why `roundEven` lowers to `llvm.rint.f64`: it is the same rounding in the default mode, which Prismio never changes, and it is C99. Check a new operation by building a probe with `--target x86_64-pc-windows-msvc -o probe.ll`, running `third_party/llvm/bin/llc -O3` on it, and reading the `call` targets. Every one must be C99.

`irRuntimeProvides` in `src/ir/module.psm` is a separate table: it controls which undeclared runtime helpers code generation is allowed to synthesize as LLVM declarations, which matters if your new symbol is called from generated code rather than from an explicit `extern fn` a program wrote itself.

## Integration

Expose application-facing operations through a standard module. A new `std/*.psm` file needs no inventory update — both producers enumerate the directory — but it does need a packaged toolchain before anything outside a checkout can import it, because installed modules are compiled `stdlib/*.plib` artifacts rather than source. If a new native library is required, declare it through the UMS (Unified Manifest System) target rather than relying on an ambient developer machine.

A **new runtime translation unit** is different: its name is duplicated across four lists, and `tools/check_externs.py` is what keeps the promise those lists make honest. It does not scan the C sources for a definition — it reads the symbol table of the *built* bitcode and archive artifacts, which is what the linker actually sees:

```bash
python3 tools/check_externs.py --help
```

```text
usage: check_externs.py [-h] [--dist DIST]

Check that every `extern fn` has a definition in the shipped artifacts. An
`extern fn` is a promise that some C function exists under that exact name.
Nothing checked the promise. Six `ir_type_*` declarations sat in
`src/ir/bridge.psm` naming functions with no definition anywhere in `runtime/`
and no caller in `src/`, and they cost nothing only because nobody called them
-- the first caller would have got a link error pointing at the call site
rather than at the declaration that lied.
...
```
(excerpt — trimmed the rest of the tool's rationale and its `optional arguments` listing)

That six-declaration incident is the reason this check exists at all: a promise nothing calls costs nothing until the day something does, and then it fails as a linker error far from the lying declaration. See [Library artifacts](/runtime/library-artifacts) for the four lists a new translation unit's name has to appear in.

Adding a symbol to an *existing* runtime file needs no packaging change, but it is not shipped until the bitcode is rebuilt — `prismio build` refreshes the project-local toolchain, `prismio dist` refreshes a packaged one. A runtime symbol that code generation can emit should also appear in `PRISMIO_CURATED_OPS` in `build_driver.c`, or carry a recorded waiver: the `curated_emits` and `curated_closure` fixtures compare that list against what code generation actually emits, and a name may be absent only with a reason written beside it.

**Removing or renaming a runtime symbol that code generation emits is the dangerous direction.** It does not fail where you make the change; it fails one generation later, in a compiler that is still emitting the old call, as an undefined-symbol error naming a generated function rather than your edit. Keep the old symbol for one generation under `PRISMIO_BOOTSTRAP_COMPAT` and bump `PRISMIO_HOST_ABI` (application binary interface) — see [Compiler host and promotion](/tooling/compiler-host-and-promotion).

## Proof

Test empty, boundary, failure, ownership, and repeated-use cases. Run the verifier ledger shown above alongside plain value assertions, inspect the declarations code generation actually emits, and exercise every platform the API claims to support — a runtime helper is not complete until a packaged toolchain outside the checkout can link it.

Add a direct runtime test when the C behavior can be isolated, a Prismio execution test for the public surface, an AIF manifest assertion for ownership, and an IR assertion for symbol selection. Build with `--verify` to exercise the ledger hooks, as above, then run without verification to cover the ordinary ABI path a shipped program actually takes. If the API is platform-specific, test its *unavailable* path too, and do not declare platform support on the strength of one host succeeding.

## If you are changing the native boundary itself

`runtime/prismio_runtime.h` is where the `rt_base_alloc`/`rt_base_realloc`/`rt_free` seam and `PRISMIO_HOST_ABI` are both declared — read it before adding a new allocation entry point rather than reasoning from a call site. The full contract grammar (`parseFfiContract()`'s parameter and return forms) and the diagnostics that enforce it (`P41xx`) are worth reading end to end in `src/sema/ownership.psm` before writing a contract by analogy to a neighboring one; analogy is how a `produce` ends up on something that was actually a `borrow`.
