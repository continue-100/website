---
title: Error handling
description: Signalling failure in Prismio with Result and Option, and stopping the program with panic, assert, unreachable and exit.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [errors, result, option, enums]
related: [stdlib/option, language/enums, language/optionals, language/generics, language/control-flow]
---

Prismio has no exceptions, no `try`/`catch`, and no propagation operator. Failure is a value: a function that can fail returns [`Result<T, E>`](/stdlib/option), and a function whose answer may be absent returns `Option<T>`.

Both are ordinary generic enums with payload-carrying variants, defined in `std/option.psm`. Nothing about them is built into the compiler.

<!-- prismio-check: pass -->
```prismio
import std.io

import std.option

fn half(n: Int) -> Result<Int, String> {
    if (n % 2 != 0) { return Result.Err("odd") }
    return Result.Ok(n / 2)
}

fn main() -> Int {
    match (half(10)) {
        Result.Ok(v) => { return v - 5 }
        Result.Err(e) => { println(e) return 1 }
    }
}
```

## When the program cannot go on

`Result` is for failures a caller can handle. Some failures cannot be handled: a broken invariant, a state the program was written never to reach, or a command-line tool that has nothing left to do but stop. These four are built in, with no import:

| Call | What it does |
| --- | --- |
| `panic(message)` | Prints `panic: <message>` and the source location to stderr, and exits with status 101. |
| `unreachable()`, `unreachable(message)` | The same, as `panic: entered unreachable code`. It marks a path the program's own logic rules out. |
| `assert(condition)`, `assert(condition, message)` | Does nothing when `condition` holds. Otherwise prints `assertion failed:` followed by the message (or the line of source it was written on) and the location, and exits with 101. |
| `exit(code)` | Ends the process with status `code`. |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.option
import std.process
import std.string

fn sign(n: Int) -> String {
    if (n > 0) { return "+" }
    if (n < 0) { return "-" }
    panic("zero has no sign")
}

fn main() -> Int {
    if (process.args.count < 2) {
        eprintln("usage: sign <number>")
        exit(2)
    }
    let n = optionOr(process.args.at(1).parseInt(), 0)
    assert(n != 0, "the input must not be zero")
    println(sign(n))
    return 0
}
```

Run with no argument, it prints the usage line and exits with 2. Run as `sign 0`, the assertion fails:

```text
assertion failed: the input must not be zero
  --> sign.psm:18:5
```

**`panic`, `unreachable` and `exit` never return.** The compiler knows this, so a function may end with one where it would otherwise need a `return`, as `sign` does above, and a `match` arm may use `unreachable()` for a case the program rules out. Code written after one of them is an error, because it can never run. `assert` returns whenever its condition holds.

**`assert` is on in every build**, release included. A passing assertion costs a comparison and a branch that is almost never taken. Its message is built only when the assertion fails, so `assert(ok, "bad input: " + name)` allocates nothing while `ok` is true. It also doesn't stop the compiler's loop optimisations: an `assert` inside a loop keeps the loop's bounds-check elimination. It does prevent vectorising that loop, because every element can now exit early; that is the same cost as the equivalent check in C.

**Status 101** is the code for a crash. It is Rust's convention, and it lets a script tell a panic apart from a program's own `exit(1)`. Other run-time errors, such as integer overflow under `--overflow-checks`, exit with 1.

**Your own names win.** If a program declares its own `assert`, `panic`, `unreachable` or `exit` (for example `extern fn exit(code: Int)`), calls use that declaration and the builtin does not apply.

### Not available yet

- **Functions that always fail don't count as never returning.** A helper like `fn fail(message: String) { eprintln(message) exit(1) }` still needs a `return` after each call to it in a function that returns a value. A `Never` return type that would let a function say so is planned.
- **There is no unwinding and no `catch`.** A panic ends the process at once and runs no cleanup. Output already written to stdout or stderr is kept.
- **No `debugAssert`.** Every `assert` runs in every build.

## Why not a sentinel

Before these types, a failing function returned `-1`, `0`, or an empty string, and nothing in the signature said so. Nothing obliged a caller to check, and nothing distinguished a legitimate `-1` from a failure.

`Result<T, E>` makes the failure case part of the type. `match` is the only way to read the value out, so the error arm cannot be skipped by accident.

## Option is not the same as `T?`

[Optionals](/language/optionals) (`T?`) predate `Option<T>` and remain the right tool for a *reference* that may be absent — an optional struct link, a string that may be missing. They cost nothing: absence is the null pointer.

`Option<T>` works for **every** type, including scalars. `Int?` is rejected by the language, because an integer has no spare representation to mean "absent"; `Option<Int>` carries a separate tag, so it can.

Use `T?` for reference fields, and `Option<T>` when the type is a scalar or a type parameter.

## Propagation is manual

There is no `?` operator. A caller that wants to forward an error writes the match:

```prismio
match (half(n)) {
    Result.Err(e) => { return Result.Err(e) }
    Result.Ok(v) => { doubled = v * 2 }
}
```

A propagation operator needs a defined interaction with ownership and with cleanup during a non-local exit. Neither is specified, so the syntax is not provided rather than provided provisionally.

## Limits in 0.1

- **No bare `unwrap`.** [`unwrapOr`](/stdlib/option) takes a fallback, so the absent case is handled at the use site, and `expect(message)` stops the program with a message you had to write. There is deliberately no accessor that does either silently.
- **Type arguments come from the context when the value cannot supply them.** `Option.Some(5)` infers `T` from `5`. `Result.Ok(5)` cannot infer `E` from anything it carries, so it takes both from the annotation, return type, field or parameter it meets. With none of those, as in `let r = Result.Ok(5)`, write them out: `Result<Int, String>.Ok(5)`. The compiler says so by name.
- `throw` is still reserved by the lexer and is not parsed.
