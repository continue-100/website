---
title: Closures and captures
description: How Prismio rewrites closures into a generated struct and call function, with no function pointer, no vtable, and no indirect call.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [closures, captures, ownership]
related: [compiler/traits-impls-and-dispatch, aif/tiers-and-analysis-domains, runtime/tasks-and-channels, compiler/generics-and-monomorphization]
---

A closure needs to carry state from where it was written to where it gets
called — `|x: Int| x + threshold` needs `threshold` to still be there when
`applyTwice` invokes it, possibly deep inside a generic function that has no
idea what a closure even is. Most languages solve this with a function
pointer plus a heap-boxed environment, resolved through an indirect call.
Prismio's compiler does something else: it rewrites the closure into an
ordinary compiler-generated **struct** holding the captures, plus a generated
**`call`** function, and then leans entirely on the machinery that already
exists for methods and overload resolution. Calling the closure becomes an
ordinary — usually direct — function call.

## See it work

<!-- prismio-check: pass -->
```prismio
import std.io

fn applyTwice<F>(f: F, x: Int) -> Int {
    return f(f(x))
}

fn main() -> Int {
    let threshold = 3
    println(applyTwice(|x: Int| x + threshold, 10))
    return 0
}
```

```bash
prismio build closures.psm -o closures.ll
```

The closure becomes a one-field struct, and `applyTwice` gets a specialization
that takes it as an opaque pointer:

```text
%"Closure$9$1" = type { i32 }
```

At the call site in `main`, the environment is built by writing the capture
into that struct — this *is* the capture, and it's the only place `threshold`
gets copied:

```text
  %threshold.0 = alloca i32, align 4
  store i32 3, ptr %threshold.0, align 4
  %2 = alloca %"Closure$9$1", align 8
  %3 = load i32, ptr %threshold.0, align 4
  %4 = getelementptr inbounds nuw %"Closure$9$1", ptr %2, i32 0, i32 0
  store i32 %3, ptr %4, align 4, !tbaa !0
  %5 = call i32 @"applyTwice$Struct_Closure$9$1__Struct_Closure$9$1_Int"(ptr %2, i32 10)
```

`applyTwice`'s specialization for this closure type calls the generated `call`
function directly, twice, with no indirection:

```text
define i32 @"applyTwice$Struct_Closure$9$1__Struct_Closure$9$1_Int"(ptr %0, i32 %1) {
entry:
  ...
  %5 = call i32 @"call__Struct_Closure$9$1_Int"(ptr %3, i32 %4)
  %6 = call i32 @"call__Struct_Closure$9$1_Int"(ptr %2, i32 %5)
  ret i32 %6
}

define i32 @"call__Struct_Closure$9$1_Int"(ptr %0, i32 %1) {
entry:
  ...
  %4 = getelementptr inbounds nuw %"Closure$9$1", ptr %3, i32 0, i32 0
  %5 = load i32, ptr %4, align 4, !tbaa !4
  %6 = add i32 %2, %5
  ret i32 %6
}
```

There is no function pointer anywhere in this — `applyTwice` was specialized
*for this exact closure type* ([monomorphized](/compiler/generics-and-monomorphization),
the same mechanism generics use), so the call to `call__Struct_Closure$9$1_Int`
is as direct as any other function call. Running it prints `16`
(`(10 + 3) + 3`):

```bash
prismio run closures.psm
```

```text
Built closures
16
```

## What failure looks like

Captures are **by value**. For a scalar that's a copy; for an owned value —
a `String`, a struct, a list — it's a move, and the original binding dies at
the closure literal:

<!-- prismio-check: fail -->
```prismio
import std.io
import std.string

fn run<F>(f: F) -> Int {
    return f()
}

fn main() -> Int {
    let name = "prismio".concat("!")
    let measure = || strLength(name)
    println(run(measure))
    println(name)
    return 0
}
```

```bash
prismio check use_after_capture.psm
```

```text
error[P4001]: use of moved value `name`
  --> use_after_capture.psm:12:13
   |
12 |     println(name)
   |             ^^^^
error: aborting due to 1 previous error
```

This is the ordinary move-checker, not closure-specific logic: capturing a
move-only value into the generated struct's field consumes it from the
enclosing scope exactly the way passing it to any other function would. Clone
the value first (`name.strClone()`) if the original is still needed
afterward.

## Capture semantics

Captures are by value in the current compiler. Capturing a move-only value
transfers it into the closure record; capturing a copy value copies it.
Parameter types are explicit, and the body is checked after the generated
environment is available.

The rewrite must preserve source locations so diagnostics point at the
closure expression rather than at synthetic declarations. Generated names
must be collision-safe and deterministic, because the self-hosted
[fixed-point check](/compiler/bootstrap) observes compiler output directly —
a nondeterministic generated name would make two otherwise-identical
compilations disagree.

## Memory consequences

The closure record is an ordinary allocation site from AIF's (Adaptive
Inference Framework's) perspective. A capture creates a field edge into that
record. If the closure escapes, its captured values acquire at least the
lifetime required by the environment.

## Lowering

Known closure calls can remain direct calls to a specialized generated
function, as shown above. Dynamic callable forms follow the same
object-safety and dispatch constraints as their trait representation (see
[traits, impls, and dispatch](/compiler/traits-impls-and-dispatch)). Tests
must cover capture moves, use-after-capture errors, generic closure contexts,
capture-free cases, and scalar and move-only captures.

