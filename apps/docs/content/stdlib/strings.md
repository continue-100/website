---
title: Strings
description: The String type, its operators, and the std.string method surface -- length, indexing, comparison, concatenation, slicing, iteration, searching, and parsing.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [standard-library, strings, operators, methods, ownership]
related: [language/operators, language/methods, language/ownership-and-borrowing, language/control-flow]
---

`String` is an owned, move-only runtime type carrying a pointer and a byte length.
It has operators, properties, and methods; all of them are ordinary `std.string`
functions underneath, and every one of them needs `import std.string`.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let greeting = "Hello, World"

    println(greeting.length)          // 12
    println(greeting[0])              // H
    println(greeting == "Hello, World")

    let shout = greeting.toUpper()
    println(shout)

    for c in greeting {
        if (c.isSpace) { println("space") }
    }
    return 0
}
```

## Passing a result straight on

An owned result can be passed straight into another call. The compiler releases
it after the call returns, or at the end of the enclosing block when the callee
may hand back a view of it:

| Written | Result |
|---|---|
| `println(text.trim())` | correct |
| `println(text.split(',').length)` | correct — the Vec is released after `length` is read |
| `println(optionOr(text.stripPrefix("x"), "none"))` | correct — the Option lives to the end of the block |
| `x.trim().toUpper()` | correct — both results are released |

Two shapes still leak, and binding the value with `let` fixes both:

- a temporary evaluated *after* another call in the same expression, when the
  callee may hand back a view of it: `n = a.size() + optionOr(f(), d).length`
  (moving `f()` ahead of `a.size()` could reorder their effects, so the compiler
  does not);
- a view of a temporary that is kept — pushed into a Vec or assigned to a
  variable outside the block. The value is kept alive rather than freed early,
  so this is a leak, never a stale read.

Every table below marks which entries allocate. Build with `--verify` and run the
binary to check: the ledger line reads `N allocated, N released, N leaked,
N violation(s)`. **Read `violations` before `leaked`** — a leak costs bytes, a
violation corrupts.

## Operators

Five operators work on `String`. Each is rewritten during semantic analysis into
the `std.string` call it means, so ownership, overload resolution, and code
generation see an ordinary call — so `+` and `[a..b]` allocate, and are released,
exactly as a method's result is.

| Operator | Means | Allocates |
|---|---|---|
| `a == b`, `a != b` | content equality, same answer as `a.equals(b)` | no |
| `a < b`, `a <= b`, `a > b`, `a >= b` | sign of `a.compare(b)`, byte order | no |
| `a + b` | `a.concat(b)` | **yes** |
| `s[i]` | `s.charAt(i)` — the byte at `i`, NUL out of range | no |
| `s[start..<end]` | `s.slice(start, end)` — stops before `end`, clamped | **yes** |
| `s[start..end]` | `s.slice(start, end + 1)` — includes `end`, clamped | **yes** |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let path = "src/main.psm"

    if (path.endsWith(".psm")) { println("prismio source") }

    let name = path[4..<12]
    println(name)

    let label = "file: " + name
    println(label)

    if (name < "n") { println("sorts before n") }
    return 0
}
```

### `==` compares content, not addresses

A `String` is a pointer, so a raw address comparison would quietly answer
"not equal" for two equal strings. `==` is the content comparison; there is no
way to spell the address one.

### A chain of `+` is a single allocation

`a + b + c` becomes one `a.concat(b, c)`, not two nested calls. This is a
correctness measure rather than an optimisation: the intermediate of a nested
concatenation is a value nothing names, so the pairwise form would leak once per
`+`. Chains of up to six parts are supported; past that, build a `Vec<String>`
and call `join` on it.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let user = "ada"
    let host = "example.com"

    // One allocation, not two.
    let address = user + "@" + host
    println(address)
    return 0
}
```

`+` requires both sides to be Strings. The language does not promote anything
implicitly, so convert first — `"n = " + count.toString()`.

## Properties

These are declared `prop`, so they are read without parentheses — `s.length`,
never `s.length()` ([properties](/language/methods#properties)). A property never
allocates; anything that does is a method and takes `()`, so `s.trim` is a
compile error naming the fix.

| Property | Type | Meaning |
|---|---|---|
| `s.length` | `Int` | byte length; a multi-byte UTF-8 character counts as its bytes |
| `s.isEmpty` | `Bool` | length is zero |
| `s.isNotEmpty` | `Bool` | length is not zero |
| `s.isBlank` | `Bool` | empty, or nothing but whitespace |
| `s.first`, `s.last` | `Char` | first/last byte, NUL when empty |

## Iteration

`for c in s` yields each byte as a `Char`. The string is borrowed, not moved, so
it is still usable afterwards.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let text = "a1b2c3"
    let mut digits = 0

    for c in text {
        if (c.isDigit) { digits = digits + 1 }
    }

    println(digits)
    println(text.length)
    return 0
}
```

