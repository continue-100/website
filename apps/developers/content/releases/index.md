---
title: Releases and documentation versions
description: Prismio release notes, current language version, and architecture for retaining older documentation.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-02"
tags: [releases, versioning, changelog]
related: [releases/0.1.0, migration, project/security-and-compatibility]
---

**Current documented language and compiler version: 0.1.0.**

- [Prismio 0.1.0](/releases/0.1.0) — the first release, published 2026-10-02

Current reference URLs are unprefixed and carry machine-readable `version` metadata. At the first compatibility-breaking documentation release, the previous tree will be retained under `/versions/<version>/`, and a version selector will link current and archived copies. Canonical URLs will keep search engines from treating identical latest/versioned pages as duplicates.

There is no stability channel distinction yet. “Implemented” means present in the audited compiler, not guaranteed unchanged through 1.0.

## What a release record must contain

A compiler release is more than a source changelog. Its record must identify the source commit,
Prismio and LLVM versions, seed identity, compiler used as the release candidate, two-generation
fixed-point result, regression and AIF differential results, supported targets, packaged artifacts,
and checksums. Source, UMS manifest, diagnostic/report schema, runtime ABI, and generated-artifact
compatibility are reported separately.

## How a release is cut

The procedure is `RELEASE.md` in the compiler repository, and it is written in the repository's own
project commands, run as `prismio <command>` from the checkout. The order is the point: **nothing is
tagged until three platforms have agreed on the exact commit that would be tagged.**

| Command | What it is for |
|---|---|
| `prismio build` | builds the compiler this checkout runs |
| `prismio suite` | the test suite, for the fast loop |
| `prismio verify` | suite, source lists, externs, AIF differential |
| `prismio gate` | lint, then the release gate on a packaged candidate; run before every push |
| `prismio release` | the archive and `.sha256` for this host |
| `prismio bench` | the cross-language benchmarks |

1. **Refresh what is generated from the tree, first.** `prismio build` twice, so the host is a fixpoint of
   this `src/`; `tools/refresh_seed.sh --compiler .prismio/build/debug/prismio` (`.ps1` on Windows);
   `graphify update .`. CI only checks that the committed seed can parse `src/`, so a stale seed passes while
   describing an older compiler (the 0.1.0 seed was about 7,500 lines behind). The refresh belongs in the
   commit that gets tested: a refresh after the gate makes a new commit the gate has not seen.
2. **`prismio gate`.** It lints, packages the host the way a user installs it, puts the pinned LLVM first on
   `PATH`, and runs `tools/release_gate.py`: source lists, two successor generations, the IR fixpoint,
   reproduction by the candidate, the committed seed, the full suite, the AIF differential, the corpus, the
   `--verify` sweep, the environment-switch fallbacks, the JIT, cross-target behavior, and packaging with
   toolchain separation. Record the run in `aif/evidence/`.
3. **Push, then start CI by hand.** CI does not run on push. `gh workflow run ci.yml --ref main` starts it on
   `windows-latest`, `ubuntu-latest` (x86-64) and `macos-latest` (arm64): a three-generation bootstrap from the
   committed seed, the fixpoint, the suite, the AIF differential, the seed check (usable, target-neutral, and on
   Linux current), packaging, separation, a smoke test of the packaged toolchain outside the checkout, and
   `tools/release.py` on the runner, whose archive and checksum are uploaded as the `release-<OS>-<arch>`
   artifact. All three must be green **on the exact commit you pushed**.
4. **Artifacts.** `prismio release` builds the archive for the host (`.tar.gz`, or `.zip` on Windows) and
   writes its SHA-256 beside it, after re-checking the fixpoint and reading the oldest system the artifact
   runs on off its binaries: macOS must say 14.0 for the compiler and 11.0 for programs, Windows must not
   import the Visual C++ runtime, and Linux prints its glibc floor (build on the oldest distribution you
   support). The x86-64 Linux and Windows archives come from CI, because no other machine builds them.
5. **Tag and publish**, only with the owner's explicit authorisation, and with the docs site's release page as
   the notes, so the two cannot differ.

In commands, from the compiler checkout:

```bash
prismio build && prismio build                                   # the host is a fixpoint of this src/
tools/refresh_seed.sh --compiler .prismio/build/debug/prismio     # then: graphify update .
prismio gate                                                     # green on this exact commit
git push origin main                                             # needs the owner's go-ahead
gh workflow run ci.yml --ref main                                # CI does not run on push
gh run watch --exit-status                                       # all three platforms
prismio release                                                  # the archive and .sha256 for this host
```

Two things the gate does not check for you, and both fail it wholesale. **The candidate must be a packaged
toolchain**: a bare generation has no `lib/runtime/*.bc`, so every program the suite, the corpus and the verify
sweep build fails to link (229 suite failures on 2026-09-25). `prismio gate` packages it for you. **The pinned
LLVM must come first on `PATH`**: an older system `llvm-nm` and `clang` cannot read LLVM 23 bitcode or agree on
its data layout. `prismio gate` and CI both put it there; only a hand-run `tools/release_gate.py` needs it
spelled out.

Artifacts must be smoke-tested outside the repository so checkout sources cannot hide missing
packaged runtime or standard-library files, and the installer has its own check: `install.sh` must verify the
`.sha256`, report the version, and leave a compiler that builds the smoke program. The archives are not
signed; the checksum is the integrity story. Documentation status and version metadata then describe that
audited commit; they do not upgrade experimental AIF policy or internal ABI into a stability promise.
