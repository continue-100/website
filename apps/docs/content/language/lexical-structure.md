---
title: Lexical structure
description: Prismio 0.1 identifiers, comments, literals, punctuation, and reserved words.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [lexer, comments, literals, keywords]
related: [specification/grammar, language/operators, language/types]
---

Prismio source files use the `.psm` extension and are read as UTF-8 text. A UTF-8 byte-order mark at the start of a file is ignored. Source is tokenized before parsing; whitespace and comments separate tokens but otherwise have no runtime meaning.

Statements are separated by their grammar and line structure, not by semicolons. Do not add `;` after a binding, call, assignment, or return.

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    let answer = 40 + 2
    println(answer)
    return 0
}
```

## Whitespace and comments

Spaces, tabs, and newlines may appear between tokens. Use `//` for a line comment; it continues through the next newline.

```prismio
// The entry point can return a process status.
fn main() -> Int {
    let value = 42 // comments may follow code
    return value
}
```

`/* ... */` is a block comment, and block comments **nest**:

<!-- prismio-check: pass -->
```prismio
import std.io

/* An outer comment
   /* holding an inner one */
   which the inner closing delimiter did not end. */

fn main() -> Int {
    let value = 21 /* comments are whitespace, so they fit anywhere whitespace fits */ * 2
    println(value)
    return 0
}
```

Nesting is why the feature is worth having. In the C form, commenting out a region that already contains a comment ends the outer comment at the first inner `*/`, turning the rest of the region back into code — usually without a syntax error to say so. Prismio counts depth, so wrapping a region is safe however many comments it already holds.

Two things nesting does not do. A `//` inside a block comment is not a line comment: it neither hides a following closing delimiter nor protects a stray opening one, because depth counts delimiters and nothing else. That also applies to prose — a closing delimiter written inside a comment, even in backticks, closes it. And an unclosed `/*` is an error reported at the opening delimiter, not at the end of the file — every unterminated comment reaches the end of the file, so that position identifies nothing.

Documentation-comment syntax is not supported in 0.1. Consecutive `//` lines are ordinary comments; the documentation generator does not extract API documentation from them.

## Identifiers

Identifiers name bindings, functions, fields, structs, enums, variants, and regions. Use letters or `_` at the beginning and letters, digits, or `_` afterward. Identifiers are case-sensitive: `point`, `Point`, and `POINT` are different names.

