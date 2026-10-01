---
title: Roadmap and feature status
description: Implementation status for current and planned Prismio language, tooling, platform, and library capabilities.
status: stable
draft: true
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [roadmap, status, coming-soon]
related: [start/overview, releases/0.1.0, faq]
---

This page distinguishes shipped compiler behavior from intent. It does not assign release dates.

| Area | 0.1 status |
| --- | --- |
| Self-hosted frontend and LLVM backend | Implemented |
| Native Windows, macOS, and Linux CI | Implemented |
| Ownership checks and AIF | Experimental |
| Cross-compilation (`--target`, `--sysroot`) | Implemented |
| WebAssembly past IR | Blocked |
| Importable standard-library modules | Implemented |
| Terminal colours and styles (`std.term`), `\e` / `\xHH` / `\u{…}` escapes | Implemented |
| Math (`std.math`): Float roots, rounding, logarithms, trigonometry, IEEE 754 constants; integer `pow`, `gcd`, `floorMod`, limits | Implemented |
| Random numbers, `F32`, bit counting, checked integer arithmetic | Coming Soon |
| Standard input (`std.input`): lines, one line, or everything | Implemented |
| Time (`std.time`): `Instant`, `Duration`, the wall clock, `sleep` | Implemented |
| Calendar dates, time zones, timers | Coming Soon |
| Files (`std.fs`): read, write, append, a line at a time, list, rename, remove, metadata | Implemented |
| Environment variables and the process id (`std.process`) | Implemented |
| `panic`, `unreachable`, `assert`, `exit` | Implemented |
| A `Never` return type for a function that always fails | Coming Soon |
| Growing text in a struct field (`StringBuilder`) | Implemented |
| `Map` removal and methods (`m.get`, `m.remove`, `m[k]`, …) | Implemented |
| `Option`/`Result` methods (`unwrapOr`, `expect`, `map`, `andThen`, …) | Implemented |
| Module qualifiers (`std.string.trim(x)`) | Implemented (calls only, by full import path) |
| Visibility: `public`, `private`, `internal` | Implemented (`fn` and `extern fn`; `public` is the default) |
| Selective imports (`import m.name`) | Implemented |
| Aliased imports (`import m as n`) | Coming Soon |
| Method call syntax and `impl` blocks | Implemented |
| Traits and bounded generics | Implemented |
| Generics, monomorphization, and per-specialization container layout | Implemented |
| Inline storage for eligible `Vec<T>` structs | Implemented |
| `Slice<T>` views of a `Vec<T>` and nested slicing | Implemented |
| Local arrays with a written length (`Array<T, N>`, zero-filled; `[T]` when initialised), copied by value | Implemented |
| Arrays returned by value (`-> Array<T, N>`) and stored in struct fields | Implemented |
| Fixed-length array parameters, compiled once per length; array fields in generic structs and enum payloads | Coming Soon |
| Chunked `Vec<T, N>` and `Vec<T, Chunk>`, slices of arrays | Coming Soon |
| More collections: `VecDeque<T>`, sets, a sorted map, a priority queue, a linked list | Coming Soon |
| Programmer-directed AoS↔SoA data views | Experimental (conversion, checked reads, mutation and round trip implemented) |
| `else if` chains, `while`, `loop`, `repeat(n)` | Implemented |
| Ranges `a..b` (end included) and `a..<b`, with `step` | Implemented |
| `for` over String, Vec, Slice, arrays, Map and `Iterator` types, with `(index, element)` | Implemented |
| Labelled loops: `outer@ for …`, `break@outer`, `continue@outer` | Implemented |
| Descending ranges (`10..0` counts down) | Implemented |
| `break` with a value, `if`/`match` as expressions | Coming Soon |
| Payload enums, `Option` and `Result` | Implemented |
| Scalar optionals (`Int?`, `Float?`, an enum's `T?`) by value, in containers | Implemented |
| Conversions: `as T?` that answer `none`, `as String`, text read at compile time | Implemented |
| An enum as its own type, exhaustive `match` over its variants | Implemented |
| Closures | Implemented |
| Closure bounds (`F: Fn(A) -> R`), solving a result type from the closure | Implemented |
| Inferred closure parameter types, storing or returning a closure | Coming Soon |
| User-written lifetimes | Coming Soon |
| Exceptions or result propagation syntax (`?`) | Coming Soon |
| Tasks: `spawn`, `join`, `Task<R>` | Experimental |
| Blocking typed channels: `Channel<T>`, `for msg in c` | Implemented |
| Plain-data messages copied rather than boxed | Implemented |
| `select` over channels, non-blocking send and receive | Coming Soon |
| Async functions, `await`, atomics, synchronization types | Coming Soon |
| Macros and compiler plug-ins | Coming Soon |
| Package manifest (`build.ums`) with profiles, project commands, native C sources, a lockfile and path dependencies | Implemented |
| Package registry and version solving | Coming Soon |
| Importing modules from a path dependency | Coming Soon |
| C++ sources in `native`, and static or shared library targets | Coming Soon |
| Formatter, linter, and language server | Coming Soon |
| Android and iOS toolchains | Coming Soon |

The twenty standard modules, from `std.io` and `std.input` to `std.time` and `std.math`, are ordinary
importable modules; see [the library status page](/stdlib). `std.io` is an import rather than a
prelude, so a program that names no I/O carries none.

Channels are the exception to "a library is a module you import": `Channel<T>` and its methods —
`send`, `receive`, `share`, `close`, `length`, `free`, and `for msg in c` — are lowered by the
compiler, in the same category as a Vec's `push` and indexing, so they need no import. There is no executor and no `await` — a send blocks while the channel is full and a
receive blocks until a message arrives or the channel closes. See
[concurrency](/language/concurrency).

Generic functions are specialized before type checking and code generation reaches their bodies.
Consequently, an eligible concrete `Vec<Flat>` instantiation may use inline storage while another
instantiation of the same template remains boxed; there is no erased generic body that guesses the
element representation at runtime.

**WebAssembly is blocked, not in progress.** Prismio emits wasm32 IR, but there is no C library for
`wasm32-unknown-unknown`, so the runtime cannot be built for it from this repository — what `print`
resolves to on the web is an embedder's decision. A cross build with no runtime bitcode for the
requested triple says so and names the file it looked for. Cross-compilation to other targets works and has been
built and run against `x86_64-apple-macos`.

`impl` is parsed and implemented: concrete specializations and generic inherent blocks such as
`impl<T> Box<T>` attach methods, and `x.f(a)` is rewritten to `f(x, a)` before overload resolution.
See [methods and `impl` blocks](/language/methods). `impl <Trait> for <Type>` and
`impl<T: Bound> Trait for Box<T>` are accepted and are how concrete or structurally matched types
satisfy a bound. Applicability includes the impl bounds, and coherence rejects overlapping generic
and concrete targets. Trait declarations and applications may also be generic, as in
`trait From<T>`, `impl From<Int> for String`, and the bound `U: From<Int>`; trait arguments are part
of applicability and coherence rather than being folded into a textual name.

Closures are implemented the same way, and it is the same mechanism: a closure is a struct plus a
`call` function, resolved by overloading after monomorphisation, so there is no function pointer and
no indirect call. Parameter types are written, the body is an expression, and captures are by value.
See [closures](/language/closures).

Traits are implemented as a **static check**, not a dispatch mechanism: a bound is verified at the
instantiation, where the concrete type is known, and the trait method call is resolved by ordinary
overload resolution. There are no trait objects and no vtables. Multiple bounds on one type
parameter are joined with `+`, or written after the signature in a `where` clause. A trait may
declare type parameters, default method bodies, supertraits, and associated constants, and an
`impl` may be generic. See
[traits and bounds](/language/traits).

The keyword token for `throw` exists in the frontend, but no statement using it is parsed. Token
presence is not implementation; its reference page stays Coming Soon until end-to-end tests establish
otherwise.
