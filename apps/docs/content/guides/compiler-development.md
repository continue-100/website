---
title: Develop the self-hosted compiler
description: Work on Prismio's self-hosted compiler with generation builds, fixed-point checks, and the regression suite.
status: stable
version: "0.1.0"
lastUpdated: "2026-08-31"
tags: [guide, compiler, self-hosting, testing]
related: [compiler/overview, compiler/bootstrap, specification/conformance]
---

Compiler changes are written in Prismio under `src/`. A trusted seed or previous compiler generation builds the next compiler. Since every generation can affect the next, compiler work needs both behavioral tests and a self-host/fixed-point check.

## Build generations

```bash
tools/bootstrap.sh --seed --out build/gen0
tools/bootstrap.sh --compiler build/gen0 --out build/gen1
tools/bootstrap.sh --compiler build/gen1 --out build/gen2
PRISMIO=$PWD/build/gen2 python3 tests/test_runner.py
```

Name generation outputs explicitly for bootstrap and fixed-point checks. A stale
compiler on `PATH` can make those failures look nondeterministic.

The sequence starts from the committed seed, builds `gen0`, then asks each
generation to compile the same source into `gen1` and `gen2`. The test command
exercises `gen2` explicitly, never a globally installed compiler.

The repository is also a normal Prismio project. For the everyday edit loop,
run this from the repository root or any descendant:

```bash
prismio build
```

The first block of this repository's manifest is the stable bootstrap boundary:

```ums
toolchain {
    host = ".prismio/build/debug/prismio"
}
```

Global Prismio reads only this prefix. On the first run the host is absent, so
the installed compiler processes `build.ums` and builds it. On subsequent runs
global Prismio forwards the complete command to that local host; the host then
parses the complete manifest, including UMS changes the installed compiler may
not understand. A broken host falls back before command execution, while a
hosted command failure is returned without replaying the command globally.

The manifest's `executable("prismio")` target is an ordinary executable whose
C runtime and backend are listed as `native` sources, with
`runtime = "none"` (it carries this checkout's runtime) and LLVM linked through
`third_party/llvm-link.rsp`, which `python3 tools/setup_llvm.py` writes. Nothing
about the compiler is built into the toolchain. A self-build leaves a checked
`.next` sibling, which the global parent atomically promotes after the hosted
process exits, and records the promoted host as built on this machine: the
launcher runs no other. Do not invoke project mode directly through
`.prismio/build/debug/prismio`: without its global parent it cannot safely
replace itself on every supported platform. To make a named generation the
project's compiler, run it from the checkout -- `build/gen2 build` -- which
builds the host with that generation and promotes it.

The bootstrap scripts stay separate because a self-hosting chain must name and
compare its generations. Continue to use `build/gen1`, `build/gen2`, and
`PRISMIO=...` explicitly whenever compiler identity is part of the test.

For a tight edit/test loop, select one file fixture by stem:

```bash
PRISMIO=$PWD/build/gen2 python3 tests/test_runner.py test_92_field_view_provenance
```

Filtered runs cover file fixtures only. Run the unfiltered suite before
submitting so its CLI, AIF, JIT, packaging-boundary, and other integration
checks also run.

## Establish a fixed point

A fixed point requires the relevant outputs of `gen1` and `gen2` to agree. CI performs generation builds, runs positive and negative language tests, compares AIF results against its oracle, and checks that the committed seed remains target-neutral on Windows, macOS, and Linux.

Compare canonicalized outputs appropriate to the repository workflow rather than assuming native executable bytes are reproducible across linkers. A semantic or IR-level divergence can identify the stage where a compiler change begins compiling itself differently.

Emit the compiler IR with both generations and compare it byte for byte:

```bash
build/gen1 build components/main.psm -o /tmp/a.ll
build/gen2 build components/main.psm -o /tmp/b.ll
cmp /tmp/a.ll /tmp/b.ll
```

If generations diverge:

1. reproduce with one host and pinned LLVM 23.1.1;
2. emit `.ll` for the compiler build;
3. locate the first changed function or global;
4. reduce the change to a small Prismio program;
5. add that program to the regression suite; and
6. only then update the trusted bootstrap artifacts if the behavior is intentional.

## Add language tests

Keep behavioral changes paired with the smallest test that proves the contract. A positive test should compile and, where relevant, return or print a checkable result. A negative test should fail for one intended rule, such as use after move, incorrect arity, missing return, or unsupported syntax.

Avoid one large test that can fail for ten reasons. Small files improve diagnostic localization and become reliable documentation examples.

## Update the language surface together

A user-visible syntax or semantic change normally requires:

- lexer/parser or semantic/code-generation implementation;
- positive coverage;
- negative coverage for invalid boundaries;
- an error-reference page or update;
- language-reference and specification changes;
- compiler/CLI documentation when a flag or target changes; and
- status changes from Coming Soon or Experimental only after end-to-end support exists.

Reserved lexer tokens alone do not count as an implemented feature. Parsing, semantic checking, lowering, diagnostics, and tests all need to agree.

## AIF changes

Allocation inference has its own oracle-backed behavior. When changing escape, alias, region, or tier selection rules, compare summaries and explanations as well as whether compilation succeeds. Experimental does not mean untested.

## Cross-platform checks

The native support matrix includes Windows, macOS, and Linux. Keep source and committed seed material target-neutral. A change that accidentally embeds a host path, object format, pointer width, or platform symbol can bootstrap successfully on one machine and fail elsewhere.

WebAssembly support is experimental and should be validated separately from native fixed-point expectations.

Keep behavioral changes paired with a small positive or negative test. Diagnostics are part of the user experience, but their prose is not yet a stable API; avoid tests that depend on more text than necessary.

Compiler errors and warnings carry stable `P####` codes. Tests and editor tools
may depend on a code when they need a durable identity; message prose should
still be matched only as narrowly as the behavior requires.

## Before submitting a compiler change

Run the repository checks directly:

```bash
python3 tools/format_sources.py --check
python3 tools/lint.py
PRISMIO=$PWD/build/gen2 python3 tests/test_runner.py
python tools/sanitizer_smoke.py --compiler build/gen2
python3 tools/milestone_bench.py --old build/gen0 --new build/gen2
cd ../docs && PRISMIO=../prismio/build/gen2 node scripts/verify-doc-examples.mjs
```

Allocation-inference changes should additionally run the AIF oracle
differential. Include the exact seed generation and host toolchain in any
failure report.
