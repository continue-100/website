---
title: Unicode
description: Terminal width, grapheme clusters and NFC/NFD normalization for Prismio strings.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-10"
tags: [standard-library, unicode, text, normalization, width]
related: [stdlib/strings, language/operators]
---

`import std.unicode` answers the two questions `std.string`'s scalar functions
cannot: how wide a string is on a terminal, and where one *character* ends when a
character is several code points.

It is a separate module because of what it carries — 100 KB of range tables
generated from the Unicode database — and a program that lays out no columns and
compares no user-entered text should not build them.

## Three counts, all correct

`"é"` written as `e` followed by a combining acute is:

| Measure | Value | From |
| --- | --- | --- |
| bytes | 3 | `s.length`, in `std.string` |
| scalars | 2 | `s.scalarCount`, in `std.string` |
| graphemes | 1 | `s.graphemeCount`, here |
| columns | 1 | `s.displayWidth`, here |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string
import std.unicode

fn main() -> Int {
    let cjk = "日本"
    println(cjk.length)
    println(cjk.scalarCount)
    println(cjk.displayWidth)
    return 0
}
```

```
6
2
4
```

Deleting a character means deleting a grapheme. Measuring a column means adding
widths. Indexing storage means bytes. Using one where another belongs is the
whole subject of this module.

## Terminal width

| Function | Returns |
| --- | --- |
| `scalarWidth(code)` | `Int` — 0, 1 or 2 |
| `s.displayWidth` | `Int` — the columns `s` occupies |
| `s.padStartDisplay(columns, pad)` | `String` |
| `s.padEndDisplay(columns, pad)` | `String` |
| `s.truncateToWidth(columns)` | `String` — cut at a cluster boundary |

Width is East Asian Width, which is what terminal emulators, `wcwidth` and every
table-drawing program agree on: a CJK ideograph is two columns, a combining mark
is none, a control character is none. It is **not** a proportional font's answer,
and no property in Unicode describes one.

`std.string`'s `padStart` counts *characters*, which lines up every alphabet whose
characters are one column wide. These count columns, for the ones that are not.

## Grapheme clusters

| Function | Returns |
| --- | --- |
| `s.graphemeCount` | `Int` |
| `s.graphemes()` | `Vec<String>` |
| `s.graphemeWidthAt(byteIndex)` | `Int` — bytes in the cluster there |

A flag is two scalars and one grapheme. A ZWJ family emoji can be seven scalars
and one. A letter with a combining mark is two and one. Hangul jamo compose into
a syllable.

This is a documented **subset of UAX #29** — the rules that decide real text:
marks join what precedes them, ZWJ sequences hold together, regional indicators
pair, skin tones join their emoji, and Hangul jamo compose. `Prepend`, the
`Extended_Pictographic` property and Unicode 15's indic conjunct rules are not
implemented.

## Normalization

The same text has two spellings — `é` is either U+00E9 or `e` plus U+0301 — and
`==` compares bytes. macOS hands out filenames decomposed while most everything
else composes, so a program that reads a path and compares it to a literal is
already in this.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string
import std.unicode

fn main() -> Int {
    let composed = "é"
    let decomposed = "é"

    if ((composed == decomposed) == false) { println("different bytes") }
    if (composed.equalsNormalized(decomposed)) { println("same text") }

    println(composed.normalizeNfd().scalarCount)
    println(decomposed.normalizeNfc().scalarCount)
    return 0
}
```

```
different bytes
same text
2
1
```

| Function | Returns |
| --- | --- |
| `s.normalizeNfc()` | `String` — composed; the form to store and compare in |
| `s.normalizeNfd()` | `String` — decomposed |
| `a.equalsNormalized(b)` | `Bool` |

Both forms are **canonical**: they never change what the text means. The
compatibility forms NFKC and NFKD, which fold `ﬁ` into `fi`, are deliberately
absent — that is a different operation with different consequences, and a library
that offers it beside these invites reaching for the wrong one.

Normalize once, where text enters the program, and compare afterwards.

## Where the tables come from

`tools/generate_unicode_tables.py` reads the Unicode database bundled with
CPython and writes `std/unicode_tables.psm`. **The tables are generated, never
edited**: a hand-maintained range list for East Asian Width or combining classes
is wrong the day it is written and wronger every year after.

The composition table is derived from NFC itself — a pair composes exactly when
the reference normalizer says it does — so singletons, non-starter decompositions
and every script-specific exclusion are accounted for without a second list to
maintain. The current tables are Unicode 13.0.0, and the normalizer agrees with
CPython's over 800 comparisons covering decomposables, multi-mark sequences in
random order, and Hangul.
