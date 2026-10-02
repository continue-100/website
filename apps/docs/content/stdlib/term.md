---
title: Terminal colors
description: The std.term module — colour, bold, underline and other terminal styles as String methods, and whether stdout will show them.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-02"
tags: [standard-library, terminal, color, ansi, console]
related: [stdlib/io, stdlib/strings, language/lexical-structure]
---

`import std.term`. Colour and text styles for terminal output, written as methods on `String`:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.term

fn main() -> Int {
    println("error:".red().bold())
    println("warning:".yellow())
    println("ok".green().underline())
    println("highlight".black().onYellow())
    println("orange".rgb(255, 140, 0))
    return 0
}
```

Each method returns a new `String` holding the text wrapped in an ANSI escape sequence. A styled string is an ordinary string: concatenate it, interpolate it, store it, print it. Methods chain in any order, and each one closes only its own attribute, so styles nest:

```prismio
let line = ("12 passed".green() + ", 1 failed".red()).bold()
```

Here both halves are bold, and each keeps its own colour.

## Methods

| Kind | Methods |
| --- | --- |
| Colour | `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray` |
| Bright colour | `brightRed`, `brightGreen`, `brightYellow`, `brightBlue`, `brightMagenta`, `brightCyan`, `brightWhite` |
| Background | `onBlack`, `onRed`, `onGreen`, `onYellow`, `onBlue`, `onMagenta`, `onCyan`, `onWhite`, `onGray` |
| Any colour | `rgb(r, g, b)` and `onRgb(r, g, b)` — 24-bit; `color(i)` and `onColor(i)` — an index into the 256-colour palette. Each value is clamped to 0–255. |
| Style | `bold`, `dim`, `italic`, `underline`, `inverse`, `strikethrough` |
| Remove | `plain()` — the text with every escape sequence removed |
| Decide | `forTerminal()` — the styled text when stdout shows colour, `plain()` otherwise |

`rgb` needs a terminal with 24-bit colour, which most current ones have; the 256-colour palette works almost everywhere. How the sixteen named colours look is up to the terminal's theme.

## Styling anything printable

Every style also works on a value that is not a `String`, as long as it has a `Display` (a number, a `Bool`, a `Char`, an `Option`, a type of your own with an `impl Display`). The value is shown first and the text is styled:

<!-- prismio-check: pass -->
```prismio
import std.display
import std.io
import std.term

struct Version {
    major: Int,
    minor: Int
}

impl Display for Version {
    fn show(self) -> String {
        return "${self.major}.${self.minor}"
    }
}

fn main() -> Int {
    let version = Version { major: 1, minor: 4 }
    println(404.red().bold())
    println("compiler".dim(), version.green())
    return 0
}
```

`plain` is the exception: it removes escape sequences from text, and a value that is not text has none. A `String` still takes the `String` method, so styling text costs what it always did; `std.term` imports `std.display` for the rest.

## When not to colour

The methods always add the escape sequences. Whether they belong in the output is the program's decision, because output piped into a file or another program should usually stay plain:

| Function | Answers |
| --- | --- |
| `colorEnabled()` | whether stdout shows colour: it is a terminal, `NO_COLOR` is not set, and `TERM` is not `dumb` |
| `stderrColorEnabled()` | the same for stderr, which is redirected separately |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.term

fn main() -> Int {
    let status = "done".green().bold()
    println(status.forTerminal())

    if (stderrColorEnabled()) {
        eprintln("note: colour is on".gray())
    }
    return 0
}
```

`forTerminal()` is the short form of that check for stdout. `plain()` is also what to use before measuring text for alignment: `styled.plain().length` is the number of characters a terminal shows.

On Windows, `colorEnabled()` also switches the console to process escape sequences when it is not already doing so, which older consoles need. Windows Terminal handles them without it. Call `colorEnabled()` (or `forTerminal()`) once before printing styled text if you target the old console.

## Writing sequences yourself

Every style is an escape sequence starting with the ESC character, which a string literal writes as `\e` (or `\x1b`):

```prismio
println("\e[1;35mbold magenta\e[0m")
```

Anything a terminal understands can be written that way — cursor movement, clearing the screen (`"\e[2J\e[H"`), hyperlinks. See [lexical structure](/language/lexical-structure#string-and-character-literals) for every escape.

## Not available yet

| Missing | Use today |
| --- | --- |
| Terminal size, raw keyboard input, cursor position queries | not available from Prismio yet |
| Automatic stripping inside `print` when stdout is not a terminal | `forTerminal()`, or check `colorEnabled()` |
