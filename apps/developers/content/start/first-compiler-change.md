---
title: Trace your first compiler change
description: A practical map for carrying one Prismio behavior change through syntax, semantics, AIF, LLVM, tests, and docs.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [workflow, compiler, testing]
related: [cookbook/add-a-language-feature, compiler/pipeline-and-driver, testing/regression-suite]
---

A compiler change is complete when every affected layer agrees. Begin at the earliest layer that
must understand the behavior; do not repair a semantic omission in LLVM lowering.

## Trace the path

1. Add or adjust tokens in `src/lexer/token.psm` and scanning in `scanner.psm`.
2. Parse the construct in the appropriate `src/parse` module and represent it in `src/ast`.
3. Establish names, types, overload behavior, flow, and ownership in `src/sema`.
4. Teach AIF about any new allocation, alias, escape, container edge, or thread transfer.
5. Lower the already-valid construct through `src/ir` and the LLVM bridge.
6. Add positive execution coverage and focused negative diagnostics.
7. Update implementation documentation and any affected specification text.

Not every change touches every stage. A diagnostic wording change may stop in the frontend; a
runtime optimization may leave source semantics untouched. The checklist is a dependency map, not
a demand for empty edits.

## Follow one node end to end

For a syntax-bearing feature, begin at `TokenKind` and `scan()`. `parseDeclaration()`,
`parseStatement()`, or `parseExpression()` constructs an `ASTNode`; keep its source span intact with
`parserNodeFrom()` or `nodeSpanFrom()` so later errors point to the user's construct. If parsing
desugars syntax into an older node form, document that rewrite because sema and codegen will never
see the surface spelling.

Name and type work begins after import flattening. `semaRegisterNamedTypes()` makes nominal types
available, `semaPredeclareFunction()` establishes callable signatures, and `semaExpr()` /
`semaStatement()` resolve uses. Put reusable type compatibility in `semaTypesMatch()` or
`semaExpectAssignable()` rather than duplicating a backend check. Ownership changes belong in
`semaMoveOperand()`, `semaConsumeOperand()`, extern-contract validation, and the flow state that
rejects use after move.

If the construct creates or transfers managed storage, add the correct site and edges to the AIF
walk. Verify the new fact survives solving and appears in `--manifest` and `--why`. Codegen should
consume the resolved node and AIF plan; it must not re-decide whether a call is legal. Add a narrow
`ir_*` bridge operation only when existing builder primitives cannot express the LLVM form.

## Prove the boundary

Add the smallest positive program that demonstrates the behavior and the smallest `neg_*.psm`
program that proves its boundary. If parser recovery should continue, include a second independent
error and assert both. For overloads or generics, cover more than one instantiation and the
ambiguous or recursive case.

For lowering changes, emit `.ll`, assert the relevant declaration, block, instruction, or metadata,
and inspect final machine code when optimization is the claim. For ownership changes, build with
`--verify`, assert returned values and mutations, then check allocation-ledger balance; a balanced
ledger alone cannot detect every premature release.

While iterating, run a named test through `PRISMIO=<generation> python3 tests/test_runner.py <name>`.
Finish with `prismio verify` (the suite, source lists, externs and the AIF differential) and, for a
self-hosting, runtime, backend, or packaging change, `prismio gate`, which lints and runs the whole release
gate on a packaged candidate. Do not run `prismio build` or edit `src/` while the suite is running.
