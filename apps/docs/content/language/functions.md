---
title: Functions and parameters
description: Declare Prismio 0.1 functions, return values, overloads, and borrow, sink, or inout parameters.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-28"
tags: [functions, parameters, returns, overloads, cold, inlining]
related: [language/ownership-and-borrowing, language/ffi, errors/wrong-arity]
---

A function has a name, zero or more typed parameters, an optional return type, and a block body. Functions are top-level declarations; Prismio 0.1 does not nest named functions inside blocks.

```prismio
fn add(left: Int, right: Int) -> Int {
    return left + right
}
```

The general shape is:

```text
fn name([mode] parameter: Type, ...) [-> Type] {
    statements
}
```

Parameter types are required. The compiler does not infer a public signature from call sites. A trailing `-> Type` declares a returned value; omitting it declares a function that returns no value.

## Calling a function

A call evaluates its arguments and transfers or borrows them according to the selected function signature.

<!-- prismio-check: pass -->
```prismio
import std.io

fn clamp_low(value: Int, minimum: Int) -> Int {
    if (value < minimum) { return minimum }
    return value
}

fn announce(value: Int) {
    println(value)
}

fn main() -> Int {
    let result = clamp_low(-3, 0)
    announce(result)
    return result
}
```

The number of arguments and their exact types must match an available declaration. There are no named arguments, default arguments, or automatic numeric conversions.

## Return rules

