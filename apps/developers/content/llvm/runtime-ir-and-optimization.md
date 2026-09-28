---
title: Runtime IR and optimization
description: Runtime-module curation, module linking, LLVM verification, optimization levels, alias metadata, object emission, and ORC JIT execution.
status: experimental
version: "0.1.0"
lastUpdated: "2026-09-28"
tags: [llvm, runtime-ir, optimization]
related: [llvm/llvm-c-bridge, compiler/loop-guards, performance/investigation-method]
---

Prismio emits program IR and combines it with runtime support before producing a native artifact.
The backend also runs LLVM's standard optimization pipeline and offers an opt-in ORC JIT path.
These are separate mechanisms: changing execution mode must not change the module generated from
the source program.

## Verification and optimization order

`ir_set_opt_level` clamps the requested level to 0–3. `ir_write_file` then:

1. calls `LLVMVerifyModule` on the unoptimized module;
2. runs `run_optimization` when the level is greater than zero;
3. verifies the optimized module again; and
4. writes textual IR using `LLVMPrintModuleToFile`.

Verifying before optimization preserves the useful failure boundary. Passing invalid IR into the
pass pipeline can produce an opaque crash or a secondary error far from the builder call that
created it. Verifying afterward catches any invalid metadata or transformation assumptions exposed
by the pipeline.

`run_optimization` constructs `default<O1>`, `default<O2>`, or `default<O3>`, creates
`LLVMPassBuilderOptionsRef`, and calls `LLVMRunPasses`. It passes no target machine, so this is
LLVM's target-independent module pipeline; the later native tool still performs target-specific
instruction selection and machine optimization.

`O1` already matters because Prismio deliberately emits addressable slots for source bindings.
Mem2reg and SROA remove ordinary stack traffic. Higher levels add inlining, loop transforms,
vectorization, global simplification, and more aggressive code-size/runtime tradeoffs.

## Metadata supplied to the optimizer

Optimization is only sound when the backend exposes facts it has proved:

- `tag_scalar` attaches scalar TBAA to ordinary loads and stores.
- `struct_field_tbaa_tag` creates struct-path tags using target offsets.
- `tag_list_header` separates header fields such as length, capacity, element size, and data.
- `tag_list_element` identifies element storage without claiming it cannot alias another element.
- `tag_list_region` scopes a proven non-overlapping element region.
- `tag_data_view` distinguishes view fields and backing storage.
- `tag_invariant_load` marks a load invariant only when mutation cannot invalidate it.
- `tag_list_count_range` attaches a valid integer range after the runtime invariant is known.

The backend also tags known runtime declarations. List constructors can receive return `noalias`
and function memory/nounwind/willreturn attributes. Mutator declarations receive conservative
memory behavior. These are not performance hints: an incorrect alias or memory attribute gives
LLVM permission to change observable behavior.

The guarded list operations in `llvm-api-backend.c` are designed to expose fast paths:
`ir_list_flat_scalar_elem`, `ir_list_flat_scalar_set`, `ir_list_flat_push_scalar`,
`ir_list_flat_copy`, and `ir_list_flat_zero_append` create checked straight-line access when
the frontend has emitted the necessary representation, capacity, and range guards. The fallback
calls the ordinary runtime helper.

## Library module merging

Runtime and standard-library support arrives as LLVM bitcode, and `ir_link_library_modules` merges
every selected module into the program in **one context, one transaction**. Linking them one at a
time reparsed and reprinted the growing program per input, which made a module-wise package
accidentally quadratic in serialization work — a large program crossed the text-IR boundary sixteen
times before optimization began.

Each source module is prepared before it is linked. `preserve_program_declaration_contracts` keeps
the program's own declaration attributes from being overwritten by the library's;
`clear_packaging_target_attributes` strips `target-cpu`, `target-features` and `tune-cpu`, which are
packaging-time tuning rather than a portable bitcode contract;
`mark_runtime_structural_invariants` reattaches the facts a portable runtime build cannot express,
such as the immutability of a list's inline stride.

`mark_library_interface_functions` then applies one policy to both PLIB and runtime boundaries.
Functions cheap enough by a cost model that scores a call far above arithmetic receive
`inlinehint` — an eligibility filter, not a decision, since LLVM's target-aware model still
chooses. Functions that read the environment or take a thread-local address receive `noinline`
instead: their calls stay dynamic after inlining while the expanded control flow perturbs the
greedy inliner's later ordering. Both tests are properties of the IR, deliberately not a list of
blessed function names.

After the merge, `prune_unused_imported_definitions` deletes imported definitions with no remaining
IR users, repeating until fixpoint because removing one wrapper can make its callees dead.
Reachable definitions keep external linkage, so this feeds no stronger visibility promise to the
inliner.

The older curated-extraction path — which compiled one runtime translation unit, cut a named subset
out of it with `ir_curate_module`, and merged only that — has been superseded by merging the shipped
bitcode whole. `PRISMIO_CURATED_OPS` in `build_driver.c` survives as a maintained list that the
`curated_emits` and `curated_closure` fixtures check against codegen, and its merge path is no
longer reached by an ordinary build.

`ir_link_modules(dest_ir, src_ir, out_path)`:

- creates a fresh context;
- reads both files with `LLVMCreateMemoryBufferWithContentsOfFile`;
- parses them with `LLVMParseIRInContext`;
- calls `LLVMLinkModules2`, which consumes the source module;
- writes the combined module; and
- disposes only the objects still owned by the caller.

LLVM object ownership matters here. Disposing the source module after a successful
`LLVMLinkModules2` is a double-free; omitting disposal of the destination/context on an early
parse error leaks compiler-process memory.

