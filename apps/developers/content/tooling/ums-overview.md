---
title: Unified Manifest System overview
description: The UMS architecture from build.ums tokens and AST through validation, dependency resolution, build planning, and command execution.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [ums, build-system, projects]
related: [tooling/build-manifest, tooling/build-graph-and-linking, tooling/compiler-host-and-promotion]
---

The Unified Manifest System turns a `build.ums` file into a validated project model and
executable build plan. It is a build and project system, not the language's source import syntax.

## Pipeline

`ums/parser` tokenizes and parses the manifest into its own AST. `ums/model/lowering.psm`
turns that syntax into workspace, package, target, dependency, and toolchain models.
`validation.psm` rejects inconsistent configurations before the builder creates commands.
`ums/dependency` discovers and resolves local dependencies. `ums/builder/build_plan.psm`
orders artifacts and native inputs. What each block, key and call accepts is in
[the manifest reference](/tooling/build-manifest).

Command behavior lives under `ums/commands`; `src/project/ums_cli.psm` connects project
commands to the compiler CLI.

## Responsibilities

UMS names source entry points, artifacts, profiles, dependencies, link inputs, and the optional
project-local compiler host. It does not perform language name resolution or replace `import`.
A dependency path becoming known to UMS does not automatically make every source below it
importable without the corresponding project/source-root behavior.

## Compatibility

The installed compiler reads a small stable bootstrap portion of a manifest before handing control
to a newer project-local host. New manifest syntax must preserve that bootstrap path or introduce a
versioned migration that an older installed compiler can diagnose clearly.

## Load pipeline

`umsDiscoverManifest(startDirectory, diagnostics)` walks toward the filesystem root until it
finds `build.ums`. `umsLoadProject` reads that file and delegates to
`umsLoadText(source, manifestPath, root, profile)`.

`umsLoadText` calls `umsLex`, `umsParse`, `umsProjectModel`, `umsLowerDocument`, and the
validation/build-plan functions. The resulting `UmsWorkspace` carries the AST, lowered project,
diagnostics, and build plan together; command code should not reparse the manifest or reconstruct
paths from text.

`umsProjectModel` initializes stable defaults. `umsLowerDocument` walks typed UMS statements
and fills package, workspace, target, dependency, command, toolchain, profile, and link models.
`umsBuildPlanCreate` selects the profile and orders buildable targets/dependencies.

## Command integration

`src/project/ums_cli.psm` provides the public commands:

- `initUmsProject` creates a minimal source tree and manifest;
- `buildUmsProject` loads the workspace, selects targets, configures native links, builds in plan
  order, and optionally runs the selected executable;
- `testUmsProject` selects test targets;
- `cleanUmsProject` removes profile artifacts through scoped project paths;
- `runUmsProjectCommand` executes a named manifest command; and
- `listUmsProjectCommands` prints available non-reserved commands.

`dispatchToUmsHost` runs before ordinary project command handling. It uses the bootstrap parser to
discover a project-local compiler host and forwards the original CLI when the active executable is
not already that host, but only to a host this machine promoted: promotion writes a
`<host>.trusted` stamp with the file's identity, and a host without a matching stamp is never
started (`P1077`). The path must be under `.prismio/`, so a cloned repository cannot choose a
program for `prismio` to run.

UMS errors are accumulated in a `Vec<UmsDiagnostic>`. `umsDiagnosticAdd` records a stable code,
manifest path, line, column, length and message; `umsDiagnosticsPrint` is the only human rendering
boundary. The codes are listed with their messages in [the manifest reference](/tooling/build-manifest#diagnostic-codes).

When extending UMS, follow data from token to AST to model to validation to build plan to command.
A field parsed but never lowered is dead syntax; a field lowered but never validated becomes a
late shell/compiler failure; a model value absent from the build plan cannot affect execution.
