---
title: Semantic analysis and types
description: The passes that resolve names, types, overloads, calls, fields and flow — and why a rejection reports every mistake it can find rather than stopping at the first.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [semantics, types, overloads]
related: [compiler/imports-and-symbols, compiler/ownership-and-drop-lowering, compiler/generics-and-monomorphization, compiler/diagnostics, aif/overview]
---

Every later stage of the compiler — allocation inference, LLVM generation — is allowed to assume the program in front of it is well-formed: every name resolved, every type assigned, every call bound to one specific overload. Semantic analysis is where that assumption is either established or the build stops. It resolves declarations and lexical scopes, assigns expression types, selects exact overloads, validates fields and enum variants, checks calls, and decides whether control flow returns or becomes unreachable — before ownership checks and code generation ever see the program.

Prismio does not lean on broad implicit numeric promotion. Width and signedness are part of a numeric type, not incidental to it, and a cast must be written explicitly wherever source and destination differ. `Int` itself is a 32-bit signed integer (`i32`). Overload selection therefore compares concrete argument types rather than ranking conversions, which is stricter than languages that will quietly widen an `Int` to an `I64` for you.

`src/sema/checker.psm` coordinates the passes; supporting modules divide builtins, types, symbols, generics, enums, ownership, and flow so each rule has one primary owner.

## See two integer widths refuse to mix

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let a: I64 = 10
    let b: Int = 5
    let c = a + b
    return 0
}
```

```bash
prismio check widths.psm
```

```text
error[P4001]: operator `+`: expected I64, found Int
 --> widths.psm:4:17
  |
4 |     let c = a + b
  |                 ^
error: aborting due to 1 previous error
```

`a` is `I64` and `b` is `Int` (32-bit); neither is a literal that could take either type, so there is no automatic widening to fall back on. The fix is an explicit cast, and once it's there the program both checks and runs:

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    let a: I64 = 10
    let b: Int = 5
    let c = a + (b as I64)
    println(c)
    return 0
}
```

```bash
prismio run widths.psm
```

```text
Built widths
15
```

## A worked example: one bad program, four diagnostics

Semantic analysis does not stop at the first error — it keeps checking and reports as many independent mistakes as it can find in one run, because a developer fixing errors one at a time and recompiling after each is exactly the loop this is meant to shorten. Four different literals, four different ways of not fitting their type:

<!-- prismio-check: fail -->
```prismio
import std.io

fn main() -> Int {
    let small: U8 = 999
    let wide = 4294967296
    let sum = 0 - 2147483648
    println(99999999999999999999999)
    println(small)
    println(wide)
    println(sum)
    return 0
}
```

```bash
prismio check literal_range.psm
```

```text
error[P4001]: integer literal `999` does not fit in U8
  --> literal_range.psm:4:21
   |
4 |     let small: U8 = 999
   |                     ^^^
error[P4001]: integer literal `4294967296` does not fit in Int
  --> literal_range.psm:5:16
   |
5 |     let wide = 4294967296
   |                ^^^^^^^^^^
error[P4001]: integer literal `2147483648` does not fit in Int
  --> literal_range.psm:6:19
   |
6 |     let sum = 0 - 2147483648
   |                   ^^^^^^^^^^
error[P4001]: integer literal `99999999999999999999999` is too large for any integer type
  --> literal_range.psm:7:13
   |
7 |     println(99999999999999999999999)
   |             ^^^^^^^^^^^^^^^^^^^^^^^
  note: the widest are `I64` and `U64`, at 64 bits
error: aborting due to 4 previous errors
```

Each literal is checked against the type it is used as — `U8` for `small`, `Int`'s own 32-bit range for a bare `let`, and the 64-bit ceiling once nothing narrower could possibly hold the value. None of these silently wrap: a literal that does not fit used to be accepted and truncated in silence, which is a worse failure than a compile error, because the program runs and prints a wrong number with no indication anything was lost. A deliberate `narrowing` cast (`300 as U8`, meaning 44) is a different, explicit operation and is not what this diagnostic is about.

## Analysis order

`analyzeModule` is the semantic entry point, and its ordering is part of the contract other stages rely on:

1. reset semantic type/symbol state and index top-level declarations;
2. collect generic templates and predeclare concrete functions and globals;
3. expand trait default methods and required generic specializations;
4. validate implementation coherence, orphan rules, members, and supertrait cycles;
5. synthesize dynamic trait-object structs and resolve opaque `impl Trait` returns;
6. analyze function bodies, globals, workloads, and expressions;
7. run ownership/extern-contract checks; and
8. leave a resolved `TypeInfo` on every expression that may reach **AIF** (the Adaptive Inference Framework — see [AIF overview](/aif/overview)) or **IR** (intermediate representation) generation.

Moving body analysis before predeclaration would break forward calls and mutual recursion. Running trait-object synthesis before conformance is known could create a vtable layout for an implementation that turns out to be invalid. Everything downstream — ownership checking, AIF, code generation — assumes this order already ran to completion.

## Builtins and source rewrites

`src/sema/builtins.psm` owns operations that look call-shaped in source but lower as compiler operations rather than as ordinary calls. Methods, operators, iteration, and selected standard-library behavior can all be rewritten to plain calls before overload resolution runs; the diagnostic for a failed rewrite should still name the source-level action the developer wrote, including a missing import when the rewrite depends on a standard module.

**Two syntactic passes run first in `analyzeModule`, before any rewrite**, because a rewrite can produce the very shape they refuse. `semaCheckArrayLengthPositions` refuses an `Array<T, N>` length where one cannot be written. `semaRefuseRuntimeCalls` (`src/sema/vec.psm`) refuses a written call to a runtime entry point — `list_push`, `list_get`, `slice_len`, `data_len` and the rest — outside `std/`, and names the method to write. After the Vec lowerings run, `list_push(v, x)` may be `v.push(x)`; only before them is every such call one a person typed. Both passes walk `module.child1` and `module.child2`, where `monoCollectTemplates` parked the generic templates.

**Element reads are `list_get`.** `semaIndexExpr` rewrites a Vec `v[i]` read into `list_get(v, i)`, the same entry point every element-reading method lowers to, so codegen's flat guards and hoisting (which match the call) see one shape. `semaBindingIsBorrow` treats the lowered call as a borrow, as it treated the index: `let x = v[i]` does not own `x`, and storing it into another slot is refused rather than putting one owned element under two slots. `Vec<T>.withCapacity(n)` lowers to `list_new_with_capacity`, typed `Vec<T>` from the written `T` — like `[]`, it names no library function. `Vec<T>.filled(n, x)` checks `x` against `T` *before* the call (the call cannot know `T`, and that is what re-types the literal in `Vec<U8>.filled(n, 0)`), then lowers a scalar `T` to `list_new_filled` — the runtime's `list_new_filled_inline(n, bits, elem_size)`, one allocation and one memset or typed fill — and anything else to std.vec's `vecFilled`, which copies `x` per element. `for c in s` over a String takes its bound from `__builtin_string_len`.

**`default`** is a `DEFAULT_EXPR` until `semaCheckValue` meets it with an expected type; `semaResolveDefault` (`src/sema/defaults.psm`) then rewrites the node in place into the source expression that builds that type's value — a literal, `[]`, `none`, `Option<T>.None`, `mapNew<K, V>()`, or a struct literal of the fields' defaults, recursively, to a depth of 16 — and checking continues on what it became. A `let` of `Array<T, N>` numbers drops the initializer instead (`semaDefaultZeroesArray`), which is the zeroing `let`. With no expected type (`semaExpr` reaching the node directly: an argument, an unannotated `let`) it is an error; nothing after sema ever sees the kind.

**A call to a type is a call to its `new`.** `semaTypeCall`, first in `semaCallExpr`, answers for a callee that is not a binding and names a struct, an enum, a generic template of either, or `Vec`: with a `Name.new` declaration or template, the callee becomes the `MEMBER_ACCESS` `Name<args>.new` the parser builds for the written spelling -- the call's `child3` becomes the qualifier -- and `semaTypeFunctionCall` and Vec's associated functions take it from there. A type with no `new`, and a generic one called with no arguments and nothing written or inferred (`let m = Map()`), are reported here. It answers with Vec's three verdicts, `semaVecRewritten`/`Rejected`/`NotLowered`.

**Type arguments from the context.** `monoTypeArgsFromExpected` (`src/sema/generics.psm`), called by `semaCheckValue` on a `CALL_EXPR` before it is typed, handles a generic call whose arguments leave a parameter unsolved: `let m: Map<String, Int> = Map()`, `= mapNew()`, `= Map.withCapacity(n)`. It solves the rest by `monoMatchParam` of the template's declared return annotation against the expected type -- the same positional match against the instantiation's recorded arguments that inference from an argument uses -- and writes the answer onto the call as explicit type arguments. A call the arguments already solve is left alone, so nothing that compiled before changes.

