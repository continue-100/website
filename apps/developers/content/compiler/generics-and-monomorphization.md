---
title: Generics and monomorphization
description: How Prismio discovers generic instantiations, substitutes concrete types, validates bounds, and emits one specialized copy per combination of type arguments.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [generics, monomorphization, compiler]
related: [compiler/traits-impls-and-dispatch, compiler/semantic-analysis-and-types, aif/layout-selection]
---

A generic function written once still has to become real machine code for
every concrete type it's called with, and those concrete versions can need
*different* code — a `Vec<Int>` stores its elements inline in its block, while
a `Vec<Named>`, where `Named` is a struct holding a `String`, stores one pointer
per element. Prismio's answer is
**monomorphization**: every generic function, struct, enum, trait, and
implementation is specialized into an ordinary, concrete declaration for each
combination of type arguments it's actually used with. There is no single
erased generic body that discovers element layout at runtime.
`src/sema/generics.psm` validates arity, substitutes types, tracks requested
instantiations, and prevents an unbounded specialization chain; each
specialized body then passes through ordinary semantic analysis, ownership
checking, AIF (Adaptive Inference Framework), and code generation exactly as
if it had been hand-written.

## See it work: two instantiations, two layouts

`tests/test_82_generic_layout.psm` in the compiler repository exists
specifically to keep this distinction observable. It declares one generic
function and instantiates it for two structs with different ownership
shapes:

```prismio
struct Flat { x: Int, weight: Float }
struct Named { label: String, value: Int }

fn singleton<T>(sink value: T) -> Vec<T> {
    let mut items: Vec<T> = list_new()
    list_push(items, value)
    return items
}

fn main() -> Int {
    let flatItems = singleton(Flat { x: 7, weight: 2.5 })
    let namedItems = singleton(Named { label: "first", value: 3 })
    // ...
}
```

Building the real fixture produces two distinct `singleton` symbols, not one:

```bash
prismio build test_82_generic_layout.psm -o layout_native
nm layout_native | grep ' T ' | grep -i singleton
```

```text
0000000100000d18 T _singleton$Struct_Flat__Struct_Flat
0000000100000d5c T _singleton$Struct_Named__Struct_Named
```

And the two bodies genuinely differ. `Flat` is eligible for inline `Vec`
storage and calls the inline entry points; `Named` cannot be inlined because
it owns a `String`, and falls back to the boxed ones:

```text
define ptr @"singleton$Struct_Flat__Struct_Flat"(ptr %0) {
entry:
  %value.33 = alloca ptr, align 8
  store ptr %0, ptr %value.33, align 8
  %1 = call ptr @list_new_inline(i32 16)
  call void @list_set_elem_owner(ptr %1, i32 1)
  ...
  call void @list_push_inline(ptr %2, ptr %3, i32 16)
  ...
}

define ptr @"singleton$Struct_Named__Struct_Named"(ptr %0) {
entry:
  %value.38 = alloca ptr, align 8
  store ptr %0, ptr %value.38, align 8
  %1 = call ptr @list_new()
  call void @list_set_elem_owner(ptr %1, i32 1)
  ...
  call void @list_push(ptr %2, ptr %3)
  ...
}
```

Nothing shares this decision at runtime — there's no branch checking "is this
element flat," because by the time either function exists, the type argument
is already concrete and AIF has already chosen its layout for that exact
specialization.

Ordinary overloads mangle the same way, just without a struct prefix —
`pick(a: Int, b: Int)` and `pick(a: String, b: String)` become
`pick__Int_Int` and `pick__String_String`, and `optionOr<T>(o: Option<T>,
fallback: T)` instantiated at `T = Int` becomes
`optionOr$Int__Struct_Option$Int_Int`.

## What failure looks like

A bound in a `where` clause is checked at the instantiation site, exactly like
one written in the parameter list — and the message names both the missing
trait and where to add it:

<!-- prismio-check: fail -->
```prismio
import std.string

trait Show { fn show(self) -> Int }

impl Show for Int {
    fn show(self) -> Int { return 1 }
}

fn render<T>(value: T) -> Int where T: Show {
    return show(value)
}

fn main() -> Int {
    return render(true)
}
```

```bash
prismio check bound_fail.psm
```

```text
error[P4001]: Bool does not implement `Show`
  --> bound_fail.psm:14:12
   |
14 |     return render(true)
   |            ^^^^^^
  note: `render` requires it: the type parameter is declared T: Show
  note: write `impl Show for Bool { ... }`
error: aborting due to 1 previous error
```

Bounds are checked where the concrete arguments are known, not where the
generic is declared — `render<T>` itself compiles fine with no `impl Show`
for anything in scope; the error only appears at a call site whose argument
type actually fails the bound.

## Why ordering matters

Method and operator rewrites must resolve against the *specialized* receiver
and its applicable implementations, which is only possible once the concrete
type argument is known — this is why an eligible `Vec<Flat>` specialization
can use inline element storage while another instantiation of the same
generic remains boxed, as shown above.

