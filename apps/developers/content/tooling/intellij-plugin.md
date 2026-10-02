---
title: The IntelliJ plugin
description: How the Prismio plugin for JetBrains IDEs finds a compiler, checks files through it, builds run configurations, and creates projects, and what must change with the compiler.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-02"
tags: [ide, intellij, plugin, tooling]
related: [tooling/ide-protocol, tooling/ums-overview, tooling/compiler-host-and-promotion, compiler/diagnostics, start/repository-tour]
---

The plugin is a separate repository, `intellij-plugin`, beside the compiler. It reads the compiler's behaviour rather than linking it: errors come from `prismio check`, the standard library from the toolchain's files, and projects from the same files `prismio init` writes. That makes it fragile in one direction only: when the compiler changes, a table in the plugin may be stale and nothing fails until someone looks.

Users of the plugin should read [the user guide](https://docs.prismio.org/guides/intellij). This page is for changing it.

## Build and test

```bash
cd ../intellij-plugin
./gradlew test --offline -Dprismio.checkout=/path/to/prismio   # the corpus tests need a checkout
./gradlew verifyPlugin buildPlugin --offline                    # compatibility, then the zip
./gradlew verifyPlugin --offline -Pprismio.verifyIdes="/path/CLion.app:/path/WebStorm.app"   # more IDEs
```

It targets IntelliJ Platform 2026.2.1 with a Java 26 toolchain emitting Java 25 bytecode. JFlex and Grammar-Kit are not available offline, so neither is used. Without `-Dprismio.checkout` the corpus tests skip silently and a green run proves less than it looks.

`verifyPlugin` runs against two IDEA builds by default, plus any IDE installs named in `-Pprismio.verifyIdes` (paths separated by `:`; the property is optional so a contributor with one IDE still builds). The plugin claims every JetBrains IDE, so run it against the IDEs you have before a release: it is the only thing that says a platform API exists there. It is the gate for API use: an `@ApiStatus.Experimental` API is a warning, an `@ApiStatus.Internal` one fails the build. The plugin has six experimental warnings, all from `InlineDocumentationProvider`, which has no stable replacement. Do not reach for an internal class to get a feature; there was one (see [documentation comments](#documentation-comments)).

## What must follow the compiler

Both lexers are hand-written and there is no generated source. A contextual keyword (`private`, `dyn`, `pin`, `produce`) is reserved in one position and an identifier in another, which a regular expression cannot decide.

| Plugin file | Follows |
|---|---|
| `lexer/PrismioLexer.java` | `src/lexer/scanner.psm` |
| `lang/PrismioWords.java` | `src/lexer/token.psm`, `src/ast/types.psm`, `src/parse/decl.psm` |
| `ums/UmsLexer.java` | `ums/parser/lexer.psm` |
| `ums/UmsWords.java` | `ums/model/lowering.psm` |
| `wizard/PrismioProjectStep.java` | `initUmsProject` in `src/project/ums_cli.psm` |
| `symbols/CompilerIntrinsics.java` | `src/sema/vec.psm`, `array.psm`, `channel.psm` |

`PrismioLexerCorpusTest` lexes every `.psm` and `.ums` in a checkout and fails on a bad character or an offset gap; `PrismioFormatterTest` reformats each file and asserts the token stream is unchanged. Run both after a change to the scanner or to syntax. `CompilerIntrinsics` is the one table that checks itself: it probes the compiler once per binary, and a member that compiler rejects is not offered.

The PSI is a flat token list. A `PsiReferenceContributor` is never asked about a bare leaf, so identifiers have their own PSI class through `lang.ast.factory`; references, Find Usages and Rename are built on that.

## Finding the compiler

`PrismioToolchainService` returns the first of:

1. the path in Settings, if it is a working executable;
2. in a trusted project only, the host the manifest declares as `toolchain.host` (and only with its `.trusted` stamp beside it, the launcher's own rule), then `.prismio/build/debug`, `.prismio/build/release` and `.prismio/bin`;
3. `PRISMIO`, then `PRISMIO_HOME/bin`;
4. `PATH`;
5. `~/.prismio/bin`, `~/.local/bin`, `/usr/local/bin`, `/opt/homebrew/bin`.

Two rules are deliberate. A project-local compiler runs on every edit, before the user has done anything but open the project, so it is never used in a project the IDE does not trust: a repository can commit a `.prismio/`. And `PATH`, `PRISMIO` and `PRISMIO_HOME` are read with `EnvironmentUtil`, not `System.getenv`, because an IDE started from the Dock has launchd's environment and never sees what a shell profile added. `detectInstalledCompiler()` is steps 3 to 5 with no project, which is what the New Project wizard and Auto-Detect use; Auto-Detect deliberately ignores the saved path, or it could only ever return it.

The standard library is found from the compiler's location and never configured: a checkout's `std/` of sources, or an installed toolchain's `stdlib/` of `.plib` files, reached through any symlink. `StdlibIndex` reads either (`.psm` winning) and rebuilds when a fingerprint of the directory changes. A `.plib` carries its interface source, so the plugin parses the same text the compiler does and hardcodes no member names. A std path in `PrismioProjectSettings` still exists, for tests, and has no UI.

## Checking a file

`PrismioExternalAnnotator` runs `prismio check <entry> --diagnostic-format=json --overlay <file> <buffer> [--module m]`, as [the IDE protocol](/tooling/ide-protocol) describes. The details that are the plugin's own:

- **The buffer is a temp file outside the source tree.** A file beside the sources would be one more module to any `import pkg.*` of that directory, in this check and in a build running meanwhile.
- **Output goes to a file, not a pipe.** A long report fills a pipe, the compiler blocks writing it, and the timeout then discards everything.
- **Which program?** `PrismioCheckTarget.plan` returns, in order: the file itself if it declares `main`; `std.<leaf>` for a module of a standard-library directory (recognised by `io.psm` and `string.psm` beside it, so a project folder called `std` is not given the library's access); the `entry` of each target in the nearest `build.ums`; any program in the file's directory or an ancestor that imports it by its module name. With no manifest, the search stops at the project directory, and a file outside any project is looked for in its own folder only. The file alone is the last resort.
- **A program that never reads the file** answers P1075 and the next is tried. A result is cached per file and dropped on the same signal.
- **Launcher status is not the file's.** P1077, P1052, P1064 and P1065 describe which compiler serves the project, not the file, and are dropped. A compiler that answers P1026 for `--overlay` predates the flag, and one banner says so instead of showing its errors.
- **Errors elsewhere** in the program may stop the check before it reaches this file; one note says so rather than a mark on the file.
- **Cancel and timeout.** The check polls for cancellation every 50 ms and stops after 15 s. Both kill the process and its descendants, because the launcher forwards to a compiler of its own and destroying only the one started leaves the other running.

## Run configurations

`UmsRunConfigurations` reads every `build.ums` in the project, ignoring ones below `.prismio/`, `build/`, `fixtures/`, `testData/`, `node_modules/` and `.git/` — judged against the path inside the project, so a project that itself lives under `~/build/` still gets entries. It creates one configuration per executable target, plus Build, Test and a configuration per `command`, and syncs again when a `build.ums` is saved, created, moved or deleted. A configuration it generated is removed when its target leaves the manifest; one a user made or copied is never touched.

`PrismioRunProfileState.arguments` maps a configuration to a command line. Program arguments follow a `--`, because without it `prismio run` reads them as its own and refuses the first it does not know (P1050). A program's exit status is the process's, so "exit code N" is the program's answer.

**Colour.** The IDE console is a pipe, so a program asks `isatty` and gets no. The plugin therefore sets `FORCE_COLOR=1` (unless `NO_COLOR` or `FORCE_COLOR` is already set) and starts the process with `ProcessHandlerFactory.createColoredProcessHandler`: a plain `OSProcessHandler` does not decode escape sequences, and the console would print them as text. On the runtime side, `prismio_rt_color_supported` in `runtime/program_support.c` is what `std.term` asks; it answers yes for `FORCE_COLOR` or `CLICOLOR_FORCE` (other than `0`) on a pipe, and `NO_COLOR` still wins. The compiler's own diagnostics (`runtime/diagnostics.c`) have honoured the same variables from the start. A toolchain built before that runtime change prints plain text in the IDE.

`PrismioConsoleFilter` links every `file.psm:line:col` on an output line, resolving it against the project, then the file system, then by file name.

## Creating projects

**File | New | Project | Prismio** is two classes, because the IDEs do not share a New Project dialog. A `GeneratorNewProjectWizard` works only where the Java plugin is, which is IntelliJ IDEA; CLion, PyCharm, WebStorm, Rider and RustRover list `DirectoryProjectGenerator`s instead. Both are registered, and both write the same project through `PrismioProjectFiles` and ask for the compiler through `CompilerSelector`, so the two dialogs cannot drift. IDEA shows Prismio once.

**IntelliJ IDEA** (`PrismioNewProjectWizard`): the steps chain as root, `NewProjectWizardBaseStep` (name and location), `GitNewProjectWizardStep` (the platform's own "Create Git repository"), then `PrismioProjectStep`.

**The other IDEs** (`PrismioDirectoryProjectGenerator`): two things are easy to get wrong, and both left CLion's dialog with a Location field and nothing else.

- The generator must also implement `CustomStepProjectGenerator` and return a `ProjectSettingsStepBase`, as CLion's own Rust and Meson generators do. Without it CLion shows a default step that draws only Location.
- The panel comes from `ProjectGeneratorPeer.getComponent(location, checkValid)`, which receives CLion's Location field. The no-argument `getComponent()` is deprecated, and `buildUI(SettingsStep)` is for dialogs that build a settings step; override the first.

That dialog has no Name or Git option, so the peer adds them. Name and the Location field are one fact told twice: the name is the last folder of the location, each rewrites the other, and a guard stops the two listeners from calling each other. "Create Git repository" calls `GitRepositoryInitializer.getInstance()` after the files are written, off the UI thread, and is not offered when that is null (no Git plugin).

**The compiler row** (`CompilerSelector`) refuses to create until `compiler --version` answers with a first line `prismio <version>`; the version it read becomes the manifest's `prismio` line, as `init` writes `PRISMIO_VERSION`. The check runs off the UI thread as the field changes, and validation falls back to asking again synchronously if it has not returned; the other dialog is told to validate again through the `checkValid` runnable. A compiler other than the one `detectInstalledCompiler()` finds is stored in the new project's settings; the default stores nothing, so there is no setting to go stale when the toolchain moves.

The files are `build.ums`, `src/main.psm` and `.gitignore` containing `.prismio/`, written only where absent. The project name is the chosen name with anything `umsValidName` would refuse replaced by `_`, so the plugin cannot write a manifest the compiler then rejects.

**New | UMS Manifest** writes `build.ums` with no prompt, because it is the only name the compiler and the plugin read, and names the project after the folder.

## Documentation comments

The compiler has no documentation syntax. The scanner skips every comment, `/** */` included, so the plugin's lexer makes the rule: `/**` followed by something other than `/` or `*` is a `DOC_COMMENT`, so `/**/` and `/***/` stay ordinary block comments. `///` is read as prose by the same convention. Anything that looks for comments must handle both token types, which is the easy thing to miss: the formatter, the Enter handler and several token scans once recognised only `BLOCK_COMMENT`.

`PrismioBlockCommentPostFormatProcessor` indents the lines inside a multi-line comment whose opener is alone on its line, and keeps a comment with a star on every line aligned one column in under the opener. It changes a comment's text, so a comment already in that shape must come out unchanged; the checkout formatter test fails on a flattened starred comment.

Rendering is IntelliJ's global "Render documentation comments" setting. The only per-editor switch, `DocRenderManager`, is `@ApiStatus.Internal` and `verifyPlugin` fails on it, so the plugin sets the global setting once, guarded by a stored flag, and never again; a user who turns it off keeps it off.

## Before a release

Run the tests with a checkout, `verifyPlugin`, and `buildPlugin`; read the verifier's output rather than its exit code, since an experimental warning and a deprecated API look alike in a summary. Check the version in `build.gradle.kts` is not one already on the Marketplace. The plugin installs only in 2026.2 or newer, so a 2026.1 IDE (the PyCharm and Rider installs a contributor may have) cannot load it and is not a test target. The New Project dialog is the one place the IDEs differ and the verifier cannot see, so open it in IDEA and in CLion by hand: a missing row looks like a pass to the verifier.
