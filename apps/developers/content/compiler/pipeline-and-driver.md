---
title: Compiler pipeline and driver
description: How the driver carries source through imports, semantics, AIF, LLVM, object emission and linking — and why a program can pass every earlier command and fail at build.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [compiler, pipeline, driver]
related: [compiler/overview, llvm/overview, runtime/overview, aif/overview]
---

Five different `prismio` subcommands run overlapping amounts of the same compiler. `check` and `dump-ast` stop before any machine code exists; `build` and `run` go all the way to a linked executable. If those stages secretly ran different logic, a program that passed `check` could still fail `build` for a reason `check` had no way to catch — and one command's bug fix could silently miss the others. `src/driver/compile.psm` exists so that does not happen: one pipeline function per command, sharing the same imports, the same semantic analysis, and the same **Adaptive Inference Framework** (AIF) allocation model, and diverging only at the point each command is defined to stop.

## Pipeline

```text
entry source
  → recursive import loading and flattening
  → parsing and semantic analysis
  → AIF fact collection and tier selection
  → LLVM module construction and verification
  → optional IR emission
  → optimized object generation
  → runtime and native input linking
```

The frontend must reject an invalid program before intermediate representation (IR) generation ever runs. AIF is allowed to pick a more conservative allocation tier than the fastest legal one, but it must never make an invalid source program valid. LLVM module verification, further down, checks backend structure — not language semantics.