**A map literal** is rewritten in place by `semaMapLiteral` (`src/sema/maps.psm`), from `semaCheckValue` with the expected type or from `semaExpr` without one. `K` and `V` are the annotation's (read back from the instantiation's `entryKeys`/`entryValues`) or the first entry's; every entry is checked against them in the literal's own words, and a mismatch stops there. `{}` becomes a `DEFAULT_EXPR`. Two equal literal keys are an error. A literal whose keys are all *plain* -- a literal, a name, or any key of a type that owns nothing -- becomes `mapFromEntries<K, V>(n, [keys], [values])`, a producer. Any other key is an owned temporary, and a frame array frees none of its elements, so such a literal is built on `mapWithCapacity`, each such key by its own `mapPut` (where it is an argument temporary) and each run of plain keys by one `mapPutAll`, in source order. That shape keeps a 300-entry table one call deep, under the backend's 64-level call nesting.

**A `let` of a Map with no initializer** is given a `DEFAULT_EXPR` initializer by `semaDefaultEmptyMap`, beside `semaDefaultEmptyVec`; it was a zeroed struct, and the first `set` read a null bucket table.

**Mutation needs a changeable root.** `semaCheckMutablePlace` (`src/sema/ownership.psm`) is asked of the receiver of every Vec builtin that changes contents (`list_push`, `list_set`, `list_set_exclusive`, `list_swap`, `list_insert`, `list_reserve`, `list_truncate`, `list_remove_at`), of an array element store, and of every argument to an `inout` parameter. It follows indexing (`INDEX_EXPR` and the lowered `list_get`) to the root binding and accepts `let mut` (`ir_var_is_mutable`) or an `inout` parameter (`ir_var_is_inout`, a flag beside `is_mutable` on the scoped binding in `runtime/ir_symbols.c`, set by `ir_mark_inout` where parameters are bound). A field access stops the walk: struct fields are assignable through any binding, so a Vec field changes with its struct. An `inout` parameter's binding is never itself mutable — `inout` is a borrow, not a reference to the caller's slot, so rebinding it would be invisible to the caller.

**A Slice store needs a writable view.** `slice_set` asks `semaCheckMutablePlace` of its Slice, and the walk (`semaPlaceRoot`) also follows a `SLICE_EXPR` to its base, so `poke(v[1..<3])` into an `inout` Slice needs `v` changeable. Whether a view may be written is a second fact, kept in two places because a binding's type travels as a semantic key with no room for it. On an *expression*, `typeSliceReadOnly` marks the Slice type in its `length` field, which only arrays read, so the mark reaches no key, no equality test and no IR. `semaSliceExpr` sets it when the base is not changeable (`semaSliceOfIsReadOnly`), and `semaCallExpr` sets it on a Slice returned by a function with no `inout` parameter. On a *binding*, `ir_mark_readonly_view` sets `is_readonly_view` in `runtime/ir_symbols.c`. `semaMarkSliceBinding` copies the mark at a `let` and at an assignment, and it refuses an assignment that would give a writable view a read-only value: a store earlier in a loop body would otherwise run through it on the next iteration. A Slice held in a struct field is not tracked, for the same reason a Vec field is not.

Source sugar is rewritten before final overload resolution in a few specific places: `semaStringComparison` and `semaStringConcatChain` route string operators to the operations that implement them while evaluating each operand exactly once; `semaForEachDesugar` and `semaForEachIterator` turn `for`-style iteration into explicit loops (below); `semaPropertyRewrite` converts property-style access (`s.length`) into a call and records the spelling on the callee, which `semaCheckPropertySpelling` checks against the `prop` marker once overload resolution has chosen the declaration (`s.length()` and `s.trim` are both errors; a plain `length(s)` is not checked, since desugarings synthesise calls that way); and `semaBecomeCall` replaces a node with its resolved call shape without discarding the original source span (needed so the diagnostic still points at what the developer wrote).

## Arrays: lengths, copies and views

An array's length lives on its `TypeInfo`, in `length` — `0` means the type does not know it. It is
set in three places and read everywhere else:

- `semaArrayLiteralExpr` and the literal branch of `semaCheckValue` give a literal its element count.
  A nested literal whose rows differ in length gets an element type of unknown length.
