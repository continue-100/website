---
title: Unicode
description: Terminal width, grapheme clusters and NFC/NFD normalization for Prismio strings.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-26"
tags: [standard-library, unicode, text, normalization, width]
related: [stdlib/strings, language/operators]
---

`import std.unicode` answers the two questions `std.string`'s scalar functions
cannot: how wide a string is on a terminal, and where one *character* ends when a
character is several code points.

It is a separate module because of what it carries — range tables generated
from the Unicode Character Database — and a program that lays out no columns and
compares no user-entered text should not build them.

The module implements **Unicode 18.0.0**. `unicodeVersion()`, from
`std.unicode_tables`, returns that string.

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

`scalarWidth` is 0 for nonspacing and enclosing marks, format characters (except
SOFT HYPHEN, which terminals draw), controls, the line and paragraph separators,
and the conjoining Hangul vowels and finals whose syllable takes its leading
consonant's two columns. It is 2 for East Asian Wide and Fullwidth, and 1 for
everything else, unassigned code points included.

`displayWidth` measures **grapheme clusters**, not scalars, because a terminal
draws a cluster as one glyph. An emoji sequence — a ZWJ family, a skin tone, a
flag — is two columns however many scalars spell it, and a pictograph followed by
VARIATION SELECTOR-16 (`©️`) is two where its text form (`©`) is one. Everything
else is the sum of its scalars' widths.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string
import std.unicode

fn main() -> Int {
    println("👨‍👩‍👧".scalarCount)
    println("👨‍👩‍👧".displayWidth)
    println("é".displayWidth)
    return 0
}
```

```
5
2
1
```

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
a syllable, and a Devanagari consonant, virama and consonant (`क्ष`) are one
conjunct.

These are UAX #29's **extended grapheme clusters**, every rule from GB1 to GB999
as Unicode 18.0.0 states them — including `Prepend`, `SpacingMark`,
`Extended_Pictographic` emoji sequences and the Indic conjunct rule GB9c. A ZWJ
joins two pictographs and nothing else, so `a` ZWJ `b` is two clusters.
`graphemeWidthAt` expects a cluster boundary: pass `0` or a value it returned.

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

`tools/generate_unicode_tables.py` writes `std/unicode_tables.psm` from the
official Unicode Character Database. **The version is pinned in the generator**,
along with the SHA-256 of every source file it reads, and every generated file
records the version, the sources, their hashes and the generator's own hash. The
tables are never edited and never taken from whatever Unicode the developer's
Python happens to bundle — which is how an earlier version of these tables called
every unassigned code point two columns wide.

Each table is a sorted array of scalar ranges searched by binary search. The
composition table is UAX #15's primary composites: the two-scalar canonical
mappings less `Full_Composition_Exclusion`.

`tools/unicode_conformance.py` runs this module against the UCD's own test
files. At 18.0.0 it passes all 853 lines of `GraphemeBreakTest.txt`, all 20,171
lines of `NormalizationTest.txt`, and the 1,094,910 scalars that file says both
forms leave unchanged.
