---
title: Telling a real difference from noise
description: How the benchmark harness decides that Prismio is faster, slower or level with C++ and Rust on one workload, why a flat percentage cannot, and where that decision is computed and read.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-01"
tags: [benchmarks, noise, statistics, harness]
related: [performance/running-adding-and-reading-results, performance/benchmark-contract, performance/investigation-method]
---

A benchmark table has one question per row: is Prismio faster, slower, or level? Answering it
with a fixed percentage ("within 4% is a tie") fails in both directions on short workloads. A
workload that runs for 0.6 ms is dominated by things no code change moves: process start, which
core the scheduler picks, the clock ramping up. Those show up as **two timing modes**, a fast one
and one roughly a quarter slower, and the share of runs landing in each differs from one binary to
the next. A flat threshold turns that into a verdict that no code change can fix.

This page explains the rule the harness uses instead, how to read what it recorded, and where to
change it.

## See it work

```bash
python3 benchmarks/run.py --only edit_distance --only large_buffer_copy --runs 7
```

```text
  algorithms
    edit_distance        702.0 µs    573.1 µs    651.8 µs     1.22×     1.08×    1.69 MB     1.03×
  memory
    large_buffer_copy      6.5 ms      5.6 ms      5.5 ms     1.16×     1.18×   17.03 MB     1.01×
Summary  6 workloads, 7 runs each, 3s
  vs C++   geomean 1.07×   0 faster · 5 parity · 1 slower
  slowest vs C++  large_buffer_copy 1.16×
```

The run had six workloads; the other rows and the Rust columns' colours are left out here.

Both rows are slower than C++ by more than 15%, and only one of them is called slower. The ratio
column is coloured by the **verdict**, not by the ratio: `edit_distance`'s 1.22× is printed plain
(parity) and `large_buffer_copy`'s 1.16× is yellow (a loss). The rest of this page is why.

## What the two rows look like

These are the recorded samples, in microseconds, five runs each:

| workload | Prismio | C++ |
|---|---|---|
| `edit_distance` | 566 577 588 **702 736** | 587 **709 726 734 743** |
| `large_buffer_copy` | 6686 6704 6760 6793 7055 | 5678 5700 5735 5747 5769 |

`large_buffer_copy` is a smooth cloud: every Prismio run is slower than every C++ run, so the
difference is real. `edit_distance` is two clusters (about 570 µs and about 720 µs) in **both**
languages. The medians differ because Prismio's runs happened to fall three-in-five in the fast
cluster and C++'s four-in-five in the slow one, while the fastest runs, 566 and 587, are within 4%
of each other. The code takes the same time in each mode; which mode a process lands in is not
under the code's control.

Under a flat 4% rule the median ratio, 0.81, would have been reported as Prismio being **19%
faster**, which is as wrong as the opposite reading of a different set of five runs.

## The rule

A comparison is a `win` or a `loss` only when **both** of these leave a tolerance, and is
`parity` otherwise:

1. the ratio of **medians**, against the tolerance `max(parity, spread, floor / median)`;
2. the ratio of **best runs** (minimums), against `max(parity, floor / minimum)`.

| term | value | meaning |
|---|---|---|
| `parity` | `0.04` | the flat floor the suite's alternating identical binaries measured as its own run-to-run difference |
| `spread` | per workload | the larger of the two arms' interquartile range divided by their median |
| `floor` | 25 000 ns | what process start, scheduling and clock ramp cost a run however short, as a fraction of the run |

Two reasons for two ratios:

- **Noise only adds time.** The best run is the steadiest estimate of what the code costs; the
  median says what a run usually costs. A real difference moves both. Equal best runs with
  different medians is the signature of timing modes, and is parity.
- **The spread is the interquartile range, not median absolute deviation (MAD).** When more than
  half the runs sit in one mode the MAD is close to zero, so the older estimate reported
  `edit_distance`'s noise as nearly 0% and a 700 µs against 560 µs split as a loss. The
  interquartile range sees both modes.

Applied to the two rows above:

| workload | median ratio | best-run ratio | tolerance | verdict |
|---|---|---|---|---|
| `edit_distance` | 0.81 | 0.96 | ±21% (its own spread) | parity |
| `large_buffer_copy` | 1.18 | 1.18 | ±4% | **loss** |
| `blake3_chunk` (0.15 ms) | 1.04 | 1.06 | ±16% (the 25 µs floor) | parity |

## Read what was recorded

Since schema version 3 the verdict is written into the result file, so no reader has to recompute
it:

```json
"verdict": {
  "cpp": {
    "outcome": "parity",
    "ratio": 0.809,
    "best_ratio": 0.9631,
    "tolerance": 0.2126,
    "noise": 0.2126
  }
}
```

`outcome` is `win`, `parity` or `loss`. `ratio` and `best_ratio` are Prismio's time over the
other arm's, so below 1 is Prismio ahead. `tolerance` is what the medians were judged against and
`noise` is the spread it contains. The top level carries `parity` and a `noise_model` object with
`floor_ns` and a one-line statement of the rule, so a file explains its own verdicts.

The HTML report shows the same thing in the tooltip of each comparison pill: *Judged against ±21%
on medians, and best runs 0.96×*.

## How to read a disagreement

If a row is a loss and you doubt it, check the three numbers before the code:

```bash
python3 - <<'EOF'
import json
r = json.load(open("benchmarks/results/results.json"))
b = next(x for x in r["benchmarks"] if x["name"] == "large_buffer_copy")
print(sorted(b["languages"]["prismio"]["elapsed_ns_samples"]))
print(sorted(b["languages"]["cpp"]["elapsed_ns_samples"]))
print(b["verdict"]["cpp"])
EOF
```

- **Samples in two clusters** and equal minimums: timing modes. Parity is the right answer;
  rerun with more `--runs` if you need a number.
- **A smooth cloud, ratios agree, tolerance near 0.04:** a real difference. Time the phases of the
  workload separately in both languages before changing the compiler; the last real loss on this
  suite sat entirely in one phase.
- **Tolerance large because the spread is large:** the verdict cannot be trusted either way.
  Increase `--runs`, close other work, and check the power state recorded under `environment`.

## If you are changing this

The rule is implemented three times, and they must agree:

| where | role |
|---|---|
| `benchmarks/run.py`: `spread()`, `verdict()`, `verdicts()` | the source of truth; writes `verdict` and `noise_model` and colours the terminal |
| `benchmarks/templates/report.html`: `outcomeOf()`, `getOutcome()` | reads `verdict`; falls back to a flat 5% only for a file without one |
| `apps/web/lib/benchmarks.ts`: `computeVerdict()`, `calculateSpread()` | the website; uses the recorded `verdict`, and recomputes with the same rule from the samples when a file predates schema 3 |

After changing the rule, bump `SCHEMA_VERSION` in `run.py`, and check that the website's port still
reproduces the recorded verdicts: compare `computeVerdict()` with every `verdict` in
`apps/web/data/results.json`. Both must agree on every outcome and tolerance, because the website
page and the terminal summary describe the same run.

Things the rule deliberately does not do:

- **It is not a significance test.** Five samples a side cannot support a p-value, and the
  samples are interleaved rather than randomised, so they are not independent draws. It decides
  how much of a difference to believe, not how likely it is by chance.
- **It assumes noise only adds time.** A workload whose fastest run is an outlier in the other
  direction (a cache state the other runs never reach) would be judged on a minimum that is not
  representative. Look at the raw samples.
- **It does not call timing modes a defect in either language.** If one binary lands in the slow
  mode more often because of a systematic cause, for example process start-up that differs, that
  is a finding for a separate investigation, not something the verdict can surface.
- **The 25 µs floor was chosen from this host.** On a machine with faster process start it is
  generous. Change `NOISE_FLOOR_NS` and say why in the commit.

A related comparison trap the harness cannot see for you: an arm that is compiled with less
information is slower for reasons unrelated to the language. The Prismio arm is always built as
one whole program; the C++ and Rust arms are built with `-flto` and `-C lto=fat -C codegen-units=1`
so a constant passed across a file boundary reaches the code that uses it in all three. Without
that, `graph_bfs` divided by a run-time value in C++ and Rust and by a folded constant in Prismio,
and read as an 8% loss that C++ at the same constant did not show.
