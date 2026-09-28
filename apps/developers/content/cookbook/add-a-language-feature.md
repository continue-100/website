---
title: Add a language feature
description: A complete contributor path for changing Prismio syntax or semantics across tokens, parsing, types, ownership, AIF, LLVM, tests, and docs.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-17"
tags: [cookbook, compiler, language]
related: [compiler/frontend, compiler/semantic-analysis-and-types, testing/regression-suite, compiler/overview, aif/overview]
---

## What this page is for

A language change touches more of the compiler than it looks like it should, because Prismio is self-hosted: the lexer, parser, semantic analysis, and allocation inference that would process *your* new syntax are themselves written in the language you are changing. Get the sequencing wrong and the failure does not show up where you made the edit — it shows up a stage later, or a generation later, with a message that does not point back at the cause. This page is the order that avoids that: which stage owns the decision, what proves it works, and the one rule that keeps a self-hosted compiler able to build itself while you do it.

Begin with the source-level rule and its rejected boundary. Decide whether the change is syntax, semantics, library behavior, or only an optimization — each has a different earliest owner, and the first question below is how to tell them apart.

Write three examples before editing any file: the smallest accepted program, the closest rejected program, and one interaction with an existing feature. These become your positive test, your negative diagnostic, and your regression boundary. If the proposed behavior can be expressed entirely in `std/*.psm`, it is a library change and should not add a token or an AST (abstract syntax tree) node at all.

## See it work

`prismio check` runs a program through semantic analysis and prints nothing when it accepts the program — silence, not an empty block, is the success case. `prismio dump-ast` runs the same analysis and prints the checked, flattened AST as JSON, which is the exact form the independent AIF (Adaptive Inference Framework) oracle reads instead of the compiler's internal structures:

<!-- prismio-check: pass -->
```prismio
import std.io

fn add(a: Int, b: Int) -> Int {
    return a + b
}

fn main() -> Int {
    println(add(2, 3))
    return 0
}
```

```bash
prismio dump-ast small.psm
```

```text
{"format":"aif-ast","version":1,"source":"small.psm","compiler":"0.1.0","files":[{"id":0,"path":"small.psm"},{"id":1,"path":"./std/io.psm"}],"decls":[{"k":"EXTERN_FUNCTION","s1":"prismio_rt_print_float","s2":"prismio_rt_print_float","i1":0,"i2":1,"ln":30,"co":19,"le":22,"fi":1,"ty":"","c1":[{"k":"FUNCTION_PARAMETER","s1":"value","s2":"","i1":0,"i2":0,"ln":30,"co":42,"le":5,"fi":1,"ty":"","c1":[{"k":"TYPE_ANNOTATION","s1":"Float", ...
```
(excerpt — the full dump covers every flattened declaration, including everything `import std.io` pulled in)

This is why a new AST field has to be added to `src/ast/dump.psm` in the same change that adds it to the node: an omitted field is invisible to the compiler itself but makes the oracle analyze a *different* program than the one that was actually compiled.

## What failure looks like

Token presence is not feature evidence. `trait` and `impl` are implemented; `throw` is reserved vocabulary with no accepted statement production behind it yet. The lexer recognizes the word, and the parser rejects it the moment it appears where a statement is expected:

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    throw 1
    return 0
}
```

```bash
prismio check throw_test.psm
```

```text
error[P3201]: expected an expression, found `throw` (a KEYWORD)
 --> throw_test.psm:2:5
  |
2 |     throw 1
  |     ^^^^^
error: aborting due to 1 previous error
```

If you are adding a feature and a reserved word like this one is involved, this is the failure mode to check for *before* you start: confirm the keyword is rejected today, so you know your change is the one that makes it start being accepted, rather than discovering midway that some other code path already treats it as a no-op.

## A worked example: checking where an allocation actually lands

Memory semantics need an explicit answer for every operand and result — copy, borrow, mutable borrow, consume, alias, or produce — and the only way to check that the answer you gave is the one AIF actually inferred is to ask it directly, not to read the tier total. `prismio aif --manifest` lists every allocation site with its inferred tier; `--why=<site>` explains one:

```bash
prismio aif owned.psm --manifest
```

```text
aif-manifest 1
level       AIF-1
...
# symbol                                      tier  thread       placement         type            layout      origin            site
concat__String_String#0                     T2    Isolated     owned             String          AoS         inferred          ./std/string.psm:2126:35
```

```bash
prismio aif owned.psm --why=concat__String_String#0
```

```text
concat__String_String#0           T2

Allocation 1
  Location   std.string:2126:35
  Type       String
  Storage    unique heap
  Reason     returned to the caller

Compiler evidence
  Symbol     concat__String_String#0
  Tier       T2
  Thread     Isolated

  minimal cause
    E rose to Caller
      <- E-RETURN  ./std/string.psm                     2126:73

  placement
    heap  -- no arena serves this site
      because  the tier is not T1 -- see the cause above
      and      no `region` encloses this allocation *in its own function*
