---
title: Local compiler development loop
description: Build and test Prismio through the UMS project host without losing a working compiler generation.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [workflow, self-hosting, ums]
related: [tooling/compiler-host-and-promotion, testing/fixed-point-verification, compiler/bootstrap]
---

The repository is a UMS project whose `build.ums` names `.prismio/build/debug/prismio` as its
project-local compiler host. The installed parent reads the bootstrap-safe host block through
`umsProjectHost()`. When the host is absent, or was not built on this machine, it performs the
command itself. When the host exists and this machine built it, `dispatchToUmsHost()` forwards the
original argument vector to that binary.

## Ordinary loop

```bash
prismio check src/main.psm
prismio build
PRISMIO=$PWD/.prismio/build/debug/prismio python3 tests/test_runner.py
```

`buildUmsProject()` loads the workspace, selects the profile, creates the build plan, and notices
when the output target is the running host. The new executable is linked at a staged path. Only
after a successful build does the parent replace the project host. The running compiler never
opens its own executable for output, and a parse, sema, LLVM, or link failure leaves the previous
host usable.

After the first promotion, repeat `prismio build` to exercise forwarding through the new host. Use
`prismio --version` and the printed `compiler` path to verify which generation received a direct
single-file command; shell `PATH` alone is not sufficient evidence.

## Make a particular generation the host

You have a compiler at `build/gen3` and want the repository's commands to use it. **Copying it over
`.prismio/build/debug/prismio` does not work.** A host is run only if this machine promoted it, and
promotion is what writes `prismio.trusted` beside it, recording the file's identity. A copy has no
stamp, so the launcher leaves it alone and the global compiler serves the command:

```text
warning[P1077]: the project compiler was not built on this machine, so it will not be run
  note: .prismio/build/debug/prismio
  note: `prismio build` builds it here; until then the global compiler serves this project
Using global toolchain: /usr/local/bin/prismio
```

Have the generation build the host instead, so it is promoted the way any build is. Run it from the
checkout **under a name other than `prismio`**, because a compiler named `prismio` forwards to the
project host instead of acting as itself:

```bash
build/gen3 build
```

That builds the `prismio` target with `gen3`, stages the result, checks that it starts, promotes it,
and writes the stamp. An editor never sees the `P1077` warning: with `--diagnostic-format=json` the
launcher stays quiet, and the global compiler answers `check`.

**`prismio clean` removes the whole profile directory**, `.prismio/build/debug/` with the host, its
stamp, and the `lib/` and `stdlib/` built beside it, and then the launcher removes the running host
itself. Keep nothing in that directory that you want back, such as a parked older compiler; put it
under `build/`.

## Focused tests while editing

The Python runner accepts names without compiling the entire suite:

```bash
PRISMIO=$PWD/.prismio/build/debug/prismio \
  python3 tests/test_runner.py test_92_field_view_provenance
```

Set `PRISMIO_TEST_JOBS=1` for a deterministic log when failures interleave. Use
`python3 tests/test_runner.py --list` to discover registered names. The runner resolves `PRISMIO`
before `PATH` and prints the chosen executable.

## Use named generations for reproducibility

Bootstrap, seed refresh, and fixed-point work should use `build/genN` outputs rather than the
moving debug host. `tools/bootstrap.sh --compiler build/gen1 --out build/gen2` gives each generation
an immutable path; `tools/release_gate.py --rc build/gen2` independently rebuilds successors and
compares their IR. Record the exact compiler path in bug reports and benchmark results.

## Trace or bypass caches

`PRISMIO_BUILD_TRACE=1` prints build phases, including `library bitcode merge`.
`PRISMIO_OBJ_CACHE_TRACE=1` exposes cache hits and misses; `PRISMIO_OBJ_CACHE=0` bypasses the
object cache, which holds the objects of every `native` source a target declares (the compiler's
own runtime and backend C among them) and the bootstrap and toolchain-source objects. A program
whose target has no `native` block compiles no C and produces no cache entries. There is no switch
that disables the library bitcode merge; `PRISMIO_INLINE_RUNTIME` is retired and ignored. These are diagnostic switches, not
alternative supported build semantics. Reproduce once with defaults before attributing a bug to the
bypassed component.

## Before committing

Run the relevant focused test while iterating, then the full test suite. Changes to code generation,
the runtime, bootstrapping, or embedded sources also require generation agreement and packaging
checks. Changes to diagnostics should validate both human and JSON forms. Changes to AIF should
exercise reports, manifests, the independent oracle, and runtime verification where applicable.
