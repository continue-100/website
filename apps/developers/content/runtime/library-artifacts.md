---
title: Library artifacts — runtime bitcode and PLIB
description: The two shipped library formats, the PLIB v3 container with a code section per target, how both are merged into a program, and the rules for changing either producer.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [runtime, packaging, llvm, stdlib]
related: [runtime/platform-and-packaging, llvm/runtime-ir-and-optimization, tooling/compiler-host-and-promotion, cookbook/add-a-runtime-or-stdlib-api]
---

A Prismio toolchain ships two kinds of library artifact, and both exist for the same reason: the optimizer has to see library bodies while it is optimizing the program, which an archive linked afterwards cannot provide.

| Artifact | Holds | Produced from | Consumed by |
| --- | --- | --- | --- |
| `lib/runtime/<module>.bc` | One runtime translation unit as LLVM bitcode | `runtime/*.c` via `clang -emit-llvm` | Merged into every program |
| `stdlib/<module>.plib` | One standard-library module: interface + bitcode per target | `std/*.psm` via the compiler itself | Merged when the program imports it |

Both are **per module**, deliberately. A single monolithic runtime artifact would be one file to replace for any change and one unit for LLVM to reason about; the sharded form keeps each translation unit independently replaceable and independently validated on disk, while `ir_link_library_modules` still merges them as one transaction.

## Runtime bitcode

`RUNTIME_BITCODE` in `tools/package.py` and `prismio_runtime_modules[]` in `runtime/build_driver.c` name the same set — currently `lang_runtime.c` and `program_support.c` — and `tools/check_source_lists.py` asserts they agree. Each is emitted twice: the ordinary module and a `.verify` variant compiled with `PRISMIO_AIF_VERIFY`, because a verify build must account for allocations made inside the runtime as well as in generated code.

The compile flags are part of the contract:

```bash
clang -O2 -fno-stack-check -fno-stack-protector \
      -Wno-deprecated-declarations [-DPRISMIO_AIF_VERIFY] \
      -emit-llvm -c runtime/<module>.c -o lib/runtime/<module>[.verify].bc
```

`-fno-stack-check` and `-fno-stack-protector` are not tuning. Apple and Homebrew clang configuration files inject stack-probing attributes intended for immediate native code generation; they are not a portable bitcode contract, and a later backend can reject the merged module because of them. Stack protection belongs to the final whole-program invocation.

Cross targets get their own subdirectory — `lib/runtime/<triple>/<module>.bc` — selected by `find_runtime_bitcode` when the target is explicit. A prefix carries only the targets it was packaged for, and a miss is an installation error naming the file rather than a silent host-module substitution.

## PLIB v3

A PLIB is a flat container, deliberately simple and deterministic. `compiler_plib_interface` reads it and `emit_stdlib_plib` writes it, both in `runtime/build_driver.c`, so the format has its reader and writer in one file.

```text
offset  size          field
0       8             magic "PRPLIB3\n"
8       4             module name length      (u32 LE)
12      8             interface length        (u64 LE)
20      4             section count           (u32 LE)
24      ...           module name             ("std.map")
        ...           interface               (the module's .psm source)

then, per section:
        4             triple length           (u32 LE)
        8             bitcode length          (u64 LE)
        8             verify bitcode length   (u64 LE)
        ...           triple                  ("" for the host, else e.g. "x86_64-apple-macos")
        ...           bitcode                 (normal build)
        ...           verify bitcode          (--verify build)
```

**The interface section is source text, and that is not laziness.** Generic bodies must be instantiated against the importing program's concrete types, so the frontend still parses them; `Map<String, Int>` in an application cannot have been compiled into the library. Codegen suppresses the original non-generic definitions, which arrive instead from whichever code section the build selected.

**One code section per packaged target.** The section whose triple is empty is the host the toolchain was packaged on, which is how a build with no `--target` asks for it; a build with `--target T` takes the section named exactly `T` — the same split, and the same spelling, as `lib/runtime/` against `lib/runtime/<triple>/`. `tools/package.py --target T --sysroot T=<path>` adds both halves for `T`; a project toolchain built by `prismio build` carries the host section only.

