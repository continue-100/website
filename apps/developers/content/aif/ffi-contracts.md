---
title: AIF foreign-function contracts
description: How extern declarations describe borrowed, consumed, produced, aliased, escaping and released foreign storage — and why a contract that "fixes" the tier can be wrong.
status: experimental
version: "0.1.0"
tags: [aif, ffi, ownership]
related: [cookbook/c-ffi, runtime/supported-surface, aif/tiers-and-analysis-domains]
lastUpdated: "2026-09-27"
---

Every allocation [AIF](/aif/overview) places — the Adaptive Inference Framework, the pass that
decides whether a value lives on the stack, in an arena, or on the heap — is a claim it can prove
by reading the function body. An `extern fn` has no body. Once a call crosses into C, the compiler
cannot see whether the callee kept the pointer, freed it, or handed back one of its own. It has to
be told, and the declaration is the only place to say it.

Get the contract wrong and nothing catches it at compile time. A wrong ordinary Prismio program
mis-tiers a value and only gets slower; a wrong FFI (foreign function interface) contract can free
memory that is still live, which is corruption, not a leak. That asymmetry is the reason this page
exists.

## See it work

`cli_arg`, the C function that used to sit behind command-line arguments, is declared with no
contract at all in this fixture:

```prismio
extern fn cli_arg(index: Int) -> String

fn tier_three() -> Int {
    let arg = cli_arg(1)
    return __builtin_string_len(arg)
}
```

```bash
prismio aif aif_tiers.psm --why=8
```

```text
Allocation 8
  Location   aif_tiers.psm:102:15
  Type       String
  Storage    heap (RC unavailable)
  Reason     multiple owners in one thread

Compiler evidence
  Symbol     tier_three__Void#0
  Tier       T3
  Thread     Isolated

  minimal cause
    A rose to Shared
      <- E-OPAQUE  aif_tiers.psm                        102:23

  placement
    heap  -- no arena serves this site
      because  the tier is not T1 -- see the cause above
      ...

  repairs, cheapest first
    1. declare the extern's return contract (FFI 5.2)           restores T2, no runtime cost
    2. pin(T2) on the binding                     rejected -- inference converged, so this is proven false
```

With no contract, AIF cannot rule out that `cli_arg` returns a value some other owner might also
hold, so it joins the alias fact to `Shared` and pays for reference counting — RC (reference
counting) here means the tag-and-count machinery `--verify` reports on, not a design choice the
program made. `--why` even proposes the fix: declare a return contract.

## The repair that would corrupt memory

Taking that suggestion literally is the trap. `cli_arg`'s C implementation, which
`runtime/program_support.c` carried until `std.process` began reading `argv` itself through
`extern let`, returned `prismio_argv[index]` directly — a pointer into the block the operating
system handed the process at startup. It allocated nothing. Declaring the tempting
`produce(free)` contract:

```prismio
extern fn cli_arg(index: Int) -> String produce(free)
```

```bash
prismio aif aif_tiers_fixed.psm --why=8
```

```text
Allocation 8
  Location   aif_tiers_fixed.psm:102:15
  Type       String
  Storage    arena:auto
  Reason     lifetime fits the region
  ...
  Tier       T1
```

does exactly what it was asked: the tier drops all the way to T1, an arena. It also compiles,
links, and produces no diagnostic — because nothing in AIF's model can see that `cli_arg` never
allocated in the first place. Ship this and the generated `free` call hands `argv` over to the
allocator, which is a corrupted-argument-vector bug, not a slower program. **`produce(free)` versus
`alias` is not a guess** — it has to match what the C side actually does, and the compiler cannot
check that for you.

The correct declaration is `alias`, which is what `std/process.psm` used while it still called the
function:

```prismio
extern fn cli_arg(index: Int) -> String alias
```

```bash
prismio aif aif_tiers_alias.psm
```

Declared this way, line 102 disappears from the site table entirely — with no argument for the
alias to point at, AIF resolves the return to "static, not allocated" and stops tracking it as a
site at all. That is cheaper than the T1 the wrong repair produced, and it is cheap because it is
true, not because a tier number went down.

| Declared as | Tier / result | Actually true of `cli_arg`? |
| --- | --- | --- |
| *(none)* | T3, heap, RC-managed | Safe (over-conservative), and slow |
| `produce(free)` | T1, arena — looks fixed | **No.** Frees a pointer into `argv` |
| `alias` | No site at all | Yes — matches what the C function did |

## A contract bug that used to reach production

`extern`-declared `alias` has its own failure mode, on the other side: claiming a value aliases an
argument when the compiler's escape analysis doesn't independently see that. `tests/extern_alias_escape.psm`
is the regression test for a real one, fixed 2026-08-30 (`aif/evidence/RESULTS-extern-alias-escape.md`):

```prismio
extern fn prismio_expect(p: String borrow) -> String alias

fn passthru() -> String {
    let t = make()
    let x = prismio_expect(t)
    return x
}
```