Omitting `-> Type` declares a no-value-returning function. Non-void functions must return on every reachable path; a path may instead end in [`panic`, `unreachable` or `exit`](/language/error-handling#when-the-program-cannot-go-on), which never return. Code after an unconditional `return`, or after one of those three, is rejected as unreachable.

```prismio
fn log_ready() {
    println("ready")
    return
}
```

For a value-returning function, `return expression` must match the declared return type. Prismio does not use a final expression as an implicit return.

<!-- prismio-check: fail -->
```prismio
fn classify(value: Int) -> Int {
    if (value > 0) {
        return 1
    }
}

fn main() -> Int { return classify(1) }
```

The compiler rejects `classify` because the path where `value <= 0` reaches the end without returning an `Int`. An infinite `loop` or a return on every branch can satisfy definite-return analysis.

An unconditional `return`, `break`, or `continue` also ends the reachable statements in its local control-flow position. The compiler reports statements that can never execute rather than silently emitting them.

## Parameter modes

- `value: T` copies scalar/copy values and borrows a move-only value by default.
- `sink value: T` consumes it.
- `inout value: T` takes a mutable borrow.

```prismio
struct Counter { value: Int }

fn read(counter: Counter) -> Int { return counter.value }
fn increment(inout counter: Counter) { counter.value = counter.value + 1 }
fn finish(sink counter: Counter) -> Int { return counter.value }
```

The caller writes no separate borrow operator. The callee's signature determines the mode.

### Default parameters borrow move-only data

An ordinary parameter does not consume a string, list, or struct. It creates a callee-visible borrow for the duration of the call. The caller retains ownership and may use the value afterward.

<!-- prismio-check: pass -->
```prismio
struct Message { code: Int }

fn inspect(message: Message) -> Int {
    return message.code
}

fn main() -> Int {
    let message = Message { code: 7 }
    let code = inspect(message)
    return message.code - code
}
```

The callee cannot `drop` or move a borrowed parameter into an owned location. Make consumption explicit with `sink` when the callee needs ownership.

### `sink` transfers ownership

`sink` documents a consuming API at the function boundary. Passing a move-only value marks the caller's binding as moved.

<!-- prismio-check: fail -->
```prismio
struct Message { code: Int }

fn consume(sink message: Message) -> Int {
    return message.code
}

fn main() -> Int {
    let message = Message { code: 7 }
    consume(message)
    return message.code
}
```

The last field access is a use after move. `sink` on a copy type is accepted as a signature mode where supported, but the observable value behavior remains copy-like; it is primarily meaningful for move-only values.

### `inout` permits caller-visible mutation

`inout` forms an exclusive mutable borrow. It does not move the value, and changes made through the parameter are visible after the call. The argument has to be something the caller may change — a `let mut` binding or its own `inout` parameter — and an `inout` parameter may be a struct, a `Vec`, an array or a slice. An ordinary parameter is read-only: pushing to a `Vec` parameter or storing into an array parameter needs `inout`.

<!-- prismio-check: pass -->
```prismio
struct Counter { value: Int }

fn increment(inout counter: Counter) {
    counter.value = counter.value + 1
}

fn main() -> Int {
    let mut counter = Counter { value: 4 }
    increment(counter)
    return counter.value - 5
}
```

There is no `&`, `&mut`, or address-of spelling at the call site. The selected parameter declaration provides the borrowing contract.

## Recursion

Functions may call themselves and other declared functions. Recursive code must still satisfy ordinary return and ownership rules.

<!-- prismio-check: pass -->
```prismio
fn factorial(value: Int) -> Int {
    if (value <= 1) { return 1 }
    return value * factorial(value - 1)
}

fn main() -> Int {
    return factorial(5) - 120
}
```

Tail-call optimization is not a source-language guarantee. Bound recursion explicitly when stack usage matters.

## Overloading

Functions may share a name when their parameter count or exact parameter types differ. Resolution does not use implicit numeric coercions, and return type alone cannot distinguish overloads. Default arguments, named arguments, variadic functions, and expression bodies are not implemented. Functions may be [generic](/language/generics).

```prismio
fn describe(value: Int) -> Int { return value }
fn describe(value: U64) -> U64 { return value }
fn describe(left: Int, right: Int) -> Int { return left + right }
```

At a call site, the compiler filters by arity and exact parameter types. If no candidate matches, it reports the mismatch. If more than one candidate is equally applicable, it reports ambiguity rather than choosing from the return context.

<!-- prismio-check: fail -->
```prismio
fn measure(value: Int) -> Int { return value }

fn main() -> Int {
    let value: U8 = 2
    return measure(value)
}
```

Write `measure(value as Int)` to select the `Int` overload deliberately.

## Cold functions

Some code runs rarely: an error report, a table that has to grow, the first
insertion of a key. Keeping it in its own function is only half the job. When a
function has a single caller, the optimiser folds it back into that caller
whatever its size -- and the caller, now large, stops being inlined into the loop
that calls *it*. The fast path pays for the slow one.

Mark such a function `cold`:

```prismio
import std.io

cold fn reportOverflow(value: Int) -> Int {
    println("value out of range")
    return 0
}

fn clamp(value: Int) -> Int {
    if (value > 1000) { return reportOverflow(value) }
    return value
}

fn main() -> Int {
    let mut total = 0
    for i in 0..<100 {
        total = total + clamp(i * 3)
    }
    println(total)
    return 0
}
```

A cold function is never inlined into its callers, and a branch that calls one
is laid out as the unlikely path, so the code around it stays small enough to be
inlined and vectorised where it is used. It is LLVM's `cold` and `noinline`
together -- Rust's `#[cold]` with `#[inline(never)]`.

`cold` goes after any visibility marker and directly before `fn`, at top level or
inside an `impl` block:

```prismio
private cold fn grow(list: Vec<Int>) { ... }
impl Table {
    cold fn rehash(self) { ... }
}
```

It is contextual, so a variable or function may still be *named* `cold`. It
changes where code is placed, never what it does: removing every `cold` leaves a
program with the same behaviour.

Use it for paths that are rare **at run time**, not merely long. The standard
library marks the insert half of `Map.set`; marking a hot function cold moves its
callers' fast path the wrong way.

## Entry point

An executable uses a top-level `main` function. The common portable form is `fn main() -> Int`, where the returned integer becomes the process exit status. The 0.1 compiler does not document command-line argument parameters on `main`; obtain environment or argument data through supported runtime or FFI functions instead of copying signatures from C, Rust, or older drafts.

## Not implemented

Named functions cannot currently be nested, define optional/default arguments,
accept source-level variadics, or use expression bodies. Functions may declare
[type parameters](/language/generics) with one or more [trait bounds](/language/traits).
Closures provide anonymous capturing callables, and method-call syntax plus `impl`
blocks provide type-oriented operations; each has its own documented constraints.