- `semaSizedArrayType` types `Array<T, N>` wherever `semaAnnotationInner` meets a length, because
  where one may be written was settled first, by `semaCheckArrayLengthPositions` — the first thing
  `analyzeModule` does. That pass is syntactic, and it has to run before anything types an
  annotation: typing one can instantiate a generic struct, and an instantiation copies whatever
  lengths its template still carries. It walks both chains, the declarations and the templates
  `monoCollectTemplates` parked on `module.child2`. A length is allowed at the top of a local
  `let`'s annotation, a return type and a struct field; anywhere else — a parameter, a type
  argument, a nested array, a cast, a closure parameter, an extern, a global — it is reported once
  and detached. A trait signature is walked as a function, so a default method's `let`s are
  ordinary locals. Three field cases are refused with their own message: a field of a generic
  struct (instantiated after this pass, so nothing would check what `T` became), any array in a
  payload enum's struct (a `match` binds a payload by loading it), and a `[T]` field with no length
  (it would point into the frame of whichever function built the struct).
- `semaCheckArrayDecl` runs after the initializer and returns the binding's type: `[T]` and
  `Array<T>` take a known initializer length, `Array<T, N>` must match one, and a declaration with
  no initializer needs `N` and an element type with a zero.

An array field is checked in two more places. `semaCheckArrayFields` runs once the named types are
registered, since an element may name a struct, and refuses an element that owns something
(`typeOwnsNothing`). `semaStructLiteralExpr` passes each initializer through `semaCheckArrayCopy`,
the assignment check, because a literal fills the field by copying. `semaFillOmittedFields`
synthesises no initializer for an array field — there is no zero to write as an expression, and
codegen zeroes every array field before the literal's own initializers run. `typeAnnIsPodIn`
answers POD for `Array<T, N>` with a POD element, so a struct holding one is inline where it is
nested and flat in a `Vec`; `soa` refuses such a struct (`semaStructHoldsArray`), since a column
holds one scalar per row.

A call to a function declared `-> Array<T, N>` gets `CALL_EXPR.i2 = 1`. Codegen decides how an
array return travels from the declaration, never from the call's type: a generic `-> T` bound to an
array types as one and still returns the pointer it was given.

The length survives a binding because `typeSemKey` writes it — `array#16:U32`, against the
unchanged `array:U32` for an unknown length — and `typeFromSemKey` reads it back. The key feeds
sema's variable-type table only; no IR is derived from it.

Two predicates in `src/ast/types.psm` are shared with code generation, so the two cannot disagree
about what a store or a binding does:

- `typeOwnsNothing(t)` — a number, `Bool`, `Char`, `Ptr` or a payload-less enum. An element must be
  one for an index store (which releases nothing it displaces), a zero-filled array, or a copy.
- `typeArrayCopies(t)` — the length is known and the elements own nothing. Then `let b = a` and
  `d = c` copy the elements; `semaCheckArrayCopy` requires equal, known lengths on assignment. An
  array without a known length is a view — a `[T]` parameter, and whatever is bound from one — and
  binding or assigning it shares the storage, which is the borrow a parameter already is.

A `Vec` binding with no initializer — `let items: Vec<Item>` — is given the `[]` it would otherwise
have to write by `semaDefaultEmptyVec`, before anything else looks at the declaration, so it is
checked and lowered exactly as `= []` and its IR is identical. It used to compile to an
uninitialised pointer. `Vec<T>?` is left alone: its absent value is `none`. Because this is a
sema rule rather than syntax, `src/` and `std/` must not rely on it until the seed has been
refreshed — the seed would still compile the short form to that uninitialised pointer.

**A Vec removal releases at once when no view can be live** (COLLECTIONS 1e). The runtime's
`list_truncate` and `list_remove_at` take a `now` flag; without it a removed element that owns
memory is parked and released with the Vec, because a `let s = v[2]` view may still read it.
`semaRemovalVerdict` leaves its proof on the call as `CALL_EXPR.i2`: `1` when the Vec is a fresh
local (the per-binding exclusive mark, set only by a `list_new` initializer) that nothing has read,
sliced or lent before this point and no loop it predates encloses the call; `2` when such a loop
does; `0` otherwise. For `2`, codegen's `irViewMayOutliveIteration` grows the set of names that may
hold a view (non-scalar `let`s whose initializer mentions one, which covers the desugared `for`)
and answers yes if any assignment of a non-scalar value mentions one — the only way a view crosses
a back edge. `test_161` holds the result to a peak-live-bytes ceiling in `run_aif_verify_test`,
because a parked removal balances the ledger too.

