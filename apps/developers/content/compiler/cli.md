---
title: Compiler command-line reference
description: Complete Prismio 0.1 build, run, test, project-command, AST, AIF, target, optimization, and verification command reference.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [compiler, cli, flags, commands]
related: [start/local-compiler-loop, aif/overview, tooling/debugging-targets-and-build-tracing]
---

## General commands

```text
prismio build <source.psm> [-o output] [options]
prismio run <source.psm> [options] [-- program-args...]
prismio check <source.psm> [--diagnostic-format=json]
prismio dump-ast <source.psm>
prismio aif <source.psm> [aif-options]
prismio runtime-hash
prismio --version
```

Passing a `.psm` file without a command is accepted as a build shorthand. Prefer the explicit form in scripts.

The same commands with **no source named** act on the project the nearest ancestor `build.ums` describes, and a project may declare commands of its own that are invoked the same way:

```text
prismio init [name]
prismio build [--release] [target...]
prismio run [--release] [target] [-- program-args...]
prismio test [--release] [test...]
prismio clean [--release]
prismio <declared-command> [args...]
```

Built-in commands take precedence, so a manifest cannot redefine one. See the
[`build.ums` reference](/tooling/build-manifest) for project configuration and declared commands.

`--help` prints the user command summary and, in a project, its declared commands; `--help-all`
adds `dump-ast`, `aif`, `runtime-hash` and the analysis flags. `--version` reports the Prismio compiler and linked/pinned LLVM version information used to identify documentation compatibility.

## `build`

```bash
prismio build components/main.psm -o build/app
```

`build` resolves source/imports, runs compiler analysis, emits LLVM IR, and—unless the output ends in `.ll`—creates and links a native artifact. The input file's directory is the source import root.

If `-o` is omitted, the driver chooses its current default output. Automation should pass an explicit path so artifacts do not depend on host naming conventions.

## `run`

```bash
prismio run components/main.psm
```

`run` performs a build and launches the resulting program after successful compilation, passing it
everything after `--` as its argument vector and exiting with its status. Every program the driver
starts -- `run`'s, a project command's step, a forwarded host -- is started through
`compiler_spawn_wait` (runtime/build_driver.c) with an argument vector, never a shell line.

## Building a compiler

There is no `bootstrap` command. The compiler is an ordinary UMS target whose `native` block lists
its backend and runtime sources, so `prismio build` in the checkout builds one, and nothing
installed knows which files make one. `tools/bootstrap.sh` / `tools/bootstrap.ps1` remain the independent path, including from
the committed seed. A named generation run from the checkout (`build/gen2 build`) builds and
promotes the project host with that generation.

## Inspection commands

`dump-ast` runs imports and semantic analysis through `dumpAstCommand()` and prints JSON consumed by
the independent AIF oracle. The schema is an internal compiler/oracle contract rather than a public
application protocol, but changes must update the oracle and differential fixtures together.

`runtime-hash` prints the identity used to reason about the embedded/installed runtime content. It helps distinguish a compiler built with different runtime sources.

## Build options

| Option | Effect |
| --- | --- |
| `-o <path>` | Select output path; `.ll` emits LLVM IR only |
| `-O0` … `-O3` | Select requested optimization level |
| `-g` | Emit DWARF and lower the program object at `-O0` for inspectable locals |
| `--verify` | Instrument and check allocation/free behavior |
| `--debug` | Use conservative analysis and extra debugging behavior |
| `--overflow-checks` | Emit checked integer arithmetic where implemented |
| `--target <triple>` | Select an LLVM target triple and target data layout |
| `--sysroot <path>` | Pass a target SDK to the native link step |
| `--jit` | Run through ORC JIT; valid only with `run` and not with `--target` |

`-O0` through `-O3` control the in-process LLVM module pass pipeline. Native object generation uses
the build driver's current Clang policy; `-g` deliberately changes the program object step to
`-O0`. Record the complete compiler version and command in benchmarks rather than treating the
front-end flag as a frozen whole-toolchain recipe.

`--verify` adds supported allocation/free lifecycle instrumentation. It can change performance and is intended for testing. `--debug` selects conservative analysis/debug behavior; it is not a promise of an integrated source debugger.

`--target` calls `targetSelect()` and asks LLVM for the triple's pointer width and data layout. The
native build still requires a matching packaged runtime or target C environment. WebAssembly target
selection does not by itself provide browser or WASI packaging.

## AIF options

| Option | Effect |
| --- | --- |
| `--manifest` | Print the stable line-oriented compiler/CI manifest |
| `--summary` | Print an allocation-tier summary |
| `--why=<ID\|symbol>` | Explain a numbered report decision or stable manifest symbol |
| `--budget=<n>` | Set a positive analysis budget |
| `--theta-fields` | Evaluate the stack threshold by field count for oracle comparison |
| `--owned-collections` | Treat collection ownership explicitly |
| `--copyable-collections` | Select copyable collection analysis mode |
| `--layout` | Print ranked layout candidates and the emitted selection |
| `--force-layout=<Type>:<hot>` | Force one candidate for measurement |
| `--target <triple>` | Evaluate target-dependent sizes for reports/layout |

Unknown commands and malformed flags exit nonzero. The default AIF report is an interactive interface and may evolve; use `aif --manifest` when automation needs the stable line-oriented protocol.

## Dispatch implementation

`main()` gives project-shaped invocations to `dispatchToUmsHost()` and the UMS command layer; a
source argument selects the single-file driver.

`--internal-host-abi <token>` is answered **before** dispatch and is deliberately absent from
`--help`. It is a protocol between two compilers: the command prints this executable's own
`PRISMIO_HOST_ABI` and exits 0 only when the argument matches. The launcher runs it against
`toolchain.host` before forwarding anything, and a compiler predating the command rejects the
argument as unknown and exits 1 — which is the same answer. Answering it before dispatch is what
keeps the reply about the binary asked rather than about the host it would otherwise forward to,
and what stops the launcher's own probe from recursing. See
[Compiler host and promotion](/tooling/compiler-host-and-promotion). `cliAif()` parses analysis flags and calls
`aifCommand()`. There is no bootstrap parser: `bootstrap` is a reserved name that answers `P1034`.
The build/run parser validates incompatible pairs such as `--jit` with `--target` before calling
`compileSource()`.

## Exit behavior

Successful inspection/build operations exit zero. Invalid arguments, missing input, compilation failure, IR verification failure, object/link failure, or a failed run step produce a nonzero result.

Do not parse color, whitespace, or prose from interactive commands as a stable API. For AIF records use `--manifest`; for other commands assert the exit status and expected artifact, and for negative compiler tests match only the diagnostic fragment needed to identify the rule.

## Script examples

Build a debuggable IR artifact:

```bash
prismio build components/main.psm -o build/main.ll -O0
```

Build a verified native test artifact:

```bash
prismio build tests/ownership.psm -o build/ownership-test --verify
```

Inspect one allocation decision:

```bash
prismio aif components/main.psm --why=request_buffer
```

Because the CLI is pre-1.0, scripts should also pin `prismio --version` and fail early when it differs from the expected toolchain.
