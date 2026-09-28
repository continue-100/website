---
title: Bootstrapping and fixed points
description: Build Prismio compiler generations from the target-neutral seed or a trusted previous compiler.
status: stable
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [compiler, bootstrap, self-hosting, reproducibility]
related: [start/development-setup, start/local-compiler-loop, testing/fixed-point-verification]
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

`tools/bootstrap.sh` and `tools/bootstrap.ps1` are maintained counterparts. In seed mode they lower
`bootstrap/prismio-seed.ll`; in compiler mode they ask the named compiler to `build src/main.psm` to
LLVM IR and link that themselves.
Both compile the current C sources with real LLVM headers, use content-derived cache keys, link to a
staging path, and atomically install the result. `PRISMIO_LLVM_DIR` overrides the toolchain recorded
by `tools/setup_llvm.py`; `PRISMIO_OBJ_CACHE=0` provides a cache-bypass diagnostic path.

## Why runtime/backend sources are rebuilt

An ordinary application build links the runtime installed/embedded with that compiler. Compiler development can change the C runtime/backend bridge itself. A bootstrap must compile those current-tree sources; otherwise a new Prismio frontend could be linked against stale support code and appear to pass only by accident.

For that reason, do not replace the bootstrap workflow with an older binary's ordinary `build` command when C sources have changed.

## Fixed-point meaning

A fixed-point check compares successive compiler outputs. It detects a compiler whose behavior depends on the generation used to build it. CI also rejects duplicate symbols in generated IR and verifies that the seed contains no host-specific target triple.

`tools/release_gate.py` makes the comparison concrete. `check_generations()` bootstraps two
successors from the release candidate, `check_fixpoint()` emits their compiler IR and compares the
canonical result, `check_rc_reproduces()` checks that the release candidate reproduces generation
one, and `check_seed()` confirms the compiler command can still reconstruct a usable seed-derived
compiler. The same gate then runs the regression suite, AIF differential, corpus, verifier sweep,
JIT, cross-target, and packaging checks.

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

Do not rebuild a new compiler solely through an older binary's ordinary `build` command when changing runtime C sources: that binary embeds its previous runtime. The bootstrap scripts intentionally compile runtime sources fresh from the working tree.
