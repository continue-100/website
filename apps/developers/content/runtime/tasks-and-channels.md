---
title: Native tasks and typed channels
description: The runtime model behind spawn, join, Task results, blocking Channel operations, ownership transfer, and current concurrency limits.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-26"
tags: [runtime, concurrency, channels]
related: [compiler/closures-and-captures, aif/tiers-and-analysis-domains, performance/benchmark-contract]
---

`spawn` creates a native operating-system thread and returns a typed `Task<R>`; `join`
waits for completion and transfers the result. There is no persistent executor or work-stealing
pool in the current runtime, and no future or `await`.

**A task that cannot start is a panic.** When the operating system refuses a thread, `spawn` prints
`panic: could not start a task: <reason>` and exits with status 101. It used to run the task
inline, which deadlocks a producer that fills a channel before its consumer exists.

Task frames package the callable and arguments in a runtime-compatible form. Ownership passed to a
task must be transferred or proven to remain valid until a join. AIF's thread-affinity facts
distinguish contained spawn/join work from values that remain shared across thread boundaries.

## `Channel<T>` at source level

`Channel<T>` is the one runtime object with source-level syntax. Seven compiler builtins are in
the same category as a `Vec`'s `push` and indexing: semantic analysis owns their types, code
generation emits the existing C call by name, and there is no `std` module to import because there
is no wrapper to write. `Channel<T>` itself is a type the compiler builds in, as `Task<R>` is.

| Builtin | Returns | Behaviour |
| --- | --- | --- |
| `chan_new(capacity)` | `Channel<T>` | `T` comes from the annotation, as `list_new`'s does; a capacity below 1 is raised to 1 |
| `chan_send(c, v)` | `Int` | 1 when delivered; 0 when closed, and then `v` is neither delivered nor freed (a leak). **Moves `v`** |
| `chan_recv(c)` | `T?` | Blocks; `none` once the channel is closed *and* drained |
| `chan_share(c)` | `Channel<T>` | A second endpoint, not a second owner |
| `chan_close(c)` | `Void` | Wakes every blocked sender and receiver |
| `chan_len(c)` | `Int` | Messages queued |
| `chan_free(c)` | `Void` | After `chan_close`, after every `join` |

**`T` must be reference-shaped.** One `void*` travels per message, and the receive answers `T?`,
which is defined for references only. A `String`, a struct, or a `Vec` may be sent;
`Channel<Int>` is refused (`tests/neg_197_channel_of_int.psm`), so send a one-field struct.

### The four channel rules

These are also the four things that go wrong:

1. **A send moves.** The receiver takes the message out and owns it, so naming it again in the
   sender names memory another thread may already have freed. The move checker refuses it
   (`tests/neg_56_channel_send_moves.psm`).
2. **`chan_share` is the duplication, spelled out loud.** Every handle the language can name is
   affine, so `spawn worker(c)` *moves* the endpoint; share it to keep one. It hands back the same
   endpoint, and only the one `chan_new` returned is freed.
3. **A receive after close drains, then answers `none` for ever.** That is what ends a worker loop
   without a sentinel message.
4. **Destruction is close, then join, then free.** The join is the edge that makes the free safe,
   and the same edge that keeps element counts non-atomic.

```prismio
fn worker(jobs: Channel<Job>, results: Channel<Answer>) -> Int {
    let mut handled = 0
    loop {
        let taken = chan_recv(jobs)
        if (taken == none) { break }
        let job = expect(taken)
        chan_send(results, Answer { value: run(job) })
        handled = handled + 1
    }
    return handled
}
```

A send blocks while the channel is full, and a receive blocks until a message arrives or the
channel closes; that is the whole surface, and it is what keeps a worker pool alive across frames.
`aif/evidence/RESULTS-v01-channels.md` records the original measurement; the maintained
concurrency workload is `parallel_reduction` in `benchmarks/prismio/suite.psm`.

## Channels

`Channel<T>` is a compiler-supported typed blocking channel. The runtime uses a bounded ring with
mutex and condition-variable coordination. Send can block while full; receive blocks until a value
arrives or the channel closes. Channel ownership rules determine whether an element is copied,
moved, or shared.

The current implementation is a general synchronized channel, not a topology-specialized SPSC,
MPSC, or lock-free queue. User-facing atomics, mutex types, memory orderings, async functions, and
nonblocking I/O are not exposed.

Tests must cover successful transfer, close behavior, task results, moved arguments, join ordering,
and memory release. Concurrency failures require stress and sanitizer runs in addition to
deterministic unit cases.

## Task runtime

`prismio_task_spawn(fn, rkind, nargs, a0, a1, a2)` allocates a `PrismioTask`, records the erased
entry pointer, return-kind tag, and up to three lowered arguments, enables thread-safe memory mode,
and starts a Windows thread or POSIX pthread. `prismio_task_entry` marks worker-thread state,
calls `prismio_task_invoke`, stores the result, and performs thread-local memory cleanup.

The compiler generates task thunks when the ordinary function ABI cannot be called directly from
the erased runtime entry. `functionNeedsTaskThunk` currently checks string parameters/returns;
`taskThunkName` derives the symbol and `generateTaskThunk` packs or unpacks the runtime slots.

`prismio_task_await` joins exactly once and returns the task record. Typed join entry points then
select the result:

- `prismio_task_join` returns the integer form;
- `prismio_task_join_p` returns a pointer/owned aggregate handle;
- `prismio_task_join_v` waits for a void task; and
- `prismio_task_release` releases a task handle whose result lifecycle is complete.

Semantic helpers `semaSpawnArgAllowed` and `semaTaskResultAllowed` reject values the erased ABI
cannot preserve. AIF's `aif_con_spawn` distinguishes a task that is structurally joined from one
whose value may overlap the enclosing scope.

## Channel runtime

`chan_new(capacity)` allocates the queue, mutex, and condition variables. Capacity controls
bounded buffering; a capacity below 1 is raised to 1.

`chan_send` locks the channel, waits while the buffer is full, fails after close, enqueues one
erased message, signals a receiver, and unlocks. `chan_recv` waits while empty and open; after
close it drains queued messages before returning the closed/empty result. `chan_close` marks
closed and wakes both senders and receivers.

`chan_share` returns the same pointer rather than counting handles: the contract is that the
creator closes, joins every task it shared with, then frees, so a count would only add cost.
`chan_free` destroys the mutex, condition variables, and queue unconditionally, and assumes no
waiters remain; the join before it is what makes that true. `chan_len` reads the current queue
length under the lock.

The compiler's `Channel<T>` type preserves the element type even though C stores `void *`.
Scalar values are packed into pointer-width slots using the same scalar-bit rules as other erased
runtime boundaries; owned values transfer according to send/receive semantics.

Concurrency tests should include capacity one and larger buffers, blocked sender/receiver wakeups,
close while blocked, close after queued sends, multiple producers/consumers, task result ownership,
channel-handle sharing, cyclic payloads, and TSan runs. A deterministic unit case is necessary but
cannot replace repeated scheduling stress.
