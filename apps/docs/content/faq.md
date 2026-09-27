---
title: Frequently asked questions
description: Concise answers about Prismio 0.1 stability, self-hosting, memory, platforms, packages, and documentation status.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [faq, support, status]
related: [start/overview, roadmap, compiler/targets]
---

## Is Prismio production-ready?

No. Version 0.1 is active compiler development. Implemented features are tested, but syntax, runtime contracts, AIF policy, and ABI details may change.

Use it for compiler/language development and controlled experiments. Pin the compiler revision for any persistent project and keep upgrade tests around ownership, FFI, and generated artifacts.

## Is the compiler really written in Prismio?

Yes. A committed LLVM IR seed breaks the initial bootstrapping cycle; subsequent generations compile the Prismio compiler source.

The repository checks multiple generations and fixed points. Self-hosting proves the language/compiler can express and rebuild itself; it does not prove the compiler is bug-free.

## Does Prismio use garbage collection?

There is no single implicit tracing-GC model. The compiler enforces moves and borrows for move-only values, while experimental AIF classifies allocations across stack, region, unique, reference-counted, and cycle-aware tiers.

Source ownership rules remain the same regardless of the selected allocation tier. AIF policy is experimental and should not be reduced to “Prismio is GC” or “Prismio is always manual memory.”

## Which platforms are supported?

The compiler is exercised in CI on Windows, macOS, and Linux. WebAssembly targeting exists experimentally at the IR/runtime layer. Android and iOS toolchains are Coming Soon.

Native support does not yet imply a stable binary distribution, cross-compilation SDK, or ABI. LLVM 23.1.1 is the pinned backend line.

## Where is the standard library?

There are twenty importable modules, [listed with what each covers](/stdlib): among them `std.io` and `std.input` for the console, `std.fs` for files, `std.process`, `std.time`, `std.math`, `std.string`, and the `std.vec` and `std.map` collections. `std.io` is an ordinary import rather than a prelude, so a program that names no I/O carries none. `std.*` resolves against the compiler's own library, so a local `std/` directory cannot shadow it.

Concurrency is not one of them, and that is not an omission: `spawn`/`join`/`Task<R>` and `Channel<T>` are language features rather than libraries. Networking still requires local FFI integration; its page is marked Coming Soon.

## Does Prismio have Cargo, npm, or Go modules?

Not yet, in the sense that matters: there is no registry and nothing to fetch from one.

Prismio 0.1 has a `build.ums` manifest and a lockfile, and dependencies may name a local path. There is no registry and no dependency solver: a version constraint is recorded, not satisfied, and a dependency without a local path cannot be fetched. A resolved path is not yet on the import search either, so vendor source below the entry root and pin external revisions through source control. See [package manager](/package-manager).

## Why does a keyword appear in highlighting but fail to compile?

Lexer or editor vocabulary can precede parser and semantic support. Only features marked Implemented or Experimental on this site should be expected to compile.

`throw` is a concrete example: the lexer reserves it, but 0.1 does not parse a feature for it.

## Are ordinary function parameters moved?

Not for move-only values. An ordinary string, Vec, or struct parameter borrows by default. Use `sink` to consume ownership and `inout` for caller-visible mutable borrowing. Scalars and fieldless enums copy.

## Does Prismio have references and lifetime syntax?

No general source-level `&` reference or user-written lifetime parameter exists in 0.1. The compiler still enforces call-scoped borrow modes, moves, scope, loop restrictions, and local-array escape checks.

## Why does `Int` not accept every integer operation?

`Int` is specifically signed 32-bit. Other widths and signedness are distinct. Prismio does not insert implicit numeric promotion, so cast intentionally with `as` after considering range.

## Can I return an array?

Yes, by value: declare the function `-> Array<T, N>` and the caller gets a copy of its own, from a local array, a literal or a zero-filled one. The elements must own nothing. A function declared `-> [T]` returns a view, so a local array cannot leave through it. A struct can hold an array too, as an `Array<T, N>` field. Use a `Vec<T>` when the length is not fixed or the elements own memory. See [returning and storing arrays](/language/arrays-and-lists#returning-and-storing-arrays).

## Are optionals available for every type?

No. `T?` is limited to reference-shaped structs, strings, vectors, and raw pointers. Scalar numbers, booleans, characters, enums, and arrays cannot be optional in 0.1. Compare with `none` and call `expect`; comparison does not flow-narrow.

## Can I use methods, traits, generics, or closures?

Yes. [Generics](/language/generics) — functions, structs, and enums take type parameters, and each instantiation is compiled separately. [Methods](/language/methods) are written in `impl` blocks, [traits](/language/traits) bound generics and can supply default methods, and [closures](/language/closures) are passed as a generic `F`.

`Vec<T>` is separate from that: it is built into the compiler and predates generics rather than being an instance of them.

## How are errors represented in programs?

As values. There are no exceptions, `try`, `catch` or propagation operator: a function that can fail returns `Result<T, E>`, and one whose answer may be absent returns `Option<T>` — ordinary generic enums from `std.option`, matched like any other. See [error handling](/language/error-handling).

## Are documentation error IDs compiler codes?

No. URLs such as `/errors/use-after-move` are permanent documentation keys. Compiler 0.1 emits prose diagnostics without stable numeric codes.

## Which documentation should I trust?

Use pages with version `0.1.0` and status Implemented or Experimental for current code. The draft specification is canonical prose; tested reference-compiler behavior is the 0.1 executable oracle. Coming Soon pages are non-normative.
