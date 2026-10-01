---
title: Frequently asked questions
description: Current answers about Prismio stability, self-hosting, AIF, LLVM, platforms, standard modules, UMS, and compiler support.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [faq, support, status]
related: [start, roadmap, tooling/debugging-targets-and-build-tracing]
---

## Is Prismio production-ready?

No. Prismio 0.1 is active compiler development. Implemented behavior is tested, but syntax,
runtime contracts, manifests, diagnostics, AIF policy, and ABI details may change. Pin a compiler
revision for persistent work.

## Is the compiler really self-hosted?

Yes. The lexer, parser, AST, import resolver, semantic analysis, AIF, and LLVM IR generator are
written in Prismio. A committed LLVM IR seed breaks the initial bootstrap cycle. Later generations
compile the current source and are checked for fixed-point agreement.

## What does AIF stand for?

Adaptive Inference Framework. It classifies allocation sites across stack, region, unique heap,
shared, and cycle-aware strategies and can explain or verify decisions. Source ownership rules do
not depend on receiving an aggressive tier.

## Does Prismio use LLVM?

Yes. LLVM 23 is the supported backend line. Self-hosted Prismio code constructs the module through
a narrow C wrapper around the LLVM C API. LLVM IR is verified before emission.

## Which language mechanisms are implemented?

The current suite covers generics, inherent and trait implementations, default trait methods,
multiple bounds, supertraits, associated constants and types, trait objects, `impl Trait`,
closures, payload enums, pattern matching, slices, DataView conversion, native tasks, and typed
blocking channels. Their exact stability and limitations remain documented per article and test.

## What standard modules exist?

The compiler tree includes `std.io`, `std.string`, `std.fs`, `std.process`,
`std.vec`, `std.map`, `std.option`, `std.key`, `std.ord`, `std.copy`,
`std.eq`, `std.display`, and `std.iter`. There is no prelude. Standard-library search can
select checkout-local or packaged modules; inspect `prismio --version` when debugging resolution.

## Does Prismio have a package registry?

No. UMS supplies `build.ums`, targets, profiles, project commands, local path dependencies, lock
information, native C sources and link inputs, and the project compiler host. It does not currently fetch packages from a
registry or solve remote version constraints.

## What concurrency model exists?

`spawn`, `join`, and `Task<R>` use native OS threads. `Channel<T>` is a typed blocking
channel. There is no async runtime, `await`, work-stealing executor, or user-facing atomic and
mutex surface.

## What does the benchmark suite cover?

The maintained catalog has 73 workloads: 57 implemented and 16 marked unsupported. Implemented
workloads compare equivalent Prismio, C++, and Rust algorithms with checksum validation. Missing
features are recorded rather than replaced with benchmark-only substitutes.

## Which documentation is authoritative?

The current compiler source and regression tests are the executable authority. Implementation
articles explain the code; specifications explain intended contracts; evidence records explain
measurements and rejected alternatives. When they differ, record the discrepancy and add a test.
