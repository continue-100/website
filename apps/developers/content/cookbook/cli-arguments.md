---
title: Read command-line arguments
description: Read the arguments a user passes to your program with process.args, and pass them from prismio run after a double dash.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [cookbook, cli, arguments, process]
related: [runtime/supported-surface, compiler/cli, tooling/build-manifest]
---

Your program often needs what the user typed after its name: a file to read, a port, a flag. `main` takes no `argc` and `argv`. The arguments are in `process.args`, from `import std.process`.

## See it work

<!-- prismio-check: pass -->
```prismio
import std.io
import std.process

fn main() -> Int {
    if (process.args.count < 2) {
        println("usage: echo_args <word>...")
        return 2
    }
    for i in 1..<process.args.count {
        println(process.args[i])
    }
    return 0
}
```

`process.args[0]` is the program's name, so the arguments start at index 1. `prismio run` passes everything after `--` to the program exactly as typed, including words that look like compiler flags:

```bash
prismio run echo_args.psm -- alpha "two words" --release
```

```text
Built echo_args
alpha
two words
--release
```

A quoted argument stays one argument. Without `--`, `prismio run` reads the words as its own and stops at the first it does not know (`P1050`). In a project, `prismio run -- alpha` runs the project's only executable, and `prismio run app -- alpha` names the target.

## What the program returns is what you get

`prismio run` exits with the status `main` returned and prints nothing about it. Run the example with no arguments:

```bash
prismio run echo_args.psm
echo $?
```

```text
Built echo_args
usage: echo_args <word>...
2
```

A shell script or CI step can therefore branch on it. The same is true of a built executable: `./echo_args a b` prints `a` and `b`.

## Check the count before reading

`process.args[i]` answers an empty string for an index outside `[0, process.args.count)`, the same as an argument that is empty, so ask `count` when the difference matters. [`std.process`](https://docs.prismio.org/stdlib/process) documents the rest of the surface, including environment variables and running other programs.

Argument zero can differ by platform, since it is whatever the operating system was given. Do not build an invariant on its exact spelling.

## If you are changing how arguments reach a program

The runtime does not expose an argument accessor for applications. Generated code defines
`prismio_argc` and `prismio_argv`, and `std.process` reads them through private `extern let`
declarations, so `process.args[i]` returns a copy and no application holds a pointer into the
runtime's storage. See [builtins, standard modules, and foreign code](/runtime/supported-surface)
for the ownership rules behind that.

On the compiler side, `prismio run <file> -- args` and `prismio run [target] -- args` both hand
everything after the first `--` to the program through `compiler_spawn_arg`, and `--` is refused for
every other verb (`P1079`, `P1084`). A test of that path should assert an argument that looks like a
compiler flag, an argument with a space, and the program's exit status coming back unchanged.
