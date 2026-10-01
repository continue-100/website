---
title: Standard library status
description: Prismio's shipped source standard library and the modules still planned.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [standard-library, runtime, status]
related: [stdlib/io, stdlib/input, stdlib/strings, stdlib/math, stdlib/time, stdlib/filesystem, stdlib/vec, stdlib/map, stdlib/option, roadmap]
---

Prismio ships twenty standard-library modules:

| Module | Covers |
| --- | --- |
| [`std.io`](/stdlib/io) | `print`, `println`, `eprint`, `eprintln` |
| [`std.input`](/stdlib/input) | standard input: `stdin.lines()`, `stdin.readLine()`, `stdin.readAll()` |
| [`std.string`](/stdlib/strings) | `String` and `Char` methods, parsing, formatting, `StringBuilder`, and the `String` operators |
| [`std.unicode`](/stdlib/unicode) | grapheme clusters, terminal width, normalization |
| [`std.fs`](/stdlib/filesystem) | files, directories, paths, `readLines`, `metadata` |
| [`std.process`](/stdlib/process) | arguments, environment variables, the process id, starting other programs |
| [`std.platform`](/stdlib/platform) | the target's operating system and architecture |
| [`std.time`](/stdlib/time) | `Instant`, `Duration`, `unixTime()`, `sleep` |
| [`std.math`](/stdlib/math) | Float and integer math, and every numeric type's limits |
| [`std.vec`](/stdlib/vec) | `Vec<T>`'s library methods and the Vec literal |
| [`std.map`](/stdlib/map) | `Map<K, V>` |
| [`std.option`](/stdlib/option) | `Option<T>`, `Result<T, E>` and their methods |
| [`std.term`](/stdlib/term) | terminal colours and styles |
| `std.key`, `std.ord`, `std.copy`, `std.eq`, `std.iter`, `std.display`, [`std.default`](/language/traits#a-types-own-default) | the `Key`, `Ord`, `Copy`, `Eq`, `Iterator`, `Display` and `Default` traits |

A packaged toolchain installs them as **compiled `stdlib/*.plib` artifacts**, not as `.psm` source. A PLIB carries the module's interface — which the frontend still parses, because generic bodies have to be instantiated against your concrete types — together with its compiled LLVM bitcode, which the driver merges into your program before optimization. The directory is **flattened**, so never derive a module's logical name from its path on disk: `std.map` is `stdlib/map.plib`.

Inside a Prismio checkout the `std/*.psm` sources win instead, because imports resolve upward from your entry file before the installed toolchain is consulted. That is what lets compiler development test a standard-library edit immediately.

**There is no prelude.** `std.io` is an ordinary import: a program that prints nothing carries no I/O, which is what lets a target with no stdout link at all. Calling `println` without `import std.io` is `error: unknown function \`println\``.

`std.*` imports resolve against the compiler's own library rather than relative to the importing program, so a local `std/` directory cannot shadow them.

`std.net` and `std.time` remain unavailable. There is no `std.concurrency` either, and that is not a gap: `spawn`/`join`/`Task<R>` and `Channel<T>` are language features rather than libraries — see [concurrency](/language/concurrency).

## Available without imports

The compiler provides a small built-in surface that needs no import at all:

- Explicit `drop` and checked `expect`
- [`panic`, `unreachable`, `assert` and `exit`](/language/error-handling#when-the-program-cannot-go-on), which stop the program with a message and its source location, or with a status of your choosing
- `Vec<T>`'s core: the empty literal `[]`, `Vec<T>.withCapacity(n)`, `Vec<T>.filled(n, x)` for a scalar `T`, indexing, `for x in v`, the methods `push`, `set`, `replace`, `swap`, `insert`, `reserve`, `truncate` and `clear`, and the properties `length`, `capacity`, `first`, `last`, `isEmpty` and `isNotEmpty`
- a Slice's and a DataView's `length`
- the [`default`](/language/variables#default-values) value of any type that has one

The `list_*` runtime entry points these compile to are internal to the standard library; calling one names the method to write instead.

That is the whole of it. `print` and `println` are **not** in this list — they are ordinary source-defined overloads in `std/io.psm` and need `import std.io` like anything else.

The output overloads participate in normal declaration lookup, overload resolution, type checking, and ownership analysis. The private C ABI symbols beneath them are implementation details and should not be declared by applications.

## Output

`String`, `Int`, `Float`, `Bool`, and `Char` have exact `print`/`println` overloads, and one call may carry several values. String interpolation, `"${x}"`, formats through the `Display` trait and needs `import std.display`. There is no writer protocol and no formatted-output mini-language.

## Input, files and time

[Standard input](/stdlib/input) is its own module, `std.input`, so a program that only prints does not carry it. Files — whole, appended to, or [a line at a time](/stdlib/filesystem#reading-a-file-a-line-at-a-time) — and directories are [`std.fs`](/stdlib/filesystem). [`std.time`](/stdlib/time) measures elapsed time on the monotonic clock, reads the wall clock, and sleeps.

## Math

[`std.math`](/stdlib/math) holds Float's square roots, rounding modes, powers, logarithms and trigonometry, integer `pow`, `gcd`, `lcm`, `floorDiv`/`floorMod` and `isqrt`, and every numeric type's limits as `Int.MAX`, `Float.PI`, `Float.INFINITY` and so on. Each Float function compiles to the instruction or C-library call a C compiler would use. `Float` itself is IEEE 754 binary64. Random numbers, `F32` and bit counting are not available yet.

## Math

[`std.math`](/stdlib/math) holds Float's square roots, rounding modes, powers, logarithms and trigonometry, integer `pow`, `gcd`, `lcm`, `floorDiv`/`floorMod` and `isqrt`, and every numeric type's limits as `Int.MAX`, `Float.PI`, `Float.INFINITY` and so on. Each Float function compiles to the instruction or C-library call a C compiler would use. `Float` itself is IEEE 754 binary64. Random numbers, `F32` and bit counting are not available yet.

## Strings

`String` is an owned move-only runtime value. [`std.string`](/stdlib/strings) provides searching, trimming, splitting, joining, replacement, padding, case mapping, and integer parsing, plus wrappers carrying the ownership contract for the eight runtime primitives that must stay in C.

Still absent: interpolation syntax, Unicode scalar iteration, a string builder, and a formatting trait. `Char` is a byte, not a Unicode scalar.

## Vectors

`Vec<T>` is the built-in growable owned sequence. It is built into the compiler rather than defined in the library: the methods that store an element or read its size are compiled straight to runtime calls, which is why the core surface above needs no import. A non-empty literal and the other methods — `get`, `contains`, `indexOf`, `pop`, `removeAt`, `extend`, `sort` and the rest — come from `std.vec`. It was spelled `List<T>` before 0.1's collections work; that spelling is now an error naming `Vec<T>`.

For boxed struct elements, `items.replace(index, value)` replaces and reclaims the old
element when the compiler can prove `items` is still an unobserved local Vec. A prior element read,
Slice construction, or arbitrary borrowing call closes that capability. `items.set(index, value)`
remains the general conservative replacement operation.

[`Map<K, V>`](/stdlib/map) is defined in Prismio, in `std/map.psm`, as an open-addressed table over `Vec`. Its key type carries `Key + Copy` bounds: [`std.key`](/stdlib) supplies `hash` and `eq`, while `std.copy` supplies `copyOf` so the table can retain a key — therefore **`String` keys work**, and every integer width does. `Float` deliberately has no `impl Key`: NaN is not equal to itself, so a NaN key could be inserted and never found again.

[`std.vec`](/stdlib/vec) gives `Vec<T>` its literals and methods — `push`, `insert`, `pop`, `removeAt`, `contains`, `indexOf`, `reverse`, `clone` and the rest — plus `sort` for a `T: Ord`, `sortBy` with a closure comparator, `binarySearch`, `filter`, `mapInto`, `countWhere`, `any` and `all`. `for x in v` and `for (i, x) in v` visit it, and [`std.iter`](/language/traits)'s `Iterator` lets a type of your own join a `for` loop; there are no lazy adapter chains (`v.iter().map(…)`) yet.

**`Vec<T>` and `Map<K, V>` are the only collections in 0.1.** Not available yet, and planned: `VecDeque<T>`, sets, a sorted map, a priority queue, a linked list and the chunked `Vec<T, N>`. The fixed-length `Array<T, N>` is a language type rather than a library one. [What each missing collection is, and what to use until it ships](/language/arrays-and-lists#not-available-yet).

## Memory primitives

`drop(value)` explicitly consumes owned move-only data. `expect(optional)` performs a checked presence assertion for reference-shaped optionals. These are language/runtime primitives, not exception or destructor frameworks.

## Foreign extensions

Programs can declare C-compatible symbols with `extern fn`. It is the escape hatch for networking and platform services the standard library does not cover — **not** the way to reach the Prismio runtime. Files, input, clocks, arguments, and string operations are covered by [`std.fs`](/stdlib/filesystem), [`std.input`](/stdlib/input), [`std.time`](/stdlib/time), [`std.process`](/stdlib/process), and [`std.string`](/stdlib/strings), which carry the ownership contracts so applications do not have to.

An `extern fn` with no contract has unknown provenance: the analysis widens it to Shared, the result gets no owner, and it leaks. Worse, `produce(free)` on a function that returns a borrowed pointer hands that pointer to the deallocator. See the [contract table](https://developers.prismio.org/runtime/supported-surface#writing-an-extern-contract) on the developer portal.

These pages separate existing runtime surface from planned modules. Networking is marked Coming Soon, and so is the concurrency page, for the synchronization types and `async` that are not built yet; every other page describes a module that ships.

Coming Soon pages intentionally do not invent final module names or signatures. They define what is missing and the semantic questions that must be resolved before the status changes.

Until module APIs exist, bind needed platform or C-library functions through a local FFI wrapper and document their ownership contracts.

## Stability rules

- Use only documented public operations and shipped source modules.
- Do not assume that planned `std.*` names resolve merely because `std.io` now ships.
- Treat internal runtime declarations as implementation details unless explicitly documented.
- Keep FFI wrappers small and target-tested.
- Expect module names and APIs to receive their own versioned reference pages when implemented.
