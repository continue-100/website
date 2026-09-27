---
title: Concurrency
description: Tasks, blocking typed channels, how AIF models thread affinity, and which concurrency features are still absent.
status: experimental
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [concurrency, tasks, threads, spawn, join, channels, aif]
related: [stdlib/concurrency, specification/memory-model, guides/memory-and-aif, roadmap]
---

Prismio has a **task model** and a **blocking typed channel**. `spawn` starts a call on another
thread and returns a `Task<R>`; `join` waits for it and yields the `R`. `Channel<T>` carries values
between tasks, one owner at a time. Both are implemented and tested.

The page is marked experimental because the surface is deliberately small and the surrounding rules
— synchronization types, memory ordering, cancellation — are not specified yet.

## Tasks

```prismio
fn summarise(j: Job) -> Report { /* ... */ }

fn main() -> Int {
    let t = spawn summarise(Job { lo: 0, hi: 5 })
    let r = join t
    return r.count
}
```

`spawn` takes a call, not an arbitrary expression. The result is `Task<R>`, where `R` is the
callee's declared return type, so `join` is typed rather than yielding a bare pointer. A task whose
function returns nothing is still joined — the join is the synchronization, not just the value
transfer.

**A task that cannot start stops the program.** If the operating system refuses to create the
thread — too many threads, or no memory for another stack — `spawn` prints
`panic: could not start a task:` followed by the reason, and exits with status 101, as a
[`panic`](/language/error-handling#when-the-program-cannot-go-on) does. It does not fall back to
running the call inline on the current thread: a task that fills a channel before its consumer
exists would then wait for a consumer that is never started.

Because the compiler knows the callee's return type statically, it selects a correctly-typed
function pointer instead of casting through one common signature. That matters on the 64-bit
targets Prismio compiles for, where calling an `Int`-returning function through a pointer declared
to return a pointer leaves half the register undefined.

## What AIF does with a task

Thread affinity is part of the memory model, not an afterthought. Every allocation site is
classified into one of three thread dispositions:

| disposition | meaning |
| --- | --- |
| `Isolated` | never reachable from another thread |
| `Transferred` | ownership moves to another thread exactly once |
| `CrossThread` | reachable from more than one thread at a time |

A value that stays inside a joined task is `Isolated`, and the join is what pays for it: the
argument never outlives the call. A value reachable from an unjoined or detached task becomes
`CrossThread`, and AIF emits an **atomic** release for it. Non-atomic reference counting stays on
the common path; the atomic form is a separate symbol chosen only where the analysis proves it is
needed.

### Where a proved join pays

When the compiler can prove the task is joined on every path before the enclosing scope exits, the
spawned argument does not outlive that scope — so it is placed in the caller's frame rather than on
the heap, and the spawn allocates nothing for it. Writing the argument at the spawn site is what
makes this reachable; building it in a helper function and returning it puts the value's lifetime
beyond the reach of that rule, and it will be heap-placed instead.

The task handle itself is released at the end of the scope that spawned it, again only where the
join is proved. A spawn the compiler cannot prove is joined keeps its handle for the life of the
process, because freeing a handle a running task may still write to would be worse than keeping it.

You can inspect this for any program:

```bash
prismio aif yourprogram.psm --summary
```

The `thread affinity` block reports the counts.

## Channels

`Channel<T>` is a language type, not an importable module: its seven operations are compiler
builtins in the same category as a Vec's `push` and indexing, so they need no import.

| | | |
| --- | --- | --- |
| `chan_new(capacity)` | `Channel<T>` | `T` comes from the annotation |
| `chan_send(c, v)` | `Int` | 1 delivered, 0 dropped because closed. **Moves `v`** |
| `chan_recv(c)` | `T?` | blocks; `none` once closed *and* drained |
| `chan_share(c)` | `Channel<T>` | a second endpoint — not a second owner |
| `chan_close(c)` | `Void` | wakes every blocked sender and receiver |
| `chan_len(c)` | `Int` | messages queued |
| `chan_free(c)` | `Void` | after `chan_close`, after every `join` |

`T` must be reference-shaped — a struct, a `Vec`, a `String`: the types `T?` accepts. One pointer
travels per message, and the receive answers `T?`, which applies to reference-shaped types only. A
channel of a number is refused, and the message says what to send instead:

```text
error[P4001]: a channel carries references, and Int is not one; send a struct with one field of it
```

`struct Reading { value: Int }` and a `Channel<Reading>` carry the same number.

<!-- prismio-check: pass -->
```prismio
import std.io

struct Job {
    seed: Int
}

struct Answer {
    value: Int
}

fn worker(jobs: Channel<Job>, results: Channel<Answer>) -> Int {
    let mut handled = 0
    loop {
        let taken = chan_recv(jobs)
        if (taken == none) { break }
        let job = expect(taken)
        chan_send(results, Answer { value: job.seed * 2 })
        handled = handled + 1
    }
    return handled
}

fn main() -> Int {
    let jobs: Channel<Job> = chan_new(4)
    let results: Channel<Answer> = chan_new(4)

    let w = spawn worker(chan_share(jobs), chan_share(results))

    chan_send(jobs, Job { seed: 21 })
    chan_close(jobs)

    let taken = chan_recv(results)
    let mut total = 0
    if (taken != none) {
        let answer = expect(taken)
        total = answer.value
    }

    let handled = join w
    chan_close(results)
    chan_free(jobs)
    chan_free(results)

    println(total)
    return handled - 1
}
```

### The four rules

**A send moves.** The receiver takes the message out and owns it from then on, so naming the value
again in the sender names memory another thread may already have freed. The move checker refuses it,
the same way it refuses a second use after `v.push(x)`.

**`chan_share` is the duplication, and it is deliberate that you have to write it.** Every handle
the language can name is affine, so `spawn worker(c)` *moves* the endpoint away. Sharing it is the
event the ownership analysis sees, and it is what classifies anything reachable through it as
crossing threads. It hands back the same endpoint — only the one `chan_new` returned may be freed.

**A receive after close drains, then answers `none` for ever.** That is how a worker loop ends
without a sentinel message and without a second channel to ask whether there is more work.

**Destruction is close, then join, then free.** The join is the synchronization edge that makes the
free safe. Freeing a channel a task is still blocked on is a program defect the runtime cannot
detect.

There is **no executor, no future and no `await`.** A send blocks while the channel is full; a
receive blocks until a message arrives or the channel closes. That is the whole surface, and it is
enough to keep a worker pool alive across frames rather than creating threads per unit of work.

## Not implemented

None of the following exist in 0.1, in the language or in the importable standard library:

- `async` functions and `await`
- user-facing atomics, mutexes, condition variables, or other synchronization types
- a specified memory-ordering model
- task cancellation, timeouts, or structured-concurrency scopes
- a non-blocking or selectable receive (`select` over several channels)
- an executor, a thread pool the language manages for you, or work stealing

Foreign C functions may expose platform concurrency directly. Prismio 0.1 does not define
thread-safety or data-race rules for that path, and such use is outside the specified language
model.
