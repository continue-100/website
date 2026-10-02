---
title: Display and printing
description: The std.display module -- the Display trait that gives a type its text, and print, println, eprint and eprintln for every type that has it, Option and String? included.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-02"
tags: [standard-library, display, print, trait, option]
related: [stdlib/io, stdlib/option, stdlib/term, language/traits]
---

`import std.display`. `Display` is the trait for a value's text, and importing the module makes `print`, `println`, `eprint` and `eprintln` accept **anything that implements it**: your own types, `Option<T>`, and a `String?`, as well as the numbers, strings, `Bool` and `Char` that [`std.io`](/stdlib/io) already prints.

```text
trait Display {
    fn show(self) -> String
}
```

`show` returns a `String` rather than writing to a stream, because the text is wanted as often as the printing is: in an error message, a map key, a joined line.

## Printing your own type

Write `impl Display for MyType` beside the type, and the type prints:

<!-- prismio-check: pass -->
```prismio
import std.display
import std.io
import std.string

struct Version {
    major: Int,
    minor: Int
}

impl Display for Version {
    fn show(self) -> String {
        return self.major.show().concat(".", self.minor.show())
    }
}

fn main() -> Int {
    let v = Version { major: 1, minor: 4 }
    println(v)              // 1.4
    println("version:", v)  // version: 1.4
    return 0
}
```

The multi-argument form goes through the same overloads, and a type that is not covered here needs no change to this module: the `impl` lives with your type.

## Printing an optional

`Option<T>`, where `T` is printable, shows its value, or `none`. So does a scalar `T?` such as `Int?`, and a `String?`:

<!-- prismio-check: pass -->
```prismio
import std.display
import std.io
import std.option
import std.string

fn main() -> Int {
    let found: Option<String> = Option<String>.Some("ada")
    let missing: Option<String> = Option<String>.None
    let age: Int? = 36
    let nickname: String? = none

    println(found)             // ada
    println("name:", missing)  // name: none
    println("age:", age)       // age: 36
    println("nickname:", nickname)  // nickname: none
    println(Option<Int>.Some(7))    // 7
    return 0
}
```

That is what `stdin.readLine()` returns, so `println(stdin.readLine())` works and shows `none` at the end of input. To use the value rather than print it, take it out first: `unwrapOr(fallback)`, `expect(x)`, or a `match`; see [Option and Result](/stdlib/option).

## What implements `Display`

| Type | Shows as |
|---|---|
| `Int`, `I8`, `I16`, `I64`, `Isize`, `U8`, `U16`, `U32`, `U64`, `Usize` | its decimal digits |
| `Float` | the same text `print` writes (at most fifteen significant digits) |
| `Bool` | `true` or `false` |
| `Char` | the character |
| `String` | itself |
| `Int?`, `Float?`, `Char?` and the other scalar optionals, and `String?` | the value, or `none` |
| `Option<T>` for a printable `T` | the value, or `none` |

The overloads for the built-in types in `std.io` are exact matches and win over these, so importing `std.display` changes nothing for a program that only prints numbers and strings. They live here and not in `std.io` because every printing program imports `std.io`, and a generic `print` there would carry `std.display` and `std.string` into all of them.

## Writing code that is generic over `Display`

`Display` is a trait bound like any other, and the trait is a check, not dispatch: `show` inside a bounded generic is resolved by ordinary overload resolution once `T` is concrete, so an `impl` costs nothing at a call site that does not use it.

<!-- prismio-check: pass -->
```prismio
import std.display
import std.io
import std.string

struct Version {
    major: Int,
    minor: Int
}

impl Display for Version {
    fn show(self) -> String {
        return self.major.show().concat(".", self.minor.show())
    }
}

fn labelled<T: Display>(label: String, value: T) -> String {
    return label.concat(": ", value.show())
}

fn main() -> Int {
    println(labelled("count", 3))                                // count: 3
    println(labelled("pi", 3.5))                                 // pi: 3.5
    println(labelled("release", Version { major: 0, minor: 1 })) // release: 0.1
    return 0
}
```

[`std.term`](/stdlib/term) uses the same bound: its style methods (`.red()`, `.bold()` and the rest) apply to anything that implements `Display`, not only to a `String`.

## When a value cannot be printed

If a type has no `Display`, the call is refused with "no overload of `println` accepts these argument types", and the message lists the argument types it was given and, for an optional, says how to take the value out. Add the `impl`, or convert the value to a `String` yourself.
