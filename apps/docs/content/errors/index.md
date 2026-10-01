---
title: Compiler error reference
description: Permanent, searchable documentation pages for every distinct failure class covered by the Prismio 0.1 negative compiler suite.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [errors, diagnostics, troubleshooting, index]
related: [compiler/diagnostics, specification/conformance, language]
---

Every diagnostic prints a code such as `error[P4001]`, and codes are permanent, but most semantic errors share one, so it names the stage and not the rule. The identifiers below are permanent documentation URL keys for a rule. Match the central message fragment, and use the [code reference](/compiler/diagnostics#codes) for the `P10xx` driver and project codes.

Each page answers five questions: what the diagnostic means, why the compiler rejects the program, a minimal invalid example, a compiler-checked correction, and common repair strategies. The URL remains stable even when diagnostic wording improves.

## Type and call errors

| Documentation ID | Typical message |
| --- | --- |
| [type-mismatch](/errors/type-mismatch) | `expected T, found U` |
| [integer-width-mismatch](/errors/integer-width-mismatch) | operator expected one integer width |
| [duplicate-overload](/errors/duplicate-overload) | duplicate definition with same parameter types |
| [wrong-arity](/errors/wrong-arity) | expects N arguments |
| [optional-needs-unwrap](/errors/optional-needs-unwrap) | member access requires a struct value |

## Ownership and memory errors

| Documentation ID | Typical message |
| --- | --- |
| [use-after-move](/errors/use-after-move) | `use of moved value` |
| [move-from-borrow](/errors/move-from-borrow) | `cannot move out of borrowed value` |
| [move-in-loop](/errors/move-in-loop) | value is moved inside a loop |
| [return-local-array](/errors/return-local-array) | cannot return a local array |
| [invalid-drop](/errors/invalid-drop) | drop requires an owned move-only value |
| [container-ownership](/errors/container-ownership) | container transfer moves or borrows incorrectly |
| [unique-alias](/errors/unique-alias) | same value passed to two `unique` parameters |
| [refuted-pin](/errors/refuted-pin) | requested tier cannot hold |
| [region-budget-exceeded](/errors/region-budget-exceeded) | region exceeds its budget |

## Syntax, names, and control flow

| Documentation ID | Typical message |
| --- | --- |
| [unknown-name](/errors/unknown-name) | `unknown identifier` |
| [visibility-violation](/errors/visibility-violation) | is `private` to the file / `internal` to the package |
| [immutable-assignment](/errors/immutable-assignment) | binding is not declared `mut` |
| [missing-return](/errors/missing-return) | must return a value on every path |
| [unreachable-code](/errors/unreachable-code) | `unreachable code` |
| [unexpected-top-level-token](/errors/unexpected-top-level-token) | expected a declaration |
| [unclosed-block](/errors/unclosed-block) | block is never closed |
| [unnamed-region](/errors/unnamed-region) | expected a name for the region |
| [multiple-errors](/errors/multiple-errors) | aborting due to previous errors |

Each page shows the failure, a correction, and related rules. Exact punctuation may change before stable diagnostic codes are introduced.

## How to use this index

Start with the earliest primary diagnostic. Parse recovery can produce later cascades, so correct malformed syntax before diagnosing every unknown name or type. Then find a distinctive message fragment or browse by category.

Do not use `mut` as a universal ownership fix: it permits reassignment but does not revive a moved value. Do not add `as` blindly to silence a type error: ensure the conversion preserves the intended range. Do not remove `sink`, `unique`, or a region constraint without deciding whether the API/performance assertion was wrong.

After applying a fix, compile again. Some follow-up diagnostics disappear when the primary error is corrected; independent ones remain.

## Version and stability

These pages describe compiler 0.1.0. Message prose, punctuation, notes, and colors are not stable. The required rejection and the underlying language rule are the durable contract. Compiler codes can be mapped to these permanent pages without changing their canonical URLs.
