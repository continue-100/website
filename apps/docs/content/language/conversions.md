---
title: Conversions
description: One operator, `as`, converts between types. `x as T` cannot fail; `x as T?` can, and answers `none` instead of guessing. Numbers, text, Bool, Char and enums.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [conversions, casts, as, optionals, parsing, enums]
related: [language/operators, language/optionals, language/types, language/enums, stdlib/strings]
---

A port number read from the command line, a byte that has to fit a `U8`, a count
printed into a message: each is a conversion, and some of them can fail. Prismio
has one operator for all of them, `as`, and **the type you write says whether the
conversion can fail**:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let port = "8080" as Int?     // text to a number: may not be one
    let byte = 300 as U8?         // does not fit a U8
    let label = 42 as String      // a number to text: always works

    println(port.unwrapOr(80))    // 8080
    println(byte == none)         // true
    println(label + "!")          // 42!
    return 0
}
```

| You write | It means |
|---|---|
| `x as T` | A conversion that cannot fail: widening, truncating, saturating, or to `String`. |
| `x as T?` | A conversion that can fail. It is `none` when `x` has no `T`, and never a run-time error. |
| `"12" as Int` | Text the compiler can read now is converted now; text it cannot read is a compile error. |
| `s as Int`, with `s` unknown | A compile error that tells you to write `s as Int?`. |

A `T?` from a conversion is a [scalar optional](/language/optionals): a flag and a
value, copied like `T`. None of these conversions allocates, except `as String`,
which returns new text.

## `x as T`: conversions that cannot fail

Between numbers, `as` never fails. It chooses an answer instead:

- widening a signed integer sign-extends, and widening an unsigned one, a `Bool`
  or a `Char` zero-extends;
- narrowing an integer keeps its low bits: `300 as U8` is 44 and `-1 as U8` is 255;
- an integer to a `Float` converts, rounding if the integer has more digits than
  a `Float` holds;
- a `Float` to an integer truncates toward zero and **saturates**: out of range is
  the type's `MAX` or `MIN`, and NaN is 0.

Those rules are what you want when the truncation is the point, as in hashing or
bit manipulation. When it is not, write `as T?` and let the out-of-range case be
`none`.

A prefix operator belongs to the value being converted: `-x as T` is `(-x) as T`.
So `-1 as U8` is 255, and `-1e30 as I64` is `I64.MIN`.

`x as String` is the text `x.toString()` gives, for every number, `Bool`, `Char`
and `String` itself. It needs `import std.string`, where `toString` lives, as
[joining Strings with `+`](/language/operators#string-operators) does.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let count = 3
    println("found " + count as String + " files")   // found 3 files
    println(2.5 as String)                              // 2.5
    println((200 as U8) as String)                      // 200
    return 0
}
```

An enum converts to its ordinal with `as Int`. Nothing converts *to* `Bool`: write
the comparison you mean, such as `n != 0`.

## `x as T?`: conversions that can fail

### Between numbers

`x as T?` is `none` exactly when `x` is not a value of `T`:

- the value is too large or too small for `T`: `300 as U8?`, `70000 as I16?`;
- the sign is one `T` cannot hold: `-1 as U64?`, and a `U64` above `I64.MAX` as `I64?`;
- from a `Float`: NaN, an infinity, or a value with a fraction. `3.5 as Int?` is
  `none` and `3.0 as Int?` is 3.

The edges are exact. `-128 as I8?` is present and `-129 as I8?` is not;
`-9223372036854775808.0 as I64?` is `I64.MIN`, and `9223372036854775808.0` (2⁶³) is
`none`. An integer to `Float?` is always present, since every integer is in a
`Float`'s range.

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    let reading = 70000
    let small = reading as U16?
    if (small == none) {
        println("does not fit a U16")
    }
    let ratio = 0.75 * 8.0
    println((ratio as Int?).unwrapOr(-1))   // 6
    println((0.1 * 3.0) as Int? == none)     // true: 0.30000000000000004
    return 0
}
```

The check is a few compares with no branch, so a conversion in a loop costs about
what the plain `as T` does.

A `T?` converts as well, and `none` stays `none`: `maybe as U16?` is `none` when
`maybe` is, and otherwise the checked conversion of its value.

### From text

`s as T?` reads a number or a `Bool` out of a `String`. It is the same function as
the parse method: `s as Int?` is `s.parseInt()`, `s as U8?` is `s.parseU8()`, and so
on for every integer width, `Float` and `Bool`.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let inputs = ["42", "4x", "256", "-3"]
    for text in inputs {
        let value = text as U8?
        if (value == none) {
            println(text + ": not a U8")
        } else {
            println(expect(value))
        }
    }
    return 0
}
```

The whole string must be the number: `"4x"`, `" 42"` and `""` are `none`. So is a
number out of range: `"256" as U8?` is `none`, never 0. See
[parsing](/stdlib/strings#parsing-and-formatting) for the exact rules.

### Into an enum

`n as Color?` is the variant whose ordinal is `n`, or `none` when there is none.
It is the only way from a number to an enum: a plain `n as Color` is an error,
because `n` might be no variant, and a value of `Color` is always one of them.

<!-- prismio-check: pass -->
```prismio
import std.io

enum Color { Red, Green, Blue }

fn main() -> Int {
    let picked = 1 as Color?
    println(picked == Color.Green as Color?)   // true
    println(7 as Color? == none)               // true
    return 0
}
```

## Text the compiler can read

When the text is a literal, the compiler reads it while compiling:

```prismio
let limit = "250" as Int        // the number 250, decided at compile time
let wide = "18446744073709551615" as U64
```

Text it cannot read is an error on the line that wrote it, not a surprise when the
program runs:

<!-- prismio-check: fail -->
```prismio
import std.string

fn main() -> Int {
    return "12Sf" as Int
}
```

The error is `` `12Sf` does not read as Int ``. And text the compiler cannot see
-- a parameter, a line read from a file -- might not be a number, so converting it
to a plain `Int` is refused with the fix in the message:

<!-- prismio-check: fail -->
```prismio
import std.string

fn main() -> Int {
    let text = "12"
    return text as Int
}
```

`a String might not hold a number; write `as Int?` and handle `none``. Only a
string literal is read at compile time, not a `let` bound to one.

## What does not convert

| From | To | Instead |
|---|---|---|
| a number | `Bool` | compare: `n != 0` |
| an `Int` | an enum | `n as Color?` |
| a `String` | a struct, `Char`, an enum | a parse function of your own |
| an optional | its value | `expect(o)`, `o.unwrapOr(x)`, or compare with `none` ([optionals](/language/optionals)) |
| a struct | anything | a method on the struct |
