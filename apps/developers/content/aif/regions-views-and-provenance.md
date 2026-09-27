---
title: Regions, views, and provenance
description: How AIF relates lexical regions, nonlexical lifetime evidence, slices, field views, and returned aliases to an owner — and the two ways getting it wrong shows up.
status: experimental
version: "0.1.0"
tags: [aif, regions, views]
related: [aif/tiers-and-analysis-domains, compiler/ownership-and-drop-lowering, aif/reuse-reports-and-verification]
lastUpdated: "2026-09-26"
---

Some values are cheaper to point at than to copy: the middle third of a list, the string inside a
struct field, the payload of an enum you just matched on. Prismio calls a value like that a
**view** — a slice, a field read, an enum payload, or a returned reference into storage some other
value owns. A view creates exactly one risk: if the owner is freed while the view is still alive,
the view now points at nothing. [AIF](/aif/overview) — the Adaptive Inference Framework — has to
prove, for every view, that this cannot happen, and a **region** is the case where the programmer
names the reclaim boundary explicitly rather than leaving it to inference.

A region is a lifetime domain whose allocations can be reclaimed together — a `region name { … }`
block. AIF can bracket eligible work inside one and route T1 sites (see
[tiers and analysis domains](/aif/tiers-and-analysis-domains)) to that region's arena when every use
is contained by it. Lexical scope is only the starting point: nonlexical analysis can end an extent
after the last relevant use, but calls, aliases, loops, and returned values can all prevent safe
bracketing.

## See it work

The `region` statement names a lifetime domain explicitly (excerpt from `tests/test_44_aif_region.psm`,
which trims `Wide`'s 33 fields to fit here):

```prismio
region work {
    let w = Wide { f01: "ab" }
    n = __builtin_string_len(w.f01)
}
```

```bash
prismio aif test_44_aif_region.psm --why=4
```

```text
Allocation 4
  Location   test_44_aif_region.psm:34:22
  Type       Wide
  Storage    arena:work
  Reason     lifetime fits the region
  ...
  minimal cause
    E is still Region
      <- ALLOC     test_44_aif_region.psm               34:22

  placement
    region:work  -- bump-allocated, and released in bulk when the region exits
```

`Wide` never leaves the `work` region, so it is bump-allocated from that region's own arena and
reclaimed in bulk when the block exits — no individual free. The same source shape without a named
region gets exactly this treatment automatically whenever AIF can bracket it itself; `region` is for
telling the compiler the boundary you want rather than waiting to see what it infers.

## What failure looks like: a proven-safe leak

Not every value inside a region can be served by that region's arena. `escapes_inner`, from the
same fixture, assigns into a binding declared in an *outer* region from inside a nested `region
inner { … }`:

```bash
prismio aif test_44_aif_region.psm --why=3
```

```text
Allocation 3
  Location   test_44_aif_region.psm:82:25
  Type       Wide
  Storage    scoped heap
  Reason     scope-bound; no arena selected
  ...
  minimal cause
    E rose to Region
      <- E-BIND    test_44_aif_region.psm               87:22

  placement
    heap  -- no arena serves this site
      because  the value outlives the enclosing region
      note     the nearest region is `inner`; the value is still live after it exits

  repairs, cheapest first
    1. declare the binding inside the scope that uses it        restores T1, no runtime cost
    ...
```

The value outlives `inner`, so `inner`'s arena cannot serve it — but it does not outlive the
*outer* region either, and this compiler generation does not thread an arena handle across that
boundary, so the site falls back to an ordinary heap allocation with no arena at all. Running the
fixture with `--verify` shows exactly this, and only this:

```bash
prismio run test_44_aif_region.psm --verify
```

```text
...
Built test_44_aif_region
PASS
aif-verify: leaked #1 (528 bytes)
aif-verify: 2 allocated, 1 released, 1 leaked, 0 violation(s)
...
aif-verify: FAILED -- an inferred fact did not hold at run time
```

`PASS` is the program's own assertions (it checks its arithmetic and the exact arena object/region
counts). `--verify`'s own `FAILED` line is a blunt instrument: it fires on *any* nonzero leak or
violation count, with no notion of "expected." Knowing this one is expected takes a second source —
`tests/test_runner.py`'s `run_aif_verify_test` asserts this exact fixture leaks exactly once, with a
comment explaining why: the value is "too long-lived for the inner arena, and not its own scope, so
the scope drop declines it too. Correct but imprecise." A leak here is the safe direction — the
alternative wrong answer would be freeing memory a live pointer still uses, which is what the next
section is about.

## A traced worked example: a balanced ledger, and the wrong answer anyway

`--verify`'s ledger checks that every allocation is released exactly once. It cannot check that a
value was still *valid* when something read it — and `tests/test_92_field_view_provenance.psm` is
the regression test for the defect that gap allowed through.

```prismio
struct Box { text: String }

fn boxText(b: Box) -> String {
    return b.text
}

fn main() -> Int {
    if (boxText(makeBox()).equals("abc") == false) {
        return fail("struct field passed straight into a call")
    }
    // ...
}
```

