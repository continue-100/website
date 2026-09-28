---
title: Package manager
description: The UMS manifest, project commands, path dependencies and the lockfile in Prismio 0.1, and what a registry would still add.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-28"
tags: [package-manager, registry, dependencies, manifest, lockfile]
related: [language/modules, guides/modules, roadmap]
---

Prismio 0.1 has a **manifest**, a **lockfile**, and **local path dependencies**. It has **no registry**, so a dependency that does not name a local path cannot be fetched.

## Commands

Every command below reads `build.ums`, found at or above the working directory,
and writes to `.prismio/build/<profile>/`.

| Command | Does |
|---|---|
| `prismio init [name]` | scaffold a project here, or in a new directory |
| `prismio build [--release] [target...]` | build every target except tests, or the ones named |
| `prismio run [--release] [target] [-- args...]` | build, then run the executable target |
| `prismio test [--release] [test...]` | build and run the `test(...)` targets, or the ones named |
| `prismio clean [--release]` | remove this profile's build output |
| `prismio <name> [args...]` | run a command the manifest declares |

A project command is the same command with **no source named**. `prismio build`
builds the project; `prismio build src/main.psm` builds that one file and needs no
manifest at all. A word that does not end in `.psm` names a target, so
`prismio build server` builds the target called `server`.

Everything after `--` belongs to the program `run` starts, exactly as typed, and
`run` exits with the program's own status:

```bash
prismio run -- --port 8080 "a file.txt"
```

## Profiles

A build uses the `debug` profile unless `--release` is given, and each writes
to its own directory under `.prismio/build/`.

| Profile | Debug info (`-g`) | Overflow checks | Optimised |
|---|---|---|---|
| `debug` | yes | yes | no: `-g` builds the program at `-O0` |
| `release` | no | no | yes |

A `profiles` block changes either setting for its profile:

```ums
profiles {
    debug {
        overflowChecks = false
    }
}
```

Overflow checks apply to your code, not to the standard library, which is
written against wrapping arithmetic and is built the same way in every profile.

```bash
prismio init hello
cd hello
prismio run
```

That writes three files and nothing else:

```
hello/
├── build.ums
├── .gitignore          # .prismio/
└── src/
    └── main.psm
```

`init` refuses if `build.ums` already exists, and never rewrites a `.gitignore`
or `src/main.psm` it did not create.

## Tests

A `test(...)` target is an ordinary program, and **it passes when it exits 0**.
That is the whole protocol — Prismio has no assertion library and no test
attribute, so nothing richer would be a promise the language could keep.

```ums
targets {
    executable("hello") {
        entry = "src/main.psm"
    }

    test("parser") {
        entry = "tests/parser.psm"
    }
}
```

```
$ prismio test
running 1 test(s)
  ok    parser
1 passed, 0 failed
```

`prismio test` exits non-zero when any test fails, so it works as a CI step.
Every test is built and run even after one fails, and a test that does not
compile is reported as a failed test rather than ending the run.
`prismio test parser` runs only the tests named. Each test runs with the
project root as its working directory, so a fixture path in a test is relative
to `build.ums`. `prismio build` does **not** build test targets — the ordinary
build is the one run constantly, and paying for the test programs every time buys
nothing.

## The manifest

`build.ums` is the required description of a project. Running `prismio build`
with no source argument finds the nearest ancestor manifest, validates it, and
builds each target into `.prismio/build/<profile>/`.

```ums
project {
    name = "app"
    version = "0.1.0"
    prismio = "0.1"
}

targets {
    executable("app") {
        entry = "src/main.psm"
    }
}

dependencies {
    implementation("json", "1.2.0", "../json")
}
```

The explicit form still works and ignores the manifest entirely:

```text
prismio build src/main.psm -o app
```

That is single-file mode, not an implicit project. A directory becomes a
Prismio project by having `build.ums`, just as a Cargo project is identified by
its manifest.

## C code and native libraries

A target can compile C sources of its own and link them into the executable.
The `native` block names them and the flags they compile with; the `link` block
names what the executable links.

```ums
targets {
    executable("app") {
        entry = "src/main.psm"
        native {
            source("c/codec.c", "c/util.c")
            include("c/include")
            define("CODEC_FAST=1")
            flag("-Wall")
        }
        link {
            library("z")
            search("vendor/lib")
            file("vendor/lib/libextra.a")
        }
    }
}
```

Each source is compiled with the toolchain's clang at `-O2` (`-g` too, in a
profile with debug info) and cached by content: an unchanged source, with its
headers and flags unchanged, is not compiled again. Only C sources are accepted.
A Prismio function calls the C one through an `extern fn` declaration.

| Declaration | Meaning |
|---|---|
| `source("a.c", ...)` | C files to compile and link, in order |
| `include("dir")` | a header directory (`-I`) |
| `define("NAME=1")` | a preprocessor definition (`-D`) |
| `flag("-Wall")` | any other compiler flag |
| `responseFile("flags.rsp")` | compiler flags from a file, one per line |
| `link { library("z") }` | a system library (`-lz`) |
| `link { search("dir") }` | a library directory (`-L`) |
| `link { file("x.a") }` | an exact object or library file |
| `link { framework("Security") }` | a framework (macOS only) |
| `link { responseFile("link.rsp") }` | linker arguments from a file |

A response file is how a manifest uses flags another tool computed, such as
`pkg-config` output, without writing one machine's paths into `build.ums`.