A letter is a letter in any script. Identifiers follow [UAX #31](https://www.unicode.org/reports/tr31/), Unicode's standard for identifiers, at Unicode 18.0.0: the first character is `XID_Start` or `_`, and the rest are `XID_Continue`, which adds digits, combining marks and connector punctuation.

<!-- prismio-check: pass -->
```prismio
import std.io

struct Точка {
    x: Int,
    y: Int
}

fn 合計(左: Int, 右: Int) -> Int {
    return 左 + 右
}

fn main() -> Int {
    let p = Точка { x: 1, y: 2 }
    let π = 3
    println(合計(p.x, p.y) + π)
    return 0
}
```

```
6
```

Three rules are Prismio's own:

- **Identifiers are compared in NFC.** `é` typed as one character and `é` typed as `e` followed by a combining accent are the same name, because they are the same text.
- **ZERO WIDTH JOINER and ZERO WIDTH NON-JOINER are not allowed**, although Unicode lists both as `XID_Continue`. They are invisible, so two names differing only by one would look identical.
- **Reserved words are ASCII** and stay reserved in every script.

A character outside these sets is an error naming it by code point — `unexpected character U+1F600` for an emoji — and a byte that is not UTF-8 is reported as a byte. Source files are UTF-8.

### Names that mislead

Two more checks come from [UTS #39](https://www.unicode.org/reports/tr39/), Unicode's security mechanisms. Both are **warnings**: the program still compiles, because an uncommon letter can be the right one and a look-alike pair can be deliberate.

- **P2003**, a restricted character: one UTS #39's General Security Profile does not allow in identifiers — obsolete, technical, limited-use, or changed by NFKC normalization.
- **P2004**, confusable identifiers: two different names in the program that look the same, because they have the same UTS #39 skeleton. It names the one declared first.

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    let paypal = 1
    let pаypal = 2
    let ſum = paypal + pаypal
    println(ſum)
    return 0
}
```

The second `pаypal` has a Cyrillic `а`, and `ſum` starts with LONG S:

```
warning[P2003]: identifier `ſum` contains U+017F, which UTS #39 restricts in identifiers: it is uncommon, obsolete or easily mistaken
 --> names.psm:6:9
  |
6 |     let ſum = paypal + pаypal
  |         ^^^
warning[P2004]: identifier `pаypal` looks like `paypal` (UTS #39 confusables); a reader cannot tell which one is meant
 --> names.psm:5:9
  |
5 |     let pаypal = 2
  |         ^^^^^^
```

A program whose identifiers are all ASCII is never checked, and two ASCII names are never reported as confusable: that `l` and `I` look alike is a reader's everyday problem, not an attack.

By convention, types and enum variants use `UpperCamelCase`, while functions, bindings, fields, and region names use `snake_case`. These are conventions, not compiler-enforced casing rules.

A reserved word cannot be used as an identifier. Name resolution also distinguishes declaration kinds: a local binding can shadow an outer binding, while duplicate top-level declarations of the same kind are normally rejected.

## Integer literals

Integer literals are decimal — `0`, `42`, `5000000000` — or hexadecimal, octal and binary with a prefix: `0xFF`, `0o755`, `0b1010`. A leading zero is not octal: `010` is ten. A leading `-` is a unary operator rather than part of the token, which matters when the compiler checks types and constant expressions.

Literal values are checked against their contextual type. For example, `255` fits `U8`, but `256` does not.

```prismio
let signed: Int = -42
let byte: U8 = 255
let wide: U64 = 5000000000
```

### Digit separators

A long number is hard to read at a glance: is `100000000` ten million or a hundred million? An underscore between two digits groups them and means nothing else, so you can write the value the way you would say it:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.display

fn main() -> Int {
    let million = 1_000_000
    let lakh = 1_00_000            // any grouping you like
    let mask = 0xFF_FF             // in every base
    let flags = 0b1010_0001
    let pi = 3.141_592_653         // and in a Float, exponent included
    println("${million} ${lakh} ${mask} ${flags} ${pi}")
    return 0
}
```

This prints `1000000 100000 65535 161 3.141592653`. A separator must have a digit on both sides, so `1_`, `1_.5`, `0x_FF` and `1e_5` are errors rather than a silent change of meaning:

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let budget = 1_000_
    return 0
}
```

```
error[P2001]: a digit separator `_` goes between two digits, as in `1_000_000`
```

## Floating-point and Boolean literals

A decimal point produces a `Float` literal, such as `1.5` or `0.0`. `Float` is the only floating-point type in 0.1 and maps to a 64-bit IEEE-style backend value.

The Boolean literals are `true` and `false`. Prismio does not treat integers as conditions, so `if (1)` is invalid; the condition must have type `Bool`.

## Strings and characters

Strings use double quotes and characters use single quotes:

```prismio
let message: String = "line one\nline two"
let initial: Char = 'P'
```

| Escape | Means | In a String | In a Char |
| --- | --- | --- | --- |
| `\n`, `\t`, `\r` | newline, tab, carriage return | yes | yes |
| `\\`, `\"`, `\'` | a backslash or quote | yes | yes |
| `\$` | a literal `$`, where `${` would start [interpolation](#strings-and-characters) | yes | — |
| `\e` | ESC (27), which starts every terminal colour and cursor sequence | yes | yes |
| `\xHH` | the byte with that hex value: `\x1b`, `\x41` | yes | yes |
| `\u{H…}` | a Unicode scalar value, written as UTF-8: `\u{E9}` is é, `\u{1F600}` is 😀 | yes | — |
| `\0` | NUL | rejected | yes |

A NUL is rejected in a String — `\0`, `\x00` and `\u{0}` alike — because a String is NUL-terminated and one would silently cut it short. `\u{…}` holds one to six hex digits and may not name a UTF-16 surrogate half (`D800`–`DFFF`), which no UTF-8 text can hold. `"\e[31mred\e[0m"` prints red in a terminal; [std.term](/stdlib/term) writes those sequences for you.

**A `"..."` literal is one line.** A newline inside one is an error rather than part of the text, which is what makes a missing closing quote a mistake reported on the line that made it instead of a string that swallows the rest of the file:

```text
error[P2001]: unterminated string literal; multiline strings require triple quotes """..."""
```

### Triple-quoted strings

`"""..."""` spans lines, and holds its text as written — the same pair of spellings as Kotlin.

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    let usage = """Usage: tool [options] <file>
  -v   verbose
  -h   this text"""
    println(usage)
    return 0
}
```

Inside `"""`, a `\n` is a backslash followed by an `n` and a `"` is a quote — there are no escapes to write and none to read, so a Windows path or a regular expression goes in unchanged. Quotes are literal as long as three in a row do not appear, since three is what ends the literal.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let pattern = """C:\logs\"today".txt"""
    println(pattern.length)
    return 0
}
```

Interpolation works in both forms, and lowers to `show(...)` — so a file that interpolates imports `std.display`:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.display

fn main() -> Int {
    let name = "world"
    println("""Hello ${name},
welcome.""")
    return 0
}
```

`Char` is a byte-sized character in 0.1, not a Unicode scalar-value type. A string is runtime-managed, move-only data. Source files are UTF-8, but the current character representation should not be described as full Unicode text semantics.

Byte-prefixed string syntax is not implemented.

## The `none` literal

`none` represents absence for an optional reference-shaped type. It needs a contextual optional type in places where the compiler cannot infer one.

```prismio
struct Node { value: Int, next: Node? }

fn empty_next() -> Node? {
    return none
}
```

`none` is not a universal null value. Scalar types such as `Int`, `Bool`, and `Char` cannot be optional in 0.1.

## Punctuation and operators

Braces delimit blocks and declarations. Parentheses delimit parameter lists, call arguments, and control-flow conditions. Brackets form array types, array literals, and index expressions. A dot selects fields and enum variants. `..` forms a range that includes its end and `..<` one that stops before it, in a `for` header or inside brackets as a slice. `@` names a loop (`outer@ for …`) and the loop a `break@outer` or `continue@outer` leaves.

The lexer recognizes the operator spellings documented in [operators and casts](/language/operators). A longer token wins where punctuation shares a prefix, so `!=`, `<=`, `>=`, `<<`, `>>`, and compound assignments are each single tokens.

## Reserved vocabulary

Implemented words include `import`, `let`, `mut`, `fn`, `extern`, `struct`, `enum`, `trait`, `impl`, `where`, `if`, `else`, `match`, `while`, `loop`, `for`, `in`, `break`, `continue`, `return`, `and`, `or`, `as`, `sink`, `inout`, `region`, `none`, and `default` — the last two are values: `none` is the absent optional, and [`default`](/language/variables#default-values) is the default of whatever type the context expects.

`repeat`, `step`, `unique` and `pin` are contextual: each means something only in its own position and is an ordinary name everywhere else, so `"ab".repeat(3)` and a variable called `step` both work. `throw` is lexed as a reserved word but no statement using it is parsed in 0.1.

## Lexical errors

The compiler rejects an unterminated string or character, an unsupported escape, an invalid character literal, or a character that cannot begin any token. Lexical errors happen before imports are semantically merged or types are checked, so correct the source spelling first.

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let text = "nul: \0"
    return 0
}
```

This program is invalid because the 0.1 lexer does not allow the NUL escape inside a string. The same escape is valid in a `Char` literal.

**Bidirectional controls must be escaped (P2002).** The overrides and isolates, U+202A to U+202E and U+2066 to U+2069, change the order in which a line is *displayed* without changing its bytes. Written raw in a comment or a string, one can make an editor or a code review show code that is not the code that compiles — the attack known as Trojan Source (CVE-2021-42574). The lexer refuses them, and the diagnostic shows the character as `�` rather than letting the terminal apply it:

```
error[P2002]: unescaped bidirectional control U+202E in a string literal: it reorders how the line is displayed, so what a reader sees is not what compiles; write it as `\u{202E}` so it is visible
 --> main.psm:4:23
  |
4 |     let access = "user� // admin"
  |                       ^
```

A string that needs one writes the escape, which says what it is:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let reversed = "abc\u{202E}def"
    println(reversed.scalarCount)   // 7
    return 0
}
```

In a comment there is nothing to escape, so the fix is to remove it. Other characters that share the first byte of their UTF-8 encoding — an em dash, an arrow — are ordinary text.

## Current limitations

- Comments are `//` to the end of the line and `/* ... */`, which nests.
- A byte-string prefix is unavailable; for raw text use a triple-quoted string, which takes its content as written.
- `Char` is byte-sized rather than a complete Unicode character abstraction.
- Reserved future words cannot be repurposed as identifiers even though their features are not parsed.

The [grammar reference](/specification/grammar) describes how these tokens form declarations, statements, and expressions.