Before the fix, `t` was dropped at `passthru`'s own scope exit — the same allocation `x` now
aliased — because the escape check that decides whether a binding is safe to drop asked "might this
function's *own* body return one of its parameters?", which is a question about ordinary Prismio
functions and answers "no" for every extern, deliberately (widening it for *unknown* externs was
tried and leaked a `String` per integer printed through `std/io.psm`). The declared `alias` was
real information the check simply never consulted. The historical failure, from the committed
evidence file:

```text
aif-verify: release of a pointer that is not live (0x102b61e00)
aif-verify: 1 allocated, 1 released, 0 leaked, 1 violation(s)
```

`println` printed an empty line, because the string was already gone. The fix reads the declared
contract as well as the general escape check, and the regression test now passes with today's
compiler:

```bash
prismio run extern_alias_escape.psm --verify
```

```text
Built extern_alias_escape
hello world
aif-verify: 1 allocated, 1 released, 0 leaked, 0 violation(s)
aif-memory: 12 allocated bytes, 12 released bytes, 0 live bytes, 12 peak live bytes
aif-memory-sizes: <=16:1 <=32:0 <=64:0 <=128:0 <=256:0 <=512:0 <=1024:0 <=4096:0 >4096:0
aif-arena: 1 object(s), 16 byte(s), 1 region(s) on reporting thread
```

