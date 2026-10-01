---
title: Native tasks and typed channels
description: The runtime model behind spawn, join, Task results, blocking Channel operations, ownership transfer, and current concurrency limits.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
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

`Channel<T>` is the one runtime object with source-level syntax, and its surface is methods.
`src/sema/channel.psm` lowers each one onto a runtime entry point in semantic analysis, the way
`src/sema/vec.psm` lowers a `Vec`'s `push`: there is no `std` wrapper, because a wrapper would be
wrong twice. A parameter is a borrow, so a Prismio `send` could not move the message; and a generic
wrapper is one template body for every `T`, so the plain-data rename below — made per call site
— would leak from a `Channel<Msg>` into the body a `Channel<String>` shares.

| Source | Lowered to | Returns | Behaviour |
| --- | --- | --- | --- |
| `Channel<T>(capacity)` | `chan_new(capacity)` | `Channel<T>` | `T` from the type arguments or the binding's annotation; below 1 is raised to 1 |
| `c.send(v)` | `chan_send(c, v) != 0` | `Bool` | `false` when closed. Moves `v`, unless plain data; a refused moved `v` is released |
| `c.receive()` | `chan_recv(c)` | `T?` | Blocks; `none` once closed *and* drained |
| `for msg in c` | a `loop` over `c.receive()` | | Ends at `none`; the body block, and so its label, is the user's |
| `c.share()` | `chan_share(c)` | `Channel<T>` | A second endpoint, not a second owner |
| `c.close()` | `chan_close(c)` | `Void` | Wakes every blocked sender and receiver |
| `c.length` | `chan_len(c)` | `Int` | A property: `c.length()` is an error |
| `c.free()` | `chan_free(c)` | `Void` | After `close()`, after every `join` |

**The runtime names are refused in source.** The callee identifier the lowering builds carries a
mark (`IDENTIFIER_EXPR.i3 == 3`, `semaChannelLowered`), and `semaCheckBuiltinCall` rejects an
unmarked `chan_*` call with the method it means (`tests/neg_233_channel_runtime_names.psm`).

**`T` must be reference-shaped**, because the receive answers `T?`, which is defined for references
only. `Channel<Int>` is refused (`tests/neg_197_channel_of_int.psm`); send a one-field struct, which
costs nothing because it is plain data.

### Plain-data channels

`semaChannelCopies` (`src/sema/builtins.psm`) is true when `T` is a non-generic struct whose every
field resolves to `INT`, `FLOAT`, `BOOL` or `CHAR`. There is no user `Drop`, so such a message owns
nothing and a byte copy is the whole of moving it. On such a channel semantic analysis renames the
call to a second pair of entry points, and **does not consume** the sent value:

| Entry point | C signature | Contract |
| --- | --- | --- |
| `chan_send_copy` | `int (void* c, const void* src, int size)` | both arguments `borrow`; 1 delivered, 0 closed |
| `chan_recv_copy` | `int (void* c, void* dst, int size)` | `borrow`; 1 copied a message into `dst`, 0 closed and drained |

Code generation (`src/ir/expr.psm`):

- **Send** takes the generic call path and appends `ir_struct_size(T)` as an `i32`. The message is
  typically a T0 struct literal in the sender's frame.
- **Receive** (`generateChannelRecvCopy`) calls into a hoisted stack slot, then branches on the
  status. `chan_recv_copy` is an AIF produce site of type `T` (`aifSiteType` strips the `?`), and
  since the frame supplies the storage it is **not** `foreign`
  (`aifFfiAllocatesThroughArenaHint`), so it is placed like a struct literal:
  T0 is the slot itself; any other tier copies the slot into `allocPlacedStruct` storage
  (region arena, `rc_alloc`, `cyc_alloc` or the heap). `none` is null, and every tier's release is
  null-safe.
- A value kept across iterations, or pushed into a `Vec`, is not T0, so it is copied out before the
  next receive reuses the slot. `tests/test_232_channel_copies.psm` checks both, and the
  `channel_copies` harness test reads the IR for each placement and runs `--verify`.

**Hot/cold splitting is vetoed** for a copied message type (`aifLayoutVetoDataViews` in
`src/aif/layout.psm`): a split record carries a link to its cold block, and a byte copy to another
thread would give that block two owners. `ir_copy_struct` refuses a split struct as a backstop.

Measured on channel_pipeline's three stages (5M messages, 21 alternating runs, Apple Silicon):
median 1.025 s boxed, **0.646 s** copied, 0.688 s for the C++ program, and the `--verify` ledger
went from 2,000,001 allocations per 1M messages to 1. `aif/evidence/RESULTS-typed-channels.md` has
the method, the dead ends (spin-then-park, mutex policy) and the numbers.

