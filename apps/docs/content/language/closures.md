---
title: Closures
description: "Prismio 0.1 closures -- a struct, a call function, and overload resolution; closure bounds (F: Fn(A) -> R) that check a closure and solve a result type from it."
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [closures, lambdas, higher-order, generics, captures]
related: [language/traits, language/methods, language/generics, stdlib/vec, stdlib/option]
---

A closure is written `|parameters| expression`.

<!-- prismio-check: pass -->
```prismio
import std.io

fn applyTwice<F>(f: F, x: Int) -> Int {
    return f(f(x))
}

fn main() -> Int {
    println(applyTwice(|x: Int| x + 3, 10))
    return 0
}
```

## What a closure actually is

A closure is **a struct and a function**, and the dispatch is
[overload resolution](/language/functions). `|x: Int| x > threshold` lowers to:

```text
struct Closure$12$0 { threshold: Int }
fn call(self: Closure$12$0, x: Int) -> Bool { return x > self.threshold }

Closure$12$0 { threshold: threshold }        // at the use site
```

and `f(x)` inside the generic that received it is rewritten to `call(f, x)`.

The consequences are worth stating, because they are what make closures cheap here:

- **There is no function pointer, no vtable and no indirect call.** Each closure has its own type,
  each generic that takes one is specialized for it, and the call is direct.
- **A closure has no spellable type.** `Closure$12$0` is compiler-generated, so a closure is always
  received through a type parameter — `fn each<T, F>(items: Vec<T>, f: F)` — and that parameter
  can say what the closure must look like with a [closure bound](#closure-bounds).
- **A closure cannot be stored.** A generic parameter is a borrow, and moving a borrowed value into
  a container is already rejected, so a closure lives for the call it is passed to.

## Parameter types are written

`|x: Int| x + 1`, not `|x| x + 1`. Inferring a closure parameter means solving it from the callee's
signature at the call site, which is a separate feature; the syntax does not change when it arrives.

The body is an **expression**, not a block. `|a: Int, b: Int| a * b + 1` is one closure.

`||` is a closure with no parameters:

<!-- prismio-check: pass -->
```prismio
import std.io

fn run<F>(f: F) -> Int {
    return f()
}

fn main() -> Int {
    println(run(|| 42))
    return 0
}
```

## Captures are by value

A free name in the body that refers to a local becomes a field of the closure's struct, initialized
from that local. Globals and function names are not captured — they are reachable already.

For a scalar that is a copy. **For an owned value it is a move**, and the original binding is dead
afterwards:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string
import std.vec

fn main() -> Int {
    let names: Vec<String> = ["apple", "apricot", "fig"]

    let needle = "ap".concat("")
    println(names.countWhere(|s: String| s.startsWith(needle)))
    return 0
}
```

By value is not a default chosen over borrowing — it is the only sound option today, because
Prismio has no way to hold a borrow in a struct field. `.clone()` the value first if the original
is needed afterwards.

This is also why closures cost the ownership model nothing. A capture is spelled as an ordinary
struct-literal field, so an owned capture is moved into a field exactly the way any other struct
literal moves one; there is no new escape route and no new lifetime rule.

## Three spellings of one call

`call`'s first parameter is the receiver, so a closure is a [method](/language/methods) like any
other, and these are the same call:

```text
f(x)
call(f, x)
f.call(x)
```

## Closure bounds

A plain `F` accepts anything, and a mistake surfaces inside the generic's body. A **closure bound**
states the signature the closure must have, in the same places a [trait bound](/language/traits)
goes:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

// `U` appears only in the result, so it is solved from the closure.
fn describe<U, F: Fn(Int) -> U>(n: Int, f: F) -> U {
    return f(n * 10)
}

fn combine<A, B, R, F: Fn(A, B) -> R>(a: A, b: B, f: F) -> R {
    return f(a, b)
}

fn twice<T, F>(x: T, f: F) -> T where F: Fn(T) -> T {
    return f(f(x))
}

fn shout(f: impl Fn(String) -> String, word: String) -> String {
    return f(word)
}

fn main() -> Int {
    println(describe(3, |x: Int| x + 1))                        // 31: U is Int
    println(describe(3, |x: Int| x.toString() + "!"))           // 30!: U is String
    let prefix = "sum="
    println(combine(3, 4, |x: Int, y: Int| prefix + (x + y).toString()))   // sum=7
    println(twice(3, |x: Int| x * 3))                           // 27
    println(shout(|s: String| s.toUpper(), "hey"))              // HEY
    return 0
}
```

`Fn(A, B) -> R` lists the closure's parameter types and its result. It can be written:

- on a type parameter, `F: Fn(Int) -> U`;
- in a `where` clause, `where F: Fn(T) -> T`;
- as a parameter's type, `f: impl Fn(String) -> String`, which is shorthand for a type parameter
  used once.

**The result type is solved from the closure.** A type parameter that appears only in the result,
such as `U` above, has no argument to be read from, so the compiler takes it from what the closure
returns. `describe` returns an `Int` for one closure and a `String` for another, and nothing at the
call names either. This is how [`Option.map`](/stdlib/option#map-and-andthen-take-a-closure) is
written. It works through a generic result too: `andThen`'s bound is `Fn(T) -> Option<U>`, and `U`
is found inside the `Option` the closure returns.

**A closure that does not fit is refused, and both signatures are named:**

```text
error[P4001]: this closure is `Fn(String) -> String`, and `map` needs `Fn(Int) -> String`
error[P4001]: Int is not a closure, so it is not `F: Fn(Int) -> Int`
  note: pass a closure: `|x: T| ...`
```

The parameter types must match exactly, as for any call, and so must the result. A bound must name
its result: `F: Fn(Int)` alone is a parse error, because a closure always returns a value and the
bound has to say which.

## Not in 0.1

- Inferred parameter types, even against a closure bound: `|x| x + 1` is a parse error; write `|x: Int| x + 1`.
- Block bodies (`|x: Int| { ... }`).
- Storing a closure in a struct, a list, or a global.
- Returning a closure from a function.
- Borrowing captures, and a `move` keyword to opt out of them.
- Recursive closures.

A closure taken as a `F` type parameter and called within the call covers `map`, `filter`, `sortBy`
and the rest of [the list algorithms](/stdlib/vec), which is what 0.1 set out to reach.
