---
title: Compiler diagnostics
description: How Prismio reports failures — stable codes, recovery that finds several errors in one run, warnings that don't stop a build, and how to read any of it.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [compiler, diagnostics, errors, warnings]
related: [testing/regression-suite, tooling/ide-protocol, compiler/cli, compiler/frontend]
---

A compile error is only useful if it says exactly where the problem is and
stays put across releases, so tooling — an editor, a CI log parser, a bug
tracker search — can key off it without re-parsing prose that might change
next release. Prismio's answer is a stable `P####` code attached to every
diagnostic, plus enough source position that an editor can underline the
right token, and recovery that keeps going after selected failures so one
invocation can report independent mistakes instead of one edit-rebuild round
per mistake.

## See it work: several errors in one run

Sema does not stop at the first mistake. Here, four unrelated errors in one
file are all reported together:

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let a: Int = "hello"
    let b = nowhere
    let c = 1 + true
    return "not an int"
}
```

```bash
prismio check multiple_errors.psm
```

```text
error[P4001]: initializer for `a`: expected Int, found String
 --> multiple_errors.psm:2:18
  |
2 |     let a: Int = "hello"
  |                  ^^^^^^^
error[P4001]: unknown identifier `nowhere`
 --> multiple_errors.psm:3:13
  |
3 |     let b = nowhere
  |             ^^^^^^^
error[P4001]: operator `+`: expected Int, found Bool
 --> multiple_errors.psm:4:17
  |
4 |     let c = 1 + true
  |                 ^^^^
error[P4001]: return: expected Int, found String
 --> multiple_errors.psm:5:12
  |
5 |     return "not an int"
  |            ^^^^^^^^^^^^
error: aborting due to 4 previous errors
```

The count in the last line matters as much as the messages: it is what
catches a *cascade*, where one real mistake gets reported several times
because a later check ran against the invalid type the first one produced.

`--diagnostic-format=json` turns the same group into one JSON object per
diagnostic plus a summary line, for a syntax error this time:

```bash
prismio check syntax_recovery.psm --diagnostic-format=json
```

```text
{"kind":"diagnostic","schemaVersion":1,"severity":"error","code":"P3201","file":"syntax_recovery.psm","line":1,"column":1,"length":1,"message":"expected a declaration, found `9` (expected one of `import`, `let`, `fn`, `extern`, `struct`, `enum`, `impl`, `trait`)"}
{"kind":"diagnostic","schemaVersion":1,"severity":"error","code":"P3201","file":"syntax_recovery.psm","line":7,"column":1,"length":1,"message":"expected a declaration, found `%` (expected one of `import`, `let`, `fn`, `extern`, `struct`, `enum`, `impl`, `trait`)"}
{"kind":"summary","schemaVersion":1,"errors":2,"warnings":0}
```

The lexer, parser, and sema never choose a renderer themselves — they build one
diagnostic group, and `--diagnostic-format=json` (via `diag_set_json_mode(1)`
in `cliCheck()`) decides afterward whether it becomes human text or JSON. That
split keeps a presentation change from ever changing compiler control flow.

## Warnings do not stop a build

A warning is reported but exits 0. `unique` on a value with no ownership to be
unique about — a plain `Int` — is one:

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let unique x = 5
    return x
}
```

```bash
prismio check unique_warning.psm
```

```text
warning[P4003]: `unique` has no effect on Int
 --> unique_warning.psm:2:9
  |
2 |     let unique x = 5
  |         ^^^^^^
  note: only owned values -- structs, strings and lists -- carry an aliasing fact
```

The command still exits `0`. 0.1 does not promise a stable warning-control
flag set or a warn-as-error policy — a warning is informational, not a second
severity of failure.

## How to read a diagnostic

1. Locate the first primary error in the earliest source stage — a parser
   recovery diagnostic can make later names go missing, so a syntax error can
   masquerade as several unrelated type errors.
2. Read any note that points at a declaration, an earlier move, or an overload
   candidate.
3. Compare the operation's exact type and ownership mode.
4. Apply the smallest correction rather than casting, cloning through FFI
   (foreign function interface), or adding annotations speculatively.
5. Recompile — independent errors hidden behind the first one are now visible.

Two mistakes worth naming because they read like something else: for
ownership messages, `mut` enables assignment but does not revive moved data —
mutability and ownership are different checks. For optional values, comparing
against `none` does not flow-narrow the type; use `expect` where presence is
already established.

## Diagnostic codes

Codes are grouped by the stage that owns them. They are not yet stable in 0.1, but
preserve an existing code when only improving prose; allocate a new one when tooling must
distinguish a new contract.