The collection has to be a **name**, not an expression. `for line in text.lines()`
is refused, because the loop needs the collection more than once and the result of
`lines()` must be bound anyway under the rule above:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let report = "alpha\nbeta\ngamma\n"
    let lines = report.lines()

    for line in lines {
        println(line)
    }
    return 0
}
```

`for (i, c) in s` gives the index beside each byte, and `for i in 0..<s.length`
remains available when only the index is wanted.

## Access and conversion

| Method | Returns | Allocates |
|---|---|---|
| `s.charAt(i)` | `Char` — NUL out of range | no |
| `s.byteAt(i)` | `Int` — no upper-bound check, use inside an established bound | no |
| `s.get(i)` | `Option<Char>` — `None` out of range | no |
| `s.clone()` | `String` | **yes** |
| `s.chars()` | `Vec<Char>` | **yes** |
| `s.bytes()` | `Vec<Int>` | **yes** |

`s[i]` and `s.charAt(i)` answer NUL rather than trapping, which is unambiguous
because a Prismio String cannot contain a NUL. `s.get(i)` is the form that makes
the absent case unavoidable.

## Comparison

| Method | Returns |
|---|---|
| `a.equals(b)` | `Bool` — same as `a == b` |
| `a.equalsIgnoreCase(b)` | `Bool` — ASCII fold, not a Unicode case fold |
| `a.compare(b)` | `Int` — negative, zero, or positive, by byte value |

## Searching

None of these allocate.

| Method | Returns |
|---|---|
| `s.contains(needle)` | `Bool` — `needle` may be a `String` or a `Char` |
| `s.startsWith(p)`, `s.endsWith(p)` | `Bool` — `String` or `Char` |
| `s.indexOf(needle)` | `Int` — first index, or `-1` |
| `s.indexOf(needle, from)` | `Int` — first index at or after `from`, or `-1` |
| `s.lastIndexOf(needle)` | `Int` — last index, or `-1` |
| `s.find(needle)` | `Option<Int>` — the same search without the sentinel |
| `s.count(needle)` | `Int` — non-overlapping occurrences |
| `s.matchesAt(needle, at)` | `Bool` — whether `needle` occurs exactly at `at` |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let line = "key = value"

    let at = line.indexOf('=')
    if (at < 0) { return 1 }

    let key = line[0..<at].trim()
    let value = line[at + 1..<line.length].trim()

    println(key)
    println(value)
    return 0
}
```

`indexOf` and `find` are the same search. The sentinel form is cheaper — an
`Option` with a payload is a tagged struct and an allocation — so `-1` is the
default and `find` is there for callers who would rather be made to handle the
absent case.

## Producing new strings

Every method here allocates and returns an owned `String`. Bind the result.

| Method | Meaning |
|---|---|
| `s.concat(other)` | same as `a + b` |
| `s.substring(start, length)` | **length**-based; a range past the end is clamped |
| `s.slice(start, end)` | **end**-exclusive; same as `s[start..<end]` |
| `s.trim()`, `s.trimStart()`, `s.trimEnd()` | space, tab, newline, carriage return |
| `s.trimChars(set)` | trim any byte appearing in `set`, from both ends |
| `s.toUpper()`, `s.toLower()` | ASCII only |
| `s.capitalize()` | first byte uppercased, rest untouched |
| `s.reverse()` | by byte |
| `s.repeat(n)` | `n` copies |
| `s.padStart(w, pad)`, `s.padEnd(w, pad)`, `s.padCenter(w, pad)` | pad to width `w` |
| `s.replace(old, new)` | every occurrence |
| `s.replaceFirst(old, new)` | the first occurrence |
| `s.insert(at, other)` | `at` past the end appends |
| `s.removeRange(start, length)` | clamped |
| `s.stripPrefix(p)`, `s.stripSuffix(p)` | `Option<String>` — `None` when absent |

`substring` takes a length and `slice` takes an end. Both exist because reading a
range as a length is the mistake the pair is meant to prevent: `s[a..<b]` and
`s.slice(a, b)` stop before `b`, and `s[a..b]` includes it.

`replace` does not rescan its own replacement, so replacing `a` with `aa`
terminates.

## Splitting and joining

| Method | Returns |
|---|---|
| `s.split(sep: Char)` | `Vec<String>` |
| `s.split(sep: String)` | `Vec<String>` |
| `s.splitWhitespace()` | `Vec<String>` — splits on runs, discards empty parts |
| `s.lines()` | `Vec<String>` |
| `parts.join(sep)` | `String` — the inverse, on a `Vec<String>` receiver |

