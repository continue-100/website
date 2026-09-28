---
title: Debug a compiler or AIF regression
description: Reduce a Prismio frontend failure, miscompile, ownership bug, or allocation-decision change to one file, then find the exact pipeline stage that changed.
status: stable
version: "0.1.0"
tags: [cookbook, debugging, aif]
related: [tooling/debugging-targets-and-build-tracing, performance/investigation-method, testing/regression-suite, compiler/overview, compiler/diagnostics, testing/aif-differential]
lastUpdated: "2026-09-18"
---

A program that used to compile, or used to compile to the same thing, no longer does. Nothing in the message says which of the compiler's seven stages changed — lexer, imports, semantic analysis, the **Adaptive Inference Framework** (AIF, the pass that decides where each value your program allocates should live — see [the compiler overview](/compiler/overview)), LLVM code generation, optimization, or the native link. This page is the path from "something regressed" to "this stage, this line, this cause."

## Reduce, then find the stage

**1. Pin down the compiler and the input.** Record the exact compiler path and run `--version` before touching source — a regression chased against the wrong binary wastes every step after it.

```bash
$P --version
```

```text
prismio 0.1.0
llvm 23.1.1
compiler ~/prismio/.prismio/build/debug
stdlib ./std
```

**The trap:** inside the compiler checkout, a bare `prismio` is not the compiler you built. `prismio init`/`build`/`run` at the repository root are project commands, and the checkout's own `build.ums` names `.prismio/build/debug/prismio` as its `toolchain.host` — so global `prismio` silently forwards to that project host and prints a line saying so before anything else:

```text
Using local toolchain: ~/prismio/.prismio/build/debug/prismio
prismio 0.1.0
...
```

If you are comparing two builds, call each one **by path** (`$P` in this page always means `.prismio/build/debug/prismio`, never bare `prismio`). Two measurements taken through the launcher can silently measure the same forwarded compiler twice.

**2. Reduce to the smallest source that still reproduces it.** A project failure should also be reduced to a direct single-file command when possible — that separates the **Unified Manifest System** (UMS, the `build.ums` project layer) planning a build from the compiler actually running one. If a program with no imports still disagrees, the bug is in something every program touches.

**3. Run the stage probes in order.** Each stops the pipeline at a different point, so the first one whose output looks wrong tells you which stage owns the regression:

| Command | Runs through | Excludes |
| --- | --- | --- |
| `$P check file.psm` | semantic analysis | native codegen, object emission, runtime link |
| `$P dump-ast file.psm` | semantic analysis | shows the post-sema nodes AIF and the oracle read |
| `$P aif file.psm --manifest` | AIF | shows stable per-site decisions and exclusions |
| `$P aif file.psm --why=<id>` | AIF | shows the witness forcing one decision |
| `$P build file.psm -o out.ll` | LLVM IR generation | the native link, optimization |
| `$P run file.psm --jit` | JIT (just-in-time) execution | the native object/link path, for comparing against it |

`check` prints nothing on success. Given this program:

<!-- prismio-check: pass -->
```prismio
fn add(a: Int, b: Int) -> Int {
    return a + b
}

fn main() -> Int {
    return add(2, 3)
}
```

```bash
$P check bare.psm
echo "check exit: $?"
```

```text
check exit: 0
```

`dump-ast` shows why: it prints the same checked tree AIF and `aif/prototype/aif.py` (the independent oracle described in [the AIF differential](/testing/aif-differential)) consume, as JSON — one node per declaration, each carrying its file id, source position, and resolved type:

```bash
$P dump-ast bare.psm
```

```text
{"format":"aif-ast","version":1,"source":"bare.psm","compiler":"0.1.0","files":[{"id":0,"path":"bare.psm"}],"decls":[{"k":"FUNCTION","s1":"add","s2":"add__Int_Int", ...
```

If `check` and `dump-ast` disagree — one accepts a program the other's serialization garbles — the dump serializer or the analysis-only driver path is the suspect, not sema itself.

**4. If storage differs, ask AIF why.** `aif --manifest` lists every allocation site AIF found with its tier and placement. Take a program with an allocation in its own code:

<!-- prismio-check: pass -->
```prismio
import std.io

fn build() -> Vec<Int> {
    let mut xs: Vec<Int>
    xs.push(1)
    xs.push(2)
    return xs
}

fn main() -> Int {
    let xs: Vec<Int> = build()
    println(xs[0])
    return 0
}
```

```bash
$P aif listy.psm
```

```text
AIF analysis
  Source   listy.psm
  Result   converged in 7 rounds
  Sites    6 potential allocation site(s), not runtime allocation counts

Your code
ID   location                 type            storage                           reason
1    listy.psm:4:25           Vec<Int>        arena:auto                        caller region selected
...
Use `--why=<ID>` for one decision or `--manifest` for compiler/CI details.
```