| Range | Owner |
| --- | --- |
| `P10xx` | driver and project commands (`P1001`–`P1089`, e.g. an unresolved import or an unknown target). Every code is listed with its message and fix in the [user reference](https://docs.prismio.org/compiler/diagnostics#driver-and-project-codes-p10xx) |
| `P2001` | the lexer (one code today — the frontend's tokenizer stage) |
| `P30xx` | parser declarations |
| `P3101`, `P3102` | parser expressions |
| `P3201` | parser core (unexpected token, missing delimiter) |
| `P33xx` | parser statements |
| `P4001`, `P4002` | general semantic errors (the catch-all; most of what you will see) |
| `P41xx` | ownership and FFI (`P4101`–`P4110`) |
| `P50xx` | AIF, the Adaptive Inference Framework (`P5001`–`P5007`) |
| `UMS####` | the manifest (`build.ums`): lexer, parser, lowering, validation, dependency resolution, planning. Listed in [the manifest reference](/tooling/build-manifest#diagnostic-codes) |

`P4001`/`P4002` cover most sema diagnostics because a fine-grained code per
rule was not worth the churn — the code identifies the *subsystem*, and the
message plus source span identify the rule. See [the compiler
overview](/compiler/overview) for where each of these stages sits in the
pipeline, and [the frontend page](/compiler/frontend) for `P2001`/`P3xxx`
examples from the lexer and parser specifically.

### Where each `P10xx` code is produced

Every driver and project code is a call to `diag_error_code` or `diag_warning_code` (or the `_at_` forms that carry a source position), so this is the map from a code to the file to open. The highest code issued is `P1089`; allocate the next number, and never reuse one. `P1009`, `P1035`, `P1038`, `P1057`, `P1060`, `P1063` and `P1074` are not issued today and stay unused.

| File | Codes |
|---|---|
| `src/driver/imports.psm` | `P1001`, `P1002`, `P1068`–`P1072` |
| `src/driver/compile.psm` | `P1003`–`P1005`, `P1008`, `P1010`–`P1012`, `P1075` |
| `src/driver/workload.psm` | `P1006`, `P1007` |
| `src/main.psm` | `P1024`–`P1034`, `P1036`, `P1037`, `P1039`–`P1050`, `P1073`, `P1076`, `P1079` |
| `src/project/ums_cli.psm` | `P1013`–`P1023`, `P1058`, `P1078`, `P1080`–`P1082`, `P1084`–`P1088` |
| `src/project/commands.psm` | `P1059`, `P1061`, `P1062`, `P1089` |
| `src/project/host.psm` | `P1051`–`P1056`, `P1064`–`P1067`, `P1077`, `P1083` |

A project command prints machine output when `--diagnostic-format=json` or `--manifest` is among its arguments. In that case the launcher (`dispatchToUmsHost`) prints neither the toolchain announcement nor `P1077`, so an editor's `check` on a project with an untrusted host gets the global compiler's answer and no launcher diagnostics. `P1052`, `P1064` and `P1065` are still printed.

## Failure changes in kind past semantic analysis

A syntax error, an unresolved import, and a type error — the failure classes
shown above plus `P10xx` import failures from the driver — all exit nonzero
and produce no output file, the same way. Past semantic analysis, a different
rule applies: AIF can still reject a program with a `P50xx` code (usually an
annotation it cannot honour), but an LLVM IR (intermediate representation)
verifier failure is always a **compiler bug**, not a user mistake — sema was
supposed to reject anything that could produce one before code generation ran
at all.

## Reporting a diagnostic bug

Include the compiler version, full command, smallest source file that
reproduces it, target platform, and complete output. Add imported reproducer
files when name resolution matters, and the emitted `.ll` when the failure
happens after semantic analysis. Remove secrets and machine-specific paths
while preserving the relevant directory layout. Regression tests should bind
to the stable meaning and source span of a diagnostic rather than incidental
punctuation, so wording can improve without breaking compatibility intent —
do not rely on colour escape sequences or exact whitespace as a public API.

## If you are changing diagnostics

### Where it lives

The self-hosted declaration surface — the codes and call sites sema and the
parser use — is `src/common/diagnostics.psm`. Storage, rendering, and JSON
serialization are the native diagnostic registry in `runtime/diagnostics.c`.
`diag_add_file()` assigns the file identifier carried by tokens and AST
(abstract syntax tree) nodes; `diag_set_file_module()` attaches the resolved
module qualifier so later visibility diagnostics can name both the source and
the namespace.

### A failure can originate in

- source loading or import resolution;
- lexical tokenization;
- parsing and recovery;
- name, type, control-flow, or ownership analysis;
- AIF constraint analysis;
- LLVM IR generation/verification; or
- object generation and native linking.

### Emission lifecycle

Use `diag_error_at_code()` or `diag_warning_at_code()` for a source-located
primary. Add supporting locations with `diag_note_at()` and prose-only context
with `diag_note()`, then call `diag_finish()` to close the group. Command
failures with no source use `diag_error_code()` or `diag_warning_code()`.
`diag_error_count()` is checked by driver stages before AIF and LLVM
generation runs; `diag_reset()` clears the registry between compiler
operations.

### Source spans

Paths and positions identify the source that contributed the failing
declaration *after* import resolution. A primary span points at the
token/expression most directly responsible; notes may identify an earlier
declaration, move, or candidate signature. Column interpretation follows the
compiler's current source accounting and should not be parsed as a stable
byte-offset protocol by external tools without a versioned integration
contract.
