---
title: Compiler command-line reference
description: Complete Prismio 0.1 build, run, bootstrap, AST, AIF, target, optimization, and verification command reference.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-25"
tags: [compiler, cli, flags, commands]
related: [start/build-and-run, compiler/aif, compiler/targets]
---

## General commands

```text
prismio build <source.psm> [-o output] [options]
prismio run <source.psm> [options]
prismio check <source.psm> [--diagnostic-format=json] [--overlay <file.psm> <text>] [--module <name>]
prismio bootstrap [source.psm] [-o output]
prismio dump-ast <source.psm>
prismio aif <source.psm> [aif-options]
prismio runtime-hash
prismio --version
```

Passing a `.psm` file without a command is accepted as a build shorthand. Prefer the explicit form in scripts.

The same commands with **no source named** act on the project the nearest ancestor `build.ums` describes, and a project may declare commands of its own that are invoked the same way:

```text
prismio init [name]
prismio build|run|test|clean [--release]
prismio <declared-command> [args...]
```

Built-in commands take precedence, so a manifest cannot redefine one. See [the package manager](/package-manager) for the manifest and for declaring commands.

`--help` prints the command summary. `--version` reports the Prismio compiler and linked/pinned LLVM version information used to identify documentation compatibility, plus the compiler and standard-library directories it resolved — the quickest way to confirm which toolchain is in use.

### Which toolchain ran the command

When a project declares `toolchain.host`, the installed compiler is a launcher: it hands the whole command to that project-local compiler. It says which one it used, on stderr:

```text
Using local toolchain: /repo/.prismio/build/debug/prismio
Using global toolchain: /opt/homebrew/opt/prismio/bin/prismio
```

You see `global` when the declared host is missing, will not start, or is from an older toolchain generation than the compiler you invoked — in that last case the launcher rebuilds the host first and says so (`P1064`). A project with no `toolchain` block has made no such choice and prints neither line.

The banner is suppressed whenever the command's stdout is a format, so `--diagnostic-format=json` and `aif --manifest` stay parseable.

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

`run` performs a build and launches the resulting program after successful compilation. Compiler or linker failure exits nonzero and does not execute a stale artifact as though it were the requested program.

## `bootstrap`

```bash
prismio bootstrap components/main.psm -o build/prismio-next
```

`bootstrap` is the compiler-development path. It builds the compiler with repository backend/runtime sources rather than linking only the installed application runtime. Prefer repository bootstrap scripts for multi-generation and platform-specific orchestration.

## Inspection commands

`check` runs everything `build` does up to code generation — imports, parsing, type checking, ownership — and reports the diagnostics without producing a program. `--diagnostic-format=json` writes them one JSON object per line for an editor. A file that is one module of a larger program is checked through that program, since its imports resolve against the program's entry and it may use names the program shares: `prismio check src/main.psm --overlay src/parse/stmt.psm buffer.psm` checks the program with `buffer.psm`'s text standing in for `stmt.psm`, which is how an editor checks unsaved changes. `--module std.map` checks a standard-library module on its own.

`dump-ast` parses a source entry and prints the compiler's current AST representation for development. The textual representation is diagnostic/internal and is not a stable machine protocol.

`runtime-hash` prints the identity used to reason about the embedded/installed runtime content. It helps distinguish a compiler built with different runtime sources.

## Build options

| Option | Effect |
| --- | --- |
| `-o <path>` | Select output path; `.ll` emits LLVM IR only |
| `-O0` … `-O3` | Select requested optimization level |
| `--verify` | Instrument and check allocation/free behavior |
| `--debug` | Use conservative analysis and extra debugging behavior |
| `--target wasm32` | Emit a WebAssembly-targeted module (experimental) |

`-O0` through `-O3` are accepted front-end optimization requests. In 0.1, the object-generation driver also has current Clang optimization behavior, so a flag should not be interpreted as a frozen end-to-end pipeline contract. Record the complete compiler version and command in benchmarks.

`--verify` adds supported allocation/free lifecycle instrumentation. It can change performance and is intended for testing. `--debug` selects conservative analysis/debug behavior; it is not a promise of an integrated source debugger.

WebAssembly changes target layout/pointer width but does not provide complete browser or WASI packaging.

## AIF options

| Option | Effect |
| --- | --- |
| `--manifest` | Print the stable line-oriented compiler/CI manifest |
| `--summary` | Print an allocation-tier summary |
| `--why=<ID\|symbol>` | Explain a numbered report decision or stable manifest symbol |
| `--budget=<n>` | Set a positive analysis budget |
| `--theta-fields` | Include theta field information |
| `--owned-collections` | Treat collection ownership explicitly |
| `--copyable-collections` | Select copyable collection analysis mode |

Unknown commands and malformed flags exit nonzero. The default AIF report is an interactive interface and may evolve; use `aif --manifest` when automation needs the stable line-oriented protocol.

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
