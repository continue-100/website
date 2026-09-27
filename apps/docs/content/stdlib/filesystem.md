---
title: Filesystem API
description: The std.fs module — files, paths, and directory listing, with the ownership contracts the raw runtime calls do not carry.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-25"
tags: [standard-library, filesystem, paths]
related: [stdlib, stdlib/process, stdlib/strings, language/ffi]
---

`import std.fs`. Files, paths, and directory listing.

Unlike [`std.string`](/stdlib/strings), none of this could be written in Prismio: opening a file, reading a directory, and asking the OS for the working directory are capabilities the language has no syscall layer for. What the module adds is the two things a raw `extern fn` cannot carry.

## Why not declare the runtime calls yourself

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
| `deleteFile(path)` | `Bool` — true when the file is gone afterwards |
| `listModules(directory)` | `Vec<String>` — the `.psm` files, sorted, without the suffix |

`readFile` cannot distinguish an unreadable file from an empty one: both come back as the empty string. `tryReadFile` can, and it does it by asking `fileExists` first rather than by inspecting the result, because the result cannot answer.

`writeFile` replaces the file's contents, creating it if it is absent. The parent directory must already exist — call `makeDirectory` first. It does not create one for you, because a mistyped path that quietly succeeds is worse than one that fails.

## Directories

| Function | Returns |
|---|---|
| `makeDirectory(path)` | `Bool` — creates `path` and every missing parent |
| `directoryExists(path)` | `Bool` |

A directory that already exists counts as success, which is what makes `makeDirectory` safe to call unconditionally.

`directoryExists` is not the same question as `fileExists`, and the difference matters. `fileExists` *opens* the path, and opening a directory succeeds on some hosts and fails on others, so it cannot answer this. Nor should you reach for `makeDirectory` to find out whether a directory is there: it answers by creating it, so a mistyped path would report success.

`listModules` returns a `Vec<String>`. The underlying runtime call hands back one newline-separated string, because a `Vec` is a Prismio type the C cannot build; splitting it is the half of that operation that always belonged in Prismio.

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

## Still missing

Directory *removal*, recursive walks, metadata (size, mtime, permissions), symlink handling, streaming reads, appending to a file, and a path type distinct from `String`. A future API must also settle path encoding, error representation, and sandbox behaviour before those are documented as implemented.

There is no way to append: `writeFile` replaces. Read, concatenate, and write back if you need to add to a file.
