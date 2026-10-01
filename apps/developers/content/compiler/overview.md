---
title: Compiler architecture
description: The self-hosted pipeline from source and imports through semantics, AIF, LLVM IR and linking — how to stop it at each stage, and which stage rejected your program.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [compiler, architecture, self-hosting, llvm]
related: [compiler/pipeline-and-driver, llvm/overview, compiler/bootstrap]
---

## What the compiler has to do

A `.psm` file is text. An executable is machine code that allocates, frees, and calls the operating system. The compiler gets from one to the other in seven stages, and each stage has exactly one kind of decision it is allowed to make:

```text
.psm source
  → lexer and parser                   is this well-formed text?
  → import resolution and flattening   which declarations exist?
  → semantic, type, ownership analysis is this a valid program?
  → Adaptive Inference Framework (AIF) where does each allocation live?
  → LLVM IR generation (LLVM C API)    what does it mean in LLVM terms?
  → optimisation and runtime link      what machine code runs it?
  → native executable
```

When you change the language, the first question is *which of these stages owns the change*. The answer is almost always the earliest one that can see the information, and every later stage then has to follow.

The compiler is **self-hosted**: the lexer, parser, semantic analysis, allocation inference, import resolver, LLVM generation, and driver orchestration are all written in Prismio. The C under `runtime/` is the LLVM bridge, the native AIF solver, the build driver, a few native tables, and the runtime that programs link.

## Stop it at any stage

Most stages have a command that stops right after them, and that is the fastest way to find out where a behaviour comes from.

| Command | Runs through | Prints |
| --- | --- | --- |
| `prismio check file.psm` | semantic analysis | diagnostics, or nothing |
| `prismio dump-ast file.psm` | semantic analysis | the checked, flattened AST as JSON — the form the AIF oracle reads |
| `prismio aif file.psm` | AIF | the allocation plan |
| `prismio build file.psm -o file.ll` | IR generation | textual LLVM IR |
| `prismio build file.psm` | the native link | an executable |

Given this program:

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    println("hello from prismio")
    return 0
}
```

`check` succeeds silently, and `-o hello.ll` stops after IR generation:

```bash
prismio check hello.psm && prismio build hello.psm -o hello.ll
```

```text
Wrote LLVM IR: hello.ll
```

A full native build can report where its time went, stage by stage:

```bash
PRISMIO_BUILD_TRACE=1 prismio build hello.psm -o hello
```

```text
[build trace] library bitcode merge         5.6 ms
[build trace] program -O3 (whole program)     57.3 ms
Built hello
```

That is the supported way to attribute a compile-time question to a stage. An ordinary program build prints those two lines. The per-source lines come from a target's `native` sources, which the compiler's own build.ums declares.

## Which stage rejected my program?

The diagnostic code tells you. Codes are permanent and grouped by the stage that owns them — driver and project `P10xx`, lexer `P2001`, parser `P3xxx`, ownership and FFI `P41xx`, AIF `P50xx`, and general semantic errors `P4001`/`P4002`. The [diagnostics page](/compiler/diagnostics) has the full table.

A parse error, from the parser, before any name has been looked up:

```text
error[P3201]: expected `)` in parenthesized expression, found `return`
 --> parse_err.psm:3:5
  |
3 |     return x
  |     ^^^^^^
error: aborting due to 1 previous error
```

An import that does not resolve, from the driver:

```text
error[P1001]: cannot read imported module `std.nothere`: no such file std/nothere.psm
 --> imp_err.psm:1:8
  |
1 | import std.nothere
  |        ^^^^^^^^^^^
error: aborting due to 1 previous error
```

A type error, from semantic analysis:

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let count: Int = "three"
    return count
}
```

```text
error[P4001]: initializer for `count`: expected Int, found String
 --> broken.psm:2:22
  |
2 |     let count: Int = "three"
  |                      ^^^^^^^
error: aborting due to 1 previous error
```

All three exit with status 1 and produce no output file. Past semantic analysis, failures change in kind. AIF can still reject a program — a `P50xx` code, usually an annotation it cannot honour — but an LLVM verifier message is always a compiler bug, not a user mistake: sema was supposed to reject anything that could produce one.

## What each stage decides

### Lexer and parser

The lexer converts UTF-8 source into tokens, preserving source positions for diagnostics. The parser constructs the AST for top-level declarations, statements, types, and precedence-climbed expressions.

Parser recovery can continue after selected failures to report independent issues in one run. Token presence is not feature evidence: `trait` and `impl` are implemented, while `throw` remains reserved without an accepted statement production.

### Import resolution and flattening

The CLI selects an entry `.psm` file, and its directory anchors dotted imports. The import resolver canonicalises each file, memoises cycles and diamonds, expands direct wildcard imports in sorted order, and flattens the resulting syntax trees into one program.

A `std.*` import is not parsed from source: it resolves to a precompiled `.plib`, and the resolver reads its interface from there.