`--why=<id>` explains exactly that one decision — the compiler evidence, not just the conclusion:

```bash
$P aif listy.psm --why=1
```

```text
Allocation 1
  Location   listy.psm:4:25
  Type       Vec<Int>
  Storage    arena:auto
  Reason     caller region selected

Compiler evidence
  Symbol     build__Void#0
  Tier       T2
  Thread     Isolated

  minimal cause
    E rose to Caller
      <- E-RETURN  listy.psm                            7:12

  placement
    region:auto  -- bump-allocated, and released in bulk when the region exits
      note     the `region` is in a caller and this call was bracketed
               (SPEC 5.2.1.1 regime (a)). A second call to this function
               removes the placement; the manifest lists the bracket.

  repairs, cheapest first
    1. have the caller allocate and pass it in                  restores T1, no runtime cost
    2. pin(T1) on the binding                     rejected -- inference converged, so this is proven false
```

**5. Diff two manifests instead of reading them by eye.** `tools/aif_manifest_diff.py` takes two `--manifest` captures and reports what changed, by symbol rather than by line:

```bash
python3 tools/aif_manifest_diff.py --help
```

```text
usage: aif_manifest_diff.py [-h] [--allow-regressions] [--compiler COMPILER]
                            [--source SOURCE] [--owned-collections]
                            old new
...
  --compiler COMPILER  a prismio binary. Given one, each regression is
                       followed by its minimal cause and ranked repairs (SPEC
                       6.3); without one, only the fact that it regressed is
                       reported
```

Wrapping both of `build`'s results in a second Vec — so each escapes into a container instead of returning straight to `main` — is a real, if small, storage change. Capture a manifest before and after, and diff them:

```bash
$P aif listy.psm --manifest > old.manifest
$P aif listy3.psm --manifest > new.manifest   # listy.psm, but both build() results pushed into a Vec<Vec<Int>>
python3 tools/aif_manifest_diff.py old.manifest new.manifest --compiler $P --source listy3.psm
```

```text
warning: different sources (listy.psm vs listy3.psm) -- the diff below compares by symbol

1 new site(s): main#0

0 regression(s), 0 improvement(s), 1 added, 0 removed (of 6 -> 7 records)
```

Read the "0 regression(s)" carefully: the tool flags a symbol whose **tier** got worse (a site that was T1 and is now T2, for example). In this run `build`'s own site stayed T2 in both manifests even though its `placement` column changed from `region:auto` to `owned` — escaping into a second collection changed where the value can be released, but not the tier the diff tool tracks. A placement-only change is real and worth reading the manifest for by eye; the diff tool will not surface it as a regression.

## What failure looks like

