---
title: Console I/O
description: Source-defined print and println overloads available to Prismio programs.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [standard-library, io, print, console]
related: [start/hello-world, stdlib, stdlib/input, stdlib/filesystem, language/ffi]
---

Console output has two public functions: `print` and `println`. They are ordinary exact-type overloads implemented in the shipped `std/io.psm` source module, and one call may carry several values. **There is no prelude — `import std.io` is required**, like any other module. That is deliberate: a program that names no I/O carries none, which is what lets a target with no stdout link at all.

```prismio
print("value: ")
println(42)
println(3.5)
println(true)
println('A')
```

The functions write to the descriptor directly — stdout for `print`/`println`, stderr for `eprint`/`eprintln` — with no buffering in between. Newline variants append a line ending; non-newline variants leave subsequent output on the current line.

## String output

```prismio
print("progress: ")
println("done")
```

`print` and `println` accept `String`. Their parameters borrow, so printing does not consume the caller's owned string.

## Several values in one call

`print` and `println` accept more than one value. A space goes between them, as in Python:

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    print("Total: ", 5)
    println()
    println("x", 1, true, 'c', 2.5)
    return 0
}
```

```
Total:  5
x 1 true c 2.5
```

`println()` with no arguments writes the line break on its own, which is how the
first line above ends. `eprintln()` does the same on stderr.

### Choosing the separator

`separator(...)` as the **last** argument replaces the space:

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    println(1, 2, 3, separator(", "))
    println("a", "b", separator(""))

    let bar = " | "
    println("x", "y", "z", separator(bar))
    return 0
}
```

```
1, 2, 3
ab
x | y | z
```

It takes a String literal or a name. The separator is written once per gap, so a
call in that position -- `separator(n.toString())` -- is refused rather than run
repeatedly; bind it to a `let` first and pass the name.

### What this is, and is not

There is no variadic function here and no new overload. `print(a, b, c)` is
rewritten by the compiler into the calls you would have written yourself:

```prismio
print(a)
print(" ")
print(b)
print(" ")
print(c)
```

Each value goes through the exact-type overload it always had, so a type with no
`print` overload has none here either, and the diagnostic points at that value.
The trailing `println` keeps its name rather than becoming `print` plus a
newline, so a line still costs one write.

Two consequences worth knowing:

- **Your own declaration wins.** A program that declares `fn print(a: String, b: String)` is calling that, not being rewritten around it. The same is true of `separator`: declare a function with that name and the marker turns itself off.
- **The pieces are separate writes.** `println("a", "b")` reaches the descriptor as three writes rather than one, so another thread printing at the same time can land between them.

## Colour

`print` writes exactly the bytes it is given, so coloured output is a String carrying ANSI escape sequences. [`std.term`](/stdlib/term) builds them — `println("error:".red().bold())` — and says whether stdout will show them; `"\e[31m"` writes one by hand.

## Standard error

`eprint` and `eprintln` write to stderr instead of stdout.

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    eprintln("scanning 3 files")
    println("result: 42")
    return 0
}
```

They exist so that a program whose **stdout carries a format** can still say
something to the person watching without corrupting it. Anything a caller may
pipe into another tool -- a manifest, JSON, a column of numbers -- is a format in
this sense, and a progress line printed alongside it is no longer parseable
output. The compiler's own host-routing banner is on stderr for exactly this
reason: while it printed to stdout it prefixed `aif --manifest` and broke that
format's one guarantee, that its first line is `aif-manifest 1`.

`eprint` and `eprintln` accept every type their stdout twins do, and take several
values in one call in the same way. A status line counts things — the compiler
uses one to report how many standard-library modules it rebuilt beside a
project-local toolchain:

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    eprint("rebuilt ")
    eprint(14)
    eprintln(" modules")
    return 0
}
```

The width-specific overloads (`I8` through `U64`, `Float`, `Bool`, `Char`) are on
stderr too. They have to be: `eprintln("count: ", n)` splits into an `eprint` of
the text and an `eprintln` of the value, so a type missing from this set would
turn a working stdout line into a diagnostic the moment it moved to stderr.

## Exact overloads

The same two names accept the five supported console value types. Overload selection uses the argument's exact type; it is not a variadic formatter or a runtime `Any` conversion.

