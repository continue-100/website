---
title: Standard input
description: The std.input module — reading what is piped into a program a line at a time, one line on demand, or all at once.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-02"
tags: [standard-library, input, stdin, io, lines]
related: [stdlib/io, stdlib/filesystem, stdlib/option, cookbook/cli-arguments]
---

`import std.input`. A program that reads what is piped into it — a filter, a line counter, a tool that takes a list on stdin — reads it through the `stdin` value this module declares.

<!-- prismio-check: pass -->
```prismio
import std.display
import std.input
import std.io
import std.string

// Counts the lines, words and bytes of whatever is piped in.
fn main() -> Int {
    let mut lines = 0
    let mut words = 0
    let mut bytes = 0
    for line in stdin.lines() {
        lines = lines + 1
        bytes = bytes + line.length
        for word in line.split(' ') {
            if (word.isNotEmpty) { words = words + 1 }
        }
    }
    println("${lines} lines, ${words} words, ${bytes} bytes")
    return 0
}
```

```text
$ printf 'the quick brown fox\r\njumps over\n\nthe lazy dog' | ./count
4 lines, 9 words, 41 bytes
```

The input has four lines. The empty third line is a line, and the last one counts even though nothing ends it. The byte count leaves out the terminators, including the `\r` of the Windows-style first line.

## Ways to read

| Call | Returns | Use it for |
| --- | --- | --- |
| `stdin.lines()` | an iterator of `String`, for `for line in` | every line, in order — the usual case |
| `stdin.readLine()` | `Option<String>`: the next line, or `None` at the end of input | one line on demand: a header, a prompt's answer |
| `stdin.readLineOr(fallback)` | `String`: the next line, or `fallback` at the end of input | a line you can do without checking for the end |
| `stdin.prompt(text)` | `Option<String>`: `text` is written first, then a line is read | asking a question |
| `stdin.readInt()`, `stdin.readFloat()` | `Int?`, `Float?`: the next line as a number | a count or a measurement on a line of its own |
| `stdin.readLines()` | `Vec<String>`: every line not yet read | input you want all of, at once, as lines |
| `stdin.readWords()` | `Vec<String>`: the rest of the input split at spaces, tabs and line ends | a list of tokens, however they are laid out |
| `stdin.readAll()` | `String`: everything not yet read, terminators included | input that is one document rather than lines |
| `stdin.isAtEnd` | `Bool`: whether there is no line left | a loop that reads a line at a time |

**A line never carries its terminator.** `\n` and `\r\n` both end a line, and neither is part of it. A last line with no terminator is still a line, so `"a\nb"` and `"a\nb\n"` are the same two lines, and an empty input has none.

**The reads share one buffer, so they can be mixed.** `readLine` followed by `readAll` gives the rest of the input after that line.

### An optional line prints, and has a fallback

`readLine` and `prompt` answer `Option<String>`, because the input may have ended. With [`std.display`](/stdlib/io#printing-your-own-types) imported, an `Option` prints as its value, or as `none`, so the usual first look at a line needs no `match`:

<!-- prismio-check: pass -->
```prismio
import std.display
import std.input
import std.io

// The first line is a title; everything after it is the body.
fn main() -> Int {
    let header = stdin.readLine()
    println("Your message:", header)
    println("body:", stdin.readAll().length, "bytes")
    return 0
}
```

```text
$ printf 'Report\nline one\nline two\n' | ./report
Your message: Report
body: 18 bytes
$ ./report < /dev/null
Your message: none
body: 0 bytes
```

When the program should not go on without a line, ask for the value or the fallback instead of matching:

<!-- prismio-check: pass -->
```prismio
import std.display
import std.input
import std.io
import std.option
import std.string

// Reads a name and an age, each on a line of its own.
fn main() -> Int {
    let name = stdin.readLineOr("stranger")
    let age = stdin.readInt()
    println("hello, ${name}")
    println("next year:", age.unwrapOr(0) + 1)
    return 0
}
```

```text
$ printf 'Ada\n36\n' | ./hello
hello, Ada
next year: 37
```

`readInt` is `None` at the end of input and also when the line is not a number (spaces around it are ignored); the line is consumed either way. A `match` on the `Option` remains the way to take the two cases apart:

<!-- prismio-check: pass -->
```prismio
import std.input
import std.io
import std.option
import std.string

fn main() -> Int {
    match (stdin.readLine()) {
        Option.Some(title) => { println("title: " + title) }
        Option.None => {
            eprintln("no input")
            return 1
        }
    }
    return 0
}
```

In a loop, prefer `lines()` to calling `readLine()` repeatedly: each `Option<String>` is an allocation of its own, and the iterator hands the line over bare.

## How fast

Input is read 64 KiB at a time into one buffer in the runtime, and each line is found in memory with `memchr` and copied out, so a line costs a scan and a copy rather than a system call. A line longer than the buffer arrives whole. Counting the lines of a 118 MB, 3-million-line file takes 134 ms, against 156 ms for C++'s `getline` and 274 ms for Rust's `lines()`. Counting lines and words together takes 212 ms, against 450 ms and 606 ms.

Every line is released when the loop moves on: the counting example above measures `0 leaked` under `--verify`.

## Why it is its own module

`std.io` is imported by every program that prints. If `stdin` lived there, every printing program would carry it into its debug information and link, and carry `std.option`'s allocation sites into its ownership analysis. A program that reads its input asks for that by importing `std.input`; one that only prints does not pay for it.

## Limits

- **Text only.** A line is a `String`, and text after a NUL byte in a line is not part of it. There is no byte-oriented read.
- **One reader at a time.** The buffer is not locked. Reading standard input from two tasks at once is undefined.
- **The descriptor directly bypasses the buffer.** `Stream { descriptor: 0 }.readAll()` from [`std.process`](/stdlib/process) reads descriptor 0 itself and skips whatever `stdin` has already buffered. Use one or the other.
- No line editing. `prompt(text)` writes the text and reads a line; nothing edits it.

To read a *file* a line at a time, use [`readLines`](/stdlib/filesystem#reading-a-file-a-line-at-a-time) from `std.fs`, which uses the same reader.
