---
title: Repository tour
description: Where each decision lives in the compiler checkout — compiler, runtime, std, UMS, tests, evidence — and how to find what owns a behaviour.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [repository, architecture, contributing]
related: [compiler/overview, runtime/overview, tooling/ums-overview]
---

## Finding where a change belongs

You have a behaviour you want to change — a diagnostic, a code shape, an allocation — and a checkout with about 55,000 lines of Prismio and C in `src/` and `runtime/` alone. The question this page answers is **which file owns the decision**.

The tree is organised by responsibility, and the rule for using it is: **start at the directory that owns the earliest decision your change affects**. A change to what the parser accepts starts in `src/parse` even if its visible effect is in the generated code, because every later stage follows from it.

## Trace a behaviour to its owner

The fastest route is backwards from something the compiler printed. Take this diagnostic:

```text
error[P4001]: initializer for `count`: expected Int, found String
```

Search for the fixed part of the message:

```bash
rg -n "initializer for" src
```

```text
src/sema/checker.psm:1884:            semaCheckValue(module, ptr_to_node(stmt.child2), varT, "initializer for ".concat(diagQuote(stmt.s1)))
src/sema/checker.psm:2252:            semaCheckValue(module, ptr_to_node(varNode.child2), varT, "initializer for global ".concat(diagQuote(varNode.s1)))
```

The message is assembled from pieces, so the next step is the function it is passed to — one callee below the match:

```bash
rg -n "fn semaCheckValue" src
```

```text
src/sema/ownership.psm:86:internal fn semaCheckValue(module: ASTNode, valNode: ASTNode, expected: TypeInfo, context: String) -> TypeInfo {
```

The rule is in `src/sema/ownership.psm`, not in the large checker that called it. **That is the usual shape**: `src/sema/checker.psm` owns the main visitors, and specialised behaviour lives beside its domain. Follow a call before assuming the big file owns the whole rule.

Then find the test that pins the behaviour. Negative fixtures state their expected diagnostic in an `// expect-error:` comment, usually the first line:

```bash
head -5 tests/neg_01_type_mismatch.psm
```

```text
// expect-error: initializer for `count`: expected Int, found Bool
fn bad_value() -> Int {
    let count: Int = true
    return count
}
```

Now you have the rule, its caller, and the fixture that fails if the rule changes.

## What a dead end looks like

A search that comes back empty usually means the text is built at runtime rather than written out. `P4001` itself appears exactly once in `src/`:

```bash
rg -n '"P4001"' src
```

```text
src/sema/checker.psm:21:    diag_error_at_code("P4001", node.file, node.line, node.col, node.len, message)
```

That is `semaErrorAt`, which every general semantic error goes through, so the code alone does not locate a rule. Search for the message text instead, then read one caller above and one callee below the match. That usually reveals whether the apparent owner is a parser rewrite, a semantic rewrite, an AIF fact producer, an LLVM operation, or a runtime implementation.

## The map

| Path | Responsibility |
| --- | --- |
| `src/lexer` | Token vocabulary and UTF-8 scanner |
| `src/parse` | Declarations, statements, expressions, and recovery |
| `src/ast` | Syntax nodes, semantic types, and AST serialisation |
| `src/sema` | Symbols, types, overloads, generics, traits, flow, and ownership |
| `src/aif` | Allocation facts, contracts, layout, solving, and reports |
| `src/ir` | LLVM types, expressions, statements, modules, and debug metadata |
| `src/driver` | Imports, workloads, and compile orchestration |
| `src/common` | Diagnostics, target selection, and shared text helpers |
| `src/project` | UMS-facing CLI and project commands |
| `runtime/` | LLVM bridge, native runtime, platform code, and build driver |
| `std/` | Importable Prismio standard modules |
| `ums/` | Manifest parser, model, resolver, build plan, and commands for the Unified Manifest System |
| `tests/` | Positive, negative, ownership, AIF, IR, and toolchain regressions |
| `tools/` | Python scripts: the suite runner, AIF differential, release gate, packaging, seed refresh |
| `bootstrap/` | The committed seed that builds the first compiler generation |
| `benchmarks/` | Equivalent Prismio, C++, and Rust workloads plus result artifacts |
| `aif/spec/` | Normative AIF (Adaptive Inference Framework) model documents |
| `aif/prototype/` | The independent Python implementation of AIF, used as an oracle |
| `aif/corpus/` | The programs the AIF differential runs over |
| `aif/evidence/` | Experiments, rejected ideas, and measured decisions, one `RESULTS-*.md` per piece of work |