`s.lines()` is not `s.split('\n')`, and the two differences are the ones that bite
when reading a file: a trailing newline **ends** the last line rather than starting
an empty one, and a CRLF file does not leave a `\r` on every element.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let csv = "ada,grace,alan"
    let names = csv.split(',')

    let rejoined = names.join(" and ")
    println(rejoined)
    return 0
}
```

## Scanning with a closure

| Method | Returns |
|---|---|
| `s.countIf(f)` | `Int` — bytes satisfying `f` |
| `s.indexWhere(f)` | `Int` — first index satisfying `f`, or `-1` |
| `s.allChars(f)`, `s.anyChars(f)` | `Bool` |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let token = "abc123"
    println(token.countIf(|c: Char| c.isDigit))
    println(token.allChars(|c: Char| c.isAlnum))
    return 0
}
```

There is no `each`: a closure's return type has no `Void` spelling yet, so
`|c: Char| println(c)` does not typecheck. Use `for c in s`, which needs no
closure at all.

## `Char`

`Char` is a **byte**, not a Unicode scalar. Every predicate below is ASCII-only.

| Method | Returns |
|---|---|
| `c.isDigit`, `c.isAlpha`, `c.isAlnum` | `Bool` (properties) |
| `c.isLower`, `c.isUpper`, `c.isSpace` | `Bool` (properties) |
| `c.digitValue` | `Int` (property) |
| `c.toUpper()`, `c.toLower()` | `Char` |
| `c.code` | `Int` — the byte value |
| `c.toString()` | `String` — **allocates** |

## Parsing and formatting

| Method | Returns |
|---|---|
| `s.parseInt()` | `Option<Int>` |
| `s.parseIntOr(fallback)` | `Int` |
| `s.parseFloat()` | `Option<Float>` |
| `s.parseBool()` | `Option<Bool>` — exactly `"true"`/`"false"`, case-insensitively |
| `s.parseInt(radix)` | `Option<Int>` — base 2 through 36 |
| `s.parseI64()` / `s.parseU64()` | `Option<I64>` / `Option<U64>`, with `(radix)` forms |
| `n.toString()` | `String` — on `Int`, `I64`, `U64`, `Float`, `Bool`, and `Char`; **allocates** |
| `n.toString(radix)` | `String` — on `Int` and `U64` |
| `n.toHex()` / `toOctal()` / `toBinary()` | `String` — on `U64` |
| `f.toString(decimals)` | `String` — fixed-point, on `Float` |

`parseInt` returns `Option<Int>` rather than a number, which is the distinction a C
`atoi` cannot make: it returns 0 for `"0"` and 0 for `"banana"`.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string
import std.option

fn main() -> Int {
    let port = "8080".parseIntOr(80)
    println(port)

    let maybe = "not a number".parseInt()
    if (optionIsNone(maybe)) { println("rejected") }
    return 0
}
```

**Every parse checks its range.** `"99999999999".parseInt()` is `None`, not a
wrapped number — a parse that reported success while producing a value the text
does not say is the defect `Option` exists to prevent, and overflow is that defect
by another route. The same holds at the edges: `I64`'s most negative value parses,
and one past it does not.

`parseFloat` is `strtod`, so it is correctly rounded, and it is **stricter than C**:
the whole string must be a number, so `"1.5kg"` and `" 1.5"` are `None`.

### Float text

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    println(0.1 + 0.2)
    println(1.0 / 3.0)
    println((1.0 / 3.0).toString(2))
    println(2.5.toString(2))
    return 0
}
```

```
0.3
0.333333333333333
0.33
2.50
```

A Float prints as the shortest decimal that reads back as the same number, with at most fifteen significant digits. Fifteen is what a double always holds exactly, so every literal prints as written and `0.1 + 0.2` prints `0.3`. The digits after that are rounding noise from binary arithmetic. A value that needs more than fifteen digits to be exact, such as `1.0 / 3.0`, prints its first fifteen, so the text is not a lossless copy of every Float. `print(f)` and `f.toString()` always agree.

`v.toString(decimals)` is the presentation form for a column: a fixed number of decimals, trailing zeros kept.

## Interpolation

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string
import std.display

