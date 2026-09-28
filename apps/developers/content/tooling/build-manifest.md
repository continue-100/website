---
title: build.ums manifest reference
description: The developer reference for Prismio workspace, target, profile, dependency, toolchain, source, output, and native link declarations.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-28"
tags: [ums, manifest, reference]
related: [tooling/ums-overview, tooling/build-graph-and-linking, tooling/compiler-host-and-promotion]
---

`build.ums` is the project manifest consumed by UMS. Its schema is implemented by the parser and
model under `ums/`; this page describes the current model rather than promising a permanently
stable syntax.

## Project structure

A manifest describes a project, its build profiles, and named targets. An executable target names
its Prismio entry source, and may declare C sources it compiles (`native { source include define
flag responseFile }`), what it links (`link { library search file framework responseFile }`),
whether it merges the installed runtime (`runtime = "installed" | "none"`), and whether it exports
its symbols (`exportDynamic = true`). `profiles { debug { ... } release { ... } }` sets
`debugInfo` and `overflowChecks` per profile.

**Nothing about a target is built into the toolchain.** The compiler repository's `prismio` target
is an ordinary executable: the runtime and backend C files are its `native` sources,
`runtime = "none"` because it carries the checkout's runtime, and LLVM comes from the response files
`tools/setup_llvm.py` writes. It used to link a `component("prismio.backend")` that every shipped
compiler knew how to build; that knowledge is gone from the compiler, and `component` is no longer a
link declaration.

## Bootstrap host

The stable `toolchain` block can name a project-local host compiler, under `.prismio/`. An installed
parent compiler uses that information before delegating the full command, and only to a host this
machine promoted: promotion writes `<host>.trusted` with the file's identity, and a host that does
not match it is never started (`P1077`). Keep this block early and compatible with the bootstrap
reader.

## Validation

Paths are resolved relative to the manifest and owning package. Duplicate names, missing entries,
invalid dependency graphs, incompatible target fields, and unresolved native inputs should fail
before compilation. Diagnostics must identify the manifest location and the recovery action.

Use `ums/model/manifest_writer.psm` when a tool must produce a canonical manifest; do not assemble
UMS text with unrelated string formatting.

## Lexer and parser functions

`umsLex(source, path, diagnostics)` emits `UmsToken` records through `umsToken`. Each token
contains kind, value, byte offset, line, column, and length. `umsTokenKindName` supports
diagnostics. The UMS lexer has its own identifier, number, string, punctuation, newline, and comment
rules; it does not reuse Prismio source tokens.

`umsParse(tokens, path, diagnostics)` produces `UmsAstDocument`. Statements are built through
`umsAstStatement`; values distinguish strings, numbers, booleans, identifiers, arrays, and nested
blocks. Nodes retain source spans and enough raw boundaries for manifest-preserving edits.

## Lowering into the project model

`umsLowerDocument(document, root, manifestPath, profile, diagnostics)` is the semantic pass for
the manifest. It interprets known blocks/keys, converts dependency scope names with
`umsDependencyScope`, creates targets with `umsTarget`, creates native inputs with
`umsLinkInput`, and creates commands/steps/arguments with `umsCommand`,
`umsCommandStep`, and `umsCommandArgument`.

Unknown keys, duplicate declarations, wrong value kinds, and misplaced blocks are diagnosed at
their UMS spans. Lowering applies defaults only where the manifest contract defines one; command
execution does not guess missing target entries or dependency paths.

Validation helpers make policy explicit:

- `umsValidName` checks package/target/dependency naming;
- `umsValidVersion` validates version components;
- `umsValidLicenseExpression` checks the supported license grammar;
- `umsRunnableScript` rejects unusable script paths/commands; and
- `umsAbsolutePath` enforces fields that require a rooted path.

File-existence validation joins paths under the project root. It must not accept traversal that
escapes the declared workspace.

## Source-preserving writer

`umsManifestAddDependency` lexes/parses the original manifest and returns `UmsManifestEdit`.
It uses `umsManifestDependencyBlock` to find an existing scope, then
`umsManifestInsertDependency` or `umsManifestAppendDependencyBlock`.
`umsManifestNewline`, `umsManifestIndentAt`, and `umsManifestChildIndent` preserve newline and
indent style. `umsManifestEscape` quotes names, paths, and versions safely.

A writer change needs round-trip tests for LF/CRLF, empty files, existing and missing dependency
blocks, indentation, comments, escaped strings, duplicate dependencies, and an unchanged result
when no edit is required.
