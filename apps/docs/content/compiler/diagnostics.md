---
title: Compiler diagnostics
description: Prismio 0.1 error rendering, recovery, warnings and notes, source spans, and the permanent codes the driver and project commands report.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [compiler, diagnostics, errors, warnings]
related: [errors, specification/conformance, compiler/cli, package-manager, guides/calling-c]
---

Prismio diagnostics include the source path, line, column, source excerpt, and a primary message. The frontend can recover from selected lexer/parser/semantic failures and report multiple independent errors in one invocation. Notes and warnings provide secondary context where available.

## Diagnostic stages

A failure can originate in:

- source loading or import resolution;
- lexical tokenization;
- parsing and recovery;
- name, type, control-flow, or ownership analysis;
- AIF constraint analysis;
- LLVM IR generation/verification; or
- object generation and native linking.

The first useful correction is normally at the earliest failing stage. A parser recovery diagnostic can cause later names to be missing, so fix syntax errors before treating every follow-up message as an independent type defect.

## Source spans

Paths and positions identify the source that contributed the failing declaration after import resolution. A primary span points to the token/expression most directly responsible; notes may identify an earlier declaration, move, or candidate signature.

Column interpretation follows the compiler's current source accounting and should not be parsed as a byte-offset protocol by external tools without a versioned integration contract.

The compiler exits nonzero when compilation fails and does not emit a runnable artifact as though the program were valid.

When selected recovery succeeds, multiple diagnostics can appear. This does not mean later phases run on a program accepted as valid; it is error recovery for developer feedback.

Every diagnostic carries a code in brackets, such as `error[P4001]` or `warning[P1077]`. Codes are permanent: a code is never reused for a different problem, and prose can improve without changing one. Most semantic errors share `P4001`, so a code names the stage that reported the problem and the message names the rule. The permanent identifiers used in this documentation, such as `use-after-move`, are URL keys for a specific rule. Each [error page](/errors) records the message fragment used by the audited tests, so match on that as well as the code.

## Reading a diagnostic

1. Locate the first primary error in the earliest source stage.
2. Read any note that points to the declaration, earlier move, or overload candidates.
3. Compare the operation's exact type and ownership mode.
4. Apply the smallest correction rather than casting, cloning through FFI, or adding annotations speculatively.
5. Recompile to reveal independent errors hidden by the first failure.

For ownership messages, distinguish mutability from ownership: `mut` enables assignment but does not revive moved data. For overload/type errors, remember that numeric widening is explicit. For optional errors, comparison with `none` does not flow-narrow; use `expect` where presence is established.

## Warnings and notes

A warning does not make compilation fail unless the driver documents otherwise. A note supplies context and is not independently actionable. 0.1 does not promise a stable warning-control flag set or warning-as-error policy.

When reporting a diagnostic bug, include the compiler version, full command, smallest source file that reproduces it, target platform, and complete output. Do not rely on color escape sequences or exact whitespace as a public API.

Also include imported reproducer files when name resolution matters, and emitted `.ll` when the failure occurs after semantic analysis. Remove secrets and machine-specific paths where possible while preserving the relevant directory layout.

The [error reference](/errors) is organized by permanent concepts, so pages stay linkable while diagnostic wording improves. The codes the driver and the project commands print are listed below.

## Codes

A code is `P` and four digits, and the leading digits say which stage reported it.