A parse error, a type error, and a native link failure are covered on the [compiler overview](/compiler/overview#which-stage-rejected-my-program) — read that first if you have not seen one. The case worth adding here is the one that does **not** show up where you would expect: an AIF rejection.

`pin(T1)` asserts a specific storage tier for a binding. When AIF's analysis converges on a different, provably incompatible tier, that is a proven-false assertion about the program, not a limit of the analysis — and it is rejected. But `check` and `aif` do not enforce it:

<!-- prismio-check: fail -->
```prismio
import std.io
import std.string

fn escapes() -> String {
    let pin(T1) s = "ab".concat("cd")
    return s
}

fn main() -> Int {
    let got = escapes()
    return 0
}
```

```bash
$P check pin_refuted.psm; echo "check exit: $?"
$P aif pin_refuted.psm >/dev/null; echo "aif exit: $?"
```

```text
check exit: 0
aif exit: 0
```

Both stage probes pass silently. The rejection only happens on a full `build`, because that is where AIF's placement decisions are checked against declared pins:

```bash
$P build pin_refuted.psm -o pin_refuted.ll
```

```text
error[P5002]: pin(T1) cannot hold: this value is T2
    --> ~/prismio/.prismio/build/stdlib/string.plib:2126:35
     |
2126 |         if (total <= 12) { return __builtin_string_concat_inline2(self, other) }
     |                                   ^
  note: inference converged, so this is a proven-false assertion rather than a limit of the analysis
error[P5002]: pin(T1) cannot hold: this value is T2
    --> ~/prismio/.prismio/build/stdlib/string.plib:2127:19
     |
2127 |         let out = str_with_capacity(total)
     |                   ^
  note: inference converged, so this is a proven-false assertion rather than a limit of the analysis
error: aborting due to 2 previous errors
```

Two things to notice when this is the failure you are chasing: the stage-probe table above does **not** promise every rejection at the earliest possible stage — `check`/`aif` model AIF's conclusions, but a pin is checked against them later, in the same pass `build` runs. And the error locations point into `string.plib` — the site whose inferred tier conflicts with the pin — not at the `pin(T1)` annotation itself. Read `error[Pnnnn]` codes by their group (driver `P10xx`, AIF `P50xx`, here `P5002`) on the [diagnostics page](/compiler/diagnostics) when the location alone does not explain the mismatch.

## Classifying the rest

- If `check` fails unexpectedly, inspect tokens, AST, imports, symbols, and sema.
- If `check` succeeds but IR (intermediate representation) emission fails, inspect resolved types and the LLVM bridge request.
- If LLVM verifies but execution is wrong, compare unoptimized IR, optimized IR, and final assembly.
- If values corrupt around moves or views, inspect ownership state, return provenance, and drop edges.
- If storage differs, run `prismio aif`, `--why`, and `--manifest` as above.
- If native linking fails, inspect target, runtime discovery, UMS inputs, and the generated command.

To distinguish program lowering from cross-module optimization, compare the program's own IR (`-o out.ll`, emitted before any library bitcode is merged) against the built executable — the merge itself cannot be switched off. Use build tracing (below) for cold-build regressions. Run the verifier, but pair its ledger with value assertions and sanitizers.

If JIT and native disagree, inspect `ir_jit_run_main()` versus `compiler_build_executable()` and the target/runtime link inputs. If compiler and oracle summaries disagree, run `tools/aif_differential.py` on only the reduced source and compare the named counter — see [the AIF differential](/testing/aif-differential) for how to read that output.

## Build tracing and object caching

`PRISMIO_BUILD_TRACE=1` reports build phases:

```bash
PRISMIO_BUILD_TRACE=1 $P build listy.psm -o listy
```

```text
[build trace] library bitcode merge        10.4 ms
[build trace] program -O3 (whole program)    122.1 ms
Built listy
```

`PRISMIO_OBJ_CACHE_TRACE=1` prints one line per toolchain object saying whether it came from the cache, and `PRISMIO_OBJ_CACHE=0` bypasses the cache entirely. Both apply to C sources a target's `native` block names -- the compiler's own build has eight -- not to an ordinary application build: running `PRISMIO_OBJ_CACHE_TRACE=1` against `listy.psm` above prints nothing, because no toolchain object needed compiling. Reproduce with object caching disabled only *after* a default run, and keep both results — the two are answering different questions.

## Running one fixture instead of the whole suite

Once you have a reduced, failing program, add it to `tests/` and run just that fixture rather than the full suite while iterating:

```bash
python3 tools/run_suite.py --no-interactive -k neg_20_pin_refuted
```

```text
Found 0 positive test(s)
Found 1 negative test(s)
Running file fixtures on 8 worker(s)

  [  1/1] (100%) ok     0.21s  neg_20_pin_refuted

  file fixtures: 0.2s (1 passed, 0 failed)
Passed: 1
Failed: 0
Total:  1

All selected tests passed!
suite: testing a copy of .prismio/build/debug/prismio
```

Once isolated, add the failing program before changing implementation. Preserve an artifact assertion when the bug depends on IR shape, symbol presence, layout, or generated metadata. Run the full suite and fixed-point checks after the focused case passes.

## Comparing two compiler builds

Sometimes the question is not "what does this program do" but "when did this program start doing that" — a bisection across commits. This needs two full toolchain layouts (a bare `build/genN` has no `lib/` or `stdlib/` beside it, so a compiler binary alone will not run programs), so it does not fit in a single checkout:

1. Add a second checkout with `git worktree add ../prismio-old <commit>` rather than switching branches in place.
2. Build each worktree's own compiler and let it promote its own `.prismio/build/debug/prismio` toolchain layout.
3. Copy each generation's whole `bin/` + `lib/` + `stdlib/` layout somewhere stable, so a later `prismio build` in either worktree cannot overwrite the binary you are about to compare.
4. Run the same reduced program through both compilers **by path** — never bare `prismio` (see the trap above) — and diff `--manifest` output, or the emitted `.ll`, between them.

This is a description, not a recipe to run casually: building a second full generation is expensive, and both copies must be complete toolchain layouts or the comparison silently falls back to whatever compiler a bare invocation would have forwarded to.

## If you are changing the compiler to fix what you found

For self-hosting regressions, build `gen1` and `gen2` from the same candidate and compare normalized IR through the release gate. A generation difference that stabilizes can be an intentional compiler change; a difference that keeps moving is a bootstrap defect. Do not refresh the committed seed to hide either case.

**Never make a compiler/oracle disagreement go away without establishing which side was wrong.** An agreement on a wrong answer is worse than a failure: `list_set`'s stored-value index was off by one in both implementations identically, and the agreement hid it for a full release cycle.