Three documents are worth knowing before you change anything: `docs/KNOWN_ISSUES.md` (what is open), [the runtime surface](/runtime/supported-surface) (what a program can call, and who owns what it returns), and `CODE_STYLE.md` with its C counterpart `C_CODE_STYLE.md`.

## Where the project's state lives

There is no `TODO.md` or `HANDOFF.md`. The root handoff documents were re-audited into planners on
2026-09-25 (each claim checked against the tree, the originals recoverable from `1e338c0`), and
what replaced them is:

| Question | Where |
| --- | --- |
| What is left before v0.1.0 is published? | `RELEASE.md` at the root (the order, and what must be green first) and `docs/KNOWN_ISSUES.md`. There is no separate checklist file |
| What is planned, and why that way? | `docs/*_PLAN.md` — `COLLECTION_METHODS_PLAN`, `MEMORY_PLAN`, `CHANNELS_PLAN`, `PERFORMANCE_PLAN` — and `docs/COLLECTIONS.md`, each split into what 0.1 needs and what comes later |
| What is open, with enough to act on? | `docs/KNOWN_ISSUES.md` |
| What was measured? | `aif/evidence/`, one `RESULTS-*.md` per piece of work |
| What changed, and why? | `git log`. Commit messages here carry their own evidence, and are usually better than any document summarising them |
| What shipped, and how to ship it? | The docs site's release pages (`apps/*/content/releases/`), and `RELEASE.md` |

A new plan goes in `docs/`, not at the root. `RELEASE.md` §1 has two requirements the release gate
does not check for you, and both fail it wholesale: the candidate must be a **packaged** toolchain
(`tools/package.py`, not a bare `build/gN`, which has no runtime bitcode — 229 suite failures), and
the pinned LLVM must be first on `PATH` (`third_party/llvm/bin`), because an older system `llvm-nm`
or `clang` cannot read LLVM 23 bitcode. See [releases](/releases#what-a-release-record-must-contain).

## If you are reading the source

### Entry points

`src/main.psm` parses the CLI. `cliCheck()`, `cliDumpAst()`, `cliAif()`, and `cliBootstrap()` validate command-specific arguments; project-shaped commands are offered to `src/project/ums_cli.psm`. `src/driver/compile.psm` then provides `checkCommand()`, `dumpAstCommand()`, `aifCommand()`, and `compileSource()`, so analysis-only commands share the same imports and sema as native compilation.

The frontend entry sequence is `createLexer()` → `lexAllTokens()` → `parserCreate()` → `parseModule()` → recursive import loading in `src/driver/imports.psm` → semantic analysis. `src/sema/checker.psm` owns the main `semaExpr()` and `semaStatement()` visitors; generics, enums, ownership, traits, flow, imports, and symbol resolution are separate modules.

At the backend boundary, `src/ir/module.psm` creates a module and stages declarations before bodies; `src/ir/expr.psm` and `src/ir/stmt.psm` lower typed nodes. Their `ir_*` extern calls cross into `runtime/llvm-api-backend.c`, where numeric handles index LLVM objects owned by the bridge.

### The C side

The C boundary is split by trust and lifecycle:

- `runtime/llvm-api-backend.c` wraps the LLVM C API.
- `runtime/lang_runtime.c` supplies managed values, strings, collections, arenas, reference counting, and verifier hooks.
- `runtime/program_support.c` implements arguments, files, processes, tasks, channels, and other platform-facing services.
- `runtime/diagnostics.c` renders diagnostics, because it needs the original text of the file a node came from.
- `runtime/build_driver.c` turns verified IR into objects and native artifacts.

Adding a function to one file does not expose it automatically: declarations, AIF contracts, the shipped bitcode module set, and packaging may all need updates. See [the runtime overview](/runtime/overview).

### Tests and executable evidence

`tests/test_runner.py` is a registry plus specialised assertions, not only a directory glob. Straightforward `test_*.psm` programs build and run; `neg_*.psm` programs assert rejection, and nearly all of them name the expected message in an `// expect-error:` comment; ownership, AIF, debug-info, cache, JIT, packaging, and fixed-point cases use dedicated Python functions that inspect manifests or IR.

Run the suite through `tools/run_suite.py`, which tests a copy of the compiler rather than the one currently running, and pass `-k` to select fixtures. `tools/aif_differential.py` compares the production AIF pass with the Python oracle. `tools/release_gate.py` composes the release-level checks. `benchmarks/run.py` owns the cross-language measurement contract.

### Before trusting prose

Search the positive and negative suites before changing source; a test is often the shortest statement of current behaviour. For memory decisions, read both `src/aif` and the matching evidence document. AIF policy has changed through measurement, and historical prose — including comments — can describe a superseded experiment.