| Range | Reported by |
|---|---|
| `P10xx` | the driver and the project commands: reading sources, resolving imports, building, running, `prismio init`, the project's own compiler. Listed in full below |
| `P2001` | the lexer |
| `P30xx`–`P33xx` | the parser |
| `P4001`, `P4002`, `P41xx` | semantic analysis; `P41xx` is ownership and foreign functions |
| `P50xx` | AIF, the Adaptive Inference Framework |
| `UMS####` | the manifest: `build.ums` itself, printed as `build.ums:11:20: error[UMS2324]: ...`. See the [build manifest reference](https://developers.prismio.org/tooling/build-manifest#diagnostic-codes) |

The compiler contributor documentation explains [where each range is produced](https://developers.prismio.org/compiler/diagnostics#diagnostic-codes).

## Driver and project codes (`P10xx`)

These are the errors a command reports before or after the compiler proper: a missing file, a flag the command does not take, a project that cannot be built. The problem is usually in what you typed or in `build.ums`, and the note under the error often names the fix. For example:

```bash
prismio run --verbose
```

```text
error[P1019]: unknown argument `--verbose`
  note: arguments for the program go after `--`: `prismio run -- --verbose`
```

```bash
prismio build nope
```

```text
error[P1080]: this project declares no target named `nope`
  note: declared targets: checksum
```

A program's own exit status is never one of these. `prismio run` exits with the status the program returned, and prints nothing extra when that status is non-zero. Only a failure of the toolchain itself gets a `P` code.

The tables give each code's severity, the message it prints (with `x` standing for the name or path it fills in), and what to do. A warning does not stop the command. Codes `P1009`, `P1035`, `P1038`, `P1057`, `P1060`, `P1063` and `P1074` are not issued today, and a code is not reused, so the gaps stay gaps.

### Reading source files and imports

| Code | | Message | What to do |
|---|---|---|---|
| `P1001` | error | cannot read imported module `x`: no such file ... | An import names a file that is not there. Imports are rooted at the entry file's directory and use dots for directories; see [modules and imports](/language/modules) |
| `P1002` | error | package `x` contains no modules | A wildcard import names a directory with no `.psm` files |
| `P1005` | error | cannot read `path` | `prismio check` was given a file that does not exist or cannot be read |
| `P1008` | error | cannot read `path` | `prismio build` or `run` was given a file that does not exist or cannot be read |
| `P1068` | error | compiled standard-library module `x` is missing, incompatible, or corrupted | The installed standard library does not match this compiler. Reinstall Prismio; the message ends with the reason |
| `P1069` | error | the name `x` is already bound to `y` in this file | A file may bind each `as` name once. Choose a different alias |
| `P1070` | error | `as` names a module, and `x` is not one | `as` renames a whole module. Drop it from a selective import, or alias the module the declaration comes from |
| `P1071` | error | `x` is already the name of a module, so it cannot also be an alias | `x.f(y)` would mean two things. Pick an alias no module in the project has |
| `P1072` | error | an import group names modules, and `x` is a declaration inside `y` | A `{ ... }` group lists modules. Import a single declaration with its own `import y.x` |

### Building and running one file

| Code | | Message | What to do |
|---|---|---|---|
| `P1003` | warning | `--force-layout` did not apply | No candidate of that type keeps that many fields hot. `prismio aif --layout` lists the candidates |
| `P1004` | error | the installed Prismio runtime library is stale | The runtime library was built from different sources than the ones on disk, and the message prints both hashes. Re-package the toolchain with `tools/package.py`, or build from outside the source tree to use the installed runtime as it is |
| `P1006` | warning | this module declares more than one workload | Only the first `workload` is measured; the profiles are not merged |
| `P1007` | warning | the reason a `workload` did not produce a profile: it failed to build, exited with a failure status, timed out after 60 seconds, or wrote no profile | The build continues with the static profile. When the workload failed to build, the message names the kept driver IR |
| `P1010` | error | cannot write LLVM IR to `path` | The output path is not writable. Check the directory and its permissions |
| `P1011` | error | the native build step failed (llc/clang) | The compiler or linker failed, and its own output is printed above this line. An undefined symbol means an object never reached the link; see [Calling C from Prismio](/guides/calling-c) |
| `P1012` | error | could not start `path` | The program was built but the operating system would not start it. A program that starts and returns non-zero is not this error |
| `P1075` | warning | `x` is not part of the program `y`, so it was not checked | `prismio check --overlay` named a file the program never reads. An editor tries the next program that might |

### Command-line arguments

| Code | | Message | What to do |
|---|---|---|---|
| `P1024` | error | cannot find the Prismio runtime sources to hash | `prismio runtime-hash` reads the runtime sources of a compiler checkout, and found none |
| `P1025` | error | missing source file | `prismio check` needs a file |
| `P1026` | error | unknown argument `x` | `prismio check` takes `--diagnostic-format=json`, `--overlay` and `--module` |
| `P1027` | error | missing source file | `prismio dump-ast` needs a file |
| `P1028` | error | missing source file | `prismio aif` needs a file |
| `P1029` | error | `--force-layout=` takes `<Type>:<hot-field-count>` | Write it as `--force-layout=Particle:8` |
| `P1030` | error | `--budget=` must be at least 1 round | Give a positive round count |
| `P1031` | error | `--target` requires an LLVM target triple | `prismio aif --target` needs one, for example `wasm32-unknown-unknown` |
| `P1032` | error | unknown target triple `x` | LLVM does not know that triple. Check the spelling |
| `P1033` | error | unknown argument `x` | `prismio aif` does not take it. `prismio --help-all` lists the flags |
| `P1040` | error | `-o` requires an output path | Follow `-o` with a path |
| `P1041` | error | unknown optimization level `x` | Use `-O0` to `-O3` |
| `P1042` | error | `--target` requires an LLVM target triple | Follow `--target` with one, for example `x86_64-apple-macos` |
| `P1043` | error | unknown target triple `x` | LLVM does not know that triple |
| `P1044` | error | `--jit` and `--target` cannot be combined | The JIT runs the module inside this process, so it can only target the host |
| `P1045` | error | `--sysroot` requires a path to the target's SDK | Follow `--sysroot` with the SDK directory |
| `P1046` | error | `--jit` is only meaningful with `prismio run` | `build` produces an object; there is nothing to run in this process |
| `P1047` | error | `--jit` and `--target` cannot be combined | As `P1044`, reported when the target was chosen another way |
| `P1048` | error | `--force-layout=` takes `<Type>:<hot-field-count>` | As `P1029`, for `build` and `run` |
| `P1049` | error | use either `build` or `run`, not both | Name one verb |
| `P1050` | error | unknown argument `x` | `build` and `run` do not take it. For `run`, the note shows that the program's own arguments go after `--` |
| `P1079` | error | `--` passes arguments to the program `run` starts, and `build` starts none | Use `--` only with `run` |
| `P1039` | error | unknown command `x` | Not a built-in and not declared in `build.ums`. The note lists the built-ins, and the project's own commands follow |

### Creating a project

| Code | | Message | What to do |
|---|---|---|---|
| `P1013` | error | cannot use `x` as a project name | A name starts with a letter, a digit or `_`, and holds those plus `-` and `.`. Run `prismio init <name>` |
| `P1014` | error | `path` already exists | `init` never overwrites a manifest |
| `P1015` | error | could not create `path/src` | Check that the directory is writable |
| `P1016` | error | could not write `path/build.ums` | Check that the directory is writable |
| `P1017` | error | could not write `path/src/main.psm` | Check that the directory is writable |
| `P1018` | error | could not write `path/.gitignore` | Check that the directory is writable |
| `P1036` | error | `init` takes at most one name | Pass one name, or none to use the directory's |

### Project commands

These come from `prismio build`, `run`, `test`, `clean` and the commands a manifest declares.

| Code | | Message | What to do |
|---|---|---|---|
| `P1019` | error | unknown argument `x` | A project command takes `--release` and target names. For `run`, program arguments go after `--` |
| `P1020` | error | could not remove everything under `path` | `clean` could not delete the profile directory. Something inside may be open or read-only |
| `P1021` | error | this project declares no executable target to run | Add an `executable("name") { entry = "src/main.psm" }` to the manifest |
| `P1022` | error | this project declares more than one executable target | Name the one to run: `prismio run <target>` |
| `P1023` | error | could not start `path` | The executable was built but could not be started. Not the program's exit status |
| `P1037` | error | `clean` acts on the project and takes no source file | Run `prismio clean` from the project |
| `P1058` | error | could not prepare native linker inputs | A `link` or `native` entry could not be handed to the linker. The manifest checks (`UMS23xx`) catch most causes earlier |
| `P1059` | error | project command `x` failed at step N (`step`), exit status S | The step's program returned S, and that is the command's exit status. Its own output is above |
| `P1061` | error | a command step cannot build the `toolchain.host` target | Run `prismio build` first; the rebuilt compiler is promoted only after that process exits |
| `P1062` | error | a project command cannot be named `x` | The name is a built-in and built-ins win. Rename the command in `build.ums` |
| `P1078` | error | this project needs Prismio X, and this compiler is Y | The manifest's `prismio` is newer than the compiler. Install a newer Prismio, or lower it |
| `P1080` | error | this project declares no target named `x` | The note lists the declared targets |
| `P1081` | warning | dependencies are resolved and locked, but Prismio 0.1 does not import from them yet | Vendor the source beneath your entry module and import it by its dotted path |
| `P1082` | error | could not write `prismio.lock` | The manifest's directory is not writable |
| `P1084` | error | `--` passes arguments to the program `run` starts, and `x` starts none | Use `--` only with `run` |
| `P1085` | error | `clean` acts on the whole profile and takes no target | Run `prismio clean` alone |
| `P1086` | error | `x` is not an executable target | `run` needs an executable, not a test or library |
| `P1087` | error | `run` runs one target, and was given two | Program arguments go after `--` |
| `P1088` | error | `x` is not a test target | `prismio test` takes `test(...)` targets |
| `P1089` | error | could not create `path/tools` | The profile directory is not writable; `.psm` tools build there |

### The project's own compiler

A project can build its own compiler and have `prismio` use it; see [a project's own compiler](/package-manager#a-projects-own-compiler). These codes are about that compiler.

| Code | | Message | What to do |
|---|---|---|---|
| `P1034` | error | `prismio bootstrap` has been removed | Build the compiler from its checkout with `prismio build`; its `build.ums` names the C sources. With no compiler at all, `tools/bootstrap.sh --seed` builds one from the committed seed |
| `P1051` | error | the project-local compiler cannot replace itself without its global parent | Run `prismio build` through the installed compiler, not through the project's own |
| `P1052` | warning | the configured project host is not runnable | The file at `toolchain.host` will not start, so the global compiler serves the command. Rebuild it with `prismio build` |
| `P1053` | error | the compiler candidate did not build; the active local compiler was kept | The new compiler failed to build. The previous one still works |
| `P1054` | error | the compiler candidate did not start; the active local compiler was kept | The new compiler linked but would not run. The previous one still works |
| `P1055` | error | could not promote the compiler candidate | The new compiler could not replace the active one. The active one was kept |
| `P1056` | error | could not remove the project compiler after clean | Delete the file by hand |
| `P1064` | warning | the project compiler is from an older toolchain generation | It is being rebuilt with the global compiler first |
| `P1065` | warning | no target in this project builds the configured compiler host | `toolchain.host` names a path no target produces. The global compiler serves the command |
| `P1066` | error | the rebuilt project compiler reports a different generation | The installed compiler is older than the project's sources. Build a newer one from the checkout |
| `P1067` | error | the project compiler was built without its runtime and standard library | It can build itself and nothing else until this succeeds |
| `P1077` | warning | the project compiler was not built on this machine, so it will not be run | A compiler a cloned repository brought with it is never run. `prismio build` builds it here; until then the global compiler serves the project |
| `P1083` | warning | could not record the promoted compiler as built on this machine | The compiler was promoted but will not be run until a later `prismio build` records it |

When a command prints machine output (`--diagnostic-format=json` or `--manifest`), `P1077` is left out, so an editor's `check` sees only diagnostics about the file.
