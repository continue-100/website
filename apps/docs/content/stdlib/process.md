---
title: Process and arguments
description: The std.process module — command-line arguments, environment variables, the process id, starting other programs and talking to them through pipes.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-25"
tags: [standard-library, process, arguments, ffi]
related: [stdlib, stdlib/platform, stdlib/filesystem, cookbook/cli-arguments, language/ffi]
---

`import std.process`. Command-line arguments and subprocesses.

## Arguments

`process` is a global. Its `args` is the command line as the process was given it.

| Spelling | Answers |
|---|---|
| `process.args.count` | how many arguments, including the program name at index 0 |
| `process.args[index]` | the argument as a string the caller owns, and `""` outside `[0, count)` |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.process

fn main() -> Int {
    println(process.args[0])

    let mut i = 1
    while (i < process.args.count) {
        println(process.args[i])
        i = i + 1
    }
    return 0
}
```

Out of range and "the argument is the empty string" answer alike, deliberately. `count` is one property away, so a caller that needs to tell them apart asks it.

`process.args[i]` is `at(i)`: `x[i]` on a struct is `at(x, i)`, the same rewrite `s[i]` has always had for String. Nothing builds a list to answer a question about one argument.

This replaced five functions — `argCount`, `arg`, `argBorrowed`, `argAt` and `args`. The two that carried real information are here; `argBorrowed`'s uncopied form and `argAt`'s `Option` are gone.

## Environment variables and the process id

| Spelling | Answers |
|---|---|
| `process.env(name)` | `Option<String>`: `Some(value)`, or `None` when the variable is not set. A variable set to the empty string is `Some("")`. |
| `process.setEnv(name, value)` | `Bool`: sets it for this process and for every child started afterwards; `false` for an empty name or one containing `=` |
| `process.removeEnv(name)` | `Bool`: `true` when the variable is unset afterwards, whether or not it was set before |
| `process.pid` | `Int`: this process's id, as the operating system numbers it |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.option
import std.process

fn main() -> Int {
    let home = process.env("HOME")
    match (home) {
        Option.Some(dir) => { println(dir) }
        Option.None => { println("HOME is not set") }
    }

    let editor = process.env("EDITOR")
    let chosen = optionOr(editor, "vi")
    println(chosen)

    process.setEnv("APP_MODE", "test")
    println(process.pid)
    return 0
}
```

`optionOr(process.env("EDITOR"), "vi")` releases everything, written in one expression: the looked-up `Option` lives until the end of the enclosing block, because the result is a view of it.

**The environment is not thread-safe**, in Prismio as in C: it is one table for the whole process, so a `setEnv` on one task racing an `env` on another is undefined. Set what you need before you `spawn` tasks.

## Why indexing copies

`std.process` reads the arguments straight out of the runtime's `argc` and `argv` globals, which it names with [`extern let`](/language/ffi#foreign-globals). An argument is therefore a pointer **into** the block the operating system handed the process at startup. Nothing allocated it, and nothing may free it.

Handing out that pointer as a `String` would make one `String` in your program unlike every other: one that must never be released. `process.args[i]` returns a copy instead, so the obvious call is the safe one, and one small allocation on a path that runs once per program is not worth the hazard.

The same distinction is what an FFI return contract states. A C function that returns a pointer into memory it does not own is `alias`; declaring it `produce(free)` would not leak, it would hand that memory to the deallocator — the mistake the `produce(free)` declarations in [`std.fs`](/stdlib/filesystem) invite by habit.

## Running another program

A program often needs to hand work to another one — ask `git` for the current commit, compress a file, run a test binary — and then know what it printed and whether it succeeded. `Process` describes the program to start; starting it gives you a `Child`, which you wait on and whose output you can read.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string
import std.vec
import std.process

fn main() -> Int {
    let p = Process()
    p.program = "uname"
    p.arguments = ["-s"]
    p.stdout = StreamMode.Pipe

    let child = p.spawn()
    if (child.handle < 0) {
        println("could not start uname")
        return 1
    }
    let output = child.stdout.readAll()
    let status = child.wait()
    println("uname said ".concat(output.trim(), ", exit status ", status.toString()))
    return 0
}
```

On macOS this prints:

```text
uname said Darwin, exit status 0
```

**No shell is involved.** `program` is looked up on `PATH` and each element of `arguments` reaches the child as exactly one argument, so a path containing a space, a quote or a newline needs no quoting. The earlier `runCommand` and `quoteArg`, which handed a string to the shell, are gone.

**A Vec literal needs `import std.vec`**, even though the program only means to use `std.process`. Without it:

```text
error[P4001]: `vecOf$String` is declared in `std.vec`, which this file does not import
 --> novec.psm:7:20
  |
