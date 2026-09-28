---
title: Ownership and drop lowering
description: How Prismio tracks moves, default borrows, consuming parameters, mutable borrows, reassignment, and destruction — and how that legality gets turned into an actual release call.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [ownership, borrowing, drops]
related: [aif/overview, aif/regions-views-and-provenance, llvm/control-flow, runtime/overview]
---

Every value a Prismio program creates has to be freed exactly once — not zero times, which leaks, and not twice, which corrupts the heap. Deciding *whether* a piece of code is even allowed to free a given value is a source-level question: who owns it, has it already been moved away, is it only borrowed here. Deciding *how* that free actually happens — a stack frame unwinding, a pointer handed to `free`, a reference count ticking down — is a storage question, answered later by **AIF**, the Adaptive Inference Framework (see [AIF overview](/aif/overview)). This page is about the handoff between the two: ownership analysis decides legality, and drop lowering turns a legal program into the release calls its chosen storage needs.

Keeping these separate is what lets AIF change a value's storage mechanism between compiler versions without changing what source code is allowed to do with it.

Strings, vectors, and structs are move-only. An ordinary parameter borrows its argument for the call; `sink` consumes it; `inout` gives the caller-visible mutable access. Scalars, raw pointer values, fieldless enums, and arrays follow their own documented copy behavior instead.

## See a release happen

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let mut names: Vec<String>
    names.push("alpha".concat("-one"))
    names.push("beta".concat("-two"))
    println(names[1])
    return 0
}
```

Run it against the instrumented runtime, which keeps a ledger of every allocation and release:

```bash
prismio run owned.psm --verify
```

```text
Built owned
beta-two
aif-verify: 2 allocated, 2 released, 0 leaked, 0 violation(s)
aif-memory: 120 allocated bytes, 120 released bytes, 0 live bytes, 120 peak live bytes
aif-memory-sizes: <=16:0 <=32:0 <=64:2 <=128:0 <=256:0 <=512:0 <=1024:0 <=4096:0 >4096:0
aif-arena: 1 object(s), 16 byte(s), 1 region(s) on reporting thread
```

Nothing leaked. Stopping at **IR** (intermediate representation) generation (`build -o owned.ll`) shows the actual release, at the point `names` goes out of scope at the end of `main`:

```text
  %16 = load ptr, ptr %names.0, align 8
  br label %label_3

label_3:                                          ; preds = %entry
  call void @list_release(ptr %16)
  br label %label_4
```

`names` owns a `Vec<String>`, so its release kind is "list" — the compiler's internal name for the vector type — and the IR generator emitted a call to `list_release` rather than a plain free. The Vec's own element policy (releasing the two `String`s it holds) happens inside that call, not at this call site.

## What a legality violation looks like

A ledger balancing is not the same claim as a program being correct — it says releases and allocations matched counts, not that a value was read before it was freed. Ownership analysis exists to reject the mistakes that would produce a use-after-free before any of that runs. Given a struct dropped and then read again:

<!-- prismio-check: fail -->
```prismio
struct Point {
    x: Int,
    y: Int
}

fn main() -> Int {
    let p = Point { x: 1, y: 2 }
    drop(p)
    let bad = p.x
    return 0
}
```

```bash
prismio check use_after_drop.psm
```

```text
error[P4001]: use of moved value `p`
 --> use_after_drop.psm:9:15
  |
9 |     let bad = p.x
  |               ^
error: aborting due to 1 previous error
```

`drop` consumes ownership the same way an ordinary move does, so the checker treats the value as gone from that point on — there is nothing special about `drop` that a general use-after-move check does not already cover.

## A worked example: the move that ran three times

`src/sema/ownership.psm` tracks move state per binding name, over the AST in source order. That is precise for straight-line code and was, for a while, wrong inside a loop:

<!-- prismio-check: fail -->
```prismio
struct Box {
    v: Int
}

