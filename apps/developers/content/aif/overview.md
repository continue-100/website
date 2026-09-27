---
title: Adaptive Inference Framework overview
description: What AIF decides, how to see its decisions on your own code, and the map of the pass for contributors changing it.
status: experimental
version: "0.1.0"
lastUpdated: "2026-09-25"
tags: [aif, memory, architecture]
related: [compiler/aif-internals, aif/tiers-and-analysis-domains, aif/reuse-reports-and-verification, testing/aif-differential]
---

## The problem AIF solves

Every value a Prismio program allocates has to live somewhere, and be reclaimed somehow. A short-lived struct can sit on the stack and cost nothing. A value that outlives its function has to go on the heap. A value two owners can reach at once needs a reference count so the last one out frees it.

**AIF** — the Adaptive Inference Framework — is the compiler pass that makes that choice, one allocation at a time.

Most languages settle this with a single global answer — everything is reference counted, or everything is garbage collected, or the programmer writes it out by hand. **AIF picks per allocation, by proving what each one actually does.**

You do not write anything to get this. The analysis reads the program you already wrote.

## See it on your own code

<!-- prismio-check: pass -->
```prismio
import std.string

struct Point { x: Int, y: Int }

fn label(n: Int) -> String {
    return "point-".concat(n.toString())
}

fn main() -> Int {
    let p = Point { x: 1, y: 2 }
    let name = label(p.x)
    return name.length + p.y
}
```

Run the analysis over it — this only analyses, it does not build:

```bash
prismio aif example.psm
```

```text
Storage plan
  Stack                   1
  Arena                   0
  Scoped heap             0
  Unique heap             81
  ...

Your code
ID   location                 type            storage                           reason
1    example.psm:10:19        Point           stack                             small value does not escape
```

`Point` never leaves `main`, so it costs nothing at runtime — no allocation, no free, no count. That is the whole point of the pass.

Two things about that output surprise people:

- **"Sites" are places in the source, not runtime allocations.** One site inside a loop is still one site.
- **Imported modules are analysed too**, even when nothing calls them. A program that imports `std.string` reports its sites as well, which is why the count looks large for a small program.

## Ask why

Any single decision can be explained:

```bash
prismio aif example.psm --why=1
```

```text
Allocation 1
  Location   example.psm:10:19
  Type       Point
  Storage    stack
  Reason     small value does not escape

Compiler evidence
  Symbol     main#0
  Tier       T0
  Thread     Isolated

  minimal cause
    E is still Region
      <- ALLOC     example.psm  10:19
```

**`--why` is the first thing to reach for**, and it is usually faster than reading the analysis source. When a value lands somewhere expensive, the *minimal cause* names the single fact that put it there — the binding, the store, the call — rather than making you infer it.

## The ladder

Storage runs from cheapest to most expensive, and the analysis takes the cheapest it can prove:

| Tier | Storage | Costs |
| --- | --- | --- |
| T0 | Stack slot | Nothing |
| T1 | Arena | A bump pointer; the whole region is freed at once |
| T2 | Heap, single owner | One allocation and one free |
| T3 | Heap, reference counted | Counts on every share |
| T4a / T4b | Cross-thread, or cycle-managed | Atomic counts, or cycle collection |

A tier is a proof obligation, not a preference. Where the evidence is incomplete AIF picks a *more* expensive tier, never a cheaper one — the analysis may cost you performance, never safety.

**AIF does not replace ownership.** The program must already satisfy move, borrow, drop and control-flow rules before AIF runs. This pass decides how to implement storage for a program that is already correct.

## Where this fits for contributors

The rest is the map you need if you are changing the pass itself.

- `src/aif/model.psm` — allocation sites, facts, tiers, the analysis model.
- `src/aif/walk.psm` — collects evidence from the checked program.
- `src/aif/contracts.psm` — what foreign code does to ownership.
- `src/aif/layout.psm` — field order and hot/cold splitting.
- `src/aif/report.psm` — the human, `--why` and manifest forms.
- `runtime/aif_support.c` — the solver the self-hosted compiler calls.

The declared compiler level is AIF-1. Policy and report details remain experimental.

### Execution order, and why it is fixed

`aifRunProfiled` is the entry point the driver uses. It resets native state, optionally loads a measured profile, then runs:

1. `aifDeclare(module)` — register functions, scopes, nominal types, explicit regions, annotations and foreign contracts.
2. `aifBuild(module)` — discover sites, keys, value sets, call edges, ownership transfers, views, stores, returns, tasks and constraints.
3. `aif_layout_select()` — rank field orders from static or measured access weights.
4. `aifComputeSizes(module)` — target-aware exact sizes, once field order is known.
5. Layout veto passes, then `aif_layout_split_select()` for an allowed hot/cold split.
6. `aif_solve(roundBudget)` — iterate to a points-to and fact fixed point.
7. `aif_widen()` if the budget runs out, keeping safety with conservative facts.
8. `aif_check_pins`, `aif_place_arenas`, `aif_check_placement_pins`.
9. Output: human, summary, manifest, layout, pin, budget, inert-region or explanation.

**The order is load-bearing.** Field order changes exact size; size decides stack and arena eligibility; tiering decides placement; and a placement pin cannot be checked before a placement exists.

### Core objects

`aif_fn_new` assigns function IDs and `aif_scope_new` builds the lexical scope tree. `aif_site_new` records an allocation site with its type, kind, function, scope and source position. `aif_key_var`, `aif_key_field`, `aif_key_param`, `aif_key_ret` and `aif_elem_key` identify storage locations, and `aif_vs_new`, `aif_vs_site`, `aif_vs_key` and `aif_vs_union` build abstract value sets.

Constraints are monotone updates over those objects. `aif_con_bind` connects a value set to a binding key, `aif_con_store` records field or container storage, `aif_con_arg` connects calls, `aif_con_return` connects a result, and the escape, borrow, retain, foreign, task and pin constraints raise their domains. **The solver never lowers a fact once learned** — that is what makes the fixed point terminate.

### How code generation reads the result

The AST is never rewritten with allocation instructions. `aif_site_note_node` associates source nodes with sites; later `aif_tier_at_node`, `aif_arena_at_node`, `aif_releases_on_overwrite_node`, `aif_elem_owner_at_node`, `aif_rc_at_node`, `aif_cycle_at_node` and `aif_owns_call_result_at_node` answer one focused lowering question each.

That side-table design keeps a single semantic AST, and creates one strict requirement:

> Every new allocation-producing syntax form must register the same node that IR generation later queries.

A missing association does not fail loudly. It falls back to conservative behaviour, so cover it with manifest and emitted-IR assertions.

## Checking a change

`prismio aif --manifest` is the stable machine form for diffing one revision against the next, and `prismio build --verify` checks selected consequences at run time. Neither can tell you an inference *rule* is wrong — for that, see [AIF oracle and differential testing](/testing/aif-differential), which runs a second independent implementation and compares.
