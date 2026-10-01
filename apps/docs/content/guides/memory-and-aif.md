---
title: Choose memory intent with AIF
description: Guide to Prismio ownership, allocation inference, regions, unique values, pinning, and verification.
status: experimental
version: "0.1.0"
lastUpdated: "2026-08-27"
tags: [guide, memory, aif, ownership]
related: [language/ownership-and-borrowing, language/annotations, compiler/aif, specification/memory-model]
---

Start with ordinary ownership. Make transfers explicit with `sink`, mutable borrows with `inout`, and early destruction with `drop`. Add AIF annotations only when a report shows that the compiler's inferred tier does not match the intended allocation strategy.

This order matters: ownership defines legal source behavior; AIF chooses or constrains a compatible allocation implementation. Pinning a tier cannot make an illegal move or escaping borrow valid.

## Step 1: make ownership visible

Review each move-only value—strings, lists, structs, and optional wrappers around owned references—and classify function boundaries:

- ordinary parameter: temporary read-only borrow;
- `inout`: temporary exclusive mutable borrow;
- `sink`: ownership transfer;
- returned/stored value: ownership may escape the current scope;
- `drop`: explicit end of ownership.

Prefer the least powerful contract that matches the operation. A function that only inspects a request should borrow it; a queue that keeps the request should accept it through `sink`.

## Step 2: inspect inferred allocations

The analysis assigns allocation sites to tiers: stack (`T0`), region/arena (`T1`), unique escaping ownership (`T2`), reference counting (`T3`), or cycle-aware collection (`T4b`). Tier names and inference policy are experimental in 0.1.

Use the analysis command before changing code:

```bash
prismio aif main.psm
prismio aif main.psm --summary
prismio aif main.psm --why=1
```

Start with the unflagged report to see application and imported sites in terms of stack, arena, and heap storage. Its IDs can be passed directly to `--why`; use `--summary` when you need the complete tier distribution and `--manifest` for stable compiler/CI records. The explanation is more useful than adding annotations speculatively because it identifies escapes, aliases, cycles, or contracts that drive analysis.

Keep the source revision, compiler version, target, and command next to performance measurements. AIF is experimental, so comparisons without that context are hard to reproduce.

## Step 3: simplify the ownership graph

Before pinning, see whether the program can express a clearer lifetime:

- return a compact copy value instead of retaining a large owner;
- pass a borrow instead of storing an alias;
- transfer once with `sink` instead of sharing responsibility;
- group short-lived work in one lexical region;
- keep foreign retention behind a precise extern contract.

This often improves both analysis and human understanding.

## Step 4: add a measured constraint

`unique` asserts a single-owner intent. `pin(Tn)` constrains an allocation to a tier, and the compiler rejects a pin it cannot justify. A named region can also declare a byte budget:

```prismio
region request pin(4096) {
    // allocations scoped to the region
}
```

Use `unique` when single-owner intent is an invariant worth checking. Use `pin(Tn)` when a benchmark or environment requires a particular currently documented tier. A rejected pin is useful feedback: the compiler has found behavior inconsistent with the request.

Region budgets are byte assertions under the current analysis, not process-wide memory quotas. Foreign allocations, runtime overhead, stack frames, and opaque external behavior can sit outside the budget's proof.

You do not always have to write `region` to get one. The compiler's cost model can place an arena on a scope by itself, and it can route a called function's allocations into it when that call is the only one to that function and the analysis can show nothing the function allocates outlives the scope. A report shows this as `region:auto` rather than a name you chose.

An automatic arena does not have to cover the whole block. It opens at the first statement that puts something in it and closes after the last statement that still reads something it holds, so the statements on either side run outside it. This is what lets a loop body that calls a clock, does its work, and calls the clock again still get an arena around the middle: the foreign calls are not inside the region, because the region is not open when they run.

Automatic placement is deliberately narrow, and two limits are worth knowing because both are visible in a report. A call the compiler cannot see through — an undeclared `extern`, for instance — sitting *inside* that range will decline it, since the compiler cannot show a foreign call was not handed memory the arena owns; so will one it cannot place in the block's statement order, such as a call nested in an inner block. A function is routed only when **every** call to it is inside the same region: calling it twice from one loop body is fine, and the compiler places both, but one call from somewhere the region does not cover means its allocations would belong to whichever caller ran, and the routing is dropped for all of them. If a scope you expected to be served is not, `--why` names the clause that declined it. Writing `region` yourself remains the way to state the intent directly, and a `region` you wrote keeps the whole block: it is pushed on entry and popped on every exit, which is what the annotation asserts.

## Step 5: verify runtime behavior

Compile with `--verify` while testing ownership-sensitive changes. Verification instruments allocation/free behavior and reports leaks or contract violations; it is not a replacement for semantic move checking.

```bash
prismio build main.psm -o app-verified --verify
./app-verified
```

Exercise success, failure, early return, loop exit, and foreign-call paths. Instrumentation changes runtime characteristics, so use it for correctness validation rather than final performance numbers.

## Tier model

The current analysis vocabulary describes:

| Tier | Current intent |
| --- | --- |
| `T0` | stack placement for non-escaping data |
| `T1` | region/arena lifetime |
| `T2` | uniquely owned escaping allocation |
| `T3` | reference-counted sharing |
| `T4b` | cycle-aware collection |

These names and inference policy are experimental. Treat the table as documentation of the 0.1 compiler, not a permanent language ABI.

## Foreign calls

AIF depends on accurate `extern fn` ownership contracts. Declaring a retaining C API as `borrow` can hide an escape from analysis; declaring a borrow as `consume` can invalidate a caller incorrectly. Prismio cannot inspect foreign code, so review these contracts like unsafe code.

## Upgrade checklist

When moving to another compiler version:

1. run the ownership regression tests without tier pins;
2. compare `aif --summary` results;
3. inspect every previously important `--why` site;
4. revalidate pin and region-budget acceptance;
5. run a verified build; and
6. remeasure uninstrumented executables.

Do not preserve a pin merely because an older compiler accepted it. Preserve the performance or storage goal and let current evidence determine the annotation.