## See where a build spends its time

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    println("hello from prismio")
    return 0
}
```

```bash
PRISMIO_BUILD_TRACE=1 prismio build hello.psm -o hello
```

```text
[build trace] library bitcode merge        10.3 ms
[build trace] program -O3 (whole program)    128.1 ms
Built hello
```

An ordinary program build prints exactly those two lines. A per-source timing line appears for each C source a target's `native` block names -- the compiler's own build has eight -- because those are compiled, where the installed runtime is precompiled bitcode.

`check` and `dump-ast` run the same frontend and stop before any of this. `dump-ast` serializes the resolved **AST** (abstract syntax tree) as JSON for tooling and the AIF oracle to read:

```bash
prismio dump-ast hello.psm
```

```text
{"format":"aif-ast","version":1,"source":"hello.psm","compiler":"0.1.0","files":[{"id":0,"path":"hello.psm"},{"id":1,"path":"~/prismio/.prismio/build/stdlib/io.plib"}],"decls":[{"k":"EXTERN_FUNCTION","s1":"prismio_rt_print_float", ...
```

`check` prints nothing at all on success — no output means the program is accepted.

## A worked example: rejected only at the stage that checks it

Some legality is only visible to AIF, and AIF only runs as part of `aif` and `build` — never `check`. A `pin(T)` annotation tells the compiler "this value must land in tier `T`, or refuse to compile"; whether that assertion is true isn't knowable until AIF has actually converged on an answer. Given a value the analysis derives as `T2` while the source pins it to `T1`:

<!-- prismio-check: fail -->
```prismio
import std.io
import std.string

fn escapes() -> String {
    let pin(T1) s = "ab".concat("cd")
    return s
}

fn main() -> Int {
    let got = escapes()
    return 0
}
```

`check` runs the full frontend and passes — a refuted pin is not a semantic-analysis question:

```bash
prismio check pin_refuted.psm
```

No output, exit status 0.

`prismio aif` also completes, and does not enforce the pin either — it reports the plan `aif` describes, it does not gate a build with it:

```bash
prismio aif pin_refuted.psm
```

```text
AIF analysis
  Source   pin_refuted.psm
  Result   converged in 8 rounds
  Sites    113 potential allocation site(s), not runtime allocation counts

Storage plan
  Stack                   0
  Arena                   2
  Scoped heap             0
  Unique heap             111
  Shared heap             0
  Cycle-managed heap      0
  Cross-thread heap       0

Your code
  No allocation sites found.

Imported modules
  113 potential site(s) found in imported source.
  Imported sites are analyzed even when their functions are not executed.
...
Use `--why=<ID>` for one decision or `--manifest` for compiler/CI details.
```

(excerpt — the per-site table between the header and that last line is cut; exit status 0.) Only `build` rejects it, because only `compileSource` — the function behind `build` and `run` — calls `aifReportPins()` before generating code:

```bash
prismio build pin_refuted.psm -o pin_refuted.ll
```

```text
error[P5002]: pin(T1) cannot hold: this value is T2
    --> ~/prismio/.prismio/build/stdlib/string.plib:2126:35
     |
2126 |         if (total <= 12) { return __builtin_string_concat_inline2(self, other) }
     |                                   ^
  note: inference converged, so this is a proven-false assertion rather than a limit of the analysis
error[P5002]: pin(T1) cannot hold: this value is T2
    --> ~/prismio/.prismio/build/stdlib/string.plib:2127:19
     |
2127 |         let out = str_with_capacity(total)
     |                   ^
  note: inference converged, so this is a proven-false assertion rather than a limit of the analysis
error: aborting due to 2 previous errors
```

The location it names is inside `std.string`'s own `.plib`, not the caller's file — the pin's refutation happened where the value was actually produced, in a fast-path branch of `concat` itself. This is not a bug in the pipeline; it is what "AIF is allowed to reject a program, but only build (and run) enforce that" means once you hit it instead of read it. `check` and `dump-ast` are for frontend feedback loops precisely because they are cheap and never run AIF's pin gate — reach for `aif` or `build` when the question is about storage, not names and types.

## Command-dependent exits

`check` runs the complete frontend without creating LLVM IR or invoking the linker. `dump-ast` serializes frontend output for tooling and the AIF oracle. An output path ending in `.ll` stops after module generation. Native `build`, `run`, and `test` continue through object generation and linking.

## Native compilation

For a native artifact, the driver merges the generated program module with the bitcode of every imported standard-library module and every runtime module, compiles the result, and links it with any user-declared native inputs. The merge is not optional and has no fallback: a missing or unreadable module fails the build naming the exact file, rather than silently producing a slower program. `PRISMIO_BUILD_TRACE=1` is the supported way to attribute a compile-time regression to frontend work, the merge, program optimization, or linking, rather than guessing from wall-clock time alone.

## Change discipline

New behavior should enter at its earliest semantic owner: keep command-line parsing in `src/main.psm`, project behavior in `src/project`, compilation orchestration in the driver, and target-specific mechanics behind the runtime/backend bridge.

## If you are changing the driver

### Driver function reference

One function backs each command below, including `compileSource`'s own **JIT** (just-in-time) execution path:

| Function | Inputs and result | Role in the pipeline |
| --- | --- | --- |
| `analyzedModule(path)` | source path → merged AST | Reads source, lexes/parses it, resolves imports, indexes declarations, desugars enums, expands monomorphization work, and runs semantic analysis |
| `dumpAstCommand(path)` | source path → exit status | Stops after analysis and serializes the resolved AST as JSON |
| `checkCommand(path)` | source path → exit status | Runs the full frontend without producing IR or a native artifact |
| `aifCommand(...)` | path plus report flags → exit status | Runs the analyzed module through AIF and selects human, summary, ownership, theta-field, explanation, or manifest output — but does not call `aifReportPins` |
| `compileSource(...)` | path, output, and a `CompileOptions` (run, verify, debug info, optimization, JIT, overflow checks, installed runtime, run directory) → exit status | Owns target setup, AIF profile passes, module generation, output paths, native build, optional execution, and cleanup — this is the one that calls `aifReportPins` before codegen |
| `checkRuntimeFreshness()` | no input | Compares the hash recorded in the installed runtime library with the hash of the runtime sources on disk, when both exist, and stops with `P1004` before linking a stale library |
| `reportForcedLayouts()` | no input | Reports command-line AIF layout overrides after analysis |

`src/main.psm` parses the public command-line interface (CLI). `main` dispatches to `cliCheck`, `cliDumpAst`, `cliAif`, the project commands, or the build/run path. It reads process arguments only through `cli_arg_count` and `cli_arg`, so platform-specific `argc`/`argv` handling stays confined to `runtime/program_support.c`.

For an ordinary build, `compileSource` configures `compiler_set_debug_info`, `compiler_set_verify_mode`, the selected target/sysroot, overflow checks, and LLVM optimization. It asks `compiler_temp_ir_path` for a private intermediate, calls `generateModule`, and writes IR; an `.ll` output ends there. A native output continues through `compiler_build_executable`, which compiles the target's `native` sources through the object cache and links them beside the program. A target with `runtime = "none"` (`installedRuntime: false`), as the compiler's own is, links no installed runtime, so its runtime C comes from the checkout. `run --jit` calls `ir_jit_run_main` for JIT execution; ordinary `run` executes the linked temporary with `compiler_run_executable`.

Workload-guided AIF is a deliberate two-pass path, in `src/driver/workload.psm`: `runWorkloadProfile` enables workload mode, generates an instrumented executable, runs it with `compiler_run_workload`, and publishes the profile only on success. The final analysis then consumes that profile. `discardWorkloadProfile` and `endWorkloadPass` reset mode and delete temporary state so one compile cannot contaminate the next compiler invocation.

When adding a pipeline phase: define whether it requires parsed, imported, semantically resolved, or AIF-annotated input; whether it mutates the AST or writes side tables; how it reports failure; which temporary files it owns; and whether it must run in `check`, `dump-ast`, workload, JIT, and native-build modes. Add order assertions — a phase that happens to work after code generation on one fixture may still violate the compiler's data contract, the way `aif`'s pin check silently not running was a contract question rather than a crash.
