---
title: Adaptive Inference Framework
description: Architecture and CLI of Prismio 0.1 AIF allocation tiers, constraints, reports, and runtime verification.
status: experimental
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [compiler, aif, memory, allocation]
related: [guides/memory-and-aif, language/annotations, specification/memory-model]
---

The Adaptive Inference Framework runs after semantic/type/ownership analysis and before code generation. It assigns an allocation strategy using escape, alias, field, container, region, and ownership evidence.

AIF is not the source ownership checker. The semantic pass first decides whether moves and borrows are legal; AIF then selects or constrains a memory-management implementation consistent with that program.

## Tier vocabulary

| Tier | Intended strategy |
| --- | --- |
| `T0` | Stack allocation |
| `T1` | Region or arena allocation |
| `T2` | Unique escaping ownership |
| `T3` | Reference counting |
| `T4b` | Cycle-aware collection |

`T0` fits data proven not to escape the relevant stack lifetime. `T1` groups suitable lifetimes into a region/arena. `T2` represents unique ownership that escapes a local stack placement. `T3` accommodates shared acyclic/reference-counted behavior. `T4b` addresses cycle-aware management.

The exact eligibility tests, thresholds, and runtime mechanics are experimental. Tier names describe the audited 0.1 AIF 1.2 Draft model and are not a stable serialized ABI.

## Analysis evidence

The pass records facts about allocations and their uses, including whether values escape a function or region, acquire aliases, enter owned/copyable collections, flow through fields, cross foreign contracts, or participate in structures that require stronger management.

Conservative/unknown evidence can push a site to a more general tier. A source constraint cannot force an unsound lower tier.

## Reports

Inspect decisions without building an executable:

```bash
prismio aif main.psm
prismio aif main.psm --summary
prismio aif main.psm --why=1
prismio aif main.psm --manifest
```

The default report groups potential allocation sites into application and imported source, translates tiers into storage mechanisms such as stack, arena, or unique heap, and assigns short numeric IDs. A site is a source location, not a runtime allocation count. `--why=<ID>` explains one numbered decision; stable manifest symbols remain accepted for compiler tooling.

`--summary` gives the detailed program-level tier distribution. `--manifest` emits the stable line-oriented compiler/CI record, including mangled symbols, tier, thread affinity, placement, layout, origin, and source position. Use `--manifest`, rather than parsing the interactive report, in automation.

Use explanations before annotations. A surprising tier can be caused by a genuine escape or retained foreign alias that should be clarified in the API rather than hidden by a pin.

`--budget=N` limits analysis work and requires `N >= 1`. `--theta-fields`, `--owned-collections`, and `--copyable-collections` expose specialized analysis modes used by compiler development and tests.

Budget exhaustion/constraint behavior should be treated according to the current compiler diagnostic, not as silent permission to choose an unsafe tier. Specialized modes are expert/compiler-test controls and can change with the experimental framework.

## Source constraints

Source annotations `unique`, `pin(Tn)`, and named `region` blocks add constraints. A request that contradicts proof is rejected. `--debug` deliberately selects a more conservative posture. `--verify` instruments runtime allocation/free events to catch supported leaks or lifecycle violations.

`unique` asserts single-owner intent. `pin(Tn)` requests a tier for a binding. A region introduces a named lexical allocation context and may include a byte budget with `pin(number)` syntax. Budget acceptance is not a process-wide memory guarantee and cannot account for opaque foreign allocations automatically.

## Runtime verification

`--verify` adds instrumentation around supported allocation/free lifecycle events. Exercise normal, early-return, loop, error-code, and FFI paths. Verification is expected to affect performance and should not be used for final benchmark numbers.

Instrumentation cannot inspect arbitrary foreign memory behavior, validate a wrong ABI declaration, or replace static ownership analysis.

## Compiler development

AIF changes should include focused source fixtures, expected tier/oracle output, refuted-annotation cases, generation builds, and documentation updates. Compare both the chosen tier and the explanation evidence so a test does not pass for the wrong reason.

When upgrading a compiler version, rerun summaries and `--why` for application-critical allocations rather than assuming previous pins remain appropriate.

The internal AIF specification is version **1.2 Draft**. Tier policy and report text are experimental, so tooling should not treat them as a stable serialization format.
