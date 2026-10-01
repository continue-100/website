---
title: build.ums manifest reference
description: The syntax of build.ums, every block, key and call with what it accepts and its default, and every UMS diagnostic code with its message and fix.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [ums, manifest, reference, diagnostics]
related: [tooling/ums-overview, tooling/build-graph-and-linking, tooling/compiler-host-and-promotion, compiler/diagnostics, cookbook/extend-ums]
---

A `build.ums` file, read by the Unified Manifest System (UMS), says what a project is, what it builds, and which commands belong to it. Everything Prismio needs to build a project comes from this one file, and a manifest that is wrong is refused with a code and a line before any compiler work starts. This page is the lookup: the syntax, each block and what it accepts, and a table of every diagnostic the manifest can produce with the change that fixes it. For the same material written as a guide to using the package manager, see [the package manager page](https://docs.prismio.org/package-manager).

## A manifest that uses everything

This manifest declares one of everything the language has. It loads, builds, runs its test, and runs its command with the compiler in this repository.

```ums
// Every block, key and call build.ums accepts.
toolchain {
    host = ".prismio/build/debug/prismio"
}

project {
    name = "full-example"
    version = "1.4.0-rc.1+build.7"
    prismio = "0.1"
    description = "Uses every declaration"
    licenseFile = "LICENSE"
    authors = ["Ada Lovelace", "Grace Hopper",]
}

profiles {
    debug {
        overflowChecks = false
    }
    release {
        debugInfo = true
    }
}

targets {
    executable("app") {
        entry = "src/main.psm"
        runtime = "installed"
        exportDynamic = false
        native {
            source("c/util.c")
            include("c/include")
            define("MODE=fast")
            flag("-Wextra")
            responseFile("flags.rsp")
        }
        link {
            library("m")
            search("vendor/lib")
            responseFile("link.rsp")
        }
    }
    test("parser") {
        entry = "tests/parser.psm"
    }
}

dependencies {
    implementation("json", "1.2.0", "../json")
    testImplementation("mock", "0.3.0", "../mock")
}

commands {
    command("notes") {
        description = "Print the notes"
        build("app")
        run("tools/notes.psm")
        run("app", "--verbose", args)
        shell("echo", "done")
    }
}
```

Only `project` and at least one target are required. The smallest useful manifest is what `prismio init` writes:

```ums
project {
    name = "hello"
    version = "0.1.0"
    prismio = "0.1"
}

targets {
    executable("hello") {
        entry = "src/main.psm"
    }
}
```

## Syntax

The syntax is small and has no keywords. Every name in a manifest is an identifier, and the meaning of `project`, `targets` or `executable` is decided afterwards, by [lowering](#if-you-are-changing-the-manifest), from where the name sits. That is why a newer manifest can still be parsed by an older compiler, which then reports the block it does not know instead of failing to read the file.

| Element | Form |
|---|---|
| Comment | `// to end of line` or `# to end of line` |
| Identifier | starts with a letter or `_`; continues with letters, digits, `_` and `-` |
| String | `"text"` with the escapes `\\`, `\"`, `\n`, `\r` and `\t`. A string ends at the closing quote or the end of the line |
| Integer | one or more digits. There are no negative numbers |
| Boolean | `true` or `false` |
| Array | `["a", "b"]`, of scalar values, with an optional trailing comma. Only `authors` uses one |
| Assignment | `key = value` |
| Call | `name("string", "string")`. Arguments are strings, or for a command step the bare word `args` |
| Block | `name { ... }` or `name("string") { ... }`, holding assignments, calls and blocks |

Semicolons are accepted after a statement and are never needed. Whitespace, including newlines, is insignificant, so a block may be written on one line.

An element with neither arguments nor a block is an error (`UMS1102`). Statements are read generically first, so a block the loader does not understand is diagnosed by name at the top level (`UMS2006`) and does not stop the rest of the file from being checked.

## Blocks at the top level

| Block | Purpose | Written |
|---|---|---|
| `toolchain` | the project's own compiler | at most once, and first if present |
| `project` | the project's identity | at most once |
| `profiles` | per-profile settings | at most once |
| `targets` | what the project builds | at most once |
| `dependencies` | other projects it uses | at most once |
| `commands` | commands the project owns | at most once |

A second copy of a block is `UMS2007`–`UMS2014`, and any other name at the top level is `UMS2006`. Anything at the top level that is not a named block, such as a bare assignment, is `UMS2005`.

### `toolchain`

Names a compiler the project builds for itself, which the installed `prismio` then uses for every command in the project.

| Key | Accepts | Notes |
|---|---|---|
| `host` | a string path | Relative to the manifest, or absolute. A sub-project may name its parent's host, as in `../.prismio/build/debug/prismio`; `clean` removes the host only when it lies under this project's own `.prismio/`. Write it without an extension: on Windows the file is `<name>.exe` and the path is resolved to match. Must not be empty (`UMS2404`) |

The block must be the first in the file (`UMS2403`) because an installed compiler reads only this stable prefix before deciding where to forward a command, and it starts the host only if this machine built it. Building it records the file's identity in `<host>.trusted` beside it. A host that does not match, such as one a cloned repository brought with it, is never started, and the global compiler serves the project with warning `P1077`. Nothing else may be in this block (`UMS2401`). See [compiler host and promotion](/tooling/compiler-host-and-promotion).

### `project`

| Key | Accepts | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Letters, digits, `.`, `_` and `-`, starting with a letter, digit or `_`, so `.`, `..` and a leading `-` are not names (`UMS2302`) |
| `version` | string | yes | A [SemVer 2.0.0](https://semver.org) version: exactly three numeric components with no leading zero, then an optional `-pre.release` and `+build`. `1.0.0-beta.1` is valid; `1.0` and `01.2.3` are not (`UMS2304`) |
| `prismio` | string | yes | The Prismio version the project needs: `MAJOR.MINOR` or `MAJOR.MINOR.PATCH` (`UMS2306`). A project that needs a newer compiler than the running one fails with `P1078` |
| `description` | string | no | Not empty (`UMS2316`) |
| `license` | string | no | A non-empty SPDX-shaped expression: letters, digits and `- . + : ( )` and spaces. The catalogue of identifiers is not checked (`UMS2317`) |
| `licenseFile` | string | no | A project-relative path to a file that exists (`UMS2318`, `UMS2319`). Mutually exclusive with `license` (`UMS2320`) |
| `authors` | array of strings | no | At least one, none empty (`UMS2321`, `UMS2322`). Must be an array (`UMS2011`) of string literals (`UMS2012`) |

Each key may appear once (`UMS2002`), values must be string literals (`UMS2001`), and the block holds properties only (`UMS2003`) and no other names (`UMS2004`).

### `profiles`

A profile is the set of build choices behind `--release`. `debug` is the default and `release` is selected by `--release`.

```ums
profiles {
    debug {
        overflowChecks = false
    }
    release {
        debugInfo = true
    }
}
```

| Key | Accepts | `debug` default | `release` default | Meaning |
|---|---|---|---|---|
| `debugInfo` | `true` or `false` | `true` | `false` | build with `-g`, and the program's object step at `-O0` so a debugger can see every variable |
| `overflowChecks` | `true` or `false` | `true` | `false` | trap on integer overflow in the project's own code. Standard-library code is never checked, because some of it wraps on purpose |

Each profile is written at most once (`UMS2702`), and the block holds only `debug { }` and `release { }` (`UMS2701`). Every block is checked whether or not it is the selected profile, so a mistake in `release` is found while building `debug`. Only the selected profile's block changes the build. A value that is not `true` or `false` is `UMS2704`, and a key other than those two is `UMS2703`.

### `targets`

Each declaration is `kind("name") { ... }`.

| Kind | What it is |
|---|---|
| `executable` | a program. Built by `prismio build`, run by `prismio run` |
| `test` | a program that exits `0` when it passes. Built and run by `prismio test`, and not built by `prismio build`. There is no test framework: the exit status is the whole protocol |
| `library` | recognised and validated, and rejected with `UMS2313` because the artifact is not implemented yet |

The name is a string, unique among targets (`UMS2105`), and follows the name rule above (`UMS2308`, `UMS2104`). Its output is `.prismio/build/<profile>/<name>`, with `.exe` on Windows.

| Key or block | Accepts | Default | Notes |
|---|---|---|---|
| `entry` | string path | required | The source file the target is built from, relative to `build.ums`. Must exist (`UMS2309`, `UMS2310`) |
| `runtime` | `"installed"` or `"none"` | `"installed"` | `"installed"` merges the Prismio runtime the toolchain ships into the program. `"none"` is for a target whose native sources define every runtime symbol themselves, as the compiler's own do (`UMS2114`) |
| `exportDynamic` | `true` or `false` | `false` | make the executable's own symbols visible to code it loads while running, such as a JIT-compiled module (`UMS2115`) |
| `native { }` | block | none | C sources this target compiles and links. At most once (`UMS2110`) |
| `link { }` | block | none | linker inputs, in order. At most once (`UMS2110`) |

Any other key is `UMS2101`, and each key or block may appear once (`UMS2102`).

**`native { }`** takes no arguments (`UMS2111`) and holds calls that each take **one or more** strings (`UMS2113`). Order is kept, because the order of flags and of objects on a link line is meaningful. A name other than these five is `UMS2112`.

| Call | Meaning | Checked when the manifest loads |
|---|---|---|
| `source("a.c", ...)` | C files to compile and link. Compiled with the toolchain's `clang` at `-O2`, with `-g` when the profile has debug info, then your flags | must end `.c` and exist (`UMS2324`). C++ is rejected here because the driver links no C++ runtime |
| `include("dir")` | a header directory (`-I`) | must be an existing directory (`UMS2325`) |
| `define("NAME=1")` | a preprocessor definition (`-D`) | not empty (`UMS2314`) |
| `flag("-Wall")` | any other compiler flag, quoted as one argument | not empty (`UMS2314`) |
| `responseFile("flags.rsp")` | compiler flags from a file, one per line (`@file`) | must exist (`UMS2326`) |

Objects are cached by content, along with every header clang reports reading. See [Calling C from Prismio](https://docs.prismio.org/guides/calling-c) for what invalidates an entry, and [runtime platforms and packaging](/runtime/platform-and-packaging) for the driver side.

**`link { }`** takes no arguments (`UMS2107`) and holds calls that each take **exactly one** string (`UMS2109`). A name other than these five is `UMS2108`.

| Call | Meaning | Checked when the manifest loads |
|---|---|---|
| `library("m")` | `-lm` | not empty (`UMS2314`) |
| `search("dir")` | a library search directory (`-L`), relative to the project root | not empty |
| `file("x.a")` | an exact object or library, relative to the project root | not empty |
| `framework("Security")` | a Mach-O framework. Ignored on other targets | not empty |
| `responseFile("link.rsp")` | linker arguments from a file another tool wrote | must exist (`UMS2326`) |

`search` and `file` are not checked for existence when the manifest loads, so a missing one is reported by the linker.

### `dependencies`

Each declaration is `scope("name", "constraint")` or `scope("name", "constraint", "local/path")`.

| Scope | Meaning |
|---|---|
| `implementation` | a dependency the project uses internally |
| `api` | a dependency the project exposes in its own API |
| `testImplementation` | a dependency only the test targets need |

A name follows the name rule (`UMS2311`), a constraint is not empty (`UMS2312`), and the same name may appear once per scope (`UMS2203`). A call with the wrong arguments is `UMS2202` and any other name is `UMS2201`. A path is resolved against the directory holding `build.ums` and must be an existing directory (`UMS2210`). A dependency with no path is a registry dependency and fails with `UMS2211`, because there is no registry.

Resolution writes `prismio.lock` beside `build.ums`, with root-relative paths, and only when the project declares a dependency. A resolved dependency is not yet on the import search path, and a build that declares one says so with warning `P1081`.

### `commands`

Each declaration is `command("name") { ... }`. The name is a string that follows the name rule (`UMS2601`), is unique (`UMS2503`), and is not a built-in verb or a name ending `.psm` (`P1062`). The body holds an optional `description` and one or more steps, run in order:

| Element | Accepts | Notes |
|---|---|---|
| `description = "..."` | string | one line shown when commands are listed, at most once (`UMS2507`). Any other key is `UMS2509` |
| `build("target")` | exactly one string | builds a declared target (`UMS2506`, `UMS2603`). It may not name the `toolchain.host` target (`P1061`) |
| `run("subject", "arg", ...)` | a string, then strings or `args` | a declared executable target is built and run; a `.py` file runs under the host's Python; a `.psm` file is compiled into `.prismio/build/<profile>/tools/` and run. Anything else is `UMS2606`, and a file that is not there is `UMS2607`. A test or library target is `UMS2604` |
| `shell("program", "arg", ...)` | a string, then strings or `args` | starts any program. No shell is involved: the program and each argument are passed as an argument list, so `$(...)`, backticks and quotes are text. The program must not be empty (`UMS2605`) |

A step needs a string first (`UMS2505`), an unknown step is `UMS2504`, and a command with no steps is `UMS2602`. After the subject, a step argument is a string literal or the bare word `args`, which splices in whatever the user typed after the command name at that position (`UMS2508`).

Every step starts in the project root, whatever directory the command was run from. A step that fails ends the command with that step's exit status and `P1059`.

## Diagnostic codes

A manifest diagnostic is printed with the file, line and column of the declaration, and a stable code:

```text
build.ums:11:20: error[UMS2324]: native source 'c/checksum.cpp' is not a C file (.c)
```

Loading collects every diagnostic it can before printing any, so one run reports several independent mistakes. A diagnostic that reports something missing altogether, such as a required property, points at the block that should have held it.

**Reading the table.** `x` stands for the name or value the message fills in. The ranges follow the stage that reports them: `UMS0xxx` finding the file, `UMS1xxx` reading it, `UMS20xx`–`UMS23xx` lowering and validation of the model, `UMS24xx` the toolchain block, `UMS25xx`–`UMS26xx` commands, `UMS27xx` profiles and `UMS3xxx` planning.

### Finding and reading the file

| Code | Message | What to do |
|---|---|---|
| `UMS0002` | no build.ums found at or above this directory | Run the command inside a project, or `prismio init` one |
| `UMS1002` | unterminated string literal | A string ends at the closing quote or the end of the line. Close it |
| `UMS1003` | unsupported escape sequence `\x` | Use `\\`, `\"`, `\n`, `\r` or `\t`, and write a backslash in a Windows path as `\\` or use `/` |
| `UMS1004` | unexpected character `c` | The character is not part of the syntax. Negative numbers are among them |
| `UMS1101` | expected X, found Y | The token in the message is not what the statement needs. Look for a missing `,`, `)` or `}` |
| `UMS1102` | DSL element 'x' requires arguments or a block | A bare name does nothing. Give it `("arguments")`, a `{ block }` or `= value` |

### Blocks and the project

| Code | Message | What to do |
|---|---|---|
| `UMS2001` | X must be a string literal | Quote the value. Booleans and numbers are not strings |
| `UMS2002` | project.x is declared more than once | Keep one |
| `UMS2003` | project metadata contains properties, not nested DSL calls | Write `key = value` in `project` |
| `UMS2004` | unknown project property 'x' | The keys are `name`, `version`, `prismio`, `description`, `license`, `licenseFile` and `authors` |
| `UMS2005` | top-level elements must be named blocks | Put the statement inside a block |
| `UMS2006` | unknown top-level block 'x' | The blocks are `toolchain`, `project`, `profiles`, `targets`, `dependencies` and `commands` |
| `UMS2007` | build.ums may contain only one project block | Merge the blocks |
| `UMS2008` | build.ums may contain only one targets block | Merge the blocks |
| `UMS2009` | build.ums may contain only one dependencies block | Merge the blocks |
| `UMS2010` | build.ums may contain only one toolchain block | Merge the blocks |
| `UMS2011` | project.authors must be an array | Write `authors = ["Name"]` |
| `UMS2012` | every project.authors item must be a string literal | Quote each author |
| `UMS2013` | build.ums may contain only one commands block | Merge the blocks |
| `UMS2014` | build.ums may contain only one profiles block | Merge the blocks |
| `UMS2301` | project.name is required | Add `name = "..."` to `project` |
| `UMS2302` | project.name may contain only letters, digits, '.', '_' and '-' | Rename. A name starts with a letter, digit or `_`; `.`, `..` and a leading `-` are not names |
| `UMS2303` | project.version is required | Add `version = "0.1.0"` |
| `UMS2304` | project.version must be a semantic version, such as 1.2.0 or 1.0.0-beta.1 | Three numeric components, no leading zeros, then optional `-pre` and `+build` |
| `UMS2305` | project.prismio is required | Add `prismio = "0.1"` |
| `UMS2306` | project.prismio must be MAJOR.MINOR or MAJOR.MINOR.PATCH, such as 0.1 | Write two or three numeric components |
| `UMS2316` | project.description cannot be empty | Write a line, or remove the key |
| `UMS2317` | project.license must be a non-empty SPDX expression | Use characters an SPDX expression can hold, such as `Apache-2.0` |
| `UMS2318` | project.licenseFile must be a non-empty project-relative path | Give a relative path |
| `UMS2319` | project.licenseFile does not exist: x | Create the file, or fix the path |
| `UMS2320` | project.license and project.licenseFile are mutually exclusive | Keep one |
| `UMS2321` | project.authors must contain at least one author | Add one, or remove the key |
| `UMS2322` | project.authors cannot contain an empty author | Remove the empty string |

### Targets

| Code | Message | What to do |
|---|---|---|
| `UMS2101` | unknown target property 'x'; expected entry, runtime, exportDynamic, native or link | Use one of those five |
| `UMS2102` | target entry, runtime or exportDynamic is declared more than once | Keep one |
| `UMS2103` | unknown target kind 'x' | The kinds are `executable`, `library` and `test` |
| `UMS2104` | X requires exactly one string name | Write `executable("name") { ... }` |
| `UMS2105` | target 'x' is declared more than once | Target names are unique |
| `UMS2106` | targets contains executable(...), library(...) or test(...) declarations | Move other statements out of `targets` |
| `UMS2107` | link takes no arguments | Write `link { ... }` |
| `UMS2108` | unknown link declaration 'x'; expected library, search, file, framework or responseFile | Use one of those five |
| `UMS2109` | X requires exactly one string argument | A link call takes one string. Repeat the call for another |
| `UMS2110` | target link or native is declared more than once | Merge the blocks |
| `UMS2111` | native takes no arguments | Write `native { ... }` |
| `UMS2112` | unknown native declaration 'x'; expected source, include, define, flag or responseFile | Use one of those five |
| `UMS2113` | X requires at least one string argument, or X takes strings | Give each `native` call one or more string literals |
| `UMS2114` | target runtime is "installed" or "none", not "x" | Use one of the two |
| `UMS2115` | target exportDynamic must be true or false | Write `true` or `false`, unquoted |
| `UMS2307` | at least one build target is required | Declare a target in `targets` |
| `UMS2308` | invalid target name 'x' | A name starts with a letter, digit or `_` and holds letters, digits, `.`, `_` and `-` |
| `UMS2309` | target 'x' requires an entry source | Add `entry = "src/main.psm"` |
| `UMS2310` | target 'x' entry does not exist: path | Fix the path, relative to `build.ums` |
| `UMS2313` | library targets are modeled but artifact emission is not implemented yet | Use `executable`. Libraries are coming |
| `UMS2314` | link inputs cannot be empty, or native inputs cannot be empty | Remove the empty string |
| `UMS2324` | native source 'x' is not a C file (.c), or native source does not exist: x | Only C sources are compiled. Fix the extension or the path |
| `UMS2325` | native include directory does not exist: x | Create the directory or fix the path |
| `UMS2326` | link responseFile does not exist: x, or native responseFile does not exist: x | Create the file or fix the path. Absolute paths are taken as written |

### Dependencies

| Code | Message | What to do |
|---|---|---|
| `UMS2201` | unknown dependency declaration 'x' | The scopes are `implementation`, `api` and `testImplementation` |
| `UMS2202` | X requires package name and version constraint strings, and an optional local path | Write `implementation("name", "1.2.0")` or add the path as a third string |
| `UMS2203` | dependency 'x' is declared more than once in this scope | Keep one |
| `UMS2210` | path dependency 'x' does not name a directory: path | The path is relative to `build.ums`. Create the directory or fix the path |
| `UMS2211` | no registry is configured, so 'x' cannot be fetched; give it a local path as a third argument | There is no registry yet. Give the dependency a path |
| `UMS2311` | invalid dependency name 'x' | Follow the name rule |
| `UMS2312` | dependency 'x' has an empty version constraint | Give a constraint |

### The toolchain block

| Code | Message | What to do |
|---|---|---|
| `UMS2401` | toolchain contains only the optional 'host' property | Remove everything but `host` |
| `UMS2402` | toolchain.host is declared more than once | Keep one |
| `UMS2403` | toolchain must be the first build.ums block | Move it to the top |
| `UMS2404` | toolchain.host cannot be empty | Give a path or remove the block |

**`UMS2401`–`UMS2404` are also used by the dependency writer.** `umsManifestAddDependency` in `ums/model/manifest_writer.psm` reports `UMS2401` (cannot write a dependency with an unknown scope), `UMS2402` (invalid dependency name 'x'), `UMS2403` (dependency 'x' has an empty version constraint) and `UMS2404` (dependency 'x' is already declared in this scope) under the same four numbers. They arise in different places, from the loader and from the writer, so a tool can tell them apart, but a code names two problems for now. Do not match on the number alone if you use the writer.

### Commands

| Code | Message | What to do |
|---|---|---|
| `UMS2501` | unknown commands declaration 'x'; expected command("name") { ... }, or commands contains command(...) declarations | Only `command("name") { }` goes in `commands` |
| `UMS2502` | command requires exactly one string name | Write `command("name") { ... }` |
| `UMS2503` | command 'x' is declared more than once | Command names are unique |
| `UMS2504` | unknown command step 'x'; expected build, run or shell | The steps are `build`, `run` and `shell` |
| `UMS2505` | X requires a string as its first argument | Name the target, file or program first |
| `UMS2506` | build takes exactly one target name | Write one `build("target")` per target |
| `UMS2507` | command description is declared more than once | Keep one |
| `UMS2508` | a step argument is a string literal or the bare word `args` | Quote it, or write `args` |
| `UMS2509` | unknown command property 'x'; expected 'description' | The only property is `description` |
| `UMS2601` | invalid command name 'x' | A name starts with a letter, digit or `_`, so a flag can never be one |
| `UMS2602` | command 'x' declares no steps | Add a `build`, `run` or `shell` step |
| `UMS2603` | no target named 'x' is declared in this project | Fix the name, or declare the target |
| `UMS2604` | run needs an executable target, and 'x' is not one | A test or library is not run. Use `build`, or `prismio test` |
| `UMS2605` | a shell step needs a program to run | Name the program |
| `UMS2606` | run names no declared target, and 'x' is not a .py or .psm file; use shell for anything else | `run` starts a target, a Python script or a Prismio tool. Use `shell` for another program |
| `UMS2607` | run cannot find 'x' under the project root | Fix the path, relative to `build.ums` |

### Profiles and planning

| Code | Message | What to do |
|---|---|---|
| `UMS2701` | profiles holds debug { ... } and release { ... }, not 'x' | Only those two profile blocks exist |
| `UMS2702` | profile 'x' is declared more than once | Keep one |
| `UMS2703` | unknown profile setting 'x'; expected debugInfo or overflowChecks | Use one of those two |
| `UMS2704` | profile setting 'x' must be true or false | Write `true` or `false`, unquoted |
| `UMS3001` | invalid build profile 'x' | A profile name holds letters, digits, `-` and `_` |

The codes not listed are not issued. `UMS2315` is unassigned, and a number is not reused.

## If you are changing the manifest

The pipeline is `umsLex`, then `umsParse`, then `umsLowerDocument`, then `validate`, then the build plan. **Lowering** in `ums/model/lowering.psm` checks shape: which names and arguments are allowed, and what kind of value each key takes. **Validation** in `ums/model/validation.psm` checks meaning: that a name is well formed, that a file exists, that a step names something real. Put a new check in the stage that has what it needs, and give it its own code, since a code is permanent.

`umsLex(source, path, diagnostics)` emits `UmsToken` records through `umsToken`, each with kind, value, byte offset, line, column and length. The lexer has its own identifier, number, string, punctuation and comment rules and does not reuse Prismio source tokens. `umsParse(tokens, path, diagnostics)` produces a `UmsAstDocument`. Statements carry their spans and enough raw boundaries for manifest-preserving edits, and values distinguish strings, integers, booleans, identifiers and arrays.

`umsLowerDocument(document, root, manifestPath, profile, diagnostics)` interprets the known blocks, creates targets with `umsTarget`, native inputs with `umsNativeInput`, link inputs with `umsLinkInput`, dependencies through `umsDependencyScope`, and commands with `umsCommand`, `umsCommandStep` and `umsCommandArgument`. It applies a default only where this page gives one; command execution does not guess a missing entry or dependency path.

The policy functions live in `validation.psm`: `umsValidName` for names, `umsValidSemver` and `umsValidNumericVersion` for versions, `umsValidLicenseExpression`, `umsRunnableScript` for what `run` may start, and `umsAbsolutePath`. `umsHostPathValid` in `ums/model/project.psm` is the host-path rule, shared with the launcher's prefix reader so there is one answer. File-existence checks join paths under the project root and must not accept a path that escapes it.

`umsManifestAddDependency` lexes and parses the original text and returns a `UmsManifestEdit`, using `umsManifestDependencyBlock` to find an existing scope and then `umsManifestInsertDependency` or `umsManifestAppendDependencyBlock`. `umsManifestNewline`, `umsManifestIndentAt` and `umsManifestChildIndent` preserve newline and indent style, and `umsManifestEscape` quotes names, paths and versions safely. A writer change needs round-trip tests for LF and CRLF, empty files, existing and missing dependency blocks, indentation, comments, escaped strings, duplicate dependencies, and an unchanged result when no edit is required.

The IntelliJ plugin mirrors the cheap value checks above and prints the same codes; its tables follow `lowering.psm`, and its corpus test loads every `build.ums` in a checkout, so a change here that the plugin does not know shows up there. Add the new key or call to the plugin's `UmsWords` and `UmsValueChecks`.

To carry a new capability through every stage, see [extend UMS](/cookbook/extend-ums).