**A closure bound checks the generated `call` against a signature.** A type parameter bounded by
`Fn(A, B) -> R` accepts only a closure whose lowered `call` takes exactly `A, B` and returns `R`,
and a type parameter that appears only in `R` is solved from that `call`'s return type — which is
how `Option.map` knows its `U`. The parsing, checking and solving are in the generics pass; see
[closure bounds](/compiler/generics-and-monomorphization#instantiation-functions). The closure
itself is lowered exactly as before: the bound adds a check and a solution, and no code.

## What's not there yet

Two things this page's earlier version claimed are worth being precise about,
because they don't hold up against the current compiler:

**Returning a closure from a function is rejected**, not supported. A
closure's generated struct type (`Closure$9$1` above) has no spellable
annotation, so a function signature has nothing to write as its return type.
Confirmed directly:

<!-- prismio-check: fail -->
```prismio
fn make(n: Int) {
    return |x: Int| x + n
}

fn main() -> Int {
    return 0
}
```

```text
error[P4001]: return: expected Void, found Closure$2$1
 --> closure_return.psm:2:12
  |
2 |     return |x: Int| x + n
  |            ^
error: aborting due to 1 previous error
```

This matches the user-facing closures page
(`https://docs.prismio.org/language/closures`)'s "Not in 0.1" list, which
names returning a closure and storing one in a struct, list, or global as
unsupported.

**Spawning a closure onto a task is not exercised by any test, and currently
crashes code generation** rather than completing. `spawn` requires its target
to be a literal call to a named function (`spawn f(args)`); a closure has no
name of its own, so the only route in is a generic wrapper function that
takes the closure as a type parameter. Semantic analysis accepts that:

```prismio
import std.io
import std.string

fn wrapper<F>(f: F, s: String) -> Int {
    return strLength(f(s))
}

fn main() -> Int {
    let suffix = "!"
    let t = spawn wrapper(|s: String| s.concat(suffix), "hi")
    let r = join t
    println(r)
    return 0
}
```

`prismio check` on this reports nothing — sema is satisfied, because the
closure argument passes `semaSpawnArgAllowed` (it lowers to a pointer, so it
counts as a reference type a task can own). But building it fails in the
backend, because no `__task` entry point exists for the task ABI's
(application binary interface's) function-pointer lookup to find:

```bash
prismio run spawn_closure.psm
```

```text
internal backend error: address of unknown function (wrapper$Struct_Closure$10$1__Struct_Closure$10$1_String__task)
```

**The closure is not the cause.** Spawning *any* generic function fails the
same way, with no closure anywhere in the program:

```prismio
import std.io
import std.string

fn measure<T>(x: T, s: String) -> Int {
    return strLength(s)
}

fn main() -> Int {
    let t = spawn measure("abc", "hello")
    println(join t)
    return 0
}
```

```text
internal backend error: address of unknown function (measure$String__String_String__task)
```

The missing piece is the task entry point for a monomorphized specialization;
a closure only reaches `spawn` through a generic wrapper, so it inherits the
failure. No fixture in `tests/` spawns a generic function or a closure — the
existing coverage (`tests/test_77_spawn_literal.psm` and friends) only spawns
non-generic functions. Until that entry point exists, spawning a closure is
"the type system doesn't stop you", not "supported and tested".

## Generated representation

`semaClosureName` combines a closure prefix, stable source identity, and
specialization context. The lowering appends:

- a synthetic struct with one field per capture;
- a synthetic call function whose first parameter is the environment/closure
  value;
- the rewritten closure body; and
- a struct literal expression that constructs the environment at the
  original closure site — the `alloca %"Closure$9$1"` / `getelementptr` /
  `store` sequence shown above.

The generated declarations are ordinary concrete AST (abstract syntax tree).
They pass through ownership checking, AIF, layout selection, struct
registration, release-function generation, and LLVM code generation. A
capture-free closure may therefore become an empty environment plus a direct
callable symbol; an owning capture makes the generated struct droppable.

## If you are changing this

### Parsing and capture discovery

`atClosure` distinguishes closure syntax from surrounding expression forms.
`parseClosureExpr` records the parameter list, declared parameter types, and
expression body as a closure AST node. The body is still parsed as an
ordinary expression, so calls, member access, operators, nested closures, and
source spans use the same nodes as function bodies.

`semaLowerClosure` owns semantic lowering. It first calls
`semaClosureBodyType` to analyze the body in a scope containing the closure
parameters. `semaCollectCaptures` and `semaCollectCapturesChain` walk the
body; `semaClosureIsCapture` excludes parameters, declarations local to the
body, top-level symbols, and duplicate names.

`semaClosureHasCapture` prevents duplicate fields. `semaRewriteCaptures`
replaces each captured identifier use with access through the generated
environment receiver. Move-only captured bindings are consumed from the
enclosing scope; copying them into a field while leaving the original usable
would create two owners — the use-after-capture example above is exactly
what stops that.

### Call lowering

Once sema has resolved the closure's generated call symbol, a known call is
emitted through the ordinary direct-call builder (this is the
`call__Struct_Closure$9$1_Int` call shown above). The environment becomes the
explicit first argument, preserving normal overload, borrow, sink, debug, and
temporary-release behavior.

When a closure participates in a supported dynamic callable/trait
representation, the erased data pointer and function entry are carried by
the dynamic record. `generateDynMake` constructs that record. `generateDynCall`
loads the table entry with `ir_ptr_slot`, passes the erased receiver, and uses
`ir_call_end_indirect`.

### What to test

A closure change needs parser-shape tests, capture ordering, shadowing,
nested closures, capture-free cases, scalar and move-only captures, use after
capture, generic specialization, direct and dynamic calls, generated release
behavior, debug visibility, and stable symbols across the self-hosted
fixed-point check. Given the gaps above, a change that touches `spawn` or
return-type handling should add the missing coverage rather than assume the
existing suite would catch a regression there — right now, it can't.
