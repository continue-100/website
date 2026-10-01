---
title: Platform
description: The std.platform module — the operating system, architecture and ABI environment a program is compiled for, as compile-time constants.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-12"
tags: [standard-library, platform, targets, cross-compilation]
related: [stdlib, stdlib/process, compiler/targets, compiler/cli]
---

`import std.platform`. Which platform a program is compiled for — answered by the compiler from the target triple, not asked of the machine while the program runs.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.platform

fn main() -> Int {
    match (platform.current) {
        Platform.Windows => { println("Windows") }
        Platform.Linux => { println("Linux") }
        Platform.MacOS => { println("macOS") }
        Platform.Unknown => { println("somewhere else") }
    }
    if (platform.architecture == Architecture.ARM64) { println("ARM64") }
    return 0
}
```

| Call | Returns |
|---|---|
| `platform.current` | `Platform` — `Windows`, `Linux`, `MacOS` or `Unknown` |
| `platform.isWindows` | `Bool` — the same as `platform.current == Platform.Windows` |
| `platform.isLinux` | `Bool` — the same as `platform.current == Platform.Linux` |
| `platform.isMacOS` | `Bool` — the same as `platform.current == Platform.MacOS` |
| `platform.architecture` | `Architecture` — `X86_64`, `ARM64` or `Unknown` |
| `platform.environment` | `Environment` — `GNU`, `Musl`, `MSVC`, `MinGW` or `Unknown` |

`platform` is a global the module declares, of an empty struct type, `PlatformQuery`; the calls above are its methods.

## The target, not the host

These are facts about the compile target. A native build targets the machine it runs on, so there the answer is that machine's too. A cross build answers for the target it names:

```text
prismio build main.psm --target x86_64-pc-windows-msvc    # platform.current is Platform.Windows
```

Every answer is a constant, so `if (platform.isLinux) { ... } else { ... }` compiles to the one branch it takes. There is no run-time check and no call.

## How a triple maps

| Target triple | Platform | Architecture | Environment |
|---|---|---|---|
| `x86_64-pc-windows-msvc` | `Windows` | `X86_64` | `MSVC` |
| `x86_64-pc-windows-gnu`, `x86_64-w64-mingw32` | `Windows` | `X86_64` | `MinGW` |
| `x86_64-unknown-linux-gnu` | `Linux` | `X86_64` | `GNU` |
| `aarch64-unknown-linux-musl` | `Linux` | `ARM64` | `Musl` |
| `aarch64-linux-android` | `Linux` | `ARM64` | `Unknown` |
| `arm64-apple-macos` | `MacOS` | `ARM64` | `Unknown` |
| `x86_64-apple-darwin` | `MacOS` | `X86_64` | `Unknown` |
| `wasm32-unknown-unknown` | `Unknown` | `Unknown` | `Unknown` |

A target outside these sets — iOS, FreeBSD, i686, riscv64 — answers `Unknown` for whatever it does not match, so a `match` over `Platform` should have a `Platform.Unknown` arm. Android reports `Linux` because its triple's operating system is Linux, and macOS has no ABI environment in its triple at all.