## Object and native output

Target selection creates `LLVMTargetMachineRef` from the chosen triple. The object path
(`ir_emit_object` in `runtime/llvm-api-backend.c`) sets the module triple/layout, runs verification
and optimization, and emits target objects with `LLVMTargetMachineEmitToFile`. Runtime and
standard-library bitcode has already been merged into that module, so the platform linker is
invoked with the program's objects plus UMS native link inputs.

### Internalization

A *closed* executable -- no `native {}` sources, no linked objects or response files, no
`exportDynamic` (`program_is_closed` in `build_driver.c`) -- has `main` as its only root, so
every other definition is made internal before the pipeline runs (`internalize_executable`), and
the pipeline starts with `globaldce`. This is the internalize step of an LTO link. Unused standard
library functions and the tables they reach are never optimized, code-generated or linked; the
benchmark suite went from 559 KB to 241 KB, and its optimization stage from 1.89 s to 1.06 s.

Internal linkage changes inlining. LLVM inlines an internal function's **only** call whatever its
size, which gave real wins (a string search specialised on its constant needle ran 0.55x) and
one systematic cost: a slow path split out on purpose so its fast half can inline into a caller's
loop is folded straight back. Size used to keep such halves apart. They must now say so --
`cold fn` in Prismio ([cold functions](https://docs.prismio.org/language/functions#cold-functions))
and `PRISMIO_NOINLINE` in the runtime. A new fast/slow split needs the same marker, or its fast
half will quietly stop inlining.

### Parallel machine code

After the whole program is optimized **as one module**, it is split into up to eight partitions
(heaviest function first onto the lightest partition, about 5,000 instructions each at least) and
each is lowered on its own thread, in its own `LLVMContext`, from one shared bitcode image. This is
LLVM's own LTO split, and the order is the point: every inlining and IPO decision has already been
made on the whole program, so unlike rustc's codegen units nothing is given up for the
parallelism. A local referenced across a partition boundary becomes a hidden global of the same
name; constants are copied into each partition that reads them. Machine code for the compiler
itself went from 2.1 s to 0.66 s. A `-g` build, or a module with aliases, ifuncs or inline
assembly, is emitted whole.

`delete_function_body` turns a body another partition owns into a declaration. It must erase
every instruction before deleting any block: a branch in a later block still names an earlier
block, and release LLVM does not assert on deleting a block that is still used. With one thread
the freed memory was rarely reused in time; with eight it corrupted other partitions' IR.

### Switches

| Variable | Effect |
| --- | --- |
| `PRISMIO_BUILD_TRACE=1` | Stage timings, including `parse merged IR`, `IR pipeline`, `machine code` and the partition count |
| `PRISMIO_CODEGEN_THREADS=n` | Exactly `n` partitions regardless of size; `1` emits the module whole |
| `PRISMIO_CODEGEN_VERIFY=1` | Verify each partition's module before lowering it |
| `PRISMIO_SAVE_IR=<file>` | Write the merged module the pipeline is about to run on, for timing `opt`/`llc` offline |

On Mach-O the link passes `-dead_strip`, so unreferenced functions in native objects go too;
exported symbols (`exportDynamic`) are roots and survive.

### The merged module stays in memory

`merge_libraries_into_program` still names a `libraries-<pid>.ll`, but a build no longer writes it:
`ir_hold_merged_module` keeps the linked module and its context, and `ir_emit_object` adopts them
when asked for that path. Printing and re-parsing it cost 70 ms of the benchmark suite's build
(16 MB of text for the compiler). `run --jit` and `PRISMIO_CODEGEN=clang` still get the file.

### What `exportDynamic` exports

On macOS and Linux it is the target's native objects' defined symbols, read with the toolchain's
`llvm-nm` and passed as `-exported_symbols_list` or `--dynamic-list` (`unix_export_flags`) -- what
Windows has always done. It used to be `-rdynamic`, which for the compiler exported ~44,000 LLVM
C++ symbols and made every one a `-dead_strip` root: the binary went from 135.8 MB to 125.2 MB. If
nm cannot run, the link falls back to `-rdynamic`.

An `.ll` output intentionally stops before native object/link stages. It is the best debugging
boundary for checking type shapes, call attributes, ownership helpers, vtables, blocks, and
optimizer effects.

## ORC JIT path

`ir_jit_run_main` is used only for explicit JIT execution. It initializes the native target and
assembly printer, creates an LLJIT instance, and makes host-process symbols visible. The existing
module cannot be handed directly to LLJIT because it belongs to the backend's context.

The function therefore:

1. serializes `g_module` with `LLVMWriteBitcodeToMemoryBuffer`;
2. creates a new `LLVMContextRef`;
3. parses the bitcode into that context;
4. transfers the context to an ORC thread-safe context;
5. transfers the parsed module to a thread-safe module;
6. adds it to the JIT dylib;
7. looks up the generated `main`; and
8. calls it with the program-support argument globals already initialized.

Every ORC operation returns `LLVMErrorRef`. `jit_failed` and `jit_failed_unresolved` convert
those objects to messages and dispose them. Ownership transfer is explicit: after an ORC
constructor consumes a context/module, the original cleanup path must not dispose it.

## Evaluating an optimization change

Start from equal source and checksums. Compare unoptimized IR, optimized IR, and final assembly.
Record function mnemonic counts so metadata-only movement does not look like code growth. Use an
A/A timing floor, multiple samples, medians, and the checked-in benchmark harness. Finally run
fixed-point generation: an optimization that speeds a small program but destabilizes or
miscompiles the self-hosted compiler is not acceptable.
