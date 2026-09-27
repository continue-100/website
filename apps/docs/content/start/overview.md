---
title: Prismio 0.1 overview
description: What Prismio is, what the self-hosted 0.1 compiler implements, and which capabilities are still planned.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [overview, status, compiler]
related: [start/installation, language, compiler/overview, roadmap]
---

Prismio is a statically typed systems language that compiles through LLVM. Its compiler is written in Prismio: the lexer, parser, semantic analysis, allocation inference, import resolver, and LLVM IR generator all live in `.psm` source.

Version 0.1 is an active-development release, not a compatibility promise. “Implemented” on this site means the feature exists in the audited 0.1.0 compiler; it does not mean the syntax or ABI is stable.

## Design at a glance

Prismio combines explicit static types and predictable native compilation with ownership-aware handling of runtime data. Its source is intentionally small and statement-oriented in 0.1: declarations and control flow are conventional, while memory behavior is expressed at function boundaries with default borrows, `sink`, `inout`, and experimental allocation inference.

The compiler pipeline is self-hosted. A trusted seed builds the Prismio source into a new compiler generation, and later generations are compared to establish a fixed point. This makes the compiler source an important part of the language's executable definition.

## What works today

- Native compilation on Windows, macOS, and Linux
- Primitive numeric types, strings, characters, arrays, vectors, structs, and fieldless enums
- Functions, exact-type overloads, lexical scopes, loops, and statement-oriented pattern matching
- Move checking for strings, vectors, and structs; borrowed parameters; `sink` and `inout` parameters
- Nullable reference-shaped types with `T?`, `none`, and checked `expect`
- Relative dotted imports and direct wildcard package imports
- C ABI declarations with explicit ownership contracts
- Adaptive Inference Framework (AIF) analysis and verification

Native targets are exercised on Windows, macOS, and Linux. The compiler also contains an experimental WebAssembly target path; treat it as experimental rather than equivalent to the native support matrix.

## A small example

<!-- prismio-check: pass -->
```prismio
import std.io

struct Counter { value: Int }

fn increment(inout counter: Counter) {
    counter.value = counter.value + 1
}

fn read(counter: Counter) -> Int {
    return counter.value
}

fn main() -> Int {
    let mut counter = Counter { value: 40 }
    increment(counter)
    increment(counter)
    println(read(counter))
    return 0
}
```

`Counter` is a nominal, move-only struct. `increment` receives a mutable borrow, while the ordinary `read` parameter borrows read-only by default. The caller remains the owner through both calls.

## Memory model in 0.1

Integers, floats, booleans, byte characters, raw pointer values, fieldless enums, and arrays use copy behavior. Strings, vectors, and structs are move-only. Moving one of those values into a new owned location invalidates the source binding.

The Adaptive Inference Framework can select an implementation tier and exposes experimental `unique`, `pin(Tn)`, and named-region annotations. Source-level ownership rules remain in force regardless of the inferred allocation mechanism.

## Not implemented

User-written lifetime syntax, exceptions, macros, `async`/`await`, and a package *registry* are not implemented. Generics, payload-carrying enum variants, `Option`/`Result`, method-call syntax, `impl` blocks, generic traits with structural arguments and multiple bounds per type parameter, closures and closure bounds, slices, module namespacing and visibility, tasks, blocking typed channels, and the UMS package manifest all are. The pages for what remains missing are retained as roadmap contracts and are visibly marked **Coming Soon**.

The twenty standard modules — `std.io`, `std.input`, `std.string`, `std.fs`, `std.process`, `std.time`, `std.math`, `std.vec`, `std.map`, `std.option` and the rest — are ordinary importable modules; `std.io` is an import rather than a prelude, so a program that names no I/O carries none. See [Standard library status](/stdlib) before assuming a module exists.

The current language does not provide tuple types, general non-owning references, or implicit numeric promotion. These limits are stated on the relevant reference pages instead of being hidden in a single roadmap.

## Documentation statuses

- **Implemented** means the compiler accepts the documented surface and the documentation includes compiler-derived or compiler-checked evidence.
- **Experimental** means it exists end to end but can change substantially before 1.0.
- **Draft** marks specification text derived from behavior that is not yet a frozen language contract.
- **Coming Soon** means the feature is not in the compiler. Such a page must not be read as valid syntax.

This separation matters for search engines and AI tools: an aspirational keyword can remain discoverable without being blended into current-language answers.

## Source of truth

The language-reference pages describe accepted source syntax. The [draft specification](/specification) records compiler-derived rules more precisely. When either conflicts with compiler behavior in 0.1.0, the tested compiler implementation wins and the discrepancy is a documentation bug.

For day-to-day use, follow the current version badge and page status. For compiler changes, update implementation, positive and negative tests, reference prose, error pages, and specification together so the site remains one source of truth.
