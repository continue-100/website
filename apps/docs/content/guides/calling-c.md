---
title: Calling C from Prismio
description: Compile your own C into a Prismio program with a native block in build.ums, call it through extern fn, and see when the object cache rebuilds it.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [guide, ffi, c, native, build, ums]
related: [guides/ffi, language/ffi, package-manager, cookbook/c-ffi, compiler/cli]
---

Some of the code you need is already written in C: a checksum, a codec, a driver for a device. You can rewrite it, or you can let Prismio's build compile it and link it into your program. This guide does the second. You write three things: the C, an `extern fn` declaration that tells Prismio what the C function looks like, and a `native` block in `build.ums` that names the C file. The build does the rest, and rebuilds the C only when something it depends on changed.

The `extern fn` half is about ownership: who frees what, and what may be borrowed. That has its own page, [call C with ownership contracts](/guides/ffi). This one is about getting the C built and linked.

## See it work: a checksum in C, called from Prismio

The project has five files:

```text
checksum/
├── build.ums
├── flags.rsp
├── src/main.psm
└── c/
    ├── checksum.c
    └── include/checksum.h
```

The C is an Adler-32 checksum. It reads exactly `length` bytes and keeps nothing, which is what lets the declaration below promise `bytes`.

```c
// c/include/checksum.h
#ifndef CHECKSUM_H
#define CHECKSUM_H

#include <stddef.h>
#include <stdint.h>

// Adler-32 of `length` bytes. Reads exactly `length` bytes and keeps nothing.
uint32_t checksum_adler32(const unsigned char *data, size_t length);

#endif
```

```c
// c/checksum.c
#include "checksum.h"

#ifndef CHECKSUM_MOD
#error "CHECKSUM_MOD is defined by flags.rsp"
#endif

uint32_t checksum_adler32(const unsigned char *data, size_t length) {
    uint32_t a = 1, b = 0;
    for (size_t i = 0; i < length; i++) {
        a = (a + data[i]) % CHECKSUM_MOD;
        b = (b + a) % CHECKSUM_MOD;
    }
    return (b << 16) | a;
}
```

`flags.rsp` is a **response file**: compiler flags, one per line, that a manifest can point at instead of spelling them out.

```text
-Wall
-Wextra
-DCHECKSUM_MOD=65521
```

The manifest names the C source, the header directory and the response file:

```ums
project {
    name = "checksum"
    version = "0.1.0"
    prismio = "0.1"
}

targets {
    executable("checksum") {
        entry = "src/main.psm"
        native {
            source("c/checksum.c")
            include("c/include")
            responseFile("flags.rsp")
        }
    }
}
```

And the Prismio side declares the C function and calls it:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

extern fn checksum_adler32(data: String bytes, length: Usize) -> U32

fn main() -> Int {
    let text = "Wikipedia"
    let sum = checksum_adler32(text, text.length as Usize)
    println(sum)
    return 0
}
```

```bash
prismio run
```

```text
Built ./.prismio/build/debug/checksum
300286872
```

`300286872` is `0x11E60398`, the published Adler-32 of `Wikipedia`, so the C really ran.

## What each line does

| You wrote | What the build does with it |
|---|---|
| `source("c/checksum.c")` | compiles the file with the toolchain's `clang` and links the object into the executable. Paths are relative to `build.ums`, not to where you ran `prismio` |
| `include("c/include")` | adds `-Ic/include`, so `#include "checksum.h"` finds the header |
| `responseFile("flags.rsp")` | passes `@flags.rsp` to the compiler. The file's contents count as part of the flags, so editing it recompiles the C |
| `extern fn checksum_adler32(...)` | declares the symbol. Prismio checks its side of every call against this signature and cannot check the C side |

The declaration is where the C header becomes Prismio types. `const unsigned char *` plus a `size_t` count is a pointer and a length, so the first parameter is `String bytes`: the string's own bytes cross the boundary, and no NUL-terminated copy is made. That is right only because the C function takes an explicit length. `size_t` is `Usize` and `uint32_t` is `U32`. `text.length` is an `Int`, so it is cast to `Usize`. [Foreign function declarations](/language/ffi) has the full type table and every contract.

Each `native` call takes one or more strings, in order: `source("a.c", "b.c")` and two `source` lines are the same. Order matters for flags and for the objects on the link line, so it is kept. The other calls are `define("NAME=1")` for `-D`, `flag("-Wall")` for anything else, and `include`. Every source must be a C file: the driver compiles C and links no C++ runtime.

Native sources are compiled at `-O2` in both profiles. `debug` adds `-g`. Your own `flag` and `responseFile` entries come after, so a later `-O` option in them wins.

## When it goes wrong

Every message below is real output from the project above with one thing changed.

**The manifest names something the build can check without compiling.** These are found before any C starts, with the manifest line and column:

```text
build.ums:11:20: error[UMS2324]: native source 'c/checksum.cpp' is not a C file (.c)
build.ums:12:21: error[UMS2325]: native include directory does not exist: c/inc
build.ums:13:26: error[UMS2326]: native responseFile does not exist: flag.rsp
```

**The C does not compile.** clang's own diagnostics come through, then the build stops:

```text
c/checksum.c:9:25: error: expected ';' after return statement
    9 |     return (b << 16) | a
      |                         ^
      |                         ;
1 error generated.
error[P1011]: the native build step failed (llc/clang); see the output above
```

**Prismio calls a symbol nothing provides.** Delete the `native` block and build again. The declaration is accepted, because Prismio never looks at your C, and the linker is the one to report the missing symbol:

```text
Undefined symbols for architecture arm64:
  "_checksum_adler32", referenced from:
      _main in .prismio-checksum-program-53126.obj
ld: symbol(s) not found for architecture arm64
clang: error: linker command failed with exit code 1 (use -v to see invocation)
error[P1011]: the native build step failed (llc/clang); see the output above
```

An undefined symbol means the object never made it into the link, or the name is spelled differently in the C and in the `extern fn`. A C++ function has a mangled name Prismio cannot spell, so it has to be reached through an `extern "C"` wrapper.

**A flag the C needs is missing.** Remove the `-DCHECKSUM_MOD` line from `flags.rsp` and clang reports the `#error` and every use of the undefined name. Nothing in Prismio is involved; the flags file is simply part of what the C is compiled with.

## What is rebuilt, and when

Compiling C on every build would be the slow part of a small project, so each compiled object is kept in a cache and reused when nothing it was built from has changed. It is keyed by the content of the files, not their timestamps, so a fresh checkout or a copied directory still hits.

To watch it, set `PRISMIO_OBJ_CACHE_TRACE=1`. It prints one line per native source, saying whether the object came from the cache:

```bash
prismio clean
PRISMIO_OBJ_CACHE_TRACE=1 prismio build
```

```text
[objcache miss] checksum
```

Run the same two commands again and the object is reused, even though `clean` removed the build directory:

```text
[objcache hit] checksum
```

What makes the next build a miss, checked against the project above:

| Change | Result |
|---|---|
| nothing | `hit`, even after `prismio clean` |
| the bytes of `checksum.c`, including whitespace | `miss` |
| a header the C includes, such as `checksum.h` | `miss` |
| `flags.rsp`, or any `flag`, `define` or `include` in the manifest | `miss` |
| building the other profile, since the debug profile adds `-g` | `miss` once, then `hit` for each profile |

A header is not named anywhere in the manifest, so the build asks clang which headers it read while compiling, records each one with a hash of its contents, and checks them on every hit. That is how editing `checksum.h` invalidates the compiled `checksum.c` without you listing the header anywhere.

The cache lives in `prismio-objcache` under your temporary directory and is shared by every project on the machine. `PRISMIO_OBJ_CACHE_DIR` moves it, and `PRISMIO_OBJ_CACHE=0` bypasses it for one build.

**What the key does not see is the compiler itself.** Upgrading `clang` in place leaves the source, the flags and the headers unchanged, so an object from the old compiler is reused. After upgrading the toolchain, build once with `PRISMIO_OBJ_CACHE=0`, or delete the cache directory.

## Link a library you did not write

If the C is already built, or is a system library, skip `native` and use `link`:

```ums
targets {
    executable("app") {
        entry = "src/main.psm"
        link {
            library("z")
            search("vendor/lib")
            file("vendor/lib/libextra.a")
        }
    }
}
```

`library("z")` passes `-lz`, `search` is a `-L` directory, `file` is an exact object or archive, `framework("Security")` names a macOS framework and is ignored elsewhere, and `link { responseFile("link.rsp") }` passes linker arguments from a file. A response file is the way to use what another tool computed, such as the output of `pkg-config --libs`, without writing one machine's paths into a manifest you check in. `native` and `link` can be used together in one target. The [package manager page](/package-manager#c-code-and-native-libraries) lists every call.

## Programs that carry their own runtime

Two target properties go with native code. `runtime = "none"` leaves out the Prismio runtime the toolchain installs, for a program whose C provides every runtime function itself. `exportDynamic = true` makes the executable's own symbols visible to code it loads while running. Most programs need neither. The Prismio compiler uses both: its `build.ums` lists its own C runtime and LLVM backend as `native` sources.

## Not available yet

| You may look for | Today |
|---|---|
| C++ sources in `native` | Coming soon. A `.cpp` file is rejected with `UMS2324`; write an `extern "C"` wrapper and build it into a library you `link` |
| Bindings generated from a C header | Coming soon. Every `extern fn` is written by hand from the header |
| A package that ships its own C, or a native library fetched by name | Coming soon. There is no registry, so the C and the library have to be in your project or on your system |
| Importing Prismio modules from a path dependency | Coming soon. A declared dependency is recorded in `prismio.lock` but is not yet on the import search path |
| Building a static or shared library from Prismio | Coming soon. A `library(...)` target is validated, and emitting the artifact is not implemented yet |
| Variadic C functions such as `printf` | Not supported by `extern fn` |

## If you are changing how native code is built

The driver side is `compile_native_sources` and the cache in `runtime/build_driver.c`; the manifest side is `lowerNative` in `ums/model/lowering.psm` and the file checks in `validation.psm`. The developer documentation covers [the build manifest](https://developers.prismio.org/tooling/build-manifest) and [runtime platforms and packaging](https://developers.prismio.org/runtime/platform-and-packaging).
