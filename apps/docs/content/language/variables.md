---
title: Variables and bindings
description: Declare local and global bindings, type annotations, default values, mutability, shadowing, and initialization in Prismio 0.1.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-24"
tags: [variables, let, mutability, scope]
related: [language/types, language/control-flow, errors/immutable-assignment]
---

`let` introduces a named binding. A binding associates a name with a type, storage, and—when the type is move-only—an ownership state. Supply an initializer, a type annotation, or both.

```prismio
let count = 3
let name: String = "Prismio"
let mut total: Int = 0
```

The compiler infers `count` as `Int` and `name` as `String`. In `total`, the annotation fixes the type and the initializer must be assignable to it.

The declaration shape is:

```text
let [mut] [unique] [pin(Tn)] name [: Type] [= expression]
```

`unique` and `pin(Tn)` belong to the experimental Adaptive Inference Framework. See [memory annotations and regions](/language/annotations) before using them in production code.

## Type inference and annotations

An initializer normally provides enough information for a local type:

```prismio
let enabled = true
let ratio = 1.5
let values = [1, 2, 3]
```

Use an annotation when the intended type differs from the literal default, when declaring an optional `none`, or when the type makes an interface clearer.

```prismio
let port: U16 = 8080
let bytes: [U8] = [80, 83, 77]
let pointer: Ptr? = none
```

An annotation without an initializer is accepted by the current compiler and allocates storage, but 0.1 does not implement a complete definite-initialization analysis for later reads. Prefer initializing a binding at its declaration — with [`default`](#default-values) when there is no better value yet. Reading annotation-only storage before assigning it can expose unspecified backend data and should not be used as a language feature. (Three annotation-only forms are defined: `let v: Vec<T>` is an empty Vec, `let m: Map<K, V>` is an empty Map, and `let a: Array<T, N>` of numbers is zeroed.)

## Default values

`default` is the value of whatever type its context expects:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

struct Settings { name: String, retries: Int, verbose: Bool, tags: Vec<String> }

fn fresh() -> Settings { return default }

fn main() -> Int {
    let title: String = default
    let count: Int = default
    let settings: Settings = default
    println(title.length, count, settings.retries, settings.tags.length)
    return 0
}
```

| Type | `default` is |
|---|---|
| `Int`, `I8` … `U64`, `Isize`, `Usize` | `0` |
| `Float` | `0.0` |
| `Bool` | `false` |
| `Char` | `'\0'` |
| `String` | `""` |
| `Vec<T>` | `[]` |
| `Array<T, N>` | `N` defaults of `T` (up to 64 elements, or any length of numbers in a `let`) |
| `T?` | `none` |
| `Option<T>` | `Option<T>.None` |
| `Map<K, V>` | an empty map |
| a struct | the struct with every field set to its field type's default |

It is resolved where a type is already known: a `let` with an annotation, a `return`, a struct field, or an assignment. It works inside generic code — `let x: T = default` is resolved separately for each type `T` is instantiated with.

`default` never runs your code. A type with a better starting value than zeros gives itself a `default` function, `Config.default()`; see [a type's own default](/language/traits#a-types-own-default).

**What has no default.** An enum does not: its value should be named, not guessed. Neither does a struct with a field that has none, a closure, a trait object, a channel, or an array whose length is not known. `default` also cannot be a function argument, because the overload is chosen from the argument types — bind it first:

<!-- prismio-check: fail -->
```prismio
fn take(x: Int) -> Int { return x }

fn main() -> Int {
    return take(default)
}
```

The compiler reports ``` `default` needs a type from its context ```.

## Immutability and reassignment

Bindings are immutable by default. `mut` permits direct assignment and compound assignment.

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let count = 1
    count = 2
    return count
}
```

The compiler reports ``cannot assign to `count`, which is not declared `mut` ``.

`mut` controls reassignment of the binding itself:

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let mut total = 1
    total += 4
    total = total * 2
    return total
}
```

Compound assignment is supported for a plain mutable binding. It is not currently a general place-expression feature, so use `item.field = item.field + 1` instead of `item.field += 1`, and read-modify-write an indexed element with the relevant collection operation.

### A Vec's or an array's contents need `mut` too

A binding without `mut` keeps its contents as well as its value. Pushing, storing an element, sorting, clearing — anything that changes a `Vec` or an array — needs a `let mut` binding:

<!-- prismio-check: fail -->
```prismio
import std.vec

fn main() -> Int {
    let v: Vec<Int> = [3, 1, 2]
    v.push(4)
    return v.length
}
```

The compiler reports ``cannot change `v`, which is not declared `mut` ``. Declare it `let mut v`.

A parameter is a borrow, so a function that changes a Vec or an array it was given declares that parameter `inout` — and the caller has to pass something it may change itself:

<!-- prismio-check: pass -->
```prismio
import std.vec

