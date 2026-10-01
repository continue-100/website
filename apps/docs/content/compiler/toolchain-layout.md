---
title: Toolchain layout
description: What an installed Prismio toolchain contains, why a compiler is a directory rather than a file, and how to read a missing-module error.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [installation, packaging, runtime, stdlib]
related: [start/installation, compiler/overview, compiler/bootstrap, stdlib]
---

A Prismio compiler is a **layout, not a file**. The executable resolves everything else relative to its own location, so the pieces have to travel together.

```text
<prefix>/
  bin/prismio                     the compiler
  lib/runtime/*.bc                LLVM bitcode merged into every program
  lib/runtime.hash                which sources those modules came from
  stdlib/*.plib                   what `import std.*` resolves to
  bin/LLVM-C.dll                  Windows only
```

There is no hardcoded installation prefix and no environment variable to set. Move, rename or copy the whole directory and it keeps working; take `bin/prismio` out on its own and it can no longer build anything.

## Where LLVM is

LLVM is inside the compiler, not next to it. On macOS and Linux, `bin/prismio` links the pinned LLVM 23.1.1 statically. It optimizes a program and generates its machine code in the same process, so the prefix needs no LLVM installed on the machine, and a `brew upgrade` or distribution update cannot change what it builds. Windows is the exception: the compiler loads LLVM from `LLVM-C.dll` in its own `bin/` directory.

The one outside tool a build runs is the system's linker, and only for the last step: linking the finished object with the platform's C library. On macOS and Linux that is `cc`. On Windows it is Visual Studio's `link.exe`, found through `vswhere` together with the newest Windows SDK, so no developer prompt is needed. A cross build uses `clang`, because the driver has to accept `--target`. That is the same arrangement `rustc` uses. Set `PRISMIO_CC` to choose a different driver.

## Why the runtime is bitcode

Everything a Prismio program needs at run time — strings, lists, maps, allocation, tasks — is implemented in C and shipped as LLVM bitcode, one module per runtime translation unit, rather than as an object archive.

The reason is optimization. The driver merges that bitcode into your program's own IR **before** the optimizer runs, so LLVM sees runtime function bodies while inlining, global optimization and dead-code elimination happen. An archive would be linked afterwards, opaque, and every call across the boundary would stay a call.

Two consequences are worth knowing:

- **Your executable does not contain the whole runtime.** After the merge, runtime definitions nothing reaches are deleted. A program that never touches a map does not carry the map implementation.
- **There is no fallback.** When an installed artifact is missing or unreadable, the build stops with an error that names the file. It does not quietly compile the runtime from source, which would produce a working but slower program and no indication of why.

## Why the standard library is `.plib`

Each standard-library module installs as one compiled artifact — `stdlib/map.plib` for `std.map`. A PLIB holds two things: the module's **interface**, which the frontend still parses, and its compiled **bitcode**, which joins the same merge as the runtime.

The interface is still source text because generics have to be instantiated against your concrete types — `Map<String, Int>` in your program cannot be pre-compiled in the library. Non-generic definitions come from the bitcode.

The directory is flattened: `std.map` lives at `stdlib/map.plib`, with no `std/` component on disk. Never derive a module's logical name from its path.

## Inside a checkout, sources win

If you are working in a Prismio checkout, `import std.string` resolves to `std/string.psm` — the source — because imports search upward from your entry file before consulting the installed toolchain. A local standard-library edit therefore takes effect on your next build with no packaging step.

Outside a checkout there is nothing to find, and the same import resolves to `stdlib/string.plib`. Both paths produce the same program; only the discovery differs.

## Reading a missing-module error

```text
ERROR: Prismio installation is incomplete or corrupted.
       Missing runtime module: lib/runtime/lang_runtime.bc
       Reinstall Prismio and try again.
```

The message names the exact file the compiler looked for, relative to the prefix. In practice it means one of three things:

- **The binary was copied out of its prefix.** Point at the original, or copy the whole directory.
- **The toolchain was never assembled.** A binary straight out of `tools/bootstrap.sh` is a compiler that can build compilers and nothing else. Run `tools/package.py` — see [Installation](/start/installation).
- **The build names a target that was not packaged.** Cross builds look under `lib/runtime/<triple>/`, and a prefix only carries the targets it was packaged for.

`prismio --version` prints the compiler and standard-library directories it resolved, which distinguishes "wrong prefix" from "incomplete prefix" immediately.
