---
title: Bootstrapping and fixed points
description: Build Prismio compiler generations from the target-neutral seed or a trusted previous compiler.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [compiler, bootstrap, self-hosting, reproducibility]
related: [start/installation, guides/compiler-development, specification/conformance]
---

Self-hosting creates a cycle: Prismio source needs a Prismio compiler. The repository breaks it with committed, target-neutral LLVM IR for a seed compiler.

The seed is a trust anchor, not the preferred everyday implementation. Its job is to reconstruct a current compiler whose later generations can be checked against one another.

## Generation workflow

```bash
tools/bootstrap.sh --seed --out build/gen0
tools/bootstrap.sh --compiler build/gen0 --out build/gen1
tools/bootstrap.sh --compiler build/gen1 --out build/gen2
```

Conceptually:

- the committed seed material produces `gen0` for the host;
- `gen0` compiles the current Prismio compiler source into `gen1`;
- `gen1` compiles the same source into `gen2`; and
- fixed-point checks compare the relevant `gen1` and `gen2` outputs.

Use explicit paths for every compiler generation so an unrelated `prismio` on `PATH` cannot enter the chain.

PowerShell provides the corresponding Windows workflow. Each generation compiles `src/main.psm`, lowers the resulting IR with Clang, rebuilds runtime/backend C sources from the current tree, and links LLVM C API support.

The scripts also coordinate the pinned LLVM line and platform-specific executable naming/link requirements. Use them instead of manually reproducing their link command when validating self-hosting.

## Why the runtime and backend C sources come from the working tree

The compiler is not only Prismio code. Its runtime and its LLVM backend bridge are C, and a change to either has to reach the next generation. This repository's `build.ums` lists those files as `native` sources of its `prismio` target, so `prismio build` compiles them from the working tree on every build (through a cache keyed by their content) and links them into the new compiler. Nothing about them is built into the compiler doing the building. An older generation, the installed compiler and the project's own host all produce a compiler with the current C, and `tools/bootstrap.sh` does the same when no compiler exists yet.

Two things are still true. The frontend source must be parseable by the compiler doing the build, which is what the committed seed is kept able to do. And the programs a compiler builds link the runtime library installed beside it, so a runtime edit needs that library re-emitted: a compiler with a source tree beside it refuses to build with a library made from different runtime sources (`P1004`) rather than link a stale one.

## Fixed-point meaning

A fixed-point check compares successive compiler outputs. It detects a compiler whose behavior depends on the generation used to build it. CI also rejects duplicate symbols in generated IR and verifies that the seed contains no host-specific target triple.

A fixed point does not prove the compiler implements the intended language; two generations can agree on the same bug. Positive/negative regression tests and specification conformance remain necessary. The fixed point specifically establishes generation stability for the checked artifacts.

Native executable bytes can contain platform linker metadata, so the repository workflow compares the appropriate canonical outputs rather than assuming every final binary is bit-identical across hosts.

## Diagnose divergence

When generations disagree:

1. rerun from a clean set of explicitly named build outputs;
2. confirm Prismio and LLVM versions;
3. emit compiler LLVM IR from both relevant generations;
4. find the earliest differing declaration/function;
5. reduce it to a small source program;
6. add a regression test; and
7. determine whether the older or newer behavior matches the intended specification.

Do not update the trusted seed merely to make a divergence disappear. Seed updates should be reviewable consequences of intentional compiler/toolchain changes.

## Platform neutrality

Committed seed IR must not embed a host target triple or other machine-specific assumptions. Host LLVM/Clang supplies native lowering when the seed is instantiated. CI checks Windows, macOS, and Linux workflows so portability failures surface before a seed is trusted.

## Reproducibility record

For a release, record source revision, seed identity, Prismio version, LLVM version, host/target, bootstrap commands, regression result, AIF oracle result, and fixed-point comparison. This information lets another maintainer reproduce the trust chain instead of relying on an unlabeled compiler binary.

Record how each generation was built, with `prismio build` or with the bootstrap scripts. Both compile the runtime and backend C from the working tree, so the record is what lets a reader tell them apart.
