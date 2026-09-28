---
title: Compiler architecture
description: The self-hosted Prismio 0.1 pipeline from source and imports through semantics, AIF, LLVM IR, and native linking.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-09"
tags: [compiler, architecture, self-hosting, llvm]
related: [compiler/bootstrap, compiler/aif, specification/conformance]
---

The Prismio compiler is a self-hosted command-line program: its main lexer, parser, semantic analysis, allocation inference, import resolver, LLVM generation, and driver orchestration are written in Prismio itself.

A source file moves through these stages:

```text
.psm source
  → lexer and parser
  → import resolution and AST flattening
  → semantic/type/ownership analysis
  → Adaptive Inference Framework (AIF)
  → LLVM IR generation through the LLVM C API
  → Clang object generation and runtime link
  → native executable
```

Emitting an output ending in `.ll` stops after LLVM IR generation. A normal native build continues through object generation and runtime linking.

## Source loading and imports

The CLI selects an entry `.psm` file. Its directory anchors dotted imports. The import resolver canonicalizes each file, memoizes cycles and diamonds, expands direct wildcard imports in sorted order, and flattens resulting syntax trees into one program.

No module namespace survives flattening. Semantic analysis sees the combined declarations and diagnoses duplicates or invalid overload sets.

## Lexer and parser

The lexer converts UTF-8 source into tokens, preserving source positions for diagnostics. The parser constructs the AST for top-level declarations, statements, types, and precedence-climbed expressions.

Parser recovery can continue after selected failures to report independent issues in one run. Reserved tokens such as `trait`, `impl`, and `throw` do not have implemented grammar productions.

## Semantic analysis

Semantic passes establish lexical scopes, resolve declarations, assign types, select overloads, validate fields/variants, enforce return/control-flow rules, and track ownership state.

This stage rejects invalid numeric combinations, wrong calls, member access on optional values, use after move, illegal drops, loop ownership hazards, and other static errors before code generation.

## Allocation inference

AIF runs after semantic/type/ownership analysis. It consumes escape, alias, field, container, region, and ownership evidence to choose a supported allocation tier or refute an annotation. AIF is experimental; the source-level ownership contract remains independent of which tier is selected.

## LLVM generation and verification

The IR layer maps Prismio types and statements through the LLVM C API exposed by linked C/backend support. It creates functions/globals, lowers control flow and runtime calls, and verifies the resulting module before emission.

LLVM module verification checks IR structural validity; it is not a substitute for language semantic analysis or runtime ownership verification.

## Object generation and linking

For a native executable, the driver invokes the configured LLVM/Clang toolchain and links the installed Prismio runtime. That runtime is **LLVM bitcode, not an archive**: the toolchain ships one `.bc` module per runtime translation unit under `lib/runtime/`, and each standard-library module ships as a `.plib` carrying its own bitcode. Before optimization, the driver merges your program's IR, the bitcode of every `std.*` module you imported, and the runtime modules into a single LLVM module — one transaction, one context — so the optimizer sees runtime and library bodies while inlining, global optimization and dead-code elimination run.

There is no source fallback and no opt-out. A missing module is an installation error naming the exact file, not a silent switch to a slower path — the obsolete `PRISMIO_INLINE_RUNTIME` variable is ignored. That also means **a compiler is a layout, not a file**: a bare binary with no `lib/runtime/` beside it can compile nothing. See [Toolchain layout](/compiler/toolchain-layout).

Because whole-program bitcode would otherwise make every executable export the entire runtime surface, imported definitions with no remaining IR users are pruned after the merge, repeatedly — deleting one wrapper can make its callees dead.

The compiler itself is the exception, and only because its own manifest says so: its `build.ums` target declares `runtime = "none"` and lists the runtime and backend C sources as `native` sources, so a compiler generation picks up C changes made after its host was built. Any project can declare the same.

Setting `PRISMIO_BUILD_TRACE=1` prints one wall-clock line per build stage — the library bitcode merge, program optimization, and the link — which is the supported way to attribute a compile-time question to a stage.

The compiler sources are organized by stage under `src/`: `lexer`, `parse`, `ast`, `sema`, `aif`, and `ir`. `src/main.psm` owns the CLI, import resolver, and build orchestration. The LLVM bridge is declared to Prismio through `extern fn` and implemented in the linked C runtime/backend.

This stage-oriented layout is a maintenance contract: language changes should enter through the earliest appropriate layer and be reflected in later layers, tests, diagnostics, specification, and documentation.

LLVM **23.1.1** is the supported backend line. Generated modules are verified before artifact emission. The build driver embeds the runtime/toolchain sources needed to link ordinary programs.

Using a materially different LLVM line can fail even when a system `clang` exists, because textual/bitcode expectations and C API availability evolve. The setup scripts select the pinned toolchain.

The reference compiler reports version `0.1.0`. Self-hosted does not mean compiler behavior is frozen; generation and fixed-point checks protect reproducibility while the language evolves.

## Trust and fixed points

A committed target-neutral seed breaks the initial self-hosting cycle. The seed builds a new compiler generation, which builds the next. Fixed-point comparison detects when successive generations disagree about the compiler source.

CI combines that check with positive/negative programs, AIF oracle tests, generated-symbol checks, and multi-platform builds. See [bootstrapping](/compiler/bootstrap) for the exact operational model.