The lesson generalizes past this one bug: a declared contract is a fact the compiler will use, not
one it double-checks. Wrong in the unsafe direction (claiming ownership you don't relinquish, or
aliasing something that isn't) and the failure is silent until `--verify`, ASan, or production finds
it.

## A produced return is not arena memory

`produce(free)` says the caller owns a fresh block. It does not say *where the block came from*,
and until 2026-09-25 AIF assumed it could be anywhere a Prismio allocation could be — including an
arena. An enclosing region was allowed to "serve" the return of any `produce` extern except
`chan_recv`, and code generation bracketed the call with the arena hint.

Only one allocator reads that hint: `rt_alloc` in `runtime/lang_runtime.c`. Everything in
`runtime/program_support.c` — `read_file`, `join_path`, `proc_env_get`, the new `io_stdin_*` —
allocates through `rt_base_alloc`, and C an application brings calls `malloc`. For those, the
region freed nothing at its exit, and the site had been taken off the drop list because the region
was supposed to reclaim it: one leak per call, with no violation to flag it. The bracketed path, which
places a callee's sites in its caller's region, did not check at all.

Standard input found it. `for line in stdin.lines()` put a region around every iteration that
served nothing:

| `for line in stdin.lines()` | Ledger | 3M lines |
| --- | --- | --- |
| before | `6 allocated, 3 released, 3 leaked` | 277 ms |
| after | `6 allocated, 6 released, 0 leaked` | 134 ms |

**The rule now is a list of who allocates through the hint, and everything else is refused.**
`aifFfiArenaCannotServe(name)` in `src/aif/contracts.psm` is true for every extern not in
`aifFfiAllocatesThroughArenaHint`: the `__builtin_string_*` family, `str_concat`, `str_substring`,
`str_slice`, `str_with_capacity`, `str_clone`, `str_clone_n`, `str_own`, `str_from_double`,
`str_from_double_fixed`, `int_to_str`, `list_new`, `list_new_with_capacity`, `soa` and `aos`. When
it is true, the walk (`src/aif/walk.psm`) applies `aif_con_foreign` to the return's site. A
`foreign` site is refused by `arena_would_serve`, gets no frame slot (T0), and the bracket gate and
its cost model report it under the `no-stack` blocker, since the reason a reader needs is the same:
this site's storage is not this frame's.

The oracle mirrors it as `ffi_arena_cannot_serve` over `FFI_ALLOCATES_THROUGH_ARENA_HINT` in
`aif/prototype/aif.py`, and the suite's `oracle_vocabulary` check compares the two lists, so one
cannot drift from the other. Of 228 programs in `tests/` and `aif/corpus/`, only
`test_19_runtime_split` changed IR (its `join_path` went from 3 leaked to 2).

**If you add a producer:** a C function that returns a block from `rt_base_alloc` or `malloc` needs
nothing. One that allocates through `rt_alloc` goes on both lists, or it loses arena placement it
could have had.

## Writing a contract

A parameter is `borrow` (the default — the callee may read and write during the call but does not
retain the pointer), `consume` (the callee takes ownership and will free it; Prismio emits no free
and treats the value as moved), `retain` (the callee stores the pointer somewhere that outlives the
call, so the argument's escape and alias facts both rise permanently), or `bytes` (marshalling
only, not a fourth ownership state — see below). A return is `alias` (default — borrows existing or
static storage; the caller must not free it) or `produce(free_fn)` (fresh, caller-owned storage,
released by the named function). Do not infer a contract from the C type signature alone; read what
the implementation does.

```prismio
extern fn strlen(s: String borrow) -> Int
extern fn fopen(path: String borrow, mode: String borrow) -> File produce(fclose)
extern fn sqlite3_exec(db: Db borrow, sql: String borrow, cb: Callback, ctx: Ptr retain) -> Int
```

`src/aif/contracts.psm` holds the contracts already reviewed for shipped runtime functions.
Application-facing system APIs should normally be wrapped in `std.*`, where the contract is written
once rather than repeated at every call site. Raw `extern fn` remains appropriate for foreign code
an application or compiler component brings itself.

## Tests

Cover success and misuse: produced results released by the correct deallocator, aliases that must
not outlive their argument, consuming calls, arguments that may alias each other, and escaping
callbacks or task transfers. Use `--verify` where the runtime can observe the boundary (as above),
and keep value assertions and native sanitizer coverage for behavior the ledger cannot see —
`extern_alias_escape.psm`'s bug was a *use*-after-free of a still-linked page, which a leak-only
check would have missed.

## If you are changing this

### Contract resolution order

`aifFfiContract(name, index)` selects one parameter contract using this precedence:

1. `aifDeclaredContract` reads the annotation encoded from the source declaration;
2. `aifCompilerBuiltinContract` supplies semantics for compiler-recognized operations;
3. `aifRuntimeContract` supplies reviewed behavior for shipped runtime functions; and
4. the fallback is opaque/foreign and therefore conservative.

The distinction matters because a user declaration may intentionally describe an application
symbol with the same shape as a runtime function. Declared behavior wins; the runtime table is not
a name-based capability granted to arbitrary source.

| Query | What the walker needs |
| --- | --- |
| `aifCallIsSummarised(name, argc)` | Whether all relevant behavior is represented by a known summary |
| `aifFfiAliasOf(name)` | Which argument owns storage referenced by the return value |
| `aifFfiReadsElement(name)` | Which container argument has an element read/view relationship |
| `aifArgTypeAt(call, index)` | The fully resolved source type for element/container policy |
| `aifDeclaredReturnIsProduce(name)` | Whether the caller receives fresh owned storage |
| `aifDeclaredReturnIsAlias(name)` | Whether the result borrows existing storage |
| `aifFfiTransfersExisting(name)` | Whether ownership of an argument crosses the boundary |
| `aifFfiProduces(name)` | Whether the call creates a site/result that AIF must track |

`parseFfiContract` parses annotations and `semaCheckExternContracts` validates legal placement,
argument indices, deallocator names, and incompatible combinations. `aif_extern_contract_set`
stores the checked encoding for the native solver; `aif_extern_contract` retrieves it by function
and parameter.

### Constraint and ABI (application binary interface) effects

A borrowed parameter applies `aif_con_borrow` and does not transfer ownership. A consuming
parameter applies the call's transfer/escape behavior and prevents later source use. An aliasing
return calls `aif_vs_view_of` or connects the result to the selected argument's value set. A
produced return creates or exposes an allocation site and uses the declared deallocator in codegen.

An unsummarised foreign call applies `aif_con_foreign` or `aif_con_opaque` to reachable values, and a
produced return that `aifFfiArenaCannotServe` names is `foreign` too ([above](#a-produced-return-is-not-arena-memory)).
That can raise escape, alias, and thread facts because the compiler cannot inspect retention,
mutation, callbacks, or concurrency inside the callee.

`declareExternFunction` uses `ffiType`, not ordinary `storageType`. A Prismio fat string
becomes the NUL-terminated pointer half for C. `ir_call_arg_cstr` extracts that pointer and
records whether a temporary conversion must be released after the call.

### `bytes`, the contract that changes marshalling rather than ownership

`bytes` is `borrow` to the solver — `aifDeclaredContract` maps it to `AIF_FFI_BORROW` and the
lattice gains no fourth state. What it changes is codegen: the argument takes
`ir_call_arg_borrow("ptr", …)` instead of `ir_call_arg_cstr`, so a **view** crosses as its own
pointer rather than as a NUL-terminated copy that must be released afterwards. Sema restricts it
to `String` parameters, where a copy is the only thing there is to suppress.

Declare it for any C signature that carries an explicit length. A loop that advances through a
buffer takes a view of the remainder on every pass, and under `borrow` each pass materialises the
whole remainder — the reason `std/io.psm` could not express a `write` retry loop before this
contract existed.

**A view bound to a local escapes; one written into the call does not.** `aifFfiAliasOf` reports
`__builtin_string_view` as argument 0's storage on purpose, so the base cannot be released while a
view of it is live. The consequence is that `let rest = __builtin_string_view(text, …)` raises
`text`'s escape to Caller, and every caller's drop of the value it passed in is declined with it.
Building the view directly into the call argument keeps it Local. The symptom is a `--verify`
ledger imbalance rather than a diagnostic, and `aif --why` names the binding as an `E-BIND`.

Contract correctness is outside LLVM type checking. A declaration can verify and link while lying
about retention or deallocation. Test native behavior under ASan/TSan (AddressSanitizer/
ThreadSanitizer) where applicable, pair produced storage with its exact allocator family, and keep
wrappers narrow enough to audit.