fn addDefaults(inout names: Vec<String>) {
    names.push("admin")
    names.sort()
}

fn main() -> Int {
    let mut names: Vec<String> = ["zoe", "ann"]
    addDefaults(names)
    return names.length
}
```

The rule follows indexing to the binding at its root: `grid[i].push(x)` changes `grid`. The same holds for the library's changing methods — `sort`, `sortBy`, `reverse`, `extend`, `pop`, `removeAt` take their Vec `inout`.

**Structs are the exception, for now.** A struct is reached by reference, so assigning one of its fields — and changing a Vec that is one of its fields — is permitted even when the binding lacks `mut`. Replacing the binding itself still requires `mut`.

A Slice follows the rule twice. Its own binding has to be `let mut` or `inout`, and it has to view something changeable: a slice of a Vec that is not `mut` is [read-only](/language/arrays-and-lists#slices), whatever its binding says.

## Scope and shadowing

Bindings have lexical block scope. A binding declared inside a function, `if` arm, loop, region, or match arm is not visible outside that block.

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    let value = 10
    if (value > 0) {
        let value = value + 5
        println(value)
    }
    return value
}
```

The inner declaration shadows the outer name. Its initializer is evaluated before the new binding becomes active, so the right-hand `value` refers to the outer binding. When the block ends, the outer `value` is visible again.

Shadowing creates a new binding; it does not mutate or revive an old one. Ownership checks apply to the specific binding selected by name resolution.

## Global bindings

`let` declarations may appear at the top level. Global initializers must be static literal values supported by the compiler; arbitrary function calls and runtime expressions cannot initialize a global.

<!-- prismio-check: pass -->
```prismio
let mut requests: Int = 0
let service_name: String = "prismio"

fn record_request() {
    requests += 1
}

fn main() -> Int {
    record_request()
    return requests - 1
}
```

A global `let` may also hold an **array of literals** — numbers, characters or strings. It is read-only data in the program, read by address, so reading it builds and allocates nothing, and it is the place for a table or a vocabulary that several functions share:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string
import std.vec

let weekdays = ["mon", "tue", "wed", "thu", "fri"]
let primes = [2, 3, 5, 7, 11]

fn isWeekday(day: String) -> Bool {
    return weekdays.contains(day)
}

fn main() -> Int {
    println(isWeekday("wed"))     // true
    println(primes[4])            // 11
    return 0
}
```

The array must be `let`, not `let mut`; an element must itself be a literal (a call, a variable or a `Bool` is refused); and, like any array whose length is known, binding it to a `let mut` makes a writable copy.

Globals share the flattened program namespace after imports are resolved. A mutable global can be assigned by a function. Prefer passing state explicitly where practical: global mutation makes ownership, initialization order, and foreign integration harder to reason about.

<!-- prismio-check: fail -->
```prismio
fn initial() -> Int { return 3 }
let count: Int = initial()

fn main() -> Int { return count }
```

This program is rejected because the global initializer is a call rather than a supported static literal.

## Ownership state

Strings, lists, and structs add an ownership state to ordinary scope and mutability rules. Moving a value into another owned location, passing it to a `sink` parameter, inserting it into an owning list, or calling `drop` consumes the source binding.

<!-- prismio-check: fail -->
```prismio
import std.io

fn main() -> Int {
    let first = "hello"
    let second = first
    println(second)
    println(first)
    return 0
}
```

The final call tries to read `first` after its string has moved to `second`. Declaring `first` as `mut` would not change the ownership rule. Read [ownership and borrowing](/language/ownership-and-borrowing) for parameter modes and legal transfer patterns.

## Rules summary

- A binding needs an initializer, an annotation, or both.
- An initializer must have the declared type; numeric coercions are not implicit.
- Direct reassignment and compound assignment require `mut`, and so does changing a Vec's or an array's contents; a parameter changes them only when it is `inout`.
- A write through a Slice needs a `mut` or `inout` view of something changeable; a slice of a non-`mut` Vec is read-only.
- `default` is the expected type's default value; it needs an annotation or other context to know the type.
- A binding is visible only in its lexical scope and may shadow an outer name.
- Global initialization is restricted to supported static literals.
- Move-only bindings cannot be read after consumption.
- Annotation-only local storage exists in 0.1, but reading it before explicit assignment is not a supported safe pattern.

For type spelling and conversion rules, continue to [types](/language/types). For diagnostics, see [immutable assignment](/errors/immutable-assignment) and [use after move](/errors/use-after-move).
