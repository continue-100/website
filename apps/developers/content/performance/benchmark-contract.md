---
title: Cross-language benchmark contract
description: The equivalence, checksum, compiler, sampling, and unsupported-workload rules for Prismio's maintained benchmark suite.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-01"
tags: [benchmarks, performance, methodology]
related: [performance/telling-a-difference-from-noise, performance/running-adding-and-reading-results, performance/investigation-method, testing/overview]
---

`benchmarks/benchmarks.json` is the maintained catalog: 78 workloads, of which 62 have Prismio,
C++, and Rust arms and 16 are explicitly unsupported by Prismio. `benchmarks/run.py` is the only
timing harness used for checked-in results. Together they define the benchmark contract; an
individual language dispatcher is not allowed to redefine it.

The three implemented arms must express the same algorithm, not merely return the same checksum.
Input construction, timed boundaries, iteration counts, and observable work should be equivalent.
Checksums are validated before timing is accepted.

`build_all()` constructs all three commands in one process. C++ uses Clang
`-O3 -std=c++20 -pthread`, Rust uses `rustc -C opt-level=3 --edition=2021`, and Prismio calls the
selected compiler's ordinary `build` command. `llvm_bin_from()` optionally prepends one LLVM bin
directory and chooses its `clang++`; it does not silently change Prismio flags per workload.

Each dispatcher receives four arguments: executable, benchmark name, generated input path, and an
output path. It must print exactly parseable `result: <integer>` and `elapsed_ns: <integer>` lines.
`parse_output()` rejects a missing or extra required field. `execute()` separately measures
process-wall time, so the artifact preserves both the workload's internal timed interval and
launch-inclusive wall time.

## Correctness before timing

Within every run, the harness executes Prismio, C++, then Rust and stores the first checksum as
`expected`. Any later mismatch raises an error before a median is produced. This catches divergent
algorithms, but a coincidentally equal checksum is still possible; review implementations for:

- identical input construction and deterministic seeds;
- the same data structure semantics and integer overflow behavior;
- the same work inside and outside the `elapsed_ns` interval;
- equivalent observable output and error handling; and
- no dead computation that one optimizer may legally remove.

`make_fixture()` owns the shared file workload input. Do not let an arm generate a private fixture
or include fixture creation in only one timed interval.

## Unsupported workloads

When Prismio lacks the ordinary capability being measured, the catalog record uses
`status: "unsupported"` and names the missing feature. `main()` copies that record into the result
without executing any language arm. The separate `UNSUPPORTED.md` explains the absence.
A benchmark-private deque, regex engine, async runtime, or JSON parser would measure a substitute
rather than the supported language surface.

Unsupported is not zero, timeout, or missing data. It must never enter a ratio or aggregate. When
the capability becomes ordinary language or standard-library surface, implement all three arms,
change the catalog status, and add checksum review in the same change.

## Interpretation

Standard containers can differ in hashing and growth policy. File tests are page-cache sensitive.
Parallel reduction includes native thread creation and joining. Allocation-oriented workloads
include their deliberate in-memory construction. Small deltas require an A/A noise floor before
they become conclusions.

The raw artifact records schema version, UTC generation time, run count, exact build commands,
compile duration and binary size per arm, every elapsed sample, medians, checksum, the host and
toolchains it ran on (processor, cores, memory, OS, power state, target, compiler versions, source
commit and whether the tree was dirty), and a verdict per comparison. Peak resident memory is
recorded per sample.

The C++ and Rust arms are built with whole-program optimisation (`-flto`, and `-C lto=fat
-C codegen-units=1`) because the Prismio arm always is, so that a constant crossing a file boundary
reaches the code that uses it in all three.

One benchmark result describes one workload, host, compiler revision, and configuration. It is not
a universal language ranking. Ratios smaller than the host's interleaved A/A variation are noise,
not an optimization claim; the harness applies that judgement itself (see
[Telling a difference from noise](/performance/telling-a-difference-from-noise)).