Instantiation identity must include every type argument that affects
semantics or representation. Deduplication then prevents duplicate emission
of the same specialization, and recursion detection distinguishes a valid
recursive call to an *existing* specialization from generation of an
ever-growing type sequence that would never terminate.

## If you are changing this

### Template collection and identity

`monoCollectTemplates` walks the merged module and separates generic
functions, structs, enums, traits, and implementation blocks from
declarations that are already concrete and ready for analysis.
`monoIsTemplate` classifies a declaration; `monoFindTemplate` and
`monoFindTypeTemplate` retrieve one. `monoAppendDeclaration` adds a generated
specialization to the same module so later sema, AIF, and IR passes see it as
an ordinary concrete declaration — nothing downstream needs to know it was
generated.

Names use `monoSeparator()` — `$`, confirmed above in
`optionOr$Int__Struct_Option$Int_Int` and `singleton$Struct_Flat__...` — plus
a complete encoding of the applied arguments. `monoMangledName` produces that
identity; `semaMangleType` produces the linkage fragments for resolved types
that go into it. `monoSeparatorCount` and `monoArgsTooDeep` guard against
runaway recursive expansion; `monoElide` shortens diagnostic presentation
without shortening the actual identity used for deduplication.

**A template is not in the declaration index.** `indexModuleDeclarations` walks `module.child1`,
and `monoCollectTemplates` parks templates on `module.child2`, so `ir_decl_count` and
`semaDeclaresFunction` answer 0 for a generic function that a call resolves perfectly well. Anything
that must know a generic exists *before* writing a call to it asks `monoHasTemplate(module, name,
kind)` instead, and `monoHasTemplateOfArity(module, name, count)` when the parameter count matters.
Two rewrites learned this in 0.1.0:

- **`semaPropertyRewrite`** turns `o.isSome` into a call. A property declared on
  `impl<T> Option<T>` is a template, so the rewrite used to see no function and read the property
  as a field ("struct `Option$Int` has no field"). It now falls back to `monoHasTemplate`, and when
  no template of the name takes only its receiver — `monoHasTemplateOfArity(module, name, 1)` —
  it reports ``"`unwrapOr` is a method, not a property"`` itself rather than letting the rewritten
  call fail as "unknown function". The concrete case still reaches `semaCheckPropertySpelling`
  through overload resolution, and both name `isSome` rather than its instantiation `isSome$Int`
  (`tests/neg_194_generic_property_spelling.psm`).
- **`semaShadowsStandardLibrary`** decides whether a program's own declaration shadows a
  standard-library function of the same name and parameter types, by mangling each same-named
  library declaration's parameters. It can meet a *generic* one, whose `T` is bound only at an
  instantiation, and mangling it reported ``unknown type `T` `` against the library for any program
  that declared a `filter`, `find`, `take` or `min` of its own, as a free function or a method, whether
  or not anything called the generic. It skips a declaration with `genericInfo`; a generic's
  instantiations are concrete functions with symbols of their own and are compared as such
  (`tests/test_252_names_beside_std_generics.psm`).
- **The index rewrite** turns `m[k]` on a struct into `at(m, k)`. `Map`'s `at` is a template of
  `impl<K, V> Map<K, V>`, so the rewrite asks `monoHasTemplate(module, "at", …)` as well as
  `semaDeclaresFunction("at")`; and the index is no longer required to be an `Int` before the
  struct's `at` is consulted, since a map's key need not be one.

### Substitution

`monoCopyOne` and `monoCopyChain` deep-copy the AST (abstract syntax tree)
portions a specialization will mutate — the template itself must stay
unchanged so a second specialization starts from the original syntax, not
from a previous specialization's leftovers. `monoParamCount`, `monoParamAt`,
`monoParamName`, and `monoParamIndex` interpret the encoded parameter list.
`monoSubstituteChain` walks annotations and expressions, and
`monoSubstituteInto` replaces each matching type parameter with a copied
concrete annotation.

`monoAnnotationFromType` converts an already-resolved semantic type back into
an annotation node for a generated declaration — necessary when *inference*,
rather than explicit syntax, is what discovered a type argument.

### Instantiation functions

`monoInstantiateStruct` validates arity, builds the specialization key,
returns an existing declaration when one is already cached, or
copies/substitutes/appends a new concrete struct. `monoResolveGenericCall`
considers function templates at a call site. `monoTemplateAcceptsCall` and
`monoSolveTypeParam` infer arguments by matching formal annotations against
actual argument `TypeInfo` values, and `monoMatchParam` recurses into nested
applied types rather than comparing only top-level names.

**A bare integer literal fits an integer parameter of any width, in a generic call too.**
`monoTemplateAcceptsCall` substitutes the solved arguments into each parameter and compares it with
the argument's type. For `contains<T: Eq>(items: Vec<T>, needle: T)` called as `ids.contains(2)` on a
`Vec<I64>`, `T` is solved from the first argument as `I64`, and the literal's first-guess type is
`Int`, so the template was rejected and the call reported "no overload". `monoLiteralFits` accepts
the argument when the parameter is an integer type and the argument is a literal
(`semaIsIntLiteral`), which is the rule `semaArgMatchesType` already applied to a concrete
parameter; the argument check then types and range-checks the literal against `I64`, so
`bytes.contains(300)` on a `Vec<U8>` is still ``integer literal `300` does not fit in U8``. A
`Float` parameter is not covered, as for a concrete one (`tests/test_250_literal_needle.psm`,
`tests/neg_252_literal_needle_range.psm`).

