---
title: Releases and documentation versions
description: Prismio release notes, current language version, and architecture for retaining older documentation.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [releases, versioning, changelog]
related: [releases/0.1.0, migration, project/security-and-compatibility]
---

**Current documented language and compiler version: 0.1.0.**

- [Prismio 0.1.0](/releases/0.1.0) — first compiler-audited documentation baseline

Current reference URLs are unprefixed and carry machine-readable `version` metadata. At the first compatibility-breaking documentation release, the previous tree will be retained under `/versions/<version>/`, and a version selector will link current and archived copies. Canonical URLs will keep search engines from treating identical latest/versioned pages as duplicates.

There is no stability channel distinction yet. “Implemented” means present in the audited compiler, not guaranteed unchanged through 1.0.

## What a release record must contain

A compiler release is more than a source changelog. Its record must identify the source commit,
Prismio and LLVM versions, seed identity, compiler used as the release candidate, two-generation
fixed-point result, regression and AIF differential results, supported targets, packaged artifacts,
and checksums. Source, UMS manifest, diagnostic/report schema, runtime ABI, and generated-artifact
compatibility are reported separately.

`tools/release_gate.py --rc <compiler>` is the local evidence aggregator. It checks source lists,
two successor generations, fixed point, reproduction by the candidate, the committed seed, full
suite, AIF differential, corpus, verifier sweep, environment-switch fallbacks, JIT, cross-target
behavior, and packaging.

**Two things the gate does not check for you, and both fail it wholesale** (`RELEASE.md` §1):

```bash
bash tools/bootstrap.sh --compiler <compiler> --out build/v0.1-rc-bin
python tools/package.py --compiler build/v0.1-rc-bin --out build/v0.1-rc
PATH=$PWD/third_party/llvm/bin:$PATH python tools/release_gate.py --rc build/v0.1-rc/bin/prismio
```

- **The candidate must be a packaged toolchain.** A bare generation has no `lib/runtime/*.bc`, so
  every program the suite, the corpus and the verify sweep build fails to link: 229 suite failures
  on 2026-09-25.
- **The pinned LLVM must come first on `PATH`.** An older system `llvm-nm` and `clang` cannot read
  LLVM 23 bitcode or agree on its data layout, which fails the packaged-toolchain check,
  `module_artifacts` and `target_cross`. CI puts it there already.

What is left before 0.1.0 can be tagged is tracked in `RELEASE_CHECKLIST.md`, not here. `tools/release.py` produces platform archives and SHA-256 files only after
the candidate is chosen.

Artifacts must be smoke-tested outside the repository so checkout sources cannot hide missing
packaged runtime or standard-library files. Multi-platform jobs must agree on the exact commit before
tagging. Documentation status and version metadata then describe that audited commit; they do not
upgrade experimental AIF policy or internal ABI into a stability promise.
