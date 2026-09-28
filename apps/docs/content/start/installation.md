---
title: Install the Prismio compiler
description: Configure LLVM 23 and bootstrap a Prismio 0.1 compiler on Windows, macOS, or Linux.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-24"
tags: [installation, bootstrap, llvm]
related: [start/hello-world, compiler/bootstrap, compiler/targets]
---

Prismio 0.1 is installed from the compiler repository. There is not yet a stable package-channel installer, signed binary channel, or package-manager formula. The website's **Install** button takes you to the canonical installation entry point; the source bootstrap below is the current supported path.

This guide installs a local compiler without changing the language source. Keep the repository available after installation because the runtime sources and bootstrap tools are part of the current toolchain.

## Requirements

- Python 3.8 or newer
- Git and a shell; PowerShell scripts are supplied for Windows
- The platform's C linker and libraries: Xcode Command Line Tools on macOS, `cc` and the C library development files on Linux, and Visual Studio or its Build Tools with the **Desktop development with C++** workload on Windows

You do not install LLVM yourself. The repository pins it to **23.1.1**, and the setup script downloads that exact release into the checkout, checks it against a recorded SHA-256, and builds the compiler against it. An LLVM you already have, from Homebrew, apt or elsewhere, is not used.

Before bootstrapping, check the prerequisites available on your path:

```bash
python3 --version
git --version
```

On Windows, use `python --version` in PowerShell if that is how Python is registered.

## Get the source

Clone the compiler repository and run installation commands from its root:

```bash
git clone https://github.com/prismio-lang/prismio.git prismio
cd prismio
```

If you are using a source archive or an existing checkout, verify that it corresponds to the documentation version shown at the top of this page. The `main` branch can move ahead of the 0.1.0 reference.

## macOS and Linux

```bash
python3 tools/setup_llvm.py
tools/bootstrap.sh --seed --out build/prismio
./build/prismio --version
```

`tools/setup_llvm.py` downloads the pinned LLVM into `third_party/llvm` and prepares it. The archive is over a gigabyte, and it is downloaded once: running the script again finds the prepared copy and does nothing. `tools/bootstrap.sh --seed` begins with the committed trusted seed and writes a self-hosted compiler to the requested output path.

The output path may be absolute or repository-relative. Keep generation binaries under `build/` while developing so they remain separate from source.

**That binary is not yet an installation.** It can compile the compiler — bootstrap builds the runtime from repository sources — but it cannot compile an ordinary program, because a program links the runtime as installed bitcode that has to sit beside the executable. Building one with a bare generation reports:

```text
ERROR: Prismio installation is incomplete or corrupted.
       Missing runtime module: lib/runtime/lang_runtime.bc
       Reinstall Prismio and try again.
```

Assemble the toolchain to fix that.

## Windows

```powershell
python tools/setup_llvm.py
./tools/bootstrap.ps1 -Seed -Out build/prismio.exe
./build/prismio.exe --version
```

Run the commands from PowerShell. The repository provides a PowerShell bootstrap path so you do not need to translate the shell script manually.

An installed binary should report Prismio `0.1.0` and LLVM `23.1.1`.

## Assemble the toolchain

Packaging turns the bootstrapped binary into a complete toolchain: the compiler, the runtime compiled to LLVM bitcode, and the standard library compiled to PLIB artifacts.

```bash
python3 tools/package.py --compiler build/prismio --out dist/Prismio
```

That writes a self-contained prefix:

```text
dist/Prismio/
  bin/prismio                     the compiler
  lib/runtime/*.bc                merged into every program you build
  lib/runtime.hash                which sources those modules came from
  stdlib/*.plib                   what `import std.*` resolves to
```

On Windows, `bin/` also holds `LLVM-C.dll`, the one LLVM library the compiler loads there.

**The prefix needs no LLVM on the machine it runs on.** On macOS and Linux, LLVM is linked into the compiler itself. It optimizes your program and generates machine code without starting another process. The only thing it runs is the system's linker, which links the finished object against the C library: `cc` on macOS and Linux, and on Windows the `link.exe` from Visual Studio, which the compiler finds by itself. You do not need to open a developer prompt. Set `PRISMIO_CC` to use a different linker driver.

The prefix moves as a unit — the compiler locates everything relative to its own executable, with no hardcoded installation path — so you can copy or rename `dist/Prismio` freely. What you cannot do is copy `bin/prismio` on its own; see [Toolchain layout](/compiler/toolchain-layout).

## Put the compiler on your path

Link `dist/Prismio/bin/prismio` into a user-owned tools directory already present on `PATH`, or add that `bin` directory to `PATH`. A symlink is fine — the compiler resolves its own real location before looking for `lib/` and `stdlib/`.

Do **not** copy `bin/prismio` out of the prefix on its own. It resolves its runtime and standard library relative to itself, so a lone copy is a compiler that cannot build anything.

Confirm which executable your shell finds:

```bash
prismio --version
```

`--version` reports the compiler and standard-library locations it resolved, which is the quickest way to see that a prefix is intact.

During compiler development, prefer an explicit path such as `./build/prismio`. That prevents an older globally discoverable binary from accidentally building a new generation.

## Verify the toolchain

Build a second generation with the compiler you just created. A successful self-host confirms that the executable can compile the current source tree.

```bash
tools/bootstrap.sh --compiler build/prismio --out build/prismio-next
```

Then compile a minimal program with the **packaged** compiler. Write the program from [Hello, Prismio](/start/hello-world) to a local `.psm` file first:

```bash
dist/Prismio/bin/prismio run hello.psm
```

Running it from outside the repository is the stronger check: inside a checkout, `import std.*` resolves against the `std/` sources it finds by walking up from your entry file, so a program built there can succeed without reading a single packaged artifact.

## Upgrade or switch versions

Prismio 0.1 does not have an in-place update command. Check out the desired compiler revision, rerun `tools/setup_llvm.py` (it only downloads when the pinned version has changed), and bootstrap a new output binary. Keep the old binary until the new generation passes `--version`, a self-host, and the regression tests relevant to your project.

Documentation versions are designed to remain separately addressable. Always compare the page version with the compiler output before relying on experimental AIF behavior or ABI details.

## Troubleshooting

If bootstrap cannot find LLVM, run `python3 tools/setup_llvm.py --check` to see what the checkout has recorded, then `python3 tools/setup_llvm.py` to finish the setup. An interrupted download resumes from where it stopped. If linking a program fails, the missing piece is almost always the system linker or C library, not LLVM: install the Xcode Command Line Tools on macOS, your distribution's C development package on Linux, or the Visual Studio C++ workload, which includes the Windows SDK, on Windows. If a generation can compile applications but not the compiler, run the fixed-point workflow in [Bootstrapping](/compiler/bootstrap) to isolate the first divergent generation.

The current CI exercises Windows, macOS, and Linux. A platform being present in CI does not make every system linker or C library version interchangeable; include the exact command, compiler version, LLVM version, and host target in bug reports.

See [Bootstrapping](/compiler/bootstrap) for fixed-point verification and platform-specific details.