...
```
(excerpt — the full report continues with a bracketing check: whether a caller's `region` could still reach this allocation)

Read the tier total (`Storage plan` in the plain `prismio aif` report) as a sanity check only. `--why` is what tells you *which rule* produced a given site's tier, which is the question you actually need answered when your change touches escapes, aliasing, or returns. See [the AIF overview](/aif/overview) for what a tier, a region, and a points-to edge mean.

## Proof

Add focused positive and negative tests, a multiple-error recovery case where recovery applies, ownership and AIF cases, a native execution test, and artifact assertions for any representation claim you are making. Generic features need multiple specializations and a defined recursion/coherence boundary. Platform-facing features need the supported target matrix, not one host's success.

A feature is not complete while `dump-ast`, `check`, a native build, and the relevant analysis command disagree about it — run all four against the same program and confirm they agree before calling it done.

## Why new syntax lands in two steps

`bootstrap/prismio-seed.ll` is committed LLVM IR: the compiler that exists before any compiler does, because a self-hosted compiler needs *something* to build its first generation from. That seed has to be able to parse everything under `src/`. If you teach the frontend a new construct and use it in `src/` in the same change, the seed can no longer parse the compiler's own source, and bootstrapping from scratch breaks — a failure mode nothing in `tests/` or `aif/corpus/` exercises, because both assume a working compiler already exists.

Land it in two steps: teach the frontend, refresh the seed, *then* use the new syntax in `src/`.

```bash
# after the frontend change is in place, before anything in src/ uses it:
tools/refresh_seed.sh   # tools/refresh_seed.ps1 on Windows
```

Separately, a behavior-preserving change (one that should alter nothing about what the compiler emits) must produce byte-identical output for every program in `tests/` and `aif/corpus/`. That is checked by building two generations and comparing them to a fixed point, running the full suite, and running the AIF differential:

```bash
tools/bootstrap.sh --seed --out build/gen0
tools/bootstrap.sh --compiler build/gen0 --out build/gen1
tools/bootstrap.sh --compiler build/gen1 --out build/gen2
# gen1 and gen2 must then agree, byte for byte, on every compiled program
python3 tools/run_suite.py
python3 tools/aif_differential.py --compiler build/gen2
```

These are expensive and change shared build state, so they are not run as part of writing this page — `tools/release_gate.py` composes the same checks for a release candidate. Do not run a bootstrap or the seed refresh against a checkout you are not prepared to rebuild from.

## If you are changing the frontend, semantics, or codegen

The earliest stage that can see the new information owns the change, and every later stage then has to follow it:

1. Add tokens in `src/lexer/token.psm`, and change scanner behavior only when new vocabulary is required.
2. Add the smallest parser production and recovery boundary under `src/parse`.
3. Extend AST nodes or semantic types, without storing backend-only LLVM details on them.
4. Resolve names, types, overloads, and flow in `src/sema`.
5. Define moves, borrows, drops, capture, container, and call behavior for the new construct.
6. Teach AIF about any new allocation sites, aliases, escapes, fields, or thread edges it introduces.
7. Lower the semantically resolved form under `src/ir`.
8. Extend the runtime or the LLVM bridge only when ordinary Prismio or existing IR operations cannot express the capability.

### Where each step actually lives

New punctuation or keywords begin in `src/lexer/token.psm`. The dispatcher is `lexerNextToken()` in `scanner.psm`, which reads the current character and calls the matching `lex*` function (`lexIdentifier()`, `lexOperator()`, and so on); each of those calls `lexerToken()` to stamp the result with file, line, column, and length before returning it.

Route new grammar through `parseDeclaration()`, `parseStatement()`, or Pratt-style `parseExpression()`. Use `parserNodeFrom()` to preserve the opening token's span, and the existing parser helpers for expected-token diagnostics and synchronization.

AST representation belongs in `src/ast/nodes.psm` and `types.psm`. Add serialization to `src/ast/dump.psm` for any node that survives parsing — see **See it work** above for why an omission there is dangerous rather than merely incomplete.

Semantic order matters: named types are registered before function predeclaration; function bodies are checked by `semaFunction()`, expressions by `semaExpr()`, and statements by `semaStatement()`. Reuse `semaTypesMatch()`, `semaExpectAssignable()`, overload resolution, and the existing flow helpers rather than duplicating them. Do not encode a source validity rule only in `src/ir` — `prismio check` deliberately stops before code generation, so a rule that only IR enforces is invisible to `check` and to every editor integration built on it.

Lower the resolved node with `generateExpression()` or `generateStatement()`, using the existing `ir_*` builder operations. Module-wide constructs also need declaration staging in `generateModule()` or `generateFunction()`. A new LLVM bridge function needs a matching Prismio `extern fn` declaration, handle validation, a C wrapper implementation, and a bridge test — see [add a runtime or standard-library API](/cookbook/add-a-runtime-or-stdlib-api) for that boundary.

### Documentation

Update the language documentation when the change is user-visible, and this developer portal for implementation behavior. Reserved syntax alone — a keyword the lexer recognizes, like `throw` above — must never be labeled implemented; implemented means the parser, sema, and code generation all agree the construct produces a working program.