| Value type | No newline | With newline |
| --- | --- | --- |
| `String` | `print` | `println` |
| `Int` (`I32`), `I8`, `I16`, `I64`, `Isize` | `print` | `println` |
| `U8`, `U16`, `U32`, `U64`, `Usize` | `print` | `println` |
| `Float` | `print` | `println` |
| `Bool` | `print` | `println` |
| `Char` | `print` | `println` |

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    let code: U8 = 255
    let bytes: U64 = 4294967296
    println(code)
    println(bytes)
    return 0
}
```

These are separate exact overloads, not implicit integer promotion. Arithmetic and assignment still require compatible widths, while output preserves the complete signed or unsigned value without a narrowing cast.

`Char` is byte-sized in 0.1, so its overload is not a complete Unicode scalar-output API. String source/runtime encoding details should be handled through the documented string/FFI contract.

## Formatting values

Pass the parts to one call, or interpolate them into one string with `${}` (which needs `import std.display`, because it is `show` underneath):

```prismio
println("items: ", items.length, separator(""))
println("items: ${items.length}")
```

For application-specific rich formatting, write typed helper functions or use a carefully declared foreign formatting wrapper. Avoid C variadic APIs unless a stable adapter fixes the signature because source-level FFI variadics are not documented.

## Printing your own types

`print`, `println`, `eprint` and `eprintln` also accept any value with an `impl Display`, once `std.display` is imported. That covers a type of your own, an `Option<T>` (its value, or `none`) and a `String?`:

<!-- prismio-check: pass -->
```prismio
import std.display
import std.io
import std.option

struct Version {
    major: Int,
    minor: Int
}

impl Display for Version {
    fn show(self) -> String {
        return "${self.major}.${self.minor}"
    }
}

fn main() -> Int {
    let version = Version { major: 1, minor: 4 }
    let missing: Option<String> = Option<String>.None
    println(version)                  // 1.4
    println("built:", missing)        // built: none
    return 0
}
```

The overloads for the built-in types in the table above are exact matches and win over these, so importing `std.display` changes nothing for a program that only prints numbers and strings. They are in `std.display` and not here because `std.io` is imported by every printing program, and a generic `print` in it would carry `std.display` and `std.string` into all of them.

When a value cannot be printed, the error lists the argument types it was given and, for an optional, says how to take the value out (`unwrapOr`, `expect`).

The old chunked names such as `println_int`, `print_bool` and `print_char` are not public Prismio functions, and as of 0.1 they no longer exist as runtime symbols either — a program that declared one by hand will fail to link naming it. Use the overload set directly.

## What "printed" guarantees

`print` writes the whole string, or stops because the descriptor refused it.

That is worth stating because the underlying `write` does not promise it. It returns how many bytes it took, and fewer than asked for is an ordinary outcome rather than an error — most visibly on a descriptor someone set `O_NONBLOCK` on, which is a property of the open file description and so is inherited across `fork`/`exec` and shared by every duplicate of it. `std/io.psm` resumes from where a short write stopped, and reissues when a write was interrupted by a signal before it moved any bytes.

A descriptor that refuses outright ends the attempt rather than spinning on it. These are `write_all` semantics, not polling: a non-blocking descriptor that has no room right now is *not* waited on, because blocking inside `print` on a descriptor its owner deliberately made non-blocking is not the caller's intent.

**A broken pipe is a signal, not a return value.** Nothing in the runtime ignores `SIGPIPE`, so a program whose reader has gone away dies of the signal, exactly as `cat` does in the same position. This is what a filter should do, and no error handling in `print` would run instead.

## Errors and buffering

There is no buffering to select or flush: output reaches the descriptor on each call. One consequence is worth relying on — `stdout` and `stderr` cannot reorder relative to each other, so a status line on stderr always lands where it was written relative to the surrounding stdout.

The 0.1 print functions do not expose a structured recoverable I/O result or a writer handle. A caller that must know whether every byte arrived cannot learn it from `print`.

`Float` is the one value type still formatted in C, because its formatter parses candidates back with `strtod`; every other overload formats in Prismio. A Float prints with at most fifteen significant digits, so `println(0.1 + 0.2)` prints `0.3` — see [float text](/stdlib/strings#float-text).

`std/io.psm` is an output module. Formatted output beyond interpolation, error objects, and pluggable writers are not part of the 0.1 standard library.

## Reading input and files

Input lives in its own modules, so a program that only prints carries none of it:

- **Standard input** is [`std.input`](/stdlib/input): `for line in stdin.lines()`, `stdin.readLine()` and `stdin.readAll()`.
- **Files** are [`std.fs`](/stdlib/filesystem): `readFile`, `writeFile`, `appendFile`, and `readLines` for a file read a line at a time.
