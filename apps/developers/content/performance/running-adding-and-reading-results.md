---
title: Run, extend, and read the benchmark suite
description: Execute the Prismio benchmark harness, inspect its JSON, add equivalent language arms, and record unsupported capabilities honestly.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-01"
tags: [benchmarks, harness, results]
related: [performance/benchmark-contract, performance/investigation-method, performance/telling-a-difference-from-noise, roadmap]
---

The suite lives under `benchmarks/`. `benchmarks.json` is the catalog; `run.py` builds the three
dispatchers, validates results, samples workloads, and writes JSON plus an HTML rendering.

## Command surface

```bash
prismio bench --runs 9
prismio bench --only binary_trees --runs 15
python3 benchmarks/run.py --list
```

`prismio bench` measures the project compiler, and refuses to run if `src/`, `std/` or `runtime/` is newer than it (`--allow-stale-compiler` overrides). Every arm is rebuilt and timed on every run, with CPU time beside wall time; `--reuse-reference-builds` brings back the cached C++ and Rust builds for a quick run-time-only check. The C++ arm uses LTO when the machine's linker can (it falls back to none, and the report records the command). Called directly, `benchmarks/run.py` takes `--compiler` or `PRISMIO`, and `--compiler` overrides `PRISMIO`. `--llvm-bin` chooses the LLVM/Clang directory. `--only` is
repeatable and `select_benchmarks()` rejects unknown names. `--skip-build` requires all three suite
executables already under `benchmarks/build`; use it only when source and compiler inputs have not
changed. `--output` changes the JSON path and the sibling HTML destination. `--open` opens the
finished report but does not alter its contents.

`build_all()` invokes the Prismio, C++, and Rust builds. `run_command()` always uses the repository
root as its working directory and captures output. Build failures include the expanded command,
stdout, and stderr. During measurement, `execute()` invokes a dispatcher, parses its two required
fields, and adds a harness-side `wall_ns`.

The loop order is run-first, language-second. This is limited interleaving: it reduces long-term
drift compared with timing every sample of one language first, but does not randomize order. For a
close result, repeat with reversed or randomized external sequencing and run A/A before assigning a
cause.

## Reading JSON

The result file records `schema_version` (now `3`), `generated_at`, `runs`, `build_commands`,
`compile_ns`, `binary_bytes`, `parity`, `noise_model`, `environment`, `benchmarks`, and `artifacts`.
`environment` is probed on every run and holds the processor, core count, memory, OS, power state,
target triple, the toolchain versions (Prismio with the profile it was built in, clang, rustc, LLVM)
and the source commit with whether the tree was dirty. Paths in `build_commands` and `artifacts` are
repository-relative. Implemented benchmark records add one `languages` object per arm:

```json
{
  "elapsed_ns_median": 1234,
  "wall_ns_median": 5678,
  "elapsed_ns_samples": [1200, 1234, 1300]
}
```

Each implemented, non-elimination record also carries a `verdict` against C++ and against Rust:
`outcome` (`win`, `parity` or `loss`), the median `ratio`, the `best_ratio`, the `tolerance` it was
judged against and the `noise` measured. Whether a difference is a difference is decided there, not
by a percentage in the reader; see [Telling a difference from noise](/performance/telling-a-difference-from-noise).

`elapsed_ns_median` is the algorithm interval reported by the dispatcher. `wall_ns_median` includes
process launch and harness overhead, although raw wall samples are not currently retained. Compile
times are nanoseconds for the suite build, not per-workload compilation. Unsupported records contain
their reason and no fabricated `languages` object.

## Adding a workload

Add the catalog record, implement the same algorithm in the Prismio, C++, and Rust category modules,
wire each suite dispatcher, choose a deterministic integer checksum, and document the timed boundary.
The Prismio category files live under `benchmarks/prismio`, the C++ implementation is split across
the files in `CPP_SOURCES`, and Rust lives under `benchmarks/rust`. The string name in all three
dispatchers must exactly match the manifest `name`.

Before a long run, use `--only <name> --runs 1`. Deliberately perturb one arm's checksum and confirm
the harness rejects it; then restore it. Check that the output file fixture is used equivalently
when the workload writes data. Finally run several samples and inspect both the raw JSON and the
generated `report.html`.

If Prismio cannot express the intended standard operation, add a complete unsupported record to
`UNSUPPORTED.md`. State the missing language or library feature and why a local substitute would
invalidate comparison.

Review the generated result diff before committing. A changed checksum, build command, workload
count, unsupported reason, or sample shape is a semantic change to the evidence, not report noise.
Do not hand-edit medians: `main()` derives them with `statistics.median` from the recorded samples.