### A refused message, and the pointer path's ledger

A pointer-path send moves its message into the call, and a closed channel answers 0 without
keeping it, so the message had no owner: it leaked, one per refused send. Code generation now
branches on the status and releases it (`generateUndeliveredRelease` in `src/ir/expr.psm`) with
`valueDropKind` (`src/ir/types.psm`) — the same function that picks the release for a received
`T?`. That agreement is the soundness argument: a refused message is released exactly as the
receiver would have released it. A struct goes through its generated release (its fields with it),
a `Vec` through `list_release`, a `String`'s buffer through the plain deallocator.

Three more things on this path were wrong, and are fixed with it
(`tests/test_235_channel_owned_messages.psm`, 160 / 160 / 0 under `--verify`):

- **A short `String` crossed as a stack address.** A consumed `String` argument went through the
  NUL-terminated scratch every foreign call gets, and for an inline or view String that is one
  stack slot, released after the call. Ten short Strings arrived as the last one, and each receive
  freed a stack address. A consumed String now crosses as `scalarToSlot`'s owned buffer, which is
  what storing one into a `Vec` already did.
- **A received `Vec` leaked its elements.** `bindingDropKind` read `Vec<Int>?` as a pointer and freed
  the header only.
- **A send stopped unrelated Strings being released.** `chan_send`'s `consume` contract marked the
  message's site `transferred` ("the callee frees it"), which is false for a channel, and a site is
  shared: every `concat` result comes from one in `std`, so sending one String turned off the
  release of every String stored in a struct field anywhere in the program. `chan_send` keeps
  `no_stack` and the escape to Caller, and no longer marks the site.

Still open, both leaks rather than unsafe frees, and neither specific to channels: AIF keys a local
by function and name, so `let v` sent and a later `for v in c` received in one function share a key
and the received value is not released; and a string literal stored into a struct field anywhere
turns that field's release off for every value of the type.

### The four channel rules

These are also the four things that go wrong:

1. **A send moves a message that owns something.** The receiver takes it out and owns it, so
   naming it again in the sender names memory another thread may already have freed. The move
   checker refuses it (`tests/neg_56_channel_send_moves.psm`, whose message owns a `String`). A
   plain-data message is copied and stays the sender's.
2. **`share()` is the duplication, spelled out loud.** Every handle the language can name is
   affine, so `spawn worker(c)` *moves* the endpoint; share it to keep one. It hands back the same
   endpoint, and only the one `Channel<T>(n)` made is freed.
3. **A receive after close drains, then answers `none` for ever.** That is what ends a worker loop,
   and `for msg in c`, without a sentinel message.
4. **Destruction is close, then join, then free.** The join is the edge that makes the free safe,
   and the same edge that keeps element counts non-atomic.

```prismio
fn worker(jobs: Channel<Job>, results: Channel<Answer>) -> Int {
    let mut handled = 0
    for job in jobs {
        results.send(Answer { value: run(job) })
        handled = handled + 1
    }
    return handled
}
```

A send blocks while the channel is full, and a receive blocks until a message arrives or the
channel closes; that is the whole surface, and it is what keeps a worker pool alive across frames.
`aif/evidence/RESULTS-v01-channels.md` records the original measurement; the maintained
concurrency workloads are `parallel_reduction` and `channel_pipeline` in
`benchmarks/prismio/`.

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

The compiler's `Channel<T>` type preserves the element type even though C stores `void *`. A
pointer channel moves one owned value per slot. A plain-data channel uses `chan_send_copy` and
`chan_recv_copy` instead, over `bytes` — a ring of `cap` messages of `elem_size` bytes that sits
beside `slots`, allocated lazily by whichever copy call runs first and freed by `chan_free`. A
channel is one kind or the other for its whole life (the element type decides), so the two rings
share `head` and `len`, and the wrap is a compare rather than a `%`.

Things tried on this ring and measured as no gain: counting waiters to skip signals, a lock-free
SPSC ring, and spinning before parking (at best 3% with 1024 relax iterations; 40-60% slower past
that, or with `sched_yield`). macOS mutexes are first-fit by default since 10.14, so the lock policy
is not a lever either.

Concurrency tests should include capacity one and larger buffers, blocked sender/receiver wakeups,
close while blocked, close after queued sends, multiple producers/consumers, task result ownership,
channel-handle sharing, cyclic payloads, and TSan runs. A deterministic unit case is necessary but
cannot replace repeated scheduling stress.
