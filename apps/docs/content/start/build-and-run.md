---
title: Build and run programs
description: Use the Prismio 0.1 command line to run source, build native executables, or emit LLVM IR.
status: stable
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [cli, build, run, llvm-ir]
related: [compiler/cli, compiler/targets, compiler/aif]
---

Use `run` for a compile-and-execute loop and `build` for a persistent artifact. Both commands begin with the same front end: resolve imports, lex and parse source, run semantic and ownership checks, perform allocation analysis, and generate LLVM IR.

```bash
prismio run main.psm
prismio build main.psm -o app
```

`run` is convenient during development because it performs the build and then launches the resulting program. `build` is the correct choice when another tool, test, or deployment step needs the output file.

## Entry file and imports

The input file is the entry module. Its directory is also the root used to resolve imports. An output ending in `.ll` emits LLVM IR without linking a native executable:

```bash
prismio build main.psm -o app.ll
```

For an entry path `project/src/main.psm`, `import model.user` resolves beneath `project/src`. Changing the working directory does not redefine that source root when the entry path still identifies the same file.

## Output modes

The output suffix selects an important build behavior:

- a normal executable path runs the LLVM/object/link pipeline;
- an output ending in `.ll` preserves textual LLVM IR and stops before native linking.

Emitted IR is useful for compiler debugging and backend inspection. It is not the canonical source-language specification and may change when lowering improves without a Prismio language change.

```bash
prismio build main.psm -o app.ll
llvm-as app.ll -o app.bc
```

The second command is optional and requires a compatible LLVM toolchain.

## Optimization levels

Optimization flags `-O0`, `-O1`, `-O2`, and `-O3` are accepted. The build driver currently invokes Clang at `-O2` when lowering generated IR to an object, so these front-end flags should not be treated as a stable end-to-end optimization contract yet.

Use `-O0` when inspecting the least-transformed front-end output and a higher level only after measuring the actual executable. Since the driver pipeline is still evolving, record the complete command and compiler version with performance comparisons.

## Analysis and verification

Add `--verify` to instrument allocation/free behavior, or `--debug` for conservative analysis. See the complete [CLI reference](/compiler/cli).

```bash
prismio build main.psm -o app --verify
prismio build main.psm -o app --debug
```

`--verify` helps test ownership-sensitive runtime behavior; it does not replace compile-time move checking. `--debug` changes analysis posture and is distinct from a general source debugger or guaranteed DWARF workflow.

Use the AIF subcommand to inspect allocation decisions without guessing:

```bash
prismio aif main.psm
prismio aif main.psm --why=1
prismio aif main.psm --summary
```

## Exit status and failures

When the compiler reports a lexical, parse, type, ownership, code-generation, or linker error, it exits unsuccessfully and does not run the application. A successfully launched program uses the result of `main() -> Int` as its process status under the current executable convention.

For reproducible bug reports, include the command, `prismio --version`, selected target, entry-file layout, and the first compiler diagnostic. If the failure appears after IR emission, also test `.ll` output to separate front-end generation from object/linker setup.
