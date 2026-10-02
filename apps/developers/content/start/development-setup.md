---
title: Development environment
description: Prepare a Prismio compiler checkout with its pinned LLVM, platform tools, Python, and a known compiler generation.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [setup, llvm, toolchain]
related: [compiler/bootstrap, start/local-compiler-loop, tooling/debugging-targets-and-build-tracing]
---

Compiler development requires the checkout's pinned LLVM, a C toolchain, Python for the test harness, and either an
installed Prismio compiler or the committed bootstrap seed. Run setup commands from the compiler
repository root: the bootstrap scripts resolve `src`, `runtime`, `bootstrap`, and
`third_party/llvm-paths.json` relative to that checkout.

## Required tools

- The pinned LLVM, which `tools/setup_llvm.py` downloads into `third_party/llvm`. Do not install one.
- A platform linker and SDK appropriate for the host: Xcode Command Line Tools on macOS, `cc` and
  the C library development files on Linux, Visual Studio's C++ tools on Windows.
- Python 3.9 or newer for tests, packaging, and support scripts.
- Git and ordinary shell tooling.

**The LLVM a compiler is built against belongs to the checkout, not to the machine.**
`tools/setup_llvm.py` downloads LLVM 23.1.1, checks the archive against a SHA-256 recorded in the
script, and prepares it under `third_party/llvm`. It does not look at Homebrew, apt or
`llvm-config`. The download resumes after a stall or a dropped connection, and running the script
again once setup has finished does nothing.

The official macOS and Linux archives ship no shared LLVM library, and their static archives are
ThinLTO bitcode. Setup therefore lowers the members the compiler uses to native objects once, which
takes about 75 s on ten cores, and writes `third_party/llvm/link.rsp` naming them. Every compiler
link after that is an ordinary static link with the system linker, so a compiler binary loads no
LLVM at run time and a `brew upgrade llvm` cannot break it. On Windows, the archive's `LLVM-C.lib`
is linked and `LLVM-C.dll` is copied beside the compiler.

`--check` reports without changing the checkout; `--force` re-downloads and re-prepares;
`--keep-all` keeps LLVM tools the build never runs, which setup normally prunes; and
`--llvm-dir DIR` adopts an existing install. An adopted install is linked dynamically and is not
pinned, so use it only as a deliberate opt-in. `PRISMIO_LLVM_DIR` does the same for a single
command.

```bash
python3 tools/setup_llvm.py --check
python3 tools/setup_llvm.py
```

The pinned `third_party/llvm/bin/clang` is still used, but only to compile the runtime's C to bitcode
during bootstrap and packaging, because that bitcode has to come from the same LLVM that reads it.
Programs are optimized and emitted in process, and the object is linked by the system's `cc`. See
[Runtime platforms and packaging](/runtime/platform-and-packaging).

## Choose the compiler explicitly

The test runner honors `PRISMIO` before `PATH`. Point it at the generation you intend to test:

```bash
PRISMIO=$PWD/.prismio/build/debug/prismio python3 tests/test_runner.py
```

If no installed compiler is available, build the first generation from the committed IR seed, then
build two self-hosted generations:

```bash
tools/bootstrap.sh --seed --out build/gen0
tools/bootstrap.sh --compiler build/gen0 --out build/gen1
tools/bootstrap.sh --compiler build/gen1 --out build/gen2
```

Windows uses `tools/bootstrap.ps1` with `-Seed` or `-Compiler` and `-Out`. Once a compiler exists, `build.ums` declares the repository's own commands: `prismio build`, `prismio suite`, `prismio verify`, `prismio gate` and `prismio release` (see [how a release is cut](/releases)). The compiler links three LLVM backends, AArch64, X86 and WebAssembly; they are listed in `runtime/prismio_llvm.h` and `tools/setup_llvm.py`, and `tools/check_source_lists.py` fails if the two disagree. The committed seed has to stay current with `src/` (`tools/refresh_seed.sh`), because CI only checks that it can still parse it. The shell and PowerShell
scripts compile the LLVM bridge and runtime support, consume the same source inventory, use a
content-keyed object cache, link into a temporary path, and install the completed compiler
atomically. `PRISMIO_LLVM_DIR` overrides recorded LLVM discovery. `PRISMIO_OBJ_CACHE=0` disables
the cache when investigating it.

For fixed-point work, use a named generation such as `build/gen2`. For the normal repository loop,
use `prismio build`; `build.ums` routes project commands to `.prismio/build/debug/prismio` once the
local host exists and this machine has promoted it. A copied binary is not run (`P1077`); see
[the local compiler loop](/start/local-compiler-loop#make-a-particular-generation-the-host).

## Validate the setup

```bash
build/gen2 --version
python3 tools/package.py --compiler build/gen2 --out build/dist
PRISMIO=$PWD/build/dist/bin/prismio python3 tests/test_runner.py --list
PRISMIO=$PWD/build/dist/bin/prismio python3 tests/test_runner.py test_92_field_view_provenance
```

A bare generation can build compilers but not ordinary programs, because a program links the runtime as
installed bitcode beside the executable, so the tests run against the packaged compiler.

`--version` prints Prismio, loaded LLVM, compiler executable, and the resolved standard-library
directory. Treat an unexpected compiler or `(none found)` stdlib as a setup error before debugging
the language change.

## Platform notes

On macOS, Apple's `cc` and the SDK from the Command Line Tools link programs, and LLVM comes only
from `third_party/llvm`. On Linux, the distribution's `cc` and C library development package are
all the system has to provide. On Windows, use the repository PowerShell bootstrap and packaging
paths rather than translating shell commands by hand.

On macOS, debug builds can produce a `.dSYM`; on Windows, keep MSVC target and SDK selection
consistent. Cross-target compilation also
needs the target SDK via `--sysroot` and a matching `runtime-<triple>` package. LLVM target support
alone does not provide a platform runtime.
