---
title: Engineering roadmap
description: Evidence-backed Prismio compiler, AIF, runtime, tooling, and standard-surface priorities without invented release dates.
status: stable
draft: true
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [roadmap, compiler, status]
related: [start, releases/0.1.0, performance/investigation-method]
---

This roadmap distinguishes shipped behavior, measured problems, and proposed engineering work. It
does not assign release dates.

## Established baseline

- Self-hosted frontend, semantic analysis, AIF, and LLVM 23 backend.
- Native artifacts, direct C ABI integration, debug information, JSON diagnostics, and UMS projects.
- Generics, traits, associated items, trait objects, `impl Trait`, closures, payload enums, slices,
  DataView, native tasks, and blocking typed channels.
- AIF storage plans, explanations, manifests, runtime verification, and an independent oracle.
- A standard library a command-line program can be written with: standard input, files and line
  readers, the environment, clocks, math, `StringBuilder`, and `Map`/`Option`/`Result` methods
  (done 2026-09-25).
- A 78-workload cross-language benchmark catalog with 63 implemented workloads.

## Foundational memory work

The active memory tracker ranks first-class allocation and lifetime telemetry, thread-safe region
and cycle state, container-aware layout pricing, a memory-aware middle IR, and interprocedural
ownership and region summaries as foundational directions.

These are proposals with acceptance criteria, not promised speedups. Most require new measurements
before a performance claim is possible.

Implementation would span `src/aif/model.psm` and `walk.psm` for facts, the solver for propagation,
`report.psm` for explanations and machine evidence, `src/ir` for mechanism selection, and
`runtime/lang_runtime.c` for any new counter or allocator path. A proposal does not become active
because a report can name it; codegen, the runtime, differential oracle, and verifier must consume
the same meaning.

## Measured optimization directions

Current investigations identify container-context layout selection, contiguous typed loop views,
general destination passing, scalar replacement, return-slot construction, preserved string
length across boundaries, runtime specialization, and explicit region capabilities as possible
follow-on work. Each remains gated by correctness and discriminating A/B evidence.

For layout work, `aif_layout_select()` and candidate ranking must expose the exact emitted choice, and
`--force-layout` must build that candidate for A/B measurement. For destination passing or return
slots, ownership/AIF must prove that construction targets do not alias live values before
`generateExpression()` changes storage. Runtime specialization must keep `PRISMIO_CURATED_OPS` and
its symbol closure synchronized with every operation codegen can emit.

Each accepted optimization needs four artifacts: a source-level correctness regression, an AIF or
IR assertion proving the mechanism, raw interleaved benchmark samples above A/A noise, and
self-hosting fixed-point agreement. Rejected candidates remain in `aif/evidence` with their measured
failure mode.

## Unsupported surface

Chunked vectors (`Vec<T, N>`, `Vec<T, Chunk>`) are designed in the compiler repository's
`COLLECTIONS.md` (step 4) and deliberately not started for 0.1; the parser refuses `Vec<T, N>` with
`P3006` until they exist. Of `Array<T, N>` (step 3), returns and struct fields are built; still
open are `[T]` parameters compiled once per length, array fields in generic structs and enum
payloads (refused in `semaCheckArrayLengthPositions`), and copies of nested or owning arrays.
`Slice<T>` layouts and slices of arrays are step 5. The benchmark catalog records missing deques and ordered containers, priority queues,
regex, JSON, generic serialization, user-facing atomics and locks, work stealing, async I/O,
sockets, memory-mapped files, explicit SIMD types, and custom collection allocators.

Missing does not mean scheduled. A feature becomes a roadmap commitment only when its semantics,
owner, implementation plan, tests, and acceptance evidence are defined.

## Toolchain and platform work

The project also tracks stronger packaged-toolchain separation, target runtime coverage, manifest
evolution, editor protocol stability, and release reproducibility. These changes are owned by
`runtime/build_driver.c`, `tools/package.py`, `ums`, `IDE_PROTOCOL.md`, and
`tools/release_gate.py` respectively. LLVM accepting a triple is only backend capability; Prismio
target support additionally requires a runtime, SDK/link strategy, tests, and a packaged smoke test.

## How roadmap status changes

A proposed item should name its current reproducer or measurement, exact source owner, unsafe or
compatibility boundary, smallest discriminating test, and removal/rollback plan. Move it to the
implemented baseline only after the ordinary compiler path uses it and the release gate proves it.
Keep dates out until a release owner and verified artifact exist.
