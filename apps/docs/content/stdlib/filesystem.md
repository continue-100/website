---
title: Filesystem API
description: The std.fs module — reading, writing and appending files, reading one a line at a time, listing and removing directories, renaming, and asking what a path is.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [standard-library, filesystem, paths]
related: [stdlib, stdlib/input, stdlib/time, stdlib/process, stdlib/strings, language/ffi]
---

`import std.fs`. Files, paths and directories: read a file whole or a line at a time, write or append to one, list a directory, move and remove things, and ask what a path is.

<!-- prismio-check: pass -->
```prismio
import std.fs
import std.io
import std.option
import std.string
import std.vec

fn main() -> Int {
    makeDirectory("logs/old")
    appendFile("logs/app.log", "started\n")
    appendFile("logs/app.log", "ready\n")
    writeFile("logs/notes.txt", "draft")
    rename("logs/notes.txt", "logs/old/notes.txt")

    for name in listDirectory("logs") {
        println(name)                    // app.log, then old -- sorted, no . or ..
    }

    let info = metadata("logs/app.log")
    match (info) {
        Option.Some(m) => {
            println(m.size)              // 14
            println(m.isFile)            // true
        }
        Option.None => { println("missing") }
    }

    println(removeDirectory("logs/old")) // false: it still holds notes.txt
    deleteFile("logs/old/notes.txt")
    println(removeDirectory("logs/old")) // true
    return 0
}
```

Unlike [`std.string`](/stdlib/strings), none of this could be written in Prismio: opening a file, reading a directory, and asking the OS for the working directory are capabilities the language has no syscall layer for. What the module adds is the two things a raw `extern fn` cannot carry.

## Why not declare the runtime calls yourself

You cannot: the runtime's raw entry points (`read_file`, `join_path` and the other nine) are `internal` to `std.fs`, so calling one through `import std.fs` is ``error: `read_file` is internal to the package that declares it``. Call the wrapper, `readFile`. A program that declares its own `extern fn read_file` still can, since that is its own foreign-function declaration. The wrappers exist for two reasons.

**The ownership contract.** `read_file`, `get_directory`, `join_path`, `current_directory`, `executable_directory`, and `list_modules` all return memory the caller must release. Only the first three are in the compiler's fallback contract table, so an application that declared one of the other three itself, without `produce(free)`, got an opaque return — no owner, and a leak on every call.

**The `Int` conventions disagree with each other.** `file_exists` returns 1 for yes. `delete_file` returns **0** for success. Two adjacent functions in one runtime file where 0 means opposite things is a trap; every predicate below is a `Bool`.

## Paths

| Function | Returns |
|---|---|
| `joinPath(directory, filename)` | the two joined with the platform separator |
| `directoryOf(path)` | the directory part, without the trailing separator; `"."` when there is none |
| `currentDirectory()` | the working directory; `"."` when the platform cannot answer |
| `executableDirectory()` | the directory holding the running executable; `"."` on failure |
| `isSourcePath(path)` | whether `path` ends in `.psm` |

## Files

| Function | Returns |
|---|---|
| `fileExists(path)` | `Bool` |
| `readFile(path)` | the whole file as text |
| `tryReadFile(path)` | `Option<String>` |
| `writeFile(path, content)` | `Bool` — true when the write succeeded |
| `appendFile(path, content)` | `Bool` — adds `content` to the end, creating the file if it is absent |
| `rename(from, to)` | `Bool` — moves the file, **replacing** one already at `to` |
| `deleteFile(path)` | `Bool` — true when the file is gone afterwards |
| `readLines(path)` | the file's lines, for `for line in` — see [below](#reading-a-file-a-line-at-a-time) |
| `tryReadLines(path)` | `Option` of the same; `None` when the file cannot be opened |
| `listModules(directory)` | `Vec<String>` — the `.psm` files, sorted, without the suffix |

`readFile` cannot distinguish an unreadable file from an empty one: both come back as the empty string. `tryReadFile` can, and it does it by asking `fileExists` first rather than by inspecting the result, because the result cannot answer.

`writeFile` replaces the file's contents and `appendFile` adds to them; both create the file if it is absent. The parent directory must already exist — call `makeDirectory` first. Neither creates one for you, because a mistyped path that quietly succeeds is worse than one that fails.

`rename` replaces an existing destination on Windows too, where the plain C `rename` would refuse. Both paths must be on one file system: it moves a directory entry, it does not copy the data.

## Directories

| Function | Returns |
|---|---|
| `makeDirectory(path)` | `Bool` — creates `path` and every missing parent |
| `directoryExists(path)` | `Bool` |
| `listDirectory(path)` | `Vec<String>` — every entry's name, sorted by byte value, without `.` and `..` |
| `removeDirectory(path)` | `Bool` — removes `path` only if it is empty |