`x[i] = v` is decided in `semaIndexAssignment` before the ordinary assignment path. A `Vec` or a
`Slice` is rewritten by `semaVecLowerIndexStore` into `list_set` / `slice_set` — the call
`v.set(i, x)` lowers to — and checked as that call. An array of elements that own nothing keeps the
assignment for codegen's element-address store. Everything else is refused with the spelling that
works. Assignment also sends a bare integer literal through `semaCheckValue`, so `w = 4294967296`
into an `I64` adopts the type and range-checks exactly as a `let` does.

### Methods on an array

A Vec carries its length and an array carries it in the type, so a `[T]` parameter cannot read
`items.length` and the array methods are separate functions that take the length beside the array:
`min(items: [T], count: Int)` in `std/vec.psm`, next to the Vec's `min(items: Vec<T>)`.
`semaArrayLower` (`src/sema/array.psm`) supplies the count at a call on an array whose
`TypeInfo.length` is known. It is called from the method-call path and from the property path in
`checker.psm`, beside `semaVecLower`, and answers in the same three results (`semaVecNotLowered`,
`semaVecRewritten`, `semaVecRejected`):

- `a.length` becomes the literal `N`, and needs a named array, because the receiver is dropped and a
  call in that position would no longer run.
- `a.first` and `a.last` become `a[0]` and `a[N - 1]`: an `INDEX_EXPR` over the receiver, which stays.
- `a.contains(x)` and the rest of `semaArrayTakesCount`'s list become `contains(a, N, x)`, a plain
  call that overload resolution then picks the `[T]` overload for. The in-place ones (`sort`,
  `reverse`, `swap`, `fill`, `sortBy`) become calls on an `inout` parameter, so the usual
  `semaCheckMutablePlace` asks for a `let mut` array without this module saying so.
- An array whose length is not known, which is what a `[T]` parameter is, is rejected with a message
  that says so and names the long form (`contains(xs, n, x)`); it is not left to report
  "no overload".

A slice needs none of this: it carries its length, so its overloads are the Vec's with `Slice<T>`.
`tests/test_249_array_methods.psm` and `tests/test_254_array_and_slice_methods.psm` cover the
accepted half, `tests/neg_251_array_length_unknown.psm` and `tests/neg_253_array_mutation_needs_mut.psm`
the refused half.

## Flow and program validity

### `for` over a collection

`semaForStatement` leaves a range loop as it is and hands a collection loop — no `child2` — to `semaForEachDesugar`, which rewrites the statement in place into a loop every later pass already handles:

| Collection | Becomes |
| --- | --- |
| String, `Vec<T>`, `Slice<T>`, `Array<T, N>` | `for $x in 0..<length { let x = c[$x]  … }` — the length is `strLength`, `list_len`, `slice_len`, or the literal `N` |
| `Map<K, V>` (a `Map$…` instantiation, with std.map imported) | `for $k in 0..<mapLen(m) { let k = mapKeyAt(m, $k)  … }`, and `let v = mapValueAt(m, $k)` for a pair |
| a struct implementing `Iterator` | `while (hasNext(it)) { let x = next(it)  … }` — the node becomes a WHILE_STATEMENT |

The element read is an INDEX_EXPR rather than a direct call so that it re-enters the indexing arm and gets its bookkeeping — `ir_unmark_list_exclusive` for a Vec. A pair `(i, x)` makes the first name the loop variable itself, so no hidden index is needed.

The collection appears several times in the rewrite, so it must be something that can be read twice without evaluating anything, and that must not be bound, since binding a name moves it: a name, or a field of one (`semaForSourceIsPlace`). Anything else is bound first by `semaForHoistSource`, which splices a statement into the block's chain: this node becomes `let $for_L_C = <expression>` (`mut` for an Iterator, whose `next` takes it `inout`) and the loop moves to a new node after it, which the block's walk reaches next and desugars as a name. The hidden binding is then released at the block's exit like any other.

