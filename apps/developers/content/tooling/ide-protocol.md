---
title: IDE and JSON diagnostics protocol
description: The analysis-only check command, versioned JSON Lines diagnostics, source positions, severities, and editor integration rules.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [ide, diagnostics, json]
related: [compiler/diagnostics, compiler/cli, cookbook/add-a-diagnostic, tooling/intellij-plugin]
---

Editors should invoke `prismio check <source.psm> --diagnostic-format=json`. The command runs
imports, parsing, semantic analysis, ownership checks, and relevant analysis without generating
LLVM IR, invoking the native linker, or creating an output artifact.

**A module is checked through its program.** `src/parse/stmt.psm` resolves `import lexer.token`
against the entry's directory, and uses `Parser` without importing it because a program's
modules share its names; checked as a program of its own it reports errors it does not have. An
editor runs `prismio check <entry> --diagnostic-format=json --overlay <file> <buffer>`: the
program reads `<buffer>` wherever it would read `<file>`, diagnostics name `<file>`, and the
editor shows the ones for that file. A program that never reads it answers warning P1075. A
standard-library module no program imports is checked alone as `--module std.<leaf>`. The
`IDE_PROTOCOL.md` in the compiler repository has the whole contract, and the order in which the
IntelliJ plugin looks for a file's program.

The wire contract is documented in the repository's `IDE_PROTOCOL.md`. Output is JSON Lines so a
client can process one diagnostic record at a time. Records identify schema version, severity,
message, source file, and source range according to the current protocol.

## Stream discipline

Diagnostic records are written to **stderr**, one JSON object per line, ending with a `summary`
record; stdout stays empty. A `note` record follows the diagnostic it explains, usually with no
location of its own, and belongs with it. A single stray non-JSON line must not stop a client
reading the rest, so a client that merges the two streams still parses correctly.

`aif --manifest` is the compiler's other machine-readable output, and it goes to stdout as plain
`key value` lines. Build progress, target selection and other explanatory status are stderr text and
are never JSON.

## Projects with their own compiler

A project can name its own compiler in `build.ums`, and the installed `prismio` forwards commands
to it, but only when this machine built it. An editor should not have to know any of that. When a
command carries `--diagnostic-format=json` or `--manifest`, the launcher prints no toolchain
announcement and no `P1077` (the project compiler was not built on this machine), and answers with
the global compiler, so `check` works in a freshly cloned project whose host has not been built.

Three launcher warnings are still printed as diagnostics with no file: `P1052` (the configured host
will not start), `P1064` (the host is an older generation and is being rebuilt first) and `P1065`
(no target builds the host). They describe the toolchain and not the file being edited, so a client
should not attach them to the file. The IntelliJ plugin drops them, with `P1077` should a compiler
ever emit it. See [the diagnostic codes](https://docs.prismio.org/compiler/diagnostics#the-projects-own-compiler).

## Source positions

Lexer and parser ranges must survive import loading and later semantic diagnostics. Recovery can
produce multiple records from one file; clients must not assume one invocation stops after the
first error.

## Compatibility

Treat schema changes as protocol changes. Add fields compatibly where possible, update the version
when interpretation changes, and keep fixtures for multi-file paths, Unicode source, zero-width
locations, warnings, multiple errors, and malformed input. Exact human prose may evolve without
changing a stable machine category when the protocol provides one.

## Diagnostic production

`common/diagnostics.psm` owns compiler diagnostics. Parser and sema code call location-aware
helpers rather than printing directly. `semaErrorAt`, `semaWarningAt`, and
`semaTypeErrorAt` supply the node span and source-level meaning; the shared diagnostic layer
chooses human or machine serialization.

The file table is created while the entry source and imports are loaded. Each AST/token span carries
that file ID plus line, column, and source offsets. Machine output resolves it to the original path;
it must not relabel all imported diagnostics as the entry file.

A machine record contains, at minimum, severity, message, source path, start/end position, and the
compiler's available stable category/code. Multiple records use JSON Lines: one complete JSON
object per line, never a JSON array mixed with status text.

`umsDiagnosticAdd` is the UMS counterpart. It stores code, manifest path, line, column, token
length and message. `umsDiagnosticsPrint` renders the collection after parsing,
lowering, and validation, allowing one run to report several independent manifest issues.

## AST and source tooling

`dumpAstCommand` uses `dumpAstJson` for a resolved compiler view. `jsonString`,
`jsonFieldStr`, `jsonFieldInt`, `dumpNode`, `dumpChain`, and `dumpFileTable` guarantee
valid escaping and stable structural names. This output is useful to editors and compiler tests,
but it is not a source formatter or a stable public semantic API.

Protocol tests should parse every emitted line with a real JSON parser; assert Unicode escaping,
CRLF and multiline spans, imported-file paths, zero-width EOF errors, warnings mixed with errors,
several recoverable errors, UMS diagnostics, empty success output, and strict stderr separation.
