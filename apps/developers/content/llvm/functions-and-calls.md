---
title: Functions and calls
description: Declaration staging, symbol selection, parameter attributes, direct and indirect calls, task thunks, vtables, and temporary ownership.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [llvm, functions, calls]
related: [llvm/types-and-abi, compiler/traits-impls-and-dispatch, runtime/tasks-and-channels, compiler/closures-and-captures]
---

## What this lowering does

A Prismio function can be overloaded, generic, a method, a trait implementation, or a compiler-
generated release function, and every one of those needs its own distinct LLVM symbol — you cannot
link two functions named `describe` no matter how obvious the source makes their difference. Calling
one is its own small protocol: LLVM needs the complete argument list and the exact function type up
front, ownership needs to know which arguments are borrowed versus consumed, and foreign functions
declared with `extern fn` need an agreed C **ABI** (Application Binary Interface — the calling
convention and data layout two compiled pieces of code must agree on) rather than Prismio's own. `functionSymbolName`
returns the resolved symbol stored on the AST when one exists, and falls back to the written name
only for unspecialized declarations.

## See it work

Two overloads of `describe`, a call to the standard-library `println`, and an `extern fn`
declaration in one program:

<!-- prismio-check: pass -->
```prismio
import std.io

fn describe(x: Int) -> String {
    return "an Int"
}

fn describe(x: String) -> String {
    return x
}

extern fn exit(status: Int)

fn main() -> Int {
    println(describe(5))
    println(describe("already text"))
    return 0
}
```

```bash
prismio build overload.psm -o overload.ll
```

```text
Wrote LLVM IR: overload.ll
```

Three things to read off the output:

```llvm
declare void @exit(i32)

define %prismio.str @describe__Int(i32 %0) {
entry:
  %x.0 = alloca i32, align 4
  store i32 %0, ptr %x.0, align 4
  ret %prismio.str { ptr @.str.s0, i64 6 }
}
```

```llvm
define i32 @main(i32 %0, ptr %1) {
entry:
  store i32 %0, ptr @prismio_argc, align 4
  store ptr %1, ptr @prismio_argv, align 8
  %2 = call %prismio.str @describe__Int(i32 5)
  call void @println__String(%prismio.str %2)
  %3 = call %prismio.str @describe__String(%prismio.str { ptr @.str.s1, i64 12 })
  call void @println__String(%prismio.str %3)
  ret i32 0
}
```

`describe__Int` and `describe__String` are two distinct symbols for one source name — the mangled
overload names `functionSymbolName` produces. `x.0` is the entry-block `alloca` every parameter
gets, filled by the `store` right after it, matching the general shape [the backend overview]
(/llvm/overview) shows for any binding. `exit`, declared with `extern fn` and never given a
Prismio body, becomes a plain `declare` with C's `i32` in place of Prismio's `Int` — no fat-pointer
pair, because `Int` already is `i32` on both sides of that boundary. Calling `println(describe(5))`
lowers to what it looks like: evaluate the argument, then call — `println__String` is `std.io`'s
own compiled function, not a compiler builtin, reached the same way `describe` is.

## What failure looks like

Compiler builtins — operations like reading a string's carried length that the compiler itself
lowers — are not a namespace `extern fn` can enter:

```prismio
extern fn __builtin_string_len(value: String) -> Int

fn main() -> Int {
    return __builtin_string_len("abc")
}
```

```bash
prismio build reserved.psm -o reserved.ll
```

```text
error[P4001]: `__builtin_string_len` is reserved for a compiler builtin and cannot be declared
 --> reserved.psm:4:11
  |
4 | extern fn __builtin_string_len(value: String) -> Int
  |           ^^^^^^^^^^^^^^^^^^^^
error: aborting due to 1 previous error
```

The same rule is why [the runtime overview](/runtime/overview) separates compiler builtins,
`std.*` modules, and `extern fn`: an `extern fn` is for foreign code an application brings itself,
never a second way to spell a builtin or to reach into the Prismio runtime directly.

A related, easier mistake: a fall-through function body. Only a `void`-returning function gets an
automatic `ret void` when control reaches its closing brace. Anything declared to return a value —
`main` included — must return on every path, checked before code generation runs at all:

```text
error[P4001]: function `main` must return Int on every path, but control can reach its closing brace
 --> fallthrough.psm:3:4
  |
3 | fn main() -> Int {
  |    ^^^^
error: aborting due to 1 previous error
```