fn main() -> Int {
    let name = "world"
    let count = 42

    println("hello, ${name}!")
    println("${count} items, ${count + 1} after the next")
    return 0
}
```

```
hello, world!
42 items, 43 after the next
```

Any expression goes inside `${...}`. Each value is converted with `show`, the
`Display` trait's method — so **a type of your own interpolates as soon as it
implements `Display`**, and `import std.display` is what an interpolated string
needs beyond `std.string`.

`\$` writes a literal `${`. That is the one migration hazard: a string that
contained `${` before this existed now interpolates, and `\${` is the fix.

By the time anything but the parser sees it, `"a${b}c"` is `concat("a", show(b), "c")`
— no format-string parsing at run time, no allocation the plain call would not
have made, and a mistake inside `${...}` underlines the expression you wrote.

## Bytes and characters

`length`, `charAt`, `substring` and the operators that lower to them are **byte**
indexed. That is what makes a scan one comparison per byte, and it is a trap for
text that is not ASCII, because a byte index can fall inside a character. These are
the second reading:

| Method | Returns |
|---|---|
| `s.isAscii` | `Bool` |
| `s.isValidUtf8` | `Bool` — well-formed, so overlong forms and surrogates are refused |
| `s.scalarCount` | `Int` — characters, as opposed to `length`'s bytes |
| `s.scalars()` | `Vec<Int>` — code points; an ill-formed byte becomes U+FFFD |
| `s.scalarAt(byteIndex)` | `Int` — the code point there, or `-1` |
| `s.scalarWidthAt(byteIndex)` | `Int` — 1 to 4, or 0 |
| `s.isCharBoundary(byteIndex)` | `Bool` — ask before `substring` |
| `s.scalarSubstring(start, count)` | `String` — counted in characters, so it cannot cut one in half |
| `strFromScalar(code)` | `String` — one code point as UTF-8 |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let greeting = "héllo"
    println(greeting.length)
    println(greeting.scalarCount)
    println(greeting.reverse())
    println(greeting.scalarSubstring(1, 3))
    return 0
}
```

```
6
5
olléh
éll
```

`reverse` moves characters rather than bytes — reversing the bytes of that string
would put half of an `é` where a character belongs, which is not a different string
but an invalid one. `padStart`, `padEnd` and `padCenter` count characters for the
same reason: a column with one accented name in it lined up a character short when
they counted bytes.

A width here is still not a *display* width. An East Asian character occupies two
terminal columns and a combining mark none, which needs tables this library does not
carry.

## Methods are the interface

Every operation on this page is a method or an operator. The `str*` and `char*`
free functions that earlier versions exposed — `strTrim(s)`, `strFromInt(n)`,
`charIsDigit(c)` — are internal to the standard library now, and calling one
reports that it is:

<!-- prismio-check: fail -->
```prismio
import std.string

fn main() -> Int {
    return strTrim("  x ").length
}
```

``error: `strTrim` is internal to the package that declares it`` — write
`"  x ".trim()`. The number conversions are methods on the number: `n.toString()`,
`n.toString(16)`, `n.toHex()`, `f.toString(2)`. The character predicates are
methods on `Char`: `c.isDigit`, `c.toUpper()`, `c.digitValue`.

Three free functions remain, because none of them has a receiver to hang on:
`join(parts, sep)` (also written `parts.join(sep)`), `strFromScalar(code)`, and,
in [std.unicode](/stdlib/unicode), `scalarWidth(code)`.

**A program that defines its own `trim`** still reaches the library's with the
module path: `std.string.trim(s)`. An unqualified call prefers the program's own
function, and the operators always mean the library's.

## Performance

`std.string` is native Prismio down to three compiler primitives — read a byte,
write a byte, allocate the buffer.

`String` carries its byte length, so `s.length` is a field read rather than a scan.
On an Apple-silicon benchmark, removing the old `strlen` call took the uppercase
workload from 0.520s to 0.271s, level with C at 0.272s. Substring search uses
Crochemore-Perrin Two-Way with a SIMD candidate prefilter; measured against pure C
and pure Rust programs it is the fastest of the four on every search workload.

Every producing function allocates its result once and fills it in a single pass,
so each is linear in the length of its output.

## Not implemented

A regex module and locale-aware collation.

`Char` is a byte, so `toUpper`, `toLower` and `capitalize` are **ASCII-only**: they
leave every other character exactly as it was rather than mangling it, but they do
not case-map it either. Full case mapping needs Unicode tables, and one of its rules
is that a string can change length — `ß` uppercases to `SS`.

Grapheme clusters, terminal width and NFC/NFD normalization are in
[`std.unicode`](/stdlib/unicode) rather than here, because they carry 100 KB of
generated tables that a program doing none of it should not build.

`s = s + part` in a loop on a local is amortised O(1) per append. Codegen consumes
the left buffer when an owning assignment immediately replaces it, and capacity
doubles on a miss — 2000 appends of ten bytes measure **13 allocations**, not 2000.
Through a struct field the same line copies the whole text each time; use a
`StringBuilder` there, which keeps the pieces and joins them once:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let mut out = StringBuilder.new()
    for i in 0..<3 {
        out.append("line ")
        out.appendLine(i.toString())
    }
    println(out.length)       // 21
    print(out.toString())
    return 0
}
```

## FFI caution

A Prismio `String` is a pointer-and-length pair and should not be assumed to match
an arbitrary C `char *` contract. Declare `borrow`, `consume`, `retain`, `alias`, or
`produce(free_fn)` accurately, and write a C adapter when terminators, encoding,
allocation, or lifetime differ.