Flattening leaves semantic analysis one combined set of declarations, and sema diagnoses duplicates or invalid overload sets across all of them. Which file a declaration came from travels on the node itself, as an id into the diagnostics file registry, along with the logical module path that file was imported by. That is what qualified calls, selective imports, and `private`/`internal` visibility are checked against.

### Semantic analysis

Semantic passes establish lexical scopes, resolve declarations, assign types, select overloads, validate fields and variants, enforce return and control-flow rules, and track ownership state.

This stage rejects invalid numeric combinations, wrong calls, member access on optional values, use after move, illegal drops, loop ownership hazards, and other static errors before code generation.

### Allocation inference

AIF runs after semantic, type, and ownership analysis. It consumes escape, alias, field, container, region, and ownership evidence to choose a supported allocation tier, or to refute an annotation. AIF is experimental; the source-level ownership contract is independent of which tier is selected. See [the AIF overview](/aif/overview).

### LLVM generation and verification

The IR layer maps Prismio types and statements through the LLVM C API, which the linked C backend exposes. It creates functions and globals, lowers control flow and runtime calls, and verifies the resulting module before emission. An output ending in `.ll` stops here.

LLVM module verification checks IR structural validity. It is not a substitute for language semantic analysis or runtime ownership verification. See [the LLVM backend overview](/llvm/overview).

### Optimisation and linking

For a native executable, the driver merges library bitcode into the program module *before* the optimiser runs, then compiles and links the result. The inputs are the program's IR, one PLIB bitcode section per imported `std.*` module, and one `.bc` per runtime translation unit from `lib/runtime/`. See [Library artifacts](/runtime/library-artifacts) for the two formats and [Platforms and packaging](/runtime/platform-and-packaging) for the layout they live in.

There is no curated subset, no source fallback, and no opt-out. The obsolete `PRISMIO_INLINE_RUNTIME` variable is ignored, and a missing module is an installation error naming the exact file.

The compiler's own build is the exception, and it is not a special case in the toolchain. Its `build.ums` declares the runtime and backend C as `native` sources with `runtime = "none"`, so `prismio build` in the checkout compiles them from the working tree and picks up C changes made after its host was built. A compiler generation needs more than the application runtime, and the installed toolchain does not know which files make one.

## Toolchain line

LLVM **23.1.1** is the supported backend line. Generated modules are verified before artifact emission.

Using a materially different LLVM line can fail even when a system `clang` exists, because textual and bitcode expectations and C API availability evolve. The setup scripts select the pinned toolchain.

The reference compiler reports version `0.1.0`. Self-hosted does not mean compiler behaviour is frozen; generation and fixed-point checks protect reproducibility while the language evolves.

## Trust and fixed points

A self-hosted compiler needs a compiler to build it. A committed, target-neutral **seed** — LLVM IR under `bootstrap/` — breaks that cycle. The seed builds a first compiler **generation**, which builds the next. Fixed-point comparison detects when successive generations disagree about the compiler source.

CI combines that check with positive and negative programs, AIF oracle tests, generated-symbol checks, and multi-platform builds. See [bootstrapping](/compiler/bootstrap) for the exact operational model.

## If you are changing the compiler

### Where each stage lives

The sources are organised by stage under `src/`:

| Directory | Stage |
| --- | --- |
| `src/lexer` | tokens and the UTF-8 scanner |
| `src/parse` | declarations, statements, expressions, recovery |
| `src/ast` | syntax nodes, semantic types, the AST dump |
| `src/driver` | import resolution (`imports.psm`) and compile orchestration (`compile.psm`) |
| `src/sema` | symbols, types, overloads, generics, traits, flow, ownership |
| `src/aif` | allocation facts, contracts, layout, reports |
| `src/ir` | LLVM types, expressions, statements, modules, debug info |
| `src/project` | the UMS-facing project commands |

`src/main.psm` parses the command line and dispatches; `src/driver/compile.psm` runs the pipeline for every command, so the analysis-only ones share the same imports and sema as a native build. The LLVM bridge is declared to Prismio through `extern fn` and implemented in the linked C backend.

This stage-oriented layout is a maintenance contract: a language change enters through the earliest appropriate layer and is then reflected in later layers, tests, diagnostics, specification, and documentation.

### The library merge, and why it is one transaction

`ir_link_library_modules` merges every library input in **one LLVM context, one transaction**. The earlier design reparsed and reprinted the growing program once per artifact, which made a module-wise package accidentally quadratic in serialisation work — a large program crossed the text-IR boundary sixteen times before optimisation.

Two policies apply at that boundary:

- **Inlining hints.** Imported functions get LLVM's `inlinehint` when they pass a cost filter that scores a call far higher than arithmetic. That is an eligibility filter, not a decision; LLVM's target-aware model still chooses.
- **`noinline` for environment and thread-local wrappers.** Wrappers that read the environment or take a thread-local address get `noinline` instead. Their calls stay dynamic after inlining, while the expanded control flow would change the greedy inliner's later ordering. That is a property of the IR, not a list of blessed names.

After the merge, imported definitions with no IR users are deleted, repeatedly, because removing one wrapper can make its callees dead. Without that, every executable would export the whole runtime surface.
