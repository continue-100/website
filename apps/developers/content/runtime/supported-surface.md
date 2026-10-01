---
title: Builtins, standard modules, and foreign code
description: "What a Prismio program can call, where each operation lives, who owns what it returns, and how contributors decide between compiler lowering, a standard module, and C."
status: stable
version: "0.1.0"
lastUpdated: "2026-09-26"
tags: [runtime, stdlib, ffi, ownership]
related: [runtime/overview, runtime/tasks-and-channels, aif/ffi-contracts, compiler/string-representation, cookbook/add-a-runtime-or-stdlib-api]
---

This page is the map of what a Prismio program can call, where each operation
lives, and who owns what it returns. A C signature states types and says nothing
about ownership, and ownership is what decides whether a call leaks, is safe, or
corrupts memory. The rule is:

> **Applications call `std.*`. `extern fn` is for foreign code an application
> brings itself, not for reaching into the Prismio runtime.**

Every runtime symbol an application has business calling is wrapped in a
standard module, and the wrapper is where its FFI contract is written down once.
This page describes compiler commit
[`0064491c6338`](https://github.com/prismio-lang/prismio/commit/0064491c63384d692b0a91b481cc9d37cee892d4).

## Choosing a layer

Choose the narrowest layer that can express an operation truthfully. There are
three, and the boundary is not "what was easiest".

### Compiler builtins: representation operations

Use a builtin when the operation exposes a representation invariant or must
lower directly to IR. Three string builtins are in this category:

| Builtin | Operation |
| --- | --- |
| `__builtin_string_len` | Read the carried byte count |
| `__builtin_string_byte_at` | Read one already-bounded byte |
| `__builtin_string_put_byte` | Write one already-bounded byte |

They have call-shaped source syntax but are not functions. The compiler owns
their types and borrowing effects and lowers them to `extractvalue`, GEP and
load, or GEP and store. They emit no LLVM declaration and require no linked
symbol.

Allocation is a different category. `str_with_capacity` remains a real runtime
call so the verifier and arena placement still observe it; code generation pairs
its returned pointer with the length the caller supplied.

A `String` does not always have a pointer. The 16-byte pair can hold up to twelve
bytes of text itself, as described in
[String representation](/compiler/string-representation). Three consequences
reach the runtime surface:

- `__builtin_string_len` masks the tag. The length is bits 0–30, so a `String` is
  bounded at 2 GiB rather than 4.
- Crossing into C keeps its shape but is no longer free: code generation
  materializes a NUL-terminated `char*` for a short string in a scratch slot in
  the caller's frame, so every entry point that takes `const char*` still gets
  one.
- A `Vec<String>` element and a struct field both hold the whole pair. A view is
  copied out when it enters a container; boxed one-word slots, used only by a
  list built without an element type, still copy a short string through
  `str_own`.

This follows the boundary production compilers use: compiler operations get a
reserved builtin identity, and ordinary stable APIs wrap them.
[Clang reserves `__builtin_*` operations](https://clang.llvm.org/docs/LanguageExtensions.html#builtin-functions),
and [Rust keeps compiler intrinsics internal](https://doc.rust-lang.org/unstable-book/language-features/intrinsics.html)
behind stable library interfaces.
[LLVM recommends synthesizing existing IR where possible](https://llvm.org/docs/ExtendingLLVM.html)
rather than extending LLVM. All three string operations already are ordinary
LLVM instructions, so a custom intrinsic would add machinery without adding
semantics.

Moving them from declarations to builtins was performance-neutral by
construction and by measurement. Nine interleaved runs of the preserved
pre-change binaries against the builtin binaries gave these medians:

| Workload | Before | Builtin | Change |
| --- | ---: | ---: | ---: |
| Rare-pair search | 148.557 ms | 148.447 ms | −0.07% |
| Dense-pair search | 47.826 ms | 47.663 ms | −0.34% |
| Long-needle search | 750.131 ms | 751.280 ms | +0.15% |
| Uppercase | 271.737 ms | 271.900 ms | +0.06% |
| Integer format | 38.177 ms | 37.792 ms | −1.01% |
| Concatenate | 206.069 ms | 208.256 ms | +1.06% |

The signs are mixed and the spread is ordinary run noise. More decisively, the
Mach-O `__TEXT` disassembly was byte-for-byte identical for all six pairs:
removing the fake declarations changed compiler semantics and IR hygiene, not
the generated instructions.

`str_equals`, `str_compare`, `str_concat`, `str_substring`, `str_char_at`, and
`str_from_char` still have C compatibility symbols, but `std.string` no longer
declares or calls them; their supported implementations are Prismio byte loops.
The IR for a program that imports the module contains neither calls to nor
declarations of those six names.

### Search accelerators

Substring search has three optional C accelerators:

- `str_find_byte` delegates a one-byte scan to libc.
- `str_find_byte_pair` compares two predictive needle bytes at 32 candidate
  starts per iteration with NEON or SSE2, and has a scalar fallback.
- `str_find_needle` is the whole search for a needle of 2–32 bytes. It picks the
  two rarest needle bytes, drives the same pair scan, verifies each candidate
  with `memcmp`, and answers "continue with Two-Way from here" when candidates
  turn dense.

That split is measured, not stylistic. With selection and verification in
`std/string.psm`, `string_search` paid six out-of-line rank calls per search and
one runtime crossing per candidate: 160 µs against C++'s 51 µs.
Crochemore–Perrin Two-Way and the long-needle prefilter policy stay in Prismio.

### C: operating-system capabilities

Use C for operating-system capabilities (opening a file, reading a directory,
spawning a process, asking for the working directory), the LLVM API,
architecture intrinsics Prismio cannot express, or a narrow stable adapter to an
external library. The language has no syscall layer and will not grow one for
these. Give every pointer-shaped parameter and result an explicit AIF ownership
contract.

### Prismio: everything else

Portable algorithms, formatting, collection algorithms, and ownership-safe
wrappers belong in a standard module. `str_trim`, `str_replace`, `str_contains`,
`str_starts_with`, `str_ends_with`, `str_index_of`, `str_to_int`, and `str_split`
were C functions that only composed the primitives. Being in C cost them twice:

- **They were outside the ownership analysis.** A C function is opaque, so the
  fact that `str_trim` allocates on every path had to be asserted in a table in
  `src/aif/contracts.psm`. For `str_replace`, `str_trim`, `str_clone`, and
  `str_split` it never was; see [Known limits](#known-limits).
- **They were outside the documentation**, because there was no Prismio
  declaration to document.

`tests/test_75_std_string.psm` is the native conformance test. It writes boundary
expectations directly, compares optimized substring search with a small,
independent O(n·m) Prismio reference, and declares no foreign string functions,
so it cannot pass by silently falling back to an older C implementation. When
recorded, its success path was ledger-clean: 562 allocations, 562 releases, no
leaks or violations.

## Standard modules

| Module | Covers |
| --- | --- |
| `std.io` | `print` / `println` overloads, several values in one call, and `eprint` / `eprintln` for stderr |
| `std.input` | Standard input: `stdin.lines()`, `stdin.readLine()`, `stdin.readAll()` |
| `std.time` | `Instant.now()` and `elapsed()` on the monotonic clock, `Duration`, `unixTime()`, `sleep(duration)` |
| `std.string` | Strings, characters, parsing, `StringBuilder`, **and the `String` operators** |
| `std.unicode` | Terminal width and grapheme clusters; separate so programs that never lay out a column do not carry its 17 KB of tables |
| `std.fs` | Files, paths, `readLines`, `listDirectory`, `appendFile`, `rename`, `removeDirectory`, `metadata` |
| `std.process` | Arguments, environment variables (`process.env`, `setEnv`, `removeEnv`), `process.pid`, subprocesses |
| `std.platform` | The target's operating system, architecture, and ABI environment, answered at compile time |
| `std.map` | `Map<K, V>`: `get`, `set`, `has`, `remove`, `clear`, `m[k]`, `length`, `values()`, `keyAt` / `valueAt` |
| `std.option` | `Option<T>`, `Result<T, E>`, and their `map`, `andThen`, `mapErr`, `unwrapOr`, `expect`, `okOr` family |
| `std.vec` | `Vec<T>`'s library methods (`get`, `contains`, `indexOf`, `lastIndexOf`, `countOf`, `min`, `max`, `find`, `indexWhere`, `fold`, `forEach`, `pop`, `removeAt`, `removeFirst`, `swapRemove`, `extend`, `retain`, `dedup`, `fill`, `reverse`, `clone`, `sort`, `sortBy`, `sorted`, `reversed`, `take`, `skip`, `concat`, `startsWith`, `endsWith`, `filter`, `binarySearch`), the same reads and in-place changes over an `Array<T, N>` (the length passed beside it, which the compiler supplies for a call) and over a `Slice<T>`, `toVec`, **the Vec literal** `[a, b, c]`, `Vec<T>.withCapacity(n)`, and `Vec<T>.filled(n, x)` (a scalar `T` needs no import; any other goes through `vecFilled`) |
| `std.math` | Float `sqrt`, rounding, `pow`, logarithms, trigonometry, IEEE constants; integer `pow`, `gcd`, `floorMod`, `isqrt`; each numeric type's `MAX` / `MIN`, lowered through the `__builtin_f64_*` family |
| `std.term` | Terminal colour and text styles as `String` methods, and `colorEnabled()` |
| `std.key`, `std.ord`, `std.copy`, `std.eq`, `std.display`, `std.iter`, `std.default` | The `Key`, `Ord`, `Copy`, `Eq`, `Display`, `Iterator`, and `Default` bounds, including `==` on a struct and `for … in` over a user type |

### There is no prelude

`std.io` is an ordinary import. A program that prints nothing carries no I/O,
which is what lets a target with no stdout link at all; see the comment above
`resolveImports` in `src/driver/imports.psm`.

The same applies to operators. `a == b`, `a + b`, `s[i]`, `s[a..<b]`, and
`for c in s` on a `String` are each rewritten during semantic analysis into the
`std.string` call they mean, so an operator is only as available as its module.
The diagnostic names the missing import, not the function the rewrite was about
to call.

### One call may carry several values

```prismio
print("Total: ", 5)                       // Total:  5
println("x", 1, true, 'c', 2.5)           // x 1 true c 2.5
println(1, 2, 3, separator(", "))         // 1, 2, 3
println()                                 // the line break on its own
```

There is no variadic function behind this and no new overload.
`semaSplitPrintStatement` in `src/sema/checker.psm` rewrites `print(a, b, c)`
into `print(a); print(" "); print(b); print(" "); print(c)`, so each value goes
through its exact-type overload, and the trailing `println` keeps its name so the
newline shares the last formatter's allocation. The rewrite fires only where no
program existed before, so a user declaration of that arity is called instead of
being split.

`separator(…)` is a marker, not a function: it is recognized as the last
argument of one of these calls and consumed there. It takes a string literal or
a name, because the rewrite writes it once per gap, and `separator(join(a, b))`
would allocate and free a `String` per gap. A program that declares its own
`separator` keeps it, and the marker turns itself off.

It is a rewrite rather than `fn print<A: Display, B: Display>(a: A, b: B)`
because that signature would make `std.io` import `std.display`, and through it
`std.string`. A hello-world reports 5 potential allocation sites today and 85
with that import, paid by every program that prints.

`eprint` and `eprintln` take the same types and split the same way. They exist so
a program whose stdout carries a *format* (`aif --manifest`, JSON diagnostics, a
pipe into another tool) can report status without corrupting it. The compiler's
host-routing banner uses them for exactly that reason: while it printed to
stdout, it broke the manifest's one guarantee, that its first line is
`aif-manifest 1`.

### Standard-module search order

`std.*` is compiler-owned rather than resolved relative to the importing
program's source root. `standardModulePath` in `src/driver/imports.psm` searches
in this order:

| # | Looked for | Why |
| ---: | --- | --- |
| 1 | `<entry-dir>/std/<name>.psm`, when `<entry-dir>` is a Prismio checkout | A compiler checkout compiles against **its own** `std/` |
| 2 | `std/<name>.psm` in each enclosing Prismio checkout, nearest first | The same, for an entry below the root such as `src/main.psm` |
| 3 | `<toolchain>/stdlib/<name>.plib` | An installed toolchain's compiled module artifacts |
| 4 | `<toolchain>/std/<name>.psm` | A build tree, where `build/gen2` sits beside `std/` |

**Rules 1 and 2 apply only in a Prismio checkout** -- a directory holding
`runtime/lang_runtime.c` beside its `std/`. That is load-bearing, because it makes
the compiler's own build use the tree being built rather than whatever is
installed. It used to be any directory: an application with a `std/io.psm` of its
own got that one file from itself and every other module from the install.

The same rules mean **a program inside a checkout never reads a `.plib`**, so a
defect only the installed path has is invisible to anything built there. Test it
from a directory with no `std/` above it. `prismio --version` prints the compiler
directory and the standard library that resolves from the current directory.

### The standard-module boundary

A standard module may wrap a runtime function, implement behaviour in Prismio, or
combine both. The module owns the public source types and semantics; the C symbol
is an internal ABI unless documented otherwise. When documenting availability,
verify all three layers:

1. a module or compiler builtin exposes the operation to source;
2. the runtime symbol exists for every claimed platform; and
3. the packaged runtime includes that symbol.

The presence of a C function alone does not make networking, JSON, regex,
atomics, mutexes, or async I/O supported. Conversely, tasks and channels are
language builtins backed by runtime symbols, not modules in `std.*`.

## Ownership at the runtime boundary

Everything in this section is enforced by `--verify`, which pairs each
allocation with its release at run time. Build with `--verify` and run the
binary; the ledger line is `N allocated, N released, N leaked, N violation(s)`.

**Read violations first.** A violation is a release of something that was never
live: a double free, or a free of memory the program does not own. A leak is
memory never released. Leaks cost bytes; violations corrupt.

### An owned result passed straight on

```prismio
println(text.trim())                                // released after println
let tail = optionOr(s.stripPrefix("Hello, "), "!")  // the Option lives to the block's end
```

An owned result passed straight into a parameter is released once the call
returns. Until 2026-09-25 it was not: a value nothing names was a value nothing
freed, and `strJoin(strSplit(s, ','), "-")` leaked its Vec.

Where the callee may hand back the argument, or a view of it, releasing after the
call would free what the result still points at. `optionOr` returns the `String`
*inside* the `Option` it was handed. That temporary is given a hidden binding
instead (`irHoistBorrowedTemporaries` in `src/ir/expr.psm`) and released with the
block, under the same guards as a `let`: if its view is returned, assigned
outward, or kept by a container, it is kept alive and leaks rather than being
freed under a live view. Two shapes are not given a binding and still leak:

- a temporary evaluated after another call in the same statement, which the
  binding would have to move ahead of that call; and
- a view kept past the block.

View provenance finds those views. A reference-shaped value read out of a
container (a `Vec` element, a struct field, a payload bound by a match arm) is
recorded as a *view* of that container, and `aif_fn_may_return_view_of_param` is
what code generation asks before releasing an argument-position temporary. A
scalar read is a copy and carries no view, so an `Option<Int>` is released
normally.

Both halves were once missing, and the result was a dangling read rather than a
leak: the temporary was freed between the call and the use of its result, and the
value came back empty. `--verify` reported
`4 allocated, 4 released, 0 leaked, 0 violation(s)`, because both releases were
ledger-legal, so a balanced ledger was not evidence.
`tests/test_92_field_view_provenance.psm` is the guard, and it asserts values
rather than the ledger for exactly that reason.

A chain of `+` is one call: `a + b + c` lowers to a single `a.concat(b, c)`, with
one allocation and no intermediate.

### A container's element is a view

```prismio
let name = names[i]               // a view of the Vec's string, not a second owner
names.clear()
println(name)                     // still readable: the removal parked it
```

On 2026-08-24, binding `list_get`'s result made the analysis treat it as
separately owned, and both the binding and the list released it: three
`release of a pointer that is not live` violations in `std/fs.psm`. View
provenance closed that. The binding is recorded as a view of `names`, releases
nothing, and keeps `names` alive. Re-measured on 2026-09-17 with a `String`
element and with a struct holding one, each bound and read:
`0 leaked, 0 violation(s)`.

**A removal cannot free what a view reads.** `pop`, `removeAt`, `truncate`, and
`clear` park a removed element that owns memory in the Vec's `grave`, and
`list_release` releases it with the Vec, exactly as it would have been released
had it stayed. Releasing at the removal where no view can be live is
[`docs/COLLECTIONS.md`](https://github.com/prismio-lang/prismio/blob/0064491c63384d692b0a91b481cc9d37cee892d4/docs/COLLECTIONS.md)
step 1e.

### Writing an extern contract

For foreign code of your own. An `extern fn` with no contract has unknown
provenance, which the analysis widens to `Shared`, and its result gets no owner.

| Contract | Means |
| --- | --- |
| `borrow` | The callee reads the argument and does not retain it |
| `bytes` | `borrow`, and the callee reads no terminator; `String` parameters only |
| `consume` | The callee takes ownership of the argument |
| `retain_in:k` | The callee stores the argument into argument *k*'s container |
| `produce(free)` | The return is a fresh allocation the caller must release |
| `alias` | The return is an existing value, **not** a fresh allocation |

`produce` versus `alias` is the distinction that bites. A C function returning a
pointer into memory it does not own (`cli_arg` was one, returning a slot of
`argv`) is `alias`; declaring it `produce(free)` hands that memory to the
deallocator.

`bytes` is the one contract about **marshalling rather than ownership**. A
`String` view has no terminator of its own, so under every other contract the
boundary hands the callee a NUL-terminated *copy* of a view. `bytes` says the
callee was given the count separately and never looks for a terminator, so the
string's own pointer crosses and no copy is made. The ownership half is exactly
`borrow`; AIF gains no fourth state. Declare it wherever a C function takes a
pointer *and* a length. `write` in `std/io.psm` is the case it was built for: a
retry loop advances by taking a view of what is left, and under `borrow` that
view would be copied in full on every iteration. Semantic analysis rejects it on
a non-`String` parameter (`P4110`), where there is no copy to suppress.

**A foreign global is `extern let`, and it takes no contract.** Reading one is a
load, not a call, so there is nothing for a contract to describe. Its type is
limited to ones nobody owns: an integer, `Float`, `Char`, or `Ptr` (`P4111`).
`mut` belongs to each declaration, so one module may read a symbol another
assigns, and the declarations must agree on the type. Visibility is
`extern fn`'s: private to the file unless marked.

**A view bound to a local escapes; one built into the call does not.**
`__builtin_string_view` aliases its argument's storage, deliberately, so the base
cannot be released while a view of it is live. `let rest = view(text, …)`
therefore raises `text`'s escape to `Caller`, and every caller's drop of what it
passed in is declined with it. Writing the view directly into the call argument
keeps it `Local`. `prismioStdIoWriteAll` carries a comment saying so; it cost a
suite-wide leak to find. See [AIF foreign-function contracts](/aif/ffi-contracts)
for how the solver reads each contract.

## What is still C, and why

Two runtime files are linked into every program: `runtime/lang_runtime.c` and
`runtime/program_support.c`. Everything else in `runtime/` is compiler-only.

### The console write is a builtin

`std/io.psm` writes to the descriptor itself, so the console write is the only
libc call a Prismio program reaches with no Prismio wrapper in front of it.
`tools/check_externs.py` allows `exit` by name; every other `extern fn` in `src/`,
`std/`, and `ums/` must resolve to a definition the repository ships.

It is a builtin rather than an `extern fn` because the symbol's name differs
across the three shipped platforms. POSIX has
`ssize_t write(int, const void*, size_t)`; the Windows CRT has
`int _write(int, const void*, unsigned int)` and exports no `write`, so the
extern spelling linked on macOS and Linux and left an undefined symbol in every
Windows program that printed. `__builtin_console_write` picks the name and both
word widths from the *target triple* in the backend, and the program still links
its C library's entry point directly, with no runtime shim.

The count and the result are `Int` on every target. That is not a narrowing: a
`String`'s length is an `i32`, so no console write can ask for more bytes than
one holds. Code generation widens the count to `size_t` for POSIX and narrows the
`ssize_t` back, and neither cast can lose a byte.

**`print` writes the whole string, and the loop that makes that true is Prismio
source.** `write` may take fewer bytes than asked for without an error: on a
descriptor with `O_NONBLOCK` set, a 4 MB print once delivered 65,536 bytes and
exited 0. `prismioStdIoWriteAll` resumes where it stopped and reissues on
`EINTR`; a descriptor that refuses outright ends the loop rather than spinning,
which is `write_all` semantics and not `poll`. A broken pipe never reaches it:
nothing ignores `SIGPIPE`, so the process dies of the signal as `cat` does.

### `errno` and target queries are builtins too

`__builtin_errno`, `__builtin_errno_intr`, and `__builtin_errno_again` exist
because `errno` is not a symbol on any modern platform but a dereference of a
per-thread location whose accessor libc names itself. Code generation picks
`__error`, `__errno_location`, or `_errno` from the target triple and emits the
call inline. The two constants are folded for the target, because they are C
macros with nowhere else to read them from: `EINTR` is 4 everywhere this
compiler targets, and `EAGAIN` is 35 on Darwin and the BSDs and 11 elsewhere.

`__builtin_target_os`, `__builtin_target_arch`, and `__builtin_target_env` use
the same mechanism with no C name behind them. Each lowers to a constant read off
the target triple (the codes are in `src/common/target.psm`), and `std.platform`
maps them onto its `Platform`, `Architecture`, and `Environment` enums. A
function that calls one is never taken from a `.plib`:
`shouldEmitFunctionFromSource` in `src/ir/module.psm` compiles it into each
program, so a program's IR answers for its own target. A `.plib` carries a code
section per packaged target, and a cross build for a target it was not packaged
for is refused rather than given the host's section.

### Console floats, colour, and float text

`prismio_rt_print_float` and `prismio_rt_println_float`, with their
`prismio_rt_eprint_float` and `prismio_rt_eprintln_float` twins, are what is left
of the console runtime. Each flushes before returning, which keeps a `printf` and
a console write to the same descriptor in order.

`prismio_rt_color_supported(fd)` in `runtime/program_support.c` is `std.term`'s
`colorEnabled()` and `stderrColorEnabled()`: 1 when the descriptor is a terminal,
`NO_COLOR` is unset or empty, and `TERM` is not `dumb`. It takes nothing that
points, so its declaration needs no contract. On Windows it also turns on
`ENABLE_VIRTUAL_TERMINAL_PROCESSING`, answering 0 if that cannot be set, so
asking before styling is what gets colour in a legacy console. The styling
itself is Prismio.

**Float text is C because its search is.** `prismio_format_double` writes the
shortest decimal that `strtod` reads back as the same double, with at most
`DBL_DIG` (fifteen) significant digits, found by asking for one digit and
widening until it matches or reaches fifteen. `str_from_double` is that text as a
`String` the caller owns. Every literal therefore prints as written and
`0.1 + 0.2` prints `0.3`; a value that needs sixteen or seventeen digits to
round-trip (`1.0 / 3.0`) prints fifteen. `strFromFloat`, `print(f)`, and
`Display for Float` all go through the one function, so none can disagree.
`str_double_valid` and `str_double_value` are the other direction, through
correctly rounded `strtod`.

### Wrapped symbols, and the supported API in front of each

| C symbol | Prismio | Contract |
| --- | --- | --- |
| `str_with_capacity` | Internal allocation seam for `std.string` | `produce(free)` |
| `str_own` | Code generation only: a `String` entering a boxed container slot or leaving through an `alias` return | — |
| `list_str_data` `list_str_word` `list_push_str` `list_set_str` | Code generation only: `Vec<String>` element access, where the element is the 16-byte pair | — |
| `list_capacity` `list_reserve` | Code generation only: `v.capacity`, `v.reserve(n)` | — |
| `list_insert` `list_insert_inline` `list_insert_inline_scalar` `list_insert_str` | Code generation only: `v.insert(i, x)`, one per push entry point; a bad index exits before the value is taken | — |
| `list_truncate` `list_remove_at` | Code generation only: `v.truncate(n)`, `v.clear()`; `pop` and `removeAt` in `std.vec`. The trailing `now` argument is `0` (park) everywhere today | — |
| `str_find_byte` `str_find_byte_pair` | Internal bounded-search accelerators | `borrow` |
| `str_find_needle` | Internal short-needle search behind `strIndexOfFrom` | `bytes` |
| `str_hash` | Code generation only: the half of `__builtin_string_hash` a pair cannot answer (a key past twelve bytes, a view, or a short string on the heap) | — |
| `read_file` `get_directory` `join_path` | `readFile` `directoryOf` `joinPath` | `produce(free)` |
| `current_directory` `executable_directory` | `currentDirectory` `executableDirectory` | `produce(free)` |
| `list_modules` | `listModules` → `Vec<String>` | `produce(free)` |
| `file_exists` `delete_file` | `fileExists` `deleteFile` | → `Bool` |
| `write_file` `make_directory` `directory_exists` | `writeFile` `makeDirectory` `directoryExists` | `borrow`; → `Bool` |
| `fs_list_begin` `fs_list_name` `fs_list_end` | `listDirectory` → `Vec<String>` | `borrow`; `fs_list_name` → `produce(free)`; one listing at a time per process |
| `fs_append_file` `fs_rename` `fs_remove_directory` | `appendFile` `rename` `removeDirectory` | `bytes` for the appended text; → `Bool` |
| `fs_metadata` | `metadata` → `Option<Metadata>` | `borrow`; `MetadataOut` written through its pointer |
| `fs_lines_open` `fs_lines_has_line` `fs_lines_take_line` `fs_lines_close` | `readLines` `tryReadLines` → `FileLines`, `FileLines.close` | An `Int` handle (slot and generation; −1 when the file cannot be opened); the reader closes itself at end of file; `fs_lines_take_line` → `produce(free)` |
| `proc_spawn_begin` `proc_spawn_arg` `proc_spawn_run` | `Process.spawn`, `Process.run` | `borrow`; `SpawnOut` written through its pointer |
| `proc_exec` | `Process.exec` | Returns only on failure, then −1 |
| `proc_wait` `proc_kill` | `Child.wait` `Child.kill` | → `Int` |
| `proc_read_all` | `Stream.readAll` | `produce(free)` |
| `proc_write` `proc_close` | `Stream.write` `Stream.close` | `bytes`; → `Int` |
| `proc_env_has` `proc_env_get` | `process.env` | `borrow`; `proc_env_get` → `produce(free)`, `""` for unset (never a literal) |
| `proc_env_set` `proc_env_remove` `proc_pid` | `process.setEnv` `removeEnv` `pid` | `borrow`; → `Int` |
| `time_monotonic_nanos` `time_unix_nanos` `time_sleep_nanos` | `Instant.now()` `unixTime()` `sleep` | → `I64` nanoseconds; POSIX `clock_gettime` / `nanosleep`, Windows `QueryPerformanceCounter` / `GetSystemTimePreciseAsFileTime` / `Sleep` |
| `io_stdin_has_line` `io_stdin_take_line` `io_stdin_read_all` | `stdin.lines()` `stdin.readLine()` `stdin.readAll()` | The last two → `produce(free)`, `""` at end of input (never a literal) |

The `Int` returns are normalized because the raw conventions disagree:
`file_exists` returns 1 for yes, while `delete_file` returns **0** for success.
Two adjacent functions in which 0 means opposite things belong behind a wrapper.

`prismio_executable_directory` and `host_is_windows` also live in
`program_support.c`, for compiler-process use rather than behind a standard
module.

**The argument vector crosses one element at a time.** No `Vec<T>` crosses the
FFI boundary, and joining argv with a separator is wrong because an argument may
contain any byte. `Process.spawn` calls `proc_spawn_begin`, then `proc_spawn_arg`
per argument, then `proc_spawn_run`, the shape `ir_call_begin` / `ir_call_arg`
has in `src/ir/bridge.psm`, with the same limit of one spawn under construction
at a time. The three stream modes are a wire protocol (`0` inherit, `1` pipe,
`2` discard), spelled once each in `std/process.psm` and
`runtime/program_support.c`.

**One line reader serves standard input and files.** `LineReader` in `program_support.c` is a
buffer over one descriptor: `io_stdin_*` use a single one for descriptor 0, and `fs_lines_*` one per
open file. A line is found with `memchr` in memory and copied out, and the descriptor is read 64 KiB
at a time, so a line costs no system call; the buffer grows to fit a longer line rather than split
it. Two calls, `has_line` then `take_line`, because the iterator protocol asks "is there another?"
and "give it to me" separately and an owned `String` has no null to mean "end". The buffer is
internal and plain `malloc`; only the line copies cross into Prismio, from `rt_base_alloc`. It is
unlocked, like `getc_unlocked`: one reader at a time. `Stream { descriptor: 0 }.readAll()` reads the
descriptor directly and skips whatever the stdin buffer already holds.

**A file reader's handle is an `Int` naming a slot and a generation.** Prismio has no destructor to
hang a close on, so `readLines` closes the file when its reader reaches the end, and the slot is
reused by the next `readLines`. An iterator asked again after its end must not read that next file,
so the handle carries the generation it was opened in (`FS_LINES_SLOT_BITS` of slot, the rest
generation) and a stale handle answers "no more lines". `-1` means the file could not be opened,
which `tryReadLines` turns into `None`. `test_194_file_lines.psm` reads 200 files in turn and
checks that an ended reader does not see the file reopened in its slot.

**A producer in `program_support.c` is not arena memory.** Everything there
allocates through `rt_base_alloc`, and only `lang_runtime.c`'s `rt_alloc` reads
the arena hint. AIF therefore refuses an arena to every extern return except the
runtime's own string producers (`aifFfiArenaCannotServe` in
`src/aif/contracts.psm`). A new producer that allocates through `rt_alloc`
belongs on that list and on the oracle's; one that does not needs nothing.

**`SpawnOut` is a Prismio struct that C reads**, which nothing else on this
surface is. Every field is `I64`, so no padding question arises, and it keeps
declaration order because it is a standard-library type (`aif_layout_fix`). A
program's own struct handed to C that reads its fields has no such guard.

### Command-line arguments are not a runtime function

`cli_arg_count` and `cli_arg` are gone. Generated code defines `prismio_argc` and
`prismio_argv` and fills them in `main`'s prologue; `std/process.psm` names both
with a private `extern let` and reads one `argv` slot with
`__builtin_cstring_at`, which AIF treats as static storage. `process.args[i]`
still returns a copy, for the reason `alias` exists: the bytes belong to the C
runtime.

### Superseded and deleted

**Superseded, still linked:** `execute_command` and `command_quote_arg`, a command
line handed to `system` and the quoting every caller had to apply to make that
safe. `std.process`'s `runCommand` and `quoteArg` were deleted with the
subprocess API; use `Process`, which takes an argument vector and involves no
shell. The compiler's own `ums` shell steps still declare both, in
`src/project/ums_cli.psm`.

`str_char_at`, `str_equals`, `str_compare`, `str_concat`, `str_substring`,
`str_from_char`, `str_trim`, `str_replace`, `str_contains`, `str_starts_with`,
`str_ends_with`, `str_index_of`, `str_to_int`, `int_to_str`, `str_clone`,
`str_split`, and `str_split_free` are superseded by `std.string`. `str_split` in
particular returned a `StringArray*`, a struct with no Prismio type whose two
allocations had to be released through `str_split_free`, which the ownership
analysis knew nothing about. `strSplit` returns a `Vec<String>`, an owned
container the analysis already understands.

**Deleted:** `prismio_rt_print`, `prismio_rt_println`, `prismio_rt_eprint`,
`prismio_rt_eprintln`, and the `print` / `println` / `print_int` / `println_int` /
`print_bool` / `println_bool` / `print_char` / `println_char` family underneath
them. `std.io` reaches the descriptor itself, so nothing declared them any more,
and a program that declared one by hand now fails to link naming the symbol.
`benchmarks/prismio/common.psm` was the one in-tree case: it prints without
importing `std.io` on purpose, and now declares the console write the same way
`std/io.psm` does.

### Not user-facing

Emitted by code generation, not called from source: `rc_*`, `cyc_*`, `arena_*`,
`list_set_elem_*`, `list_push_inline` and the other inline-element entry points,
`rt_profile_*`, `aif_verify_*`, `heap_reset`, and `prismio_expect`.

Compiler-internal, for the self-hosted frontend only: `ptr_to_node`,
`node_to_ptr`, `ptr_to_token`, `token_to_ptr`, `ptr_to_type`, `type_to_ptr`, and
everything in `ir_symbols.c`, `aif_support.c`, `diagnostics.c`, `build_driver.c`,
and `llvm-api-backend.c`.

Reached through syntax: the `prismio_task_*` family, through `spawn` and `join`,
and the `chan_*` family (with `chan_send_copy`/`chan_recv_copy` for plain-data
messages), through `Channel<T>`'s methods — a program may not name them. See
[Native tasks and typed channels](/runtime/tasks-and-channels).

## Where the string surface's performance comes from

Measured on 2026-08-24 against **pure C and pure Rust programs**, not Prismio
calling C. Each program timed its own loop and mutated an input to defeat
hoisting, and the harness rejected variants whose checksums disagreed. These are
historical results, the best of three interleaved runs; the maintained
`string_search` and `tokenization` workloads now run through
`python3 benchmarks/run.py`.

| Workload | C | Rust std | Rust `memchr` 2.8.3 | Prismio |
| --- | ---: | ---: | ---: | ---: |
| Search, selective 4-byte miss | 2.979 s | 1.854 s | 0.149 s | **0.148 s** |
| Search, dense false candidates | 0.410 s | 0.053 s | 0.107 s | **0.048 s** |
| Search, selective 40-byte miss | 2.837 s | 2.143 s | 0.808 s | **0.740 s** |
| Uppercase | 0.270 s | 0.399 s | — | **0.269 s** |
| Integer → string | 0.042 s | 0.039 s | — | **0.038 s** |
| Concatenate 20 KB + 20 KB | **0.200 s** | **0.200 s** | — | 0.201 s |

**Search is a hybrid, because no one algorithm wins every distribution.** Needles
of 2–32 bytes use two predictive bytes as a packed-pair SIMD filter. Dense false
candidates switch after four attempts to a native Two-Way loop; long needles use
the same pair scan as a prefilter around Two-Way and assess it in 50-skip
windows, disabling it below eight skipped bytes on average. The vector loop
checks 32 starts at a time and uses a narrowed NEON movemask rather than
extracting 16 lanes. All three cases reach parity with or slightly beat the best
Rust arm while keeping Two-Way's linear bound.

**Integer formatting is at parity with Rust and 2.2× faster than C's `sprintf`.**
A two-digit table and a comparison-based digit count each moved it by under 2%.
The win was removing a *second allocation*: `strFromInt` called
`strFromUnsigned` and then `str_concat(digits, "")` only so the result would be
the function's own allocation. Writing the sign into the digits' buffer took it
from 0.078 s to 0.038 s.

**Uppercase ties C.** `strToUpper` was already vectorized, 64 bytes per
iteration. Making `String` a `{ptr, len}` pair and lowering
`__builtin_string_len` as a field read removed the repeated `strlen`, taking the
workload from 0.520 s to 0.271 s.

**Native concat reuses both lengths.** The corrected cross-language benchmark
reads one byte from each half of the result and puts all three languages within
4%; an older checksum observed only the first half, so C and Rust could delete
the second copy. Native `String.concat` allocates once and fills from lengths the
values already carry.

Two changes came first, from a starting point 30× slower than C:

- **Byte access is a compiler builtin.** `__builtin_string_byte_at` and
  `__builtin_string_put_byte` lower to a GEP plus a load or store rather than a
  call. User programs do not link with LTO, so the old externs cost a call per
  byte: 1.85 s → 0.56 s on search alone.
- **Checked character access is native too.** `String.charAt` tests the carried
  length and performs the same byte load as `strByteAt`, so both are O(1). Inner
  loops still use the unchecked form after establishing one shared bound.

## Known limits

**Use the unchecked builtins only with an established bound.** `strLength`,
`String.charAt`, and `strByteAt` are O(1), and the first two are safe. The byte
read and write builtins deliberately omit an upper-bound check, so native
builders use them only inside loops bounded by a carried `String` length.

**`str_replace`, `str_clone`, `str_trim`, and `str_split` are absent from the
contract tables.** They allocate on every path and appear in neither
`aifFfiProduces` (`src/aif/contracts.psm`) nor `FFI_RETURNS_PRODUCE`
(`aif/prototype/aif.py`). Nothing in `std.*` calls them, so no supported path is
affected, but a hand-written `extern fn` for one still leaks unless it carries
`produce(free)`. `run_oracle_vocabulary_test` cannot catch this class: it compares
the two tables against each other, and both omit the same four names. It should
also be compared against the C.

**The old recursion ceiling is gone.** `strToUpper`, `strToLower`, `strReverse`,
`strRepeat`, `strPadStart`, and `strJoin` used to recurse once per character,
because a loop that reassigned a `String` leaked one allocation per iteration.
That cost n allocations, copied O(n²) bytes, and overflowed the stack at 200,000
characters. `str_with_capacity` and the write builtin replaced the recursion with
one allocation filled in a single pass: 5,000,000 characters now succeeds, and a
13-call program dropped from 58 allocations to 29.

## Failure and ownership conventions

File and process helpers return status values or owned strings according to
their exact declaration. Any returned allocation needs a `produce` contract and a
matching free function, and borrowed input paths must not be retained. Functions
that terminate, such as bounds or DataView failure helpers or
`prismio_overflow_trap`, must be declared non-returning in the backend when LLVM
relies on that control-flow fact.

To add supported surface, implement the runtime path on Windows and POSIX, add
the standard-module or builtin declaration, specify ownership and errors, expose
no repository-only paths, test a packaged compiler, and update the unsupported
catalog when the capability unlocks benchmarks.
[Add a runtime or standard-library API](/cookbook/add-a-runtime-or-stdlib-api)
walks through it.