fn main() -> Int {
    let b = Box { v: 1 }
    let mut i = 0
    while (i < 3) {
        drop(b)
        i = i + 1
    }
    return 0
}
```

```bash
prismio check move_in_loop.psm
```

```text
error[P4001]: `b` is moved inside a loop, so the move would repeat on the next iteration
 --> move_in_loop.psm:9:14
  |
9 |         drop(b)
  |              ^
error: aborting due to 1 previous error
```

Textually, `drop(b)` appears once, so a checker that only asks "is this binding's single textual move legal" says yes. Dynamically, that line runs three times against a binding declared once outside the loop — a double free the source-order analysis could not see, because nothing about the *text* repeats. The fix generalizes the rule: a move of a binding that predates the loop, made from inside the loop body, is rejected regardless of how many times the source mentions it, because the loop's back-edge is a second (and third, and fourth) use the linear reading never accounted for. Branch joins have the same shape of problem in miniature — ownership state after an `if`/`else` has to be the conservative combination of both arms, not whichever arm was checked second.

## Analysis

`src/sema/ownership.psm` records initialization, moves, borrows, last use, reassignment, explicit `drop`, container transfer, and scope exit. Beyond the loop case above, it rejects use after move, dropping borrowed storage, moving the same value through incompatible paths, and ownership operations that would let a local stack-only aggregate escape its frame. A reinitialized binding starts a fresh ownership interval, distinct from the one that ended at its last move.

The semantic checker records legality only. It does not decide whether the eventual storage is stack, arena, reference-counted, or cycle-managed — AIF makes that choice afterward, without weakening any move or borrow the checker already enforced.

| Function | Meaning |
| --- | --- |
| `semaBindingIsBorrow` | Classifies parameters and local bindings that observe rather than own a move-only value |
| `semaMoveOperand` | Marks the source of an ownership transfer and rejects reuse through the source binding |
| `semaConsumeOperand` | Applies consuming-call or assignment semantics to an expression |
| `semaCheckValue` | Checks an expression against the expected type and ownership context in one operation |
| `semaCheckExternContracts` | Validates `borrow`, `consume`, `alias`, `produce`, and related foreign-function-interface (FFI) annotations against the signature |
| `semaCheckUniqueArgs` | Rejects passing the same unique value into multiple consuming/unique positions in one call |

## If you are changing lowering

### Backend ownership state

`runtime/ir_symbols.c` maintains scoped binding records used while IR is emitted. `ir_mark_moved`, `ir_unmark_moved`, and `ir_is_moved` mirror the checked move state, so the backend never generates a second use or release for something sema already tracked as moved. `ir_mark_borrowed` keeps a non-owning binding out of the drop list entirely. `ir_mark_droppable(name, kind)` records the release kind for an owning slot; `ir_mark_owns_slot` distinguishes the binding that owns a slot from a temporary view of it.

`ir_scope_push` stores the current binding/drop floor. `ir_scope_drop_floor` and `ir_drop_count` expose the entries created in that scope; `ir_drop_slot`, `ir_drop_type`, and `ir_drop_kind` let `generateScopeDrops` emit releases in reverse ownership order — the same order the `list_release` call above was emitted in, just for one binding instead of many. `ir_drop_barrier_push` and `ir_loop_drop_floor` give `return`, `break`, and `continue` the correct boundary to drop back to.

### Selecting the release operation

`dropKindOf` in `types.psm`, together with AIF's own queries, choose the mechanism:

- plain owned storage calls `ir_free_object`;
- a list calls `ir_free_list`, which also handles its element policy (this is what compiled to `list_release` above);
- a `DataView` calls `ir_free_data_view`;
- an owning struct calls `ir_free_typed(value, releaseFnName(type))`;
- a struct on the frame whose type's fields own their values (`IR_DROP_FIELDS`) calls `ir_free_typed(value, frameReleaseFnName(type))` — the same field walk without freeing the stack slot;
- shared/counted storage calls `ir_free_rc` or `ir_free_rc_atomic`;
- cycle-managed storage follows its generated typed release/cycle path; and
- stack, static, borrowed, transferred, or arena-owned values emit no individual free at all.

`generateReleaseFn` creates one helper per struct whose fields require teardown. `generatedFieldRelease` asks AIF whether each field is owned, counted, cyclic, or inert and emits the matching action. `generateCyclicChildrenFn` creates the visitor the cycle collector uses.

Assignment needs a separate path, because the old value can only be released once its replacement has been evaluated safely: `generateDisplacedRelease` does that ordering. `aif_releases_on_overwrite_node` determines when a write displaces an owned value in the first place. `ir_set_reinit_target` marks a self-reinitializing accumulator so string/list operations can reuse existing storage without releasing the buffer they are about to mutate.

### Structs on the frame

AIF puts a struct that does not outlive its function in a stack slot (T0), and a stack slot has no release, so nothing released the fields of one. Two rules give those fields owners, and each asks the question the equivalent heap or binding case already asks, so the two cannot disagree:

- **An owned temporary written into a frame struct's field** — `Bag { items: [] }`, or `bag.items = f()` in the block that declared `bag` — is spilled to a hidden binding on the drop list by `spillOwnedFieldTemporary` (`src/ir/expr.psm`), exactly as `spawn` does for its arguments. It is gated by the questions a `let` of the value would ask, in the same order: `aif_frees_at_scope_node` first, because it answers per node where one allocation site backs many calls (every `concat`), then `aif_owns_call_result_at_node`. The assignment form requires the same block because a hidden binding is dropped at the exit of the scope it is made in, and a binding the function reassigns is excluded (`irFrameStructSlots`).
- **Where the type's fields are the release point**, the frame struct's binding gets `IR_DROP_FIELDS` (`frameStructOwnsFields` in `src/ir/stmt.psm`). Once any object of a type is reclaimed — `aif_type_is_reclaimed`, the premise `site_in_released_field` is built on — a value stored into an owning field has no other owner, including one stored into a frame instance, because a field's points-to set is the type's and not the object's. `generateFrameReleaseFns` defines `__aif_release_fields_T` after every function, for exactly the types some drop named, so a program without one carries none; it shares `generateOwnedFieldRelease` with `__aif_release_T`. A type none of whose objects is reclaimed bars nobody, and must not be released here as well.

Releasing the value a field *assignment* displaces is still not done: `let old = bag.items` is a view, and so is a value a call returns out of `bag`, so the displaced value may still be read. It needs a "no view can be live" proof; KNOWN_ISSUES.md lists it with the other open field shapes.

### Calls, temporaries, and returns

`irArgumentIsOwnedTemporary` identifies a call argument whose storage has no binding owner. `generateOwnedTemporaryRelease` schedules its release after the call completes (`ir_call_end`), except where a consuming parameter has taken ownership instead. Borrowed C-string conversion records its own call-frame temporary and releases it in `release_call_temps`.

`nodeProducesOwnedValue`, `irCallReturnsAlias`, and `aif_owns_call_result_at_node` distinguish an owned result from an alias or a view. Return lowering transfers an owned result out of the local drop set entirely; returning an alias instead extends the underlying owner's required lifetime through AIF provenance, rather than pretending the alias itself owns storage.

**Who owns a call's result is asked of that call, not of its allocation site.** A site is per allocating function, so one site serves every value that function makes — every `concat` in a program is one. `aif_owns_call_result_at_node` used to refuse a call whenever any site it could return had been stored into a container or a released field *anywhere*, and one `Box { text: make(n) }` in a function nothing calls then cost every temporary `concat` result its release. It now builds a key-level flow graph from the constraints (`flow_build` in `runtime/aif_support.c`) and asks two flow questions:

- `call_result_held` — does *this node's* value reach a holder? The walk gives every call a fresh value set, so the constraints that consume it (and any union built from it) are this node's consumers alone.
- `call_fn_result_held` — can the callee's result already be held when it returns: read out of a holder, or stored into one and returned as well? Answered over the keys that flow into its `RET` key, without following edges out of a `RET` key, which belong to callers.

The pass-through guard is asked of flow in the same way. `param_returns` records, per parameter, whether a path leads from it to its function's return along moves that function makes — each constraint carries the function whose walk made it (`aif_con_fn`) — crossing into a callee only through the callee's own answer. Asked of sites instead, a chain of one-line wrappers (`x.toUpper().toUpper()`, where `toUpper` returns `strToUpper`'s allocation) put one site in both the parameter's set and the return's, and every chained call looked like it returned its receiver.

**A temporary whose release the callee withholds becomes a binding.** When the callee may hand an argument, or a view of it, back — `optionOr(lookup(i), d)` returns the String inside the Option — codegen cannot release the temporary after the call. `irHoistBorrowedTemporaries` (`src/ir/expr.psm`) runs before a function body is generated and splices `let bt.N = lookup(i)` ahead of the statement, so the scope drop and every guard on it apply by name. It only does so where that reorders nothing: the temporary must be the statement's first effect, the statement must run once (a `let`, an expression, an assignment to a name, an `if` condition), and the block must not carry an automatic arena, whose range is counted in statements.

The guards on a callee-allocated binding's drop now cover a view of it leaving the scope, not only the binding itself: `irValueAliasesName` treats a call that may return a view of a parameter as an alias (except `concat`, which copies), `chainAssignsAliasOf` refuses a binding whose alias is assigned into another binding, and `chainRetainsAliasOf` one whose alias is passed to an argument the callee keeps (`aif_call_arg_retained`: the contract for an extern such as `list_push`, the flow graph for a Prismio function). Each shape read freed memory before — a Vec of views of a dropped `Option` read back as the last string written — and `--verify` reported them clean, because every release it saw was legal. `tests/test_185_view_outlives_binding.psm` aborts on the compiler before the fix.

**A discarded result is released.** `make(1)` on a line of its own, or `it.next()` to skip an element, is a value nothing reads — the degenerate `let`, with no uses. `generateDiscardedCallRelease` (`src/ir/expr.psm`) asks it the question a temporary argument is asked, `irArgumentIsOwnedTemporary`, and releases an owned one through `generateOwnedTemporaryRelease`. Before 2026-09-25 every discarded owned result leaked.

**A return that may be static storage is partial.** `fn_returns_partial` (`runtime/aif_support.c`) tells a caller not to take ownership of what a function hands back when some `return` may carry no allocation. It used to ask "does a return resolve to no site at all?", and two shapes answered no while returning a literal:

- `fn wrap(o: Option<String>, d: String) -> String { return optionOr(o, d) }` resolved to the sites stored into *any* `Option<String>` payload — std's own `Some(substring)` among them — while the value could be the caller's literal `d`;
- `return v` for a payload binder resolved the same way while the `Option` in hand held a literal.

Both read as owned, and the caller freed `.rodata`: `free(): invalid pointer` outside `--verify`. The question is now "may this return be static storage?", answered by `key_may_return_untracked`. It is `key_may_be_untracked`'s closure over binds, stores and arguments, less one source: a literal bound straight into a local, which codegen clones wherever that binding is also given owned values (`let mut out = ""; out = out + x; return out` returns an allocation on every path). Counting that source made every such builder partial and leaked its result — 6 of 1,054 in `test_140`. Still open, and no wider than before: a `let mut s = "lit"` that is not an accumulator, later given both an owned value and an unowned one that is not itself a literal source, and returned. `forwarding_literal_probe.psm` and `binder_return_probe.psm` pin the two shapes. The third shape fixed with them — a payload binder moved into a new enum — is a view question; see [regions, views and provenance](/aif/regions-views-and-provenance#a-field-holding-a-view-of-an-enums-payload).

**A value this frame stores into a recursive field is held.** `plain_released_field_keys` leaves out a released field that re-enters its owner's type, so that a tree's root stays its caller's: the field's release and the caller's drop are one traversal. That holds for the root and not for a value this frame binds and then makes a child:

```prismio
let left = build(d - 1)
let right = build(d - 1)
return Expr.Op(d, left, right)
```

`left` became part of the returned tree, which the tree's release frees, and the binding's scope drop freed it too: a double free on every tree built this way. `call_result_held` now also asks `vs_stored_in_recursive_field`, which walks the value through this frame's own `VAR` keys to such a field, so a value reaching one through a return or a parameter stays the question it was. No program in `tests/` or `aif/corpus/` changed IR, and `recursive_enum_bindings_probe.psm` reads 190/190/0.

The same tree through `Node?` did not link. A `T?` slot's IR key is `ptr`, which carries no type, so its typed drop named `__aif_release_` — undefined. `noteOptionalDropType` (`src/ir/types.psm`) remembers the struct an optional binding's drop must name where the binding is marked droppable, and `irOwnedTemporaryDeclType` does the same for a temporary; `recursive_optional_probe.psm` pins it. All four probes run in the suite's `ownership_probes` check.

**One allocation site backs every `concat` in a program, so its ownership is decided by the whole program.** Asking "who owns this call's result" of the call rather than the site (above) narrowed this, and did not remove it: a fact about the one `concat` site still reaches every `concat` call. When `StringBuilder` first stored `concat` results in its `Vec` field, that together with `listModules` doing the same made every `concat` result passed straight as an argument go unreleased, in any program that imported `std.fs` and `std.string`, whether it used either or not: `test_184` leaked 2,165 of 4,073. `StringBuilder` now copies each piece through a helper of its own, `builderPiece` in `std/string.psm`, whose comment says why it must not be `concat`, and `concat_argument_probe.psm` pins the shape. The sensitivity remains for application code: a program that stores `concat` results in a container field of its own can change what is released elsewhere. The planned fix is context-sensitive sites for library producers, part of the interprocedural work in `docs/MEMORY_PLAN.md` §2.3 (`docs/KNOWN_ISSUES.md`, "Ownership", the entry on `concat`, has the measurement); until then, treat a new `concat` stored into a field in `std/` as a whole-program change and measure the suite's ledgers with it.

**A binding returned on some paths is released on the others.** A `return` takes its value out of the drop set only on the path it is on: `generateReturn` passes the slot of a bare `return name` to `generateScopeDrops`, which skips that one entry, and every other exit — another `return`, a `break`, the end of the block — releases the binding as usual. Two facts make a binding eligible. For a callee's allocation, `nodeReturnsAliasBeyondBare` (`src/ir/expr.psm`) requires every `return` that may carry it to be the bare name; `let t = a; return t` is not, so `a` keeps the old refusal. For an allocation made in the frame, the escape fact `E` cannot answer, because the return lifts it to Caller for every path; the engine keeps `E_held`, the escape by every rule except the direct E-RETURN of a bare `return name` in the site's own function (and except a return or binding in another function, which reaches the value only after this frame returned it or during a call it made), plus `ret_key`, the binding that return named. `aif_frees_unless_returned_node` is `aif_frees_at_scope_node` with `E_held` in place of `E` and `ret_key` required to be this binding's. Binding keys are per name, so the codegen side also requires the name to be bound once in the function: `let a = a` in an inner block made two bindings one key, and the drop of the outer `a` at the inner `return a` was a double free. `tests/test_205_return_on_one_path.psm` pins the shapes.

Ownership regressions need coverage for at least: a legal move, use-after-move rejection, borrow followed by use, consuming call, overwrite, every early exit, nested scope, loop break/continue, returned owned value, returned view, container element replacement, task transfer, an FFI contract, and both verifier and observable-value assertions — a balanced ledger and a correct answer are different claims, and a regression test that only checks the ledger can pass while returning a stale value.