A directory that already exists counts as success, which is what makes `makeDirectory` safe to call unconditionally.

`directoryExists` is not the same question as `fileExists`, and the difference matters. `fileExists` *opens* the path, and opening a directory succeeds on some hosts and fails on others, so it cannot answer this. Nor should you reach for `makeDirectory` to find out whether a directory is there: it answers by creating it, so a mistyped path would report success.

`listDirectory` returns names, not paths: `joinPath(directory, name)` is the path. It lists files, directories and anything else alike; ask [`metadata`](#what-a-path-is) which is which. A directory that cannot be read lists as empty, and `directoryExists` tells that apart from an empty one. The names are read one at a time from the operating system rather than split out of one string, because a POSIX file name may contain a newline.

`removeDirectory` refuses a directory with anything in it rather than emptying it. Delete the contents first.

`listModules` returns a `Vec<String>` of the `.psm` files only. The underlying runtime call hands back one newline-separated string, because a `Vec` is a Prismio type the C cannot build; splitting it is the half of that operation that always belonged in Prismio.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string
import std.fs

fn main() -> Int {
    let here = currentDirectory()
    println(here)

    let path = joinPath("src", "main.psm")
    if (fileExists(path)) {
        let text = readFile(path)
        println(text.length)
    }
    return 0
}
```

Binding the result is not required: `println(readFile(path))` releases the file's contents once `println` returns. See [strings](/stdlib/strings#passing-a-result-straight-on) for the two shapes where a `let` still matters, and how `--verify` reports a leak.

## What a path is

`metadata(path)` answers `Option<Metadata>`: `None` when nothing is at `path` or it cannot be examined, and otherwise a struct of four fields.

| Field | Type | Meaning |
| --- | --- | --- |
| `size` | `I64` | the size in bytes; 0 for a directory |
| `modified` | `Duration` | the last write, as a time since the Unix epoch — see [`std.time`](/stdlib/time#the-wall-clock) |
| `isDirectory` | `Bool` | a directory |
| `isFile` | `Bool` | a regular file |

A symbolic link answers for what it points at. A path that is neither a directory nor a regular file, such as a device or a socket, has both flags false. `unixTime().minus(m.modified).asSeconds` is how old the file is.

**Bind the result with `let` before matching it**, as the example at the top does. `match (metadata(path)) { ... }` compiles, but leaks the `Option` on every call: ten calls measure `30 allocated, 20 released, 10 leaked` under `--verify`, and the bound form releases all 30. The same holds for any `Option` or `Result` matched straight off a call.

## Reading a file a line at a time

`readFile` reads the whole file into one `String`. For a large file, or one you only need the start of, read it a line at a time instead:

<!-- prismio-check: pass -->
```prismio
import std.fs
import std.io
import std.option
import std.string

// Prints each line up to the first comment, then stops reading.
fn main() -> Int {
    let mut reader = readLines("scores.csv")
    for line in reader {
        if (line.startsWith("#")) {
            reader.close()               // stopped early: close it yourself
            break
        }
        println("[" + line + "]")
    }

    let mut count = 0
    for line in readLines("scores.csv") { count = count + 1 }
    println(count)                       // ran to the end, so it closed itself

    let missing = tryReadLines("nope.csv")
    println(missing.isNone)              // true
    return 0
}
```

Given a `scores.csv` holding `name,score\r\nada,36\n\n# stop here\ngrace,85`, this prints:

```text
[name,score]
[ada,36]
[]
5
true
```

Lines follow the same rules as [standard input](/stdlib/input): `\n` and `\r\n` both end a line and neither is part of it, and a last line without a terminator still counts. The file is read through a 64 KiB buffer, and a line longer than that arrives whole.

**The reader closes the file itself when it reaches the end**, which is how every loop that runs to the end finishes. Prismio has no destructors, so nothing else can close it: a loop that stops early — with `break` or `return` — should call `close()`, or the file stays open until the program exits. Closing twice, or after the end, is harmless.

`readLines` of a file that cannot be opened has no lines, as `readFile` gives `""` for one. `tryReadLines` tells the two apart: it is `None` when the file cannot be opened.

## Still missing

| Missing | Use today |
| --- | --- |
| Copying a file | `readFile`, then `writeFile` |
| Removing a directory that is not empty, and recursive walks | `listDirectory`, recurse on each name `metadata` says is a directory, delete, then `removeDirectory` |
| Permissions, owners, and symbolic links as links | not available; `metadata` follows a link |
| Reading bytes rather than text, and seeking | `readFile` for text; foreign code for binary formats |
| Path helpers: file name, extension, parent, normalising | `directoryOf` and `joinPath`, and `String` methods for the rest |
| A path type distinct from `String`, and a structured error | `Bool` and `Option` results; check `fileExists` or `metadata` for the reason |

A future API must also settle path encoding, error representation, and sandbox behaviour before those are documented as implemented.
