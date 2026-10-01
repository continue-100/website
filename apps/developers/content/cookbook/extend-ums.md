---
title: Extend the UMS manifest
description: Carry a new build.ums capability through tokens, syntax, lowering, validation, planning, diagnostics, tests and bootstrap, with the manifest errors you will hit on the way.
status: stable
version: "0.1.0"
tags: [cookbook, ums, build-system]
related: [tooling/ums-overview, tooling/build-manifest, tooling/compiler-host-and-promotion, compiler/diagnostics]
lastUpdated: "2026-09-30"
---

A Prismio project has one manifest, `build.ums`, and `prismio build`/`run`/`test`/`clean` read it. When that manifest needs a new capability — a target field, a package rule, a dependency kind, a toolchain component — the question is not "how do I write the syntax" but **where in the pipeline that capability's one semantic owner belongs**, because a change entering at the wrong stage either can't see the information it needs or duplicates a rule that already exists somewhere else. **UMS**, the Unified Manifest System, is that pipeline: it is self-hosted Prismio code living at the repository root (`ums/`), not inside the compiler's `src/`.

## See it work

```bash
$P init demo
```

```text
created demo
  demo/build.ums
  demo/src/main.psm
  demo/.gitignore

build it with `cd demo && prismio run`
```

`init` writes a minimal manifest — no empty metadata placeholders:

```text
project {
    name = "demo"
    version = "0.1.0"
    prismio = "0.1.0"
}

targets {
    executable("demo") {
        entry = "src/main.psm"
    }
}
```

```bash
cd demo && $P build && $P run
```

```text
Built .../demo/.prismio/build/debug/demo
Built .../demo/.prismio/build/debug/demo
Hello, Prismio!
```

That round trip — text in, an executable and a run out — is what every extension below has to keep working. The path from text to command is explicit and every new capability sits on it somewhere:

```text
umsDiscoverManifest() -> umsLex() -> umsParse() -> umsLoadText() -> model validation
  -> umsBuildPlanCreate() -> project command execution
```

## Add the capability at its earliest owning stage

Define the project problem before adding syntax. A target field, package field, dependency rule, or toolchain component should have **one** semantic owner in the UMS model. Place the change at the earliest stage that needs the new information: a new spelling touches the parser; a new constraint over existing fields may need only model validation; a different ordering rule belongs only in the plan.

1. **Extend the grammar** in `ums/parser/token.psm`, the lexer, the AST, and the parser. The parser AST stays generic — assignments, scalar values, flat scalar arrays, calls, arguments, nested blocks — so most new *sections* need no lexer or parser change at all (see the worked example below).
2. **Lower syntax into a typed model.** `umsLoadText()` turns the parsed `UmsAstDocument` into a `UmsProjectModel` — its project metadata, targets, dependencies, commands, and workspace. Use the existing constructors (`umsTarget()`, `umsLinkInput()`, `umsCommand()`, `umsCommandStep()`, `umsCommandArgument()`) instead of building nodes by hand, and the existing lookups (`umsTargetFind()`, `umsDependencyFind()`, `umsCommandFind()`) instead of duplicating name rules.
3. **Validate incompatible combinations before producing commands.** Report through `umsDiagnosticAdd()` and print with `umsDiagnosticsPrint()`. Give each failure a stable `UMSxxxx` code, a source path, and a span, and explain the incompatible fields — don't postpone an invalid manifest until Clang or the linker emits a less local error.
4. **Update discovery and resolution** when the feature affects paths or dependencies.
5. **Teach `umsBuildPlanCreate()`** (in `ums/builder/build_plan.psm`) the ordering and native command consequences. If a field affects native linking, preserve its semantic kind through `UmsLinkInput` instead of flattening it into a shell string; command steps distinguish executable, arguments, forwarding, and environment so platform quoting stays an execution concern.
6. **Add a canonical writer representation** in `ums/model/manifest_writer.psm` if generated manifests need the field. `umsManifestAddDependency()` edits source text — comments, whitespace, and declaration order stay byte-for-byte unchanged — rather than serializing the model, because serializing would erase formatting the model doesn't represent.
7. **Emit source-located diagnostics** for invalid input, and keep `umsProjectHost()`'s stable prefix readable by an older parent (see "If you are changing the host boundary" below).

Test successful parsing, round-trip writing where relevant, validation failures, path normalization, graph ordering, generated commands, host forwarding, and platform-specific quoting. Add fixtures under `ums/tests/fixtures` and assertions in `ums/test_ums.psm`, then run project-level tests through `prismio build`, `run`, `test`, and any custom command, so the compiler-facing `src/project/ums_cli.psm` path is covered as well as the model in isolation.

## What a broken manifest looks like

Validation catches problems at the earliest stage that can see them, and the error names exactly the field. An unknown project property:

```bash
echo 'project {
    name = "demo"
    version = "0.1.0"
    prismio = "0.1.0"
    flavor = "chocolate"
}

targets {
    executable("demo") { entry = "src/main.psm" }
}' > build.ums
$P build
```

```text
build.ums:5:5: error[UMS2004]: unknown project property 'flavor'
```

A missing closing brace does not fail at the point of the typo — the parser recovers and keeps going, so three diagnostics come back naming different symptoms of the same missing `}`:

```text
build.ums:11:1: error[UMS1101]: expected '}', found end of file
build.ums:6:1: error[UMS2003]: project metadata contains properties, not nested DSL calls
build.ums: error[UMS2307]: at least one build target is required
```

Read these bottom-up when there are several: `UMS2307` ("at least one build target") is a downstream consequence of the parser folding `targets { ... }` into `project { ... }` once the brace that should have closed `project` didn't. Fix the earliest one first and re-run — the later ones usually disappear with it.

A manifest can also be syntactically fine and still rejected because it collides with the CLI's own verb list. `commands { command("build") { ... } }` is well formed UMS, but `build` is a built-in:

```text
error[P1062]: a project command cannot be named `build`
  note: that name is a built-in command and built-ins win; rename it in build.ums
```

This is deliberate, and it is a CLI decision, not a UMS one: `init`, `build`, `run`, `test`, `clean`, `check`, `bootstrap` (which now only reports that it was removed, `P1034`), `aif`, `dump-ast`, `runtime-hash` and any name ending `.psm` are reserved because `src/main.psm` dispatches them directly -- `prismioBuiltinCommands` in `src/project/commands.psm` is the one list, read by the `P1062` check and the `P1039` note -- and UMS validates a command's *shape* without knowing that list itself.

## A worked example: adding a project command needs no grammar change

`commands` is the clearest illustration of "place the change at the earliest stage that needs it," because that stage turned out to be **validation and lowering only** — the generic parser already produced everything a command needed. Renaming the reserved command above to something free:

```bash
cat > build.ums << 'EOF'
project {
    name = "demo"
    version = "0.1.0"
    prismio = "0.1.0"
}

targets {
    executable("demo") {
        entry = "src/main.psm"
    }
}

commands {
    command("greet") {
        description = "Build and run demo, then say hi"
        build("demo")
        run("demo")
    }
}
EOF
$P build && $P greet
```

```text
Built .../demo/.prismio/build/debug/demo
Built .../demo/.prismio/build/debug/demo
Built .../demo/.prismio/build/debug/demo
Hello, Prismio!
```

`greet` runs as a first-class project verb after only a lowering, validation, and dispatch-hook change — no lexer or parser edit — because a named block of calls with arguments is exactly what the parser already produces for any DSL section. `run("demo")` re-resolves `"demo"` against the declared targets and works out it means "build then execute" from that lookup, the same rule that lets `run("tools/x.py", ...)` mean "run under this host's Python" and `run("x.psm", ...)` mean "compile then execute" — three different actions from one step form, because the manifest author's question is "run this," not "which launcher does this need." Anything `run` cannot resolve is a manifest error rather than a guess; `shell(...)` is the deliberate escape hatch for what it genuinely cannot start, such as a `.sh` script, which is also why the project's own tools are Python rather than shell.

## If you are changing the host boundary

Two constraints are specific to `toolchain.host` and worth knowing before you touch manifest syntax that the compiler's *own* `build.ums` would need to use.

**A global `prismio` reads only the stable `toolchain` prefix, never the rest of the manifest.** If a project-relative host at `toolchain.host` exists and starts, the global launcher forwards the original argument vector and working directory to it unparsed, and that host parses the full manifest — including any syntax newer than the global compiler understands. Global Prismio only becomes "stage 0" and parses the manifest itself when no usable host is configured. "Exists and starts" is deliberately not the whole test: a host from an older toolchain generation can start but still emit code naming runtime symbols the installed runtime no longer defines, so the launcher additionally asks the host to compare its own `PRISMIO_HOST_ABI` before trusting it, and rebuilds the host first on a mismatch (`P1064` reports that it did).

**This is why new `build.ums` syntax is free in the parser but not yet usable by the compiler's own manifest.** The compiler repository's `build.ums` is read by whatever compiler generation is currently promoted as its own host. A parser change lands the moment it's merged, but `src/`'s own manifest can't rely on the new syntax until a compiler that parses it has been promoted through the same `toolchain.host` mechanism — otherwise you'd be relying on a host to parse a manifest describing how to build its own replacement, before that replacement exists. Land the parser and model change first, prove it on a scratch project (as above), and only adopt the new syntax in this repository's own `build.ums` once a generation that understands it is the current host.

A `build` step may also never name the `toolchain.host` target itself: rebuilding the host stages a `.next` candidate that the global parent only promotes after the current process exits, so every later step in the same command would still be running the previous compiler while reading as though it ran the new one. `prismio build` — the built-in, outside any custom command — is how the host is rebuilt.