## A worked example: getting an extern's ownership contract wrong

`extern fn` declarations state an ownership contract because the compiler cannot infer one from C:
`produce(free_fn)` for a fresh, owned return the caller must release, `alias` for a return that is
some existing value handed back, `borrow` for a parameter the callee only reads. Getting this wrong
does not fail to compile — it corrupts memory. `produce` versus `alias` is the distinction that
bites; see [writing an extern contract](/runtime/supported-surface#writing-an-extern-contract).

`tests/extern_alias_escape.psm` is a real, fixed instance. `prismio_expect`, declared
`extern fn prismio_expect(p: String borrow) -> String alias`, hands back the same string it was
given rather than a fresh one:

```prismio
extern fn prismio_expect(p: String borrow) -> String alias

fn passthru() -> String {
    let t = make()
    let x = prismio_expect(t)
    return x
}
```

Until 2026-08-30, `irValueAliasesName` in `src/ir/expr.psm` refused to widen alias tracking through
*any* call whose return might alias a parameter — including a declared `extern ... alias` — because
doing so for an unknown symbol leaked memory elsewhere. That blanket caution was wrong here: `t` was
released at `passthru`'s scope exit while `x`, the very same pointer, was on its way back to the
caller. The fix reads the declared contract instead of guessing about it: a written `alias` is a
stated fact about *one* function, not evidence about symbols in general. Verified with the
instrumented runtime:

```bash
prismio run extern_alias_escape.psm --verify
```

```text
aif-verify: 2 allocated, 2 released, 0 leaked, 0 violation(s)
```

Before the fix this reported a violation — `release of a pointer that is not live` — and `println`
printed an empty line because the string was already gone. Nothing about the *source* changed
between the two states; only whether codegen trusted the declared contract.

## If you are changing function or call lowering

### Definitions

`generateFunction` performs this sequence:

1. Determine the emitted symbol, declared return key, and whether the function is source `main`.
2. Call `ir_function_begin(name, returnType)`.
3. Add parameters through `ir_function_param` or `ir_function_param_unique`.
4. Call `ir_function_body_start` to create the `LLVMValueRef` and entry block.
5. Allocate one entry-block slot per source parameter and store the incoming `%p_name` value.
6. Register variable type/debug information and, in a function that contains a loop, cache each
   `String` parameter's data pointer. A loop-free function does not: the cache is three stores to
   a scratch slot, and inlined into a caller's byte loop -- `strByteAt` is one line -- they landed
   inside that loop between lifetime markers LICM will not hoist past, and the loop stayed
   scalar. Summing `s.byteAt(i)` over 1 MB fifty times went from 18.8 ms to 0.58 ms without it.
7. Emit the body through `generateBlock`.
8. If control can still reach the closing brace, emit `ret void` for a `void` function, or
   `ret <type> 0` otherwise. In practice the non-`void` branch is a defensive fallback: semantic
   analysis's control-flow check (`P4001`, `src/sema/checker.psm`) already rejects any non-`void`
   function, including `main`, whose body does not return on every path — see the failure example
   above. Only a `void` function actually falls through to its automatic return in a build that
   reaches codegen.
9. Close debug state and call `ir_function_end`.

On the C side, `ir_function_begin` records a pending return `LLVMTypeRef`.
`ir_function_param` converts and appends each parameter type. `materialize_function` creates
`LLVMFunctionType`, calls `LLVMAddFunction`, applies collected attributes, and names the
parameters. `ir_function_body_start` appends the entry block with
`LLVMAppendBasicBlockInContext` and positions the builder at the entry block.

`ir_function_param_unique` records that a pointer parameter is uniquely reachable for this
call. `apply_param_attrs` uses `LLVMCreateEnumAttribute` and `LLVMAddAttributeAtIndex` to
attach the supported aliasing/capture facts. Those attributes are proof obligations: applying
`noalias` to a borrowed or shared value can miscompile otherwise valid code.

### Declarations and foreign symbols

External declarations use a parallel staging API:

- `ir_declare_function_begin` starts the return/signature record;
- `ir_declare_function_param` appends ABI-level parameter keys;
- `ir_declare_function_fresh` marks a constructor-like pointer result as fresh; and
- `ir_declare_function_end` materializes the declaration.

`declareExternFunction` chooses `ffiType` for each parameter and return. String arguments
therefore become C pointers, while ordinary Prismio functions receive the fat pair. A
`produce(free_fn)` contract may justify a fresh return; an aliasing return must not be marked
fresh merely because its type is a pointer — see the worked example above for what happens when
that distinction is lost in the other direction.

`generateExternStub` emits a diagnostic stub for runtime functions unavailable on the selected
platform. `irRuntimeProvides` is the allowlist that distinguishes compiler-known runtime symbols
from arbitrary external declarations.

### Direct call builder

Calls are accumulated because LLVM requires the complete argument array and exact function type:

| Bridge call | Backend action |
| --- | --- |
| `ir_call_begin()` | Push an empty `CallFrame` |
| `ir_call_arg(type, value)` | Resolve and coerce an owned/value argument |
| `ir_call_arg_borrow(type, value)` | Record a non-capturing borrowed argument and its call-site attributes |
| `ir_call_arg_cstr(value, isBorrow)` | Extract a NUL-terminated pointer from a fat string and record whether a temporary must be released |
| `ir_call_end(retType, symbol)` | Find or synthesize the declaration, emit `LLVMBuildCall2`, apply attributes, release call temporaries, and return a value handle |

`ir_call_end` first tries `LLVMGetNamedFunction`. If an undeclared runtime helper is permitted,
it synthesizes a signature from the resolved argument `LLVMTypeOf` values and the requested
return key. The final call uses `LLVMBuildCall2`; void calls return no usable result handle.
`apply_borrow_attrs` adds call-site rather than declaration-wide facts when ownership differs by
call.

`str_cstr_for_call` extracts the data member of `{ ptr, len }` (the layout behind `String`, in
full `%prismio.str = type { ptr, i64 }`). A string expression that materializes owned temporary
storage is remembered in the call frame. `release_call_temps`
runs after the call so a borrowed C pointer stays live for the entire foreign invocation but not
for the surrounding scope.

### Owned temporary arguments

`irArgumentIsOwnedTemporary` and `irOwnedTemporaryKind` classify arguments such as freshly
concatenated strings or constructed aggregates. `generateOwnedTemporaryRelease` emits the
matching `str_release`, list/data-view release, generated typed release, RC (reference-counting)
release, or cycle release after the callee has consumed or borrowed the value according to its
contract.

This is separate from lexical scope drops. A temporary has no user binding to appear in the scope
table, but it still has exactly one lifetime end. Moving this logic into a generic "release every
call result" rule would free aliases and borrowed views.

### Indirect calls and trait objects

`ir_func_addr` converts an `LLVMValueRef` function into an opaque pointer. Vtables are emitted
with `ir_vtable_declare`, `ir_vtable_begin`, repeated `ir_vtable_entry`, and
`ir_vtable_end`; the backend builds a constant pointer array through `LLVMConstArray2` and
`LLVMAddGlobal`. `ir_vtable_addr` obtains the table address, and `ir_ptr_slot` addresses a
method entry.

`generateDynMake` packages the data pointer and vtable pointer. `generateDynCall` selects the
slot, loads the function pointer, pushes the receiver and explicit arguments into a call frame,
and finishes with `ir_call_end_indirect`. That backend function constructs the exact
`LLVMFunctionType` from the runtime argument values and emits `LLVMBuildCall2` against the
loaded callee.

**Closures are lowered separately** and are out of scope here: [closures and captures]
(/compiler/closures-and-captures) covers how a closure becomes a generated type and call function
before it ever reaches this page's machinery.

### Task thunks and inlining

`functionNeedsTaskThunk` detects signatures whose string ABI differs from the runtime's generic
task entry. `generateTaskThunk` adapts the runtime payload to the real function, including
packing or unpacking string values. `taskThunkName` appends a stable `__task` suffix.

`markSingleLoopCallsiteFunctions` counts direct call sites and loop-local calls. A non-recursive
function with one total call site and one call in a loop can be marked by
`ir_function_always_inline`. `LLVMAddAttributeAtIndex` applies the attribute only outside
debug builds. This is a measured, bounded policy — not a blanket instruction to inline every small
function.

Tests for call changes must cover overload/specialization symbol choice, direct and indirect
calls, void and aggregate returns, borrowed and owned strings, extern contracts (both directions —
a wrongly-fresh alias and a wrongly-aliased fresh return), task thunks, recursive exclusion from
inlining, LLVM verification, and native linkage.
