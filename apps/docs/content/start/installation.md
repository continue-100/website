---
title: Install the Prismio compiler
description: Install Prismio 0.1 on macOS, Linux or Windows from a release archive, verify the download, upgrade or remove it, or build the compiler from source.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-02"
tags: [installation, install-script, archives, checksums, bootstrap, llvm]
related: [start/hello-world, compiler/bootstrap, compiler/targets, releases/0.1.0]
---

Prismio 0.1.0 is installed from a release archive. On macOS and Linux one command downloads it, checks it and puts it on your `PATH`; on Windows you unpack a `.zip`. You can also build the compiler from source, which is covered [below](#build-from-source). There is no package-manager formula yet, and the archives are not code-signed (see [Verify your download](#verify-your-download)).

## What you need

You do not install LLVM. The compiler carries its own, and nothing already on your machine is used. It links finished programs with your system's linker, so you do need the platform's C tools:

- **macOS:** the Xcode Command Line Tools (`xcode-select --install`).
- **Linux:** `cc` and the C library headers (`build-essential` on Debian and Ubuntu). The archive is built against glibc 2.34 or later, so it does not run on musl systems such as Alpine.
- **Windows:** Visual Studio or its Build Tools with the **Desktop development with C++** workload, which includes the Windows SDK. The compiler finds `link.exe` by itself; you do not need a developer prompt.

The compiler runs on macOS 14 or later, and the programs it builds run on macOS 11 or later.

## macOS and Linux: the install script

```bash
curl -fsSL https://prismio.org/install.sh | sh
```

The script picks the archive for your machine, downloads it from the [latest release](https://github.com/prismio-lang/prismio/releases/latest), checks its SHA-256 against the `.sha256` published beside it, and **stops without installing anything if they differ**. It installs into `~/.prismio` (`bin/`, `lib/` and `stdlib/` side by side, which is the layout the compiler expects) and runs `prismio --version` to confirm the result starts. Then it adds `~/.prismio/bin` to your `PATH` in `.zshrc`, `.bashrc`, `.profile` or the fish configuration, whichever matches your shell.

| Variable | Effect |
|---|---|
| `PRISMIO_VERSION` | install this release instead of the latest, for example `0.1.0` or `v0.1.0` |
| `PRISMIO_INSTALL` | install into this directory instead of `~/.prismio` |
| `PRISMIO_NO_MODIFY_PATH=1` | leave your shell profiles alone |
| `PRISMIO_TARBALL` | install from a local archive; a `.sha256` beside it is checked when there is one |
| `PRISMIO_DOWNLOAD_URL` | download an archive from this URL instead of GitHub |

```bash
curl -fsSL https://prismio.org/install.sh | PRISMIO_VERSION=0.1.0 PRISMIO_INSTALL=$HOME/tools/prismio sh
```

The script refuses, with a message, to install on an Intel Mac or a musl Linux, and it never guesses a version: if it cannot find the latest release (offline, or GitHub is rate limiting) it asks you to set `PRISMIO_VERSION`. A shell running under Rosetta on an Apple-silicon Mac gets the native arm64 build.

## Windows

Download `prismio-0.1.0-windows-x64.zip` from the [release page](https://github.com/prismio-lang/prismio/releases/tag/v0.1.0), [verify it](#verify-your-download), unpack it somewhere you will keep it, and add its `bin` directory to your `PATH`:

```powershell
[Environment]::SetEnvironmentVariable("Path", "$([Environment]::GetEnvironmentVariable('Path','User'));C:\prismio\bin", "User")
```

Open a new terminal afterwards. Keep `bin`, `lib` and `stdlib` together: the compiler finds its runtime and standard library relative to its own executable, so a copy of `prismio.exe` on its own cannot build anything.

## Which archive

| Platform | Archive |
|---|---|
| macOS, Apple silicon | `prismio-0.1.0-macos-arm64.tar.gz` |
| Linux, x86-64 | `prismio-0.1.0-linux-x64.tar.gz` |
| Windows, x86-64 | `prismio-0.1.0-windows-x64.zip` |
| Linux, ARM64 | `prismio-0.1.0-linux-arm64.tar.gz` |
| Windows, ARM64 | `prismio-0.1.0-windows-arm64.zip` |

The first three are built and tested by the project's CI. **The two ARM64 archives are built and tested on virtual machines instead**, and have had less use, so expect rougher edges there. There is no archive for Intel Macs. Each archive has a `.sha256` beside it, and the install script reads the same files.

## Verify your download

The checksum shows that what you downloaded is what was published. **It does not show who published it: the archives are not signed.** Take the archive and its `.sha256` from the same release page, over HTTPS. On macOS and Linux:

```bash
shasum -a 256 -c prismio-0.1.0-macos-arm64.tar.gz.sha256     # sha256sum -c on Linux
```

On Windows, compare the hash PowerShell prints with the one in the `.sha256` file:

```powershell
Get-FileHash .\prismio-0.1.0-windows-x64.zip -Algorithm SHA256
```

Because the archives are unsigned, your operating system may warn about them. On macOS, an archive downloaded in a browser is quarantined by Gatekeeper; clear the flag from the unpacked folder with `xattr -dr com.apple.quarantine prismio-0.1.0-macos-arm64` (the install script downloads with `curl`, which does not set it). On Windows, SmartScreen may show an "unknown publisher" warning for `prismio.exe`; choose **More info**, then **Run anyway**, once you have checked the hash.

## Check that it works

```bash
prismio --version
```

```text
prismio 0.1.0
llvm 23.1.1
compiler /Users/you/.prismio/bin
stdlib /Users/you/.prismio/stdlib
```

`--version` also reports where the compiler found its runtime and standard library, which is the quickest way to see that an installation is intact. Then build and run [Hello, Prismio](/start/hello-world), from a directory outside any checkout.

## Upgrade, switch version, or uninstall

**Upgrade** by running the install script again: it replaces the compiler (even while it is running) and refreshes `lib/` and `stdlib/`. Use `PRISMIO_VERSION` to move to, or back to, a specific release. On Windows, unpack the new archive over the old one, or into a new directory and point `PATH` at it.

**Uninstall** by deleting the installation directory, `~/.prismio` unless you chose another, and removing the `# Prismio toolchain` lines the script added to your shell profile (`.zshrc`, `.bashrc`, `.profile` or `~/.config/fish/config.fish`). On Windows, delete the unpacked directory and its `PATH` entry. Nothing else is written outside it. Projects keep their own build output under `.prismio/` and are not touched.

## Build from source

Build from source to work on the compiler, or on a platform the release does not cover. The compiler repository's `README` and `CONTRIBUTING.md` are the shortest guide; this is the long form.

### Requirements

- Python 3.9 or newer
- Git and a shell; PowerShell scripts are supplied for Windows
- The platform's C linker and libraries, as above

The repository pins LLVM to **23.1.1**, and the setup script downloads that exact release into the checkout, checks it against a recorded SHA-256, and builds the compiler against it. An LLVM you already have, from Homebrew, apt or elsewhere, is not used.

Before bootstrapping, check the prerequisites available on your path:

```bash
python3 --version
git --version
```

On Windows, use `python --version` in PowerShell if that is how Python is registered.

### Get the source

Clone the compiler repository and run installation commands from its root:

```bash
git clone https://github.com/prismio-lang/prismio.git prismio
cd prismio
```

If you are using a source archive or an existing checkout, verify that it corresponds to the documentation version shown at the top of this page. The `main` branch can move ahead of the 0.1.0 reference.

### macOS and Linux (from source)

```bash
python3 tools/setup.py
tools/bootstrap.sh --seed --out build/prismio
./build/prismio --version
```

`tools/setup.py` first checks the machine: your Python, the free disk space, and the system C toolchain, which it tests by compiling and linking a small program rather than looking for a file name. It then runs `tools/setup_llvm.py`, which downloads the pinned LLVM into `third_party/llvm` and prepares it. The archive is over a gigabyte, and it is downloaded once: running the script again finds the prepared copy and does nothing. Python is the one prerequisite you install yourself. If the C toolchain is missing, the script says what to install, and `python3 tools/setup.py --install-system-deps` installs it for you after asking (`--yes` skips the question; `--check` only reports). `tools/bootstrap.sh --seed` begins with the committed trusted seed and writes a self-hosted compiler to the requested output path.

The output path may be absolute or repository-relative. Keep generation binaries under `build/` while developing so they remain separate from source.

**That binary is not yet an installation.** It can compile the compiler — bootstrap builds the runtime from repository sources — but it cannot compile an ordinary program, because a program links the runtime as installed bitcode that has to sit beside the executable. Building one with a bare generation reports:

```text
ERROR: Prismio installation is incomplete or corrupted.
       Missing runtime module: lib/runtime/lang_runtime.bc
       Reinstall Prismio and try again.
```

Assemble the toolchain to fix that.

### Windows (from source)

```powershell
python tools/setup.py
./tools/bootstrap.ps1 -Seed -Out build/prismio.exe
./build/prismio.exe --version
```

Run the commands from PowerShell. The repository provides a PowerShell bootstrap path so you do not need to translate the shell script manually.

An installed binary should report Prismio `0.1.0` and LLVM `23.1.1`.

### Assemble the toolchain

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

### Put the compiler on your path

Link `dist/Prismio/bin/prismio` into a user-owned tools directory already present on `PATH`, or add that `bin` directory to `PATH`. A symlink is fine — the compiler resolves its own real location before looking for `lib/` and `stdlib/`.

Do **not** copy `bin/prismio` out of the prefix on its own. It resolves its runtime and standard library relative to itself, so a lone copy is a compiler that cannot build anything.

Confirm which executable your shell finds:

```bash
prismio --version
```

`--version` reports the compiler and standard-library locations it resolved, which is the quickest way to see that a prefix is intact.

During compiler development, prefer an explicit path such as `./build/prismio`. That prevents an older globally discoverable binary from accidentally building a new generation.

### Verify the toolchain

Build a second generation with the compiler you just created. A successful self-host confirms that the executable can compile the current source tree.

```bash
tools/bootstrap.sh --compiler build/prismio --out build/prismio-next
```

Then compile a minimal program with the **packaged** compiler. Write the program from [Hello, Prismio](/start/hello-world) to a local `.psm` file first:

```bash
dist/Prismio/bin/prismio run hello.psm
```

Running it from outside the repository is the stronger check: inside a checkout, `import std.*` resolves against the `std/` sources it finds by walking up from your entry file, so a program built there can succeed without reading a single packaged artifact.

### Upgrade or switch versions of a source build

A source build has no in-place update command. Check out the desired compiler revision, rerun `tools/setup.py` (it only downloads when the pinned version has changed), and bootstrap a new output binary. Keep the old binary until the new generation passes `--version`, a self-host, and the regression tests relevant to your project.

Documentation versions are designed to remain separately addressable. Always compare the page version with the compiler output before relying on experimental AIF behavior or ABI details.

### Troubleshooting

If bootstrap cannot find LLVM, run `python3 tools/setup_llvm.py --check` to see what the checkout has recorded, then `python3 tools/setup_llvm.py` to finish the setup. An interrupted download resumes from where it stopped. If linking a program fails, the missing piece is almost always the system linker or C library, not LLVM: install the Xcode Command Line Tools on macOS, your distribution's C development package on Linux, or the Visual Studio C++ workload, which includes the Windows SDK, on Windows. If a generation can compile applications but not the compiler, run the fixed-point workflow in [Bootstrapping](/compiler/bootstrap) to isolate the first divergent generation.

CI builds and tests Windows, macOS and Linux on request (it is started by hand, not on every push). A platform being present in CI does not make every system linker or C library version interchangeable; include the exact command, compiler version, LLVM version, and host target in bug reports.

See [Bootstrapping](/compiler/bootstrap) for fixed-point verification and platform-specific details.