7 |     p.arguments = ["-s"]
  |                    ^^^^
  note: add `import std.vec`; an import is not transitive, so importing a module that imports it is not enough
```

## When the program fails, or cannot start

There are two different failures, and they look different.

A program that **cannot be started** — not on `PATH`, not executable — gives a `Child` whose `handle` is negative, and `run` answers `-1`. A program that **starts and fails** exits with its own status, which is whatever it chose; read its stderr to find out why.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string
import std.vec
import std.process

fn main() -> Int {
    let missing = Process()
    missing.program = "no-such-program"
    println("run: ".concat(missing.run().toString()))

    let ls = Process()
    ls.program = "ls"
    ls.arguments = ["/no/such/directory"]
    ls.stderr = StreamMode.Pipe
    let child = ls.spawn()
    let complaint = child.stderr.readAll()
    let status = child.wait()
    println("ls exited ".concat(status.toString(), ": ", complaint.trim()))
    return 0
}
```

```text
run: -1
ls exited 1: ls: /no/such/directory: No such file or directory
```

A child killed by a signal reports `128` plus the signal number on POSIX — `137` after `kill`. On Windows a killed child reports `1`.

## Writing to a child's input

Set `stdin` to `Pipe`, write, and **close** it. A child that reads until the end of its input — `sort`, `tr`, a compressor — waits forever for an end that only `close` sends, and your `readAll` waits with it.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string
import std.vec
import std.process

fn main() -> Int {
    let upper = Process()
    upper.program = "tr"
    upper.arguments = ["a-z", "A-Z"]
    upper.stdin = StreamMode.Pipe
    upper.stdout = StreamMode.Pipe

    let child = upper.spawn()
    child.stdin.write("quiet words")
    child.stdin.close()
    let loud = child.stdout.readAll()
    child.wait()
    println(loud)
    return 0
}
```

```text
QUIET WORDS
```

## Reference

**`Process`** — what to start. `Process()` gives one with nothing set and all three streams inherited.

| Field | Type | Default |
|---|---|---|
| `program` | `String` | `""` — found on `PATH` unless it contains a separator |
| `arguments` | `Vec<String>` | empty; the program name is not repeated here |
| `stdin`, `stdout`, `stderr` | `StreamMode` | `StreamMode.Inherit` |

| Method | Does | Returns |
|---|---|---|
| `spawn()` | starts the program and returns immediately | `Child`; its `handle` is negative if the start failed |
| `run()` | `spawn()` then `wait()`; does not read any pipe | the exit status, or `-1` if it could not start |
| `exec()` | replaces this process with the program | only on failure, then `-1` |

**`StreamMode`** — where each of the child's three streams goes.

| Variant | Meaning |
|---|---|
| `Inherit` | the child shares this process's stream |
| `Pipe` | this process gets the other end, as a `Stream` on the `Child` |
| `Discard` | the null device |

**`Child`** — a running program.

| Member | Meaning |
|---|---|
| `handle` | `I64`: a pid on POSIX, a process `HANDLE` on Windows; negative if the start failed |
| `stdin`, `stdout`, `stderr` | `Stream`s; only a piped one is open |
| `wait()` | blocks until the child exits; its status, or `-1` if it could not be waited for |
| `kill()` | terminates it; `0` on success. Call `wait()` afterwards |

**`Stream`** — one end of a pipe, or nothing.

| Method | Returns |
|---|---|
| `readAll()` | everything until the child closes its end; `""` for a stream that is not a pipe |
| `write(text)` | bytes written, or `-1`; a short count means the child closed its end |
| `close()` | `0`, or `-1` |
| `isOpen()` | whether there is a descriptor at all |

## Things that bite

**`readAll` blocks until end of file.** Reading after `wait` is fine while the output fits in the pipe's buffer. A child that writes more than that blocks in its own `write` and never exits, so for large output read **before** `wait`. The same applies to reading stdout and stderr one after the other when the child fills the one you are not reading; nothing detects that deadlock.

**Nothing waits for a child you forget.** There is no destructor to do it: a `Child` dropped without `wait` stays a zombie on POSIX and an open handle on Windows. A program that starts children in a loop must wait in that loop.

**`exec` is not the same on Windows.** There is no `execvp` there; `_execvp` starts a new process and ends this one, so a parent waiting on the original sees it finish rather than getting the new program's status. Where that matters, `spawn` and `wait` instead.

**One spawn at a time.** The argument list crosses into the runtime one element at a time, so two threads starting processes at the same moment can interleave their arguments.

## Still missing

Listing every environment variable at once, a working directory or environment of its own for a child (a child inherits this process's), and redirecting a stream to a file. The Windows half has not been exercised yet — it is written, and its first build is on Windows CI.
