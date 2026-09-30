---
title: Option and Result
description: The std.option module — Option<T> for absence, Result<T, E> for failure, their methods (unwrapOr, expect, map, andThen), and how they are represented.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [standard-library, option, result, errors, generics]
related: [language/error-handling, language/enums, language/generics, language/closures]
---

`import std.option`. `Option<T>` is a value that may be absent; `Result<T, E>` is a value or the error that stopped it. Both are ordinary generic enums, and both come with methods for the common ways of reading one.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.option
import std.string

fn parsePort(text: String) -> Result<Int, String> {
    let n = text.parseInt()
    if (n == none) { return Result<Int, String>.Err("not a number: " + text) }
    let v = expect(n)
    if (v > 0 and v < 65536) { return Result<Int, String>.Ok(v) }
    return Result<Int, String>.Err("out of range: " + text)
}

fn main() -> Int {
    let given = Option.Some(8080)
    println(given.isSome)                            // true
    println(given.map(|p: Int| p + 1).unwrapOr(80))  // 8081

    let port = parsePort("443")
    println(port.isOk)                               // true
    println(port.unwrapOr(80))                       // 443

    let next = parsePort("21").andThen(|p: Int| parsePort((p * 2).toString()))
    println(next.expect("a port"))                   // 42

    let asOption = parsePort("22").ok()
    println(asOption.unwrapOr(80))                   // 22
    return 0
}
```

## Option

```prismio
enum Option<T> {
    None,
    Some(T)
}
```

| On an `Option<T>` | Returns |
|---|---|
| `o.isSome`, `o.isNone` | `Bool`; [properties](/language/methods#properties), read without parentheses |
| `o.unwrapOr(fallback)` | the value, or `fallback` when there is none |
| `o.expect(message)` | the value, or a [panic](/language/error-handling#when-the-program-cannot-go-on) with `message` when there is none |
| `o.okOr(error)` | `Result<T, E>`: `Ok` of the value, or `Err(error)` |
| `o.map(f)` | `Option<U>`: `Some(f(value))`, or `None` |
| `o.andThen(f)` | `Option<U>`: `f(value)`, where `f` itself returns an `Option`; or `None` |

`Option<T>` is not what a parse returns: `parseInt` and the other parse methods answer a [scalar optional](/language/optionals), `Int?`, which is a value rather than a tagged struct and allocates nothing. Reach for `Option<T>` when you want `map` and `andThen`, or an absent value of a type with no `T?` form.

The functions these methods grew out of remain: `optionIsSome(o)`, `optionIsNone(o)` and `optionOr(o, fallback)` answer what `isSome`, `isNone` and `unwrapOr` do.

`Option.Some(x)` infers `T` from `x`. A `None` carries nothing that says what it would have held, so it takes `T` from its context: an annotation, the variable it is assigned to, a return type, a field or a parameter. With no context at all, write it out: `Option<Int>.None`.

## Result

```prismio
enum Result<T, E> {
    Err(E),
    Ok(T)
}
```

| On a `Result<T, E>` | Returns |
|---|---|
| `r.isOk`, `r.isErr` | `Bool`; properties |
| `r.unwrapOr(fallback)` | the success value, or `fallback` for an error |
| `r.expect(message)` | the success value, or a panic with `message` for an error |
| `r.ok()` | `Option<T>`: the value, dropping the error |
| `r.err()` | `Option<E>`: the error, dropping the value |
| `r.map(f)` | `Result<U, E>`: `Ok(f(value))`, or the error unchanged |
| `r.mapErr(f)` | `Result<T, G>`: the value unchanged, or `Err(f(error))` |
| `r.andThen(f)` | `Result<U, E>`: `f(value)`, where `f` itself returns a `Result`; or the error unchanged |

The functions remain here too: `resultIsOk(r)`, `resultIsErr(r)`, `resultOr(r, fallback)` and `resultErrOr(r, fallback)`.

Neither variant mentions both parameters, so a construction takes them from its context, as `None` does: `return Result.Ok(v)` in a function declared `-> Result<Int, String>`. With no context, write them: `Result<Int, String>.Ok(v)`.

## Matching

`match` is the general way a value comes out, and it must cover every variant or carry a `_` arm — see [exhaustiveness](/language/pattern-matching). The methods above are the common matches, written once.

**There is deliberately no bare `unwrap`.** `unwrapOr` takes a fallback, so the absent case is handled where the value is used. `expect` does stop the program, but it makes you say why the value must be there, and that sentence is what the panic prints:

```text
panic: PORT must be a number
  --> .../stdlib/option.plib:176:32
```

The location printed is `expect`'s own line inside the standard library, not your call, so make the message specific enough to find the call by. The process exits with status 101.

**Bind a call's result before you match it.** `match (find(key)) { ... }` compiles, but leaks the `Option` or `Result` on every call; `let found = find(key)` and then `match (found)` releases it.

## `map` and `andThen` take a closure

`map` changes the value inside and leaves an absent one absent; `andThen` runs a step that can itself fail. Both take a [closure](/language/closures), and the result's type is whatever the closure returns — `given.map(|p: Int| p.toString())` is an `Option<String>` with nothing written to say so. That comes from the closure bound in their signatures:

```text
fn map<U, F: Fn(T) -> U>(self, f: F) -> Option<U>
```

`U` appears only in the result, so it is solved from the closure's return type. The same bound is available to your own functions; see [closure bounds](/language/closures#closure-bounds). A closure whose parameter does not match is refused with both signatures:

```text
error[P4001]: this closure is `Fn(String) -> String`, and `map` needs `Fn(Int) -> String`
```

## Representation

A payload-carrying enum compiles to a **tagged struct**: a tag field followed by one field per payload slot. `Option<Int>` is `{ i32 tag, i32 payload }`.

Two consequences worth knowing:

- **The variants do not overlap.** A real tagged union stores every variant's payload in the same space, sized to the widest. That needs the size of a type, which 0.1 does not expose, so each payload slot gets its own field. `Option<T>` loses nothing by this — only one variant carries anything — while a many-armed enum with large payloads is larger than it needs to be.
- **These are owned, move-only values, not scalars.** `Option<Int>` is a struct, so it allocates and moves rather than being copied in a register. For a hot inner loop over scalars, `T?` or a plain sentinel is still cheaper.

**Variant order is part of the compiled form.** The tag is the variant's position in the declaration, so reordering the variants of an enum changes the tag that already-compiled code expects. Append variants; do not insert them.

## Limits

- **Moving a payload into a new enum can leak it.** `ok()`, `err()`, `okOr` and `mapErr` — and `map` and `andThen` on a `Result`, which move the error along — put a payload into a new enum. The compiler never frees it twice. Where it cannot prove the original gives the payload up, it keeps the original alive instead, which is a leak. Whether it can prove that is decided across the whole program: `let r = parsePort("99999")` followed by `r.unwrapOr(80)` released everything in a program of its own, and leaked the error string once the same program also called `map` on another `parsePort` result. `--verify` shows it, as `leaked` with 0 violations.
- **No `?` operator.** Propagating an error is a `match` that returns the `Err`, or `andThen`.
- **No `unwrapOrElse`, `filter`, `zip`, `flatten` or `or`.**