Jumps are checked before the body is typed. `semaCheckJumps` (`src/sema/flow.psm`) walks the statement tree with the enclosing loops' labels and rejects `break`/`continue` outside any loop, a label no enclosing loop carries, and a label that shadows an enclosing one. It enters loops, `if`, `match` and `region` but never an expression, so a closure's body is checked as its own function.

`src/sema/flow.psm` tracks returns, unreachable statements, loop behavior, and the facts safe lowering depends on. `semaStmtDiverges` identifies returns, breaks, continues, fully diverging `if` chains, unbroken infinite `loop` statements, and a statement that is a call to `panic`, `unreachable` or `exit`; `semaBlockDiverges` walks a block until one statement prevents fall-through. The private `semaBlockBreaksOut` and `semaIfBreaksOut` helpers answer whether a `break` leaves the `loop` being classified: an unlabelled one outside any nested loop does, and so does a labelled one unless its label names a loop nested inside — a `break@outer` from an inner loop leaves the outer one too. A nested loop's own unlabelled `break` does not count; counting it, as the analysis did before labels, rejected a `loop` whose only exits are returns as reaching the closing brace. Get this wrong in the other direction and a function that falls off its end is accepted (`tests/neg_207_break_outer_leaves_loop.psm`).

## If you are changing semantic analysis

### Expression and statement functions

`semaExpr(module, expr)` is the central dispatcher. It handles literal types, identifier lookup, unary/binary operators, calls, members, indexing, casts, optionals, arrays, lists, structs, closures, dynamic values, and builtins, returning a `TypeInfo` that it also stores on the node. `semaStatement` checks one statement against its enclosing function's expected return type. `semaBlock` manages scope, analyzes the statement chain, and invokes the flow checks above. `semaFunction` creates the parameter scope, validates the body, checks return behavior, and closes the scope; `semaPredeclareFunction` and `semaPredeclareGlobal` establish names before any body executes, which is what step 2 of the analysis order depends on.

`semaTypeErrorAt` compares an expected and actual `TypeInfo` and formats the source-level diagnostic — this is what produced every `error[P4001]` above. `typeEquals` is structural for applied builtins/generics and nominal where the language requires identity. Three different string forms of a type exist for three different audiences and must not be swapped: `typeDisplay` is for humans (diagnostic text), `typeSemKey` is for semantic caches, and `typeIrKey` is for lowering.

### Builtins and calls in detail

**The failure builtins claim a name only where the program has not.** `semaFailureBuiltinApplies` (in `sema/flow.psm`) answers whether `panic`, `unreachable`, `assert` or `exit` is the builtin: it is unless the merged program declares a free function or `extern fn` of that name. The compiler's own sources declare `extern fn exit` six times, and user programs do too, so a builtin that took the name would silently change what their calls mean. Where the builtin applies, `semaCheckBuiltinCall` rewrites the callee to `__builtin_panic` (and so on). No program can declare a `__builtin_` name, so divergence, codegen, the flat-List guard and AIF all key on that spelling. Codegen ends each failing path with a call to the runtime's `prismio_panic` / `prismio_unreachable` / `prismio_assert_failed` (exit status 101) or libc `exit`, then `unreachable`. An `assert`'s message is generated inside the failure block only, and `irFlatGuardCount` counts only the condition, so a message that calls something neither allocates on the passing path nor costs the loop its guard. A failed `assert` with no message prints its source line, which codegen reads through `diag_source_line` while the file is still in hand.

`semaBuiltinCallType` returns the result type for compiler-known operations; `semaCheckBuiltinCall` validates arity, receiver/element types, mutation, ownership, and operation-specific constraints, across list, slice, `DataView`, string, task, channel, optional, and selected numeric operations. `semaTaskResultAllowed` and `semaSpawnArgAllowed` keep task application binary interface (ABI) values within representations the backend actually implements. `semaCheckUniqueArgs` prevents a uniquely-consumed value from being passed twice into one call. `semaCheckExternContracts` validates foreign-function-interface (FFI) ownership annotations, and only after types and parameter positions are already known — an FFI contract cannot be checked against a signature that has not been resolved yet.

A semantic change is only complete once it defines: accepted and rejected types, coercions, source-span ownership for diagnostics, overload interaction, flow behavior, ownership mode, generic specialization, dynamic dispatch behavior, AIF visibility, and the exact resolved form handed to code generation. New rules need a positive example, a focused rejection, and — where recovery or continued checking matters, as in the four-diagnostic example above — a multiple-error test proving the checker keeps going rather than stopping at the first mistake.