Two target properties go with native code. `runtime = "none"` leaves out the
Prismio runtime the toolchain installs, for a program whose C provides every
runtime function itself. `exportDynamic = true` makes the executable's own
symbols visible to code it loads while running.

The Prismio compiler is built exactly this way. Its repository's `build.ums`
lists the compiler's C runtime and backend as `native` sources, declares
`runtime = "none"` because it carries the runtime from its own checkout, and
links LLVM through response files. Nothing about the compiler is built into the
toolchain you install.

### A project's own compiler

A first `toolchain` block names a compiler the project builds for itself, which
is how the Prismio repository works on its own compiler:

```ums
toolchain {
    host = ".prismio/build/debug/prismio"
}
```

Once that compiler exists, the installed `prismio` forwards every command in the
project to it. It forwards only to a compiler **this machine built**: building
it records the file's identity beside it, and a file that does not match — one a
cloned repository brought with it, or one changed since — is never run, not even
for `prismio --version` or an editor's `check`. The global compiler serves the
project instead, with warning `P1077`, until `prismio build` builds the
project's compiler. The path must be under `.prismio/`.

## Project commands

A `commands` block declares commands the project owns. Each is a name, an
optional `description`, and one or more steps run in declaration order; the
command stops at the first step that fails.

```ums
commands {
    command("dist") {
        description = "Package a release archive"
        build("app")
        run("tools/package.py", "--out", "dist", args)
    }
}
```

`prismio dist` then runs it, and `prismio dist --keep-symbols` passes
`--keep-symbols` through. Two step forms:

**`build("target")`** builds a declared target and takes nothing else.

**`run(subject, "arg", ...)`** runs one thing, and works out how from the
subject:

| Subject | What happens |
|---|---|
| a declared target | it is built, then executed |
| a `.py` file | run under this host's Python |
| a `.psm` file | compiled into the profile's `tools/` directory, then executed |

Anything else is a manifest error rather than a guess, because the toolchain has
to know how to start what it is given. A `.psm` tool is not a declared target and
does not become one: a target is something the project builds every time, a tool
is something it runs when asked.

**`shell("program", "arg", ...)`** starts any other program, and its portability
is yours. A program written with a path separator resolves against the project
root; a bare name is looked up on `PATH`. Despite the name, no shell is involved,
so a shell builtin or a script needs its shell named: `shell("sh", "-c", "...")`,
or `shell("cmd", "/c", "...")` on Windows. That is why `run` exists and why the
Prismio repository's own tools are Python.

**No step goes through a shell.** Every argument is passed to the program exactly
as written: `$(...)`, backticks, quotes and backslashes are text, never syntax.
Every step starts in the project root, whichever directory you ran the command
from, because the paths in `build.ums` are written relative to it. If a step
fails, the command stops and exits with that step's exit status. The bare word
`args` splices in whatever the user typed after the command name, keeping its
position among the fixed arguments; it is the only identifier a step argument
accepts.

Built-in commands win. A manifest that names one of `init`, `build`, `run`,
`test`, `clean`, `check`, `bootstrap`, `aif`, `dump-ast` or `runtime-hash`, or a
name ending in `.psm`, is rejected when it loads, so a project cannot quietly
redefine what `prismio build` means, and a future release adding a verb fails
loudly rather than silently taking one over. A command name starts with a letter
or a digit.

A `build` step may not name the `toolchain.host` target: the rebuilt compiler is
promoted by the global parent only after the process exits, so later steps in the
same command would still be running the previous one.

## Dependencies

A dependency takes a name and a version constraint, and optionally a third argument: a **local path**.

| Form | Meaning |
| --- | --- |
| `implementation("json", "1.2.0", "../json")` | path dependency — resolves to that directory |
| `implementation("json", "1.2.0")` | registry dependency — fails, there is no registry |

Scopes are `implementation`, `api`, and `testImplementation`.

A path is resolved against the directory holding `build.ums`, not against the working directory. Those differ whenever you run `prismio build` from a subdirectory, and resolving against the working directory would make one manifest mean different things depending on where it was invoked.

A path that does not name an existing directory is an error (`UMS2210`), and the directory is **not** created for you.

A dependency with no path reports `UMS2211` and names the third-argument form as the fix. This is the one step with nothing behind it: the dependency is modelled, validated, and written to the lockfile exactly like a path dependency, and only the fetch is missing.

## The lockfile

Resolution writes `prismio.lock` beside `build.ums` before it reports any failure, so the file describes the attempt rather than only the successes. A project that declares no dependency gets no lockfile.

```text
# prismio lockfile v1
# generated from build.ums; paths are relative to it
# scope	name	constraint	source	resolved
implementation	json	1.2.0	path	../json
implementation	http	2.0.0	registry	-
```

One row per declared dependency, in manifest order, tab-separated. Paths are written relative to the manifest with `/` separators, so the file reads the same on every machine. An unresolved dependency is written with `-` rather than omitted, so the row count matches the manifest and a failed fetch is visible in a diff instead of absent from one. Check it in: it exists to be reviewed.

## Not implemented

There is no registry, so no package identity beyond a name, no version *solving* (a constraint is recorded, not satisfied), no integrity verification, no binary dependencies, no offline cache, and no workspace with multiple projects.

A resolved path dependency is recorded but is **not yet added to the import search**, and a build that declares one says so (`P1081`). Importing modules from one is still done by vendoring the source beneath your entry module and using dotted imports. Wiring resolution into module resolution is the next step, not part of 0.1.

Do not use a third-party manifest format as though it were part of Prismio.
