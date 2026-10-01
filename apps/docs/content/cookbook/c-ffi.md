---
title: Wrap a C function
description: Create a narrow Prismio 0.1 module around a C ABI function and state its ownership contract.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [cookbook, c, ffi, ownership]
related: [guides/calling-c, guides/ffi, language/ffi, specification/behavior]
---

Put raw declarations in one source file, match C-compatible types, and state pointer ownership.

Suppose a C-compatible library exports a byte-length function that reads but does not retain the passed runtime-compatible string. Declare that contract at the boundary:

```prismio
extern fn c_strlen(text: String borrow) -> Usize

fn string_byte_length(text: String) -> Usize {
    return c_strlen(text)
}
```

## Why the wrapper exists

The wrapper's ordinary `String` parameter borrows from its Prismio caller. The external `borrow` contract promises that C does not store or free that string. The return is a copyable unsigned size.

The wrapper gives application code a Prismio-named operation and keeps the raw foreign symbol in one place. It is also the place to validate ranges, translate return codes, or adapt a representation.

## Verify the real ABI

Before using the declaration, confirm:

- the symbol uses C-compatible linkage and exact spelling;
- the parameter representation truly accepts the Prismio runtime string passed here;
- the function does not retain, mutate, or release the argument;
- the return width matches `Usize` on the selected target; and
- the linked library uses the same target ABI.

If any representation detail differs, write a C adapter with a narrow stable signature instead of guessing in Prismio source.

## Link and test

The symbol still has to be present at link time. Name it in `build.ums`: `native { source("c/lib.c") }` compiles a C file of your own into the program, and `link { library("name") }` links a library that is already built. [Calling C from Prismio](/guides/calling-c) shows a complete project. A mismatched signature or false ownership contract is outside compiler safety guarantees.

Emit `.ll` first if you need to separate front-end acceptance from native link configuration. Then test empty strings, ordinary content, large lengths, repeated calls, and every supported target.

## Owned foreign results

When a C function returns newly allocated storage, use the supported `produce(free_fn)` return contract and name the matching deallocator. Use `alias` only when the result borrows storage owned elsewhere. Never pair a produced pointer with an unrelated allocator's free function.

The exact declaration must follow the compiler's FFI contract grammar. Keep produced/aliased pointer handling inside the wrapper because raw `Ptr` values do not carry an automatically verified pointee lifetime.

## What this recipe does not promise

It does not provide automatic header parsing, C++ name mangling, variadic calls, stable struct layout, C++ sources, dynamic-library targets, or a cross-version Prismio ABI. Those capabilities are not hidden behind `extern fn`.