A PLIB used to carry the host section alone, merged whatever `--target` said. Building for `x86_64-apple-macos` on an arm64 Mac then printed this, and succeeded:

```text
warning: Linking two modules of different target triples: '.prismio-asker-plib-80608-0.bc' is 'arm64-apple-macosx27.0.0' whereas '.prismio-asker-80608.ll' is 'x86_64-apple-macos'
```

A target with runtime bitcode but no PLIB section is now an installation error:

```text
ERROR: Prismio installation is incomplete or corrupted.
       Missing standard-library bitcode for x86_64-apple-darwin in .../stdlib/io.plib
       Reinstall Prismio and try again.
```

The reader validates magic, bounds every length, rejects two sections for one triple, checks that the recorded module name matches the import that asked for it, and requires the file to end exactly where the sections say it should — a truncated or extended PLIB is rejected rather than partly trusted. The section is chosen when the libraries are merged, not when the import is read, because that is when the build's target is settled.

## Two producers, one format

`tools/package.py` builds these for a release; `compiler_emit_local_toolchain` builds them beside a `toolchain.host` artifact during an ordinary `prismio build`. Two producers of one format is drift neither side can see, so `run_ums_test` imports the packaging module and compares the bytes of a runtime module and a standard-library module built both ways. For the host-only case they must be **byte-identical**.

That check earned its place immediately. `clang -emit-llvm` records the source path in the bitcode's `source_filename`, so the same file compiled as `runtime/lang_runtime.c` from the repository root and as `../runtime/lang_runtime.c` from `ums/` produced two different `lang_runtime.bc`. Source paths are canonicalized with `realpath` before use for exactly that reason — `tools/package.py` resolves its own root the same way.

If you change how either artifact is built, change both and keep the comparison green.

## How they reach the program

`merge_libraries_into_program` extracts the bitcode for the build's target from each registered PLIB, validates every runtime module, and hands the whole set to `ir_link_library_modules`, which parses and links them in a single LLVM context. Doing it one artifact at a time reparsed and reprinted the growing program per input — accidentally quadratic in serialization, with a large program crossing the text-IR boundary sixteen times before optimization ever started.

After the merge, imported definitions with no remaining IR users are deleted, and the sweep repeats because removing one wrapper can make its callees dead. Without that, whole-program bitcode would turn every executable into an export of the entire runtime surface.

**A workload's stubs win the link.** A workload build — the program AIF runs to measure a layout profile — must not reach the file system, the environment or its input, so `generateExternStub` (`src/ir/module.psm`) gives every extern the runtime does not provide a body that calls `rt_workload_stub`. Some of those names are the runtime's own capabilities, `read_file`, `proc_*` and `io_stdin_*`, and the runtime module defines them too. Two definitions of one name do not link ("symbol multiply defined"), and the driver fell back to the static profile with the generic "the workload failed to build": every workload that imported `std.fs` or `std.process` had been measuring nothing, and `std.input` would have made it every workload that reads input. `yield_to_workload_stubs` in `runtime/llvm-api-backend.c` runs on each runtime module before the link and gives any function the program has stubbed `available_externally` linkage, which says "this body is a copy of one defined elsewhere", so the linker keeps the program's stub and discards the runtime's body. The suite's workload test builds a variant that imports those modules.

There is no source fallback on this path and no environment variable that restores one. The obsolete `PRISMIO_INLINE_RUNTIME` is ignored.

## Changing the set

Adding or removing a runtime module touches four lists, and `tools/check_source_lists.py` is what keeps them in step:

1. `prismio_toolchain_files[]` in `runtime/build_driver.c`
2. `RUNTIME_SOURCES` in `tools/bootstrap.sh` and `tools/bootstrap.ps1`
3. `RUNTIME_BITCODE` / `LIBRARIES` in `tools/package.py`
4. `tools/check_source_lists.py` itself

Adding a standard-library module needs none of them — both producers enumerate `std/*.psm` — but it does need a packaged toolchain before anything outside a checkout can import it.

Removing a symbol that codegen emits is a different and sharper problem: it fails one generation later, in the compiler still emitting the call. See [Compiler host and promotion](/tooling/compiler-host-and-promotion) for the ABI handshake that makes that migration self-repairing.