`boxText` returns a *view* of its parameter's field, not a copy. Before the fix, two provenance
facts were both missing: a field read (`b.text`) recorded no view relationship back to `b` at all,
and an enum payload bound by a `match` arm recorded none either. So AIF had no reason to keep the
temporary `Box` returned by `makeBox()` alive past the call, released it immediately, and
`boxText(makeBox())` read a field of already-freed storage. **Both releases were individually
ledger-legal** — the temporary was released once, not twice or zero times — so `--verify` reported a
perfectly balanced `4 allocated, 4 released, 0 leaked, 0 violation(s)` while the program printed the
wrong string. A balanced ledger proved the bookkeeping was consistent; it said nothing about whether
the value it was consistent *about* was still there to read.

The fix teaches the walk that a field read and a match-arm binder are each a view of what they came
from ([`aif_vs_view_of`](#views-are-provenance-edges), below), so the temporary's required lifetime
now includes the call that reads its field. Running the same shape today:

```bash
prismio run test_92_field_view_provenance.psm --verify
```

```text
test_92 ok
aif-verify: 18 allocated, 18 released, 0 leaked, 0 violation(s)
```

`test_92 ok` is the value assertion passing — every one of these views now reads the right string.
The ledger balances too. When this fix landed it read `18 allocated, 8 released, 10 leaked`: an
owned result passed straight into a parameter, with nothing left to name it, was leaked rather than
freed early. Since 2026-09-25 such a result is released after the call, or, when the callee may
return a view of it, given a hidden binding and released with the block; see
[an owned result passed straight on](/runtime/supported-surface#an-owned-result-passed-straight-on).
**The test still asserts values, not the ledger:** a `--verify` run that only checked the counts
would have called both the broken and the fixed compiler correct.

## Layout consequence

Under structure-of-arrays storage (see [layout selection](/aif/layout-selection)), an element may
have no standalone address, so a view is a logical pair — container identity plus index — rather
than necessarily a raw interior pointer. Representation freedom depends on preserving this
abstraction across sema, AIF, and lowering.

## Deliberate omissions

This page covers what a region and a view are and the two failure shapes they produce (a
provably-safe leak, and a provenance gap that a balanced ledger cannot reveal). It does not cover
concurrent region use in detail — ambient region state is currently part of the runtime
implementation, which is exactly why sharing a region across threads needs separate scrutiny this
page does not give it.

## If you are changing this

### Scope and region functions

`aif_scope_new(parent, owner)` creates the lexical tree used for least-common-ancestor escape
joins. `aif_scope_set_region` and `aif_scope_set_region_span` mark an explicit region and its
diagnostic location. `aif_scope_note_node` maps the source block back to the scope, while
`aif_scope_set_loop_depth` records whether repeated execution changes placement cost.

`aif_con_live_in(values, scope, fn)` raises each reachable site's required lifetime to the named
scope. `aif_var_note_scope` and `aif_var_note_use` record where bindings are declared and used.
`aif_scope_set_budget` adds a region high-water assertion; `aif_scope_budget`,
`aif_scope_served`, and the source accessors support reporting.

`aif_place_arenas` runs after tier solving. It rejects sites with blockers reported by
`aif_arena_blockers`, groups eligible lifetimes, computes statement ranges, and chooses the
scope/arena serving each site. `arena_would_serve` counts only a site codegen would actually route
into an arena: not a list, a container-owned value, a foreign pointer — and not an array literal,
which `generateArrayLiteral` always builds in an entry-block `alloca`. Counting one put a push and a
pop around every iteration of a loop that declared an array and allocated nothing. `aif_arena_range_first` and `aif_arena_range_last` allow codegen
to open and close a non-lexical arena around only the required statements.

### Views are provenance edges

`aif_vs_view_of(viewValues, collectionValues)` records that a slice, string view, DataView, or
element reference uses storage owned by another value. It does not create a new allocation site.
When a view escapes, the solver raises the owner to the required lifetime — this is the edge that
was missing for a field read and a match-arm binder in the worked example above.

**An element read of a scalar is a copy, not a view.** `aifSitesOf` gives `List[i]` and
`Slice[i]` of a scalar element no edge, and an array index the same: it walks the base for its own
effects and answers the empty set. Falling through to the generic child walk handed the read the
array's own value set — and an `Array<T, N>` field's value set is a view of its struct, so
`sum = sum + t.cells[3]` in a loop lifted `t` into the function's arena, all 100,000 of them. The
oracle (`aif/prototype/aif.py`) mirrors the rule. `test_164_array_fields` holds the arena to it in
`run_aif_verify_test`.

Container stores are different: `aif_con_store(key, values, owners)` records both the field/element
points-to edge and the set of owning containers. `aif_con_retain_in` records another holder.
`aif_elem_key` is based on the full container type to avoid immediately merging
`List<Int>` and `List<Node>`.

### Interprocedural provenance

`aif_note_call_result` associates a call node with its abstract result.
`aif_fn_may_return_param` computes whether a result may alias an input; `aif_fn_may_return_view_of_param`
is the narrower view-provenance summary. `aif_owns_call_result_at_node` tells codegen whether the
caller owns the result.

For region call bracketing, `aif_call_edge` records visible calls and `aif_call_opaque` records
unknown ones. `aif_bracket_count`, `aif_bracket_callee`, `aif_bracket_scope`, and
`aif_bracket_served` expose selected brackets; `aif_fn_bracket_blockers` explains why a
function cannot safely run under a caller-owned arena.

Region tests must cover nested scopes, early return, break/continue, repeated loop execution,
returned views, views stored in containers or fields, visible and opaque calls, recursive call
graphs, budget overflow, and both lexical and non-lexical arena exit placement — and, per the worked
example above, must assert the values a view reads, not only the allocation ledger.