**Closure bounds.** `Fn(A, B) -> R` in a bound position is parsed by `parseCallableBound`
(`src/parse/decl.psm`) into a `TRAIT_REF` marked callable, with the parameter types on `child1`
and the result on `child3`; `nodeIsCallableBound` tells it apart from a trait. The result is
required, because a bound without one would leave nothing to solve from
(`tests/neg_196_callable_bound_result.psm`). A closure's own `call` may return nothing: a body of
type `Void`, as in `|x: Int| println(x)`, lowers to a `call` with no return annotation and a statement
body, where it used to name the unknown type `Void`. So an unconstrained `F`, as `Vec.forEach` uses,
accepts such a closure and a bound `F: Fn(A) -> R` never does
(`tests/test_253_void_closure.psm`). Two things happen at instantiation:

- `monoSolveFromCallables` solves what the arguments left open. A type parameter that appears only
  in a bound's result — `U` in `F: Fn(T) -> U` — has no argument to be read from, so it is matched
  structurally against the closure's lowered `call` return type. Matching is structural, so
  `andThen`'s `Fn(T) -> Option<U>` finds `U` inside the `Option` the closure returns. It repeats
  until nothing more is solved, because one answer can be what another bound's result is written in.
- `monoCheckCallableBound` checks the closure against the substituted bound: the same parameter
  types and the same result, or ``this closure is `Fn(String) -> String`, and `map` needs
  `Fn(Int) -> String` ``; an argument that is not a closure is ``Int is not a closure, so it is
  not `F: Fn(Int) -> Int` `` (`tests/neg_195_callable_bound.psm`).

It works in a `where` clause and as `impl Fn(...)` on a parameter. The syntax landed in two steps,
as new syntax must: the frontend first, then a seed refresh, and only then `std/option.psm`'s
`map`, `andThen` and `mapErr`. `tests/test_192_callable_bounds.psm` covers the language half.

**An array is not a type argument of a type.** `monoArgsHoldArray` runs where a written type with
type arguments is resolved (`semaAnnotationInner` in `src/sema/types.psm`) and refuses an unsized
array among them: a `[T]` without a length is a pointer to elements in the declaring frame, and a
`Box<[Int]>` built from a local and returned read that dead frame. Because it runs on annotations,
it also catches a generic function whose `T` is an array when the instantiated body writes
`Option<T>` (`tests/neg_199_array_inferred_type_argument.psm`); a generic function's own `T` may
still be an array, since `id<T>(x: T) -> T` hands the view back to the frame that owns it
(`test_163`). It does not see a type named only in expression position: `Box<[Int]> { value: a }`
used within the declaring function compiles, which is sound because nothing carries it out, but
it is a gap to close if a path that does carry one is found.

After solving, `monoCheckBounds` evaluates every required trait reference —
this is what produced the `Show`/`Bool` diagnostic above. `monoCheckOneBound`
reports one stable diagnostic per failed parameter/bound combination.
`monoImplApplies`, `monoImplBoundsHold`, and `monoImplements` determine
whether a concrete or generic implementation satisfies the applied trait,
including the trait's own type arguments.

### Traits, defaults, and associated types

`monoExpandDefaultMethods` copies a trait default into implementation blocks
that don't provide the member. `monoExpandOneImpl`, `monoImplDeclaresMethod`,
and `monoAddDefaultMethod` preserve the target's generic context and create
the same method record shape a hand-written implementation would have.

`monoResolveProjections` resolves associated-type expressions after
implementation applicability is known — this can't happen during parsing,
because which implementation applies depends on substituted type arguments
and bounds that aren't resolved yet. `monoFindAssocType`,
`monoImplAssocTypeAnnotation`, and `monoConstraintsHold` select the concrete
associated annotation.

### What reaches later passes

There is no erased generic body anywhere in this pipeline. A concrete
specialization has concrete field types, parameter types, a mangled symbol
name, method records, and ownership behavior. Sema checks it as an ordinary
declaration, AIF selects layout per specialization (not per generic
declaration), and LLVM emits a distinct function or named struct for each one
— exactly the `singleton$Struct_Flat...` / `singleton$Struct_Named...` split
above.

### What to test

The suite covers generic functions and aggregates, inherent generic
implementations, generic trait implementations, trait arguments, `where`
clauses, blanket implementations, coherence, associated items, and
nonterminating-instantiation rejection. A change to substitution or identity
should add both a success case and a case that would collide under an
incomplete specialization key — explicit and inferred arguments, nested
types, repeated cache hits, overloads, recursive templates, generic impl
applicability, blanket/concrete overlap, multiple bounds, trait arguments,
default methods, associated projections, distinct symbols, and a
specialization whose layout genuinely differs from another instantiation of
the same generic.
