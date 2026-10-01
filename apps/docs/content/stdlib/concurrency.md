---
title: Concurrency library
description: Prismio 0.1 ships no standard concurrency module; tasks and channels are language features rather than libraries.
status: planned
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [standard-library, concurrency, threads, channels, coming-soon]
related: [language/concurrency, stdlib, roadmap]
---

Prismio 0.1 has **no standard concurrency module**. Synchronization types, mutexes, atomics and
scheduling APIs are Coming Soon, alongside the memory-ordering rules they require.

**Tasks and channels are not missing — they are language features rather than libraries.** `spawn`
and `join` are keywords and `Task<R>` is a language type; `Channel<T>` and its methods (`c.send(v)`,
`c.receive()`, `for msg in c`, ...) are lowered by the compiler in the same category as a Vec's
`push` and indexing. None of them need an import.
See [Concurrency](/language/concurrency) for the task model, the channel rules, and how AIF
classifies thread affinity.

What a concurrency *library* would add, and what this page is a placeholder for: a `select` over
several channels, a managed thread pool, atomics and memory ordering, and cancellation. A send that
cannot proceed blocks today, and there is no way to ask whether it would.
