---
title: Operators and casts
description: Prismio 0.1 arithmetic, comparison, logical, bitwise, shift, unary, assignment, and cast operators.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-25"
tags: [operators, precedence, casts, bitwise]
related: [language/types, specification/evaluation, errors/integer-width-mismatch]
---

Operators form expressions from typed operands. Prismio provides arithmetic `+ - * / %`, comparison `== != < <= > >=`, short-circuit logic `and or`, bitwise `& | ^`, shifts `<< >>`, and unary `! - ~`. Explicit casts use `expression as Type`. `String` has its own set — see [String operators](#string-operators) below.

Operators are statically checked. Prismio generally requires matching operand types and does not insert C-style integer promotions or integer-to-float conversions.

## Arithmetic

`+`, `-`, `*`, `/`, and `%` operate on compatible numeric values. On integers `%` takes the dividend's sign (`-7 % 2` is `-1`; [`floorMod`](/stdlib/math#integer-functions) takes the divisor's). On `Float` it is C's `fmod`: `-7.5 % 2.0` is `-1.5`, and `x % 0.0` is NaN. Unary `-` negates a signed integer or floating-point value, and on a `Float` it flips only the sign, so `-(0.0)` is `-0.0`.

`Float` comparisons follow IEEE 754: `NaN != NaN` is `true`, and `==`, `<`, `<=`, `>`, `>=` with a NaN operand are `false`.

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let width: Int = 7
    let height: Int = 6
    let area = width * height
    let remainder = area % 5
    return area + remainder - 44
}
```

Division or remainder by zero, signed overflow, and the most negative signed value divided by `-1` are not recoverable Prismio exceptions. Avoid those inputs; the exact backend outcome is not a portable program contract.

## Comparisons

`==` and `!=` compare compatible scalar values, fieldless enums, and supported optional/`none` cases. `<`, `<=`, `>`, and `>=` order compatible numeric values. Comparisons return `Bool`.

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let small: U8 = 4
    let normal: Int = 10
    if (small < normal) { return 0 }
    return 1
}
```

The two typed operands do not gain an implicit common width. Give the comparison one exact type, for example by widening `small as Int`.

## Logical operators

`and`, `or`, and `!` operate on `Bool`. `and` evaluates its right operand only when the left operand is true. `or` evaluates its right operand only when the left operand is false.

```prismio
if (index >= 0 and index < limit) {
    println(index)
}
```

Prismio uses the words `and` and `or`, not `&&` and `||`.

## Bitwise operators and shifts

`&`, `|`, `^`, and unary `~` operate on compatible integers. `<<` and `>>` shift an integer value. Right shift is arithmetic for signed types and logical for unsigned types.

Keep shift counts within the bit width of the left operand. Negative or oversized counts do not have a stable source-level safety guarantee.

```prismio
let permissions: U8 = 5
let readable = (permissions & (1 as U8)) != (0 as U8)
```

## Assignment

Assignment forms are `=`, `+=`, `-=`, `*=`, `/=`, `%=`, `&=`, `|=`, and `^=`. Direct and compound assignment to a binding require `mut`.

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let mut bits: U8 = 1
    bits |= 4 as U8
    bits ^= 1 as U8
    return (bits as Int) - 4
}
```

Compound assignment is supported for plain variable bindings. It is not currently generalized to struct fields or indexed collection places. Assignment is a statement operation, not a value expression to embed inside a condition.

## Precedence

From lowest to highest, binary precedence is:

1. `or`
2. `and`
3. `== !=`
4. `< <= > >=`
5. `|`
6. `^`
7. `&`
8. `<< >>`
9. `+ -`
10. `* / %`

Unlike C, Prismio deliberately binds bitwise operators more tightly than equality, so `flags & mask != 0` groups as `(flags & mask) != 0`. Right shift is arithmetic for signed values and logical for unsigned values.

Unary operators and casts bind more tightly than the binary levels above. Parentheses are recommended whenever a mixed bitwise, comparison, and logical expression would otherwise require the reader to recall the complete table.

Operators at the same precedence normally group left-to-right. Do not use associativity to hide numerically significant grouping, especially for subtraction, division, shifts, or floating-point expressions.

## Casts

Operands generally require exact compatible types. There are no implicit integer-width or integer/float promotions; cast explicitly.

```prismio
let source: I16 = -12
let wide: I64 = source as I64
let magnitude: Float = (wide as Float) * -1.0
```

The documented conversions are:

- widening a signed integer sign-extends;
- widening an unsigned integer, `Bool`, or `Char` zero-extends;
- narrowing an integer keeps the low-order bits;
- integer-to-float converts numerically but may lose precision;
- float-to-integer truncates toward zero and saturates: out-of-range values clamp to the destination's `MAX`/`MIN`, and NaN becomes 0.

A cast states intent; it does not validate an input range. Check application ranges before narrowing data received from files, networks, or foreign code.

## String operators

`String` supports five operators. Each is rewritten during semantic analysis into
the `std.string` call it means, so all of them need `import std.string`, and two of
them allocate exactly as the call they stand for does.

| Operator | Means | Allocates |
|---|---|---|
| `a == b`, `a != b` | content equality, same answer as `a.equals(b)` | no |
| `a < b`, `a <= b`, `a > b`, `a >= b` | sign of `a.compare(b)` — byte order | no |
| `a + b` | `a.concat(b)` | **yes** |
| `s[i]` | `s.charAt(i)` — the byte at `i`, NUL out of range | no |
| `s[start..<end]` | `s.slice(start, end)` — stops before `end`, clamped | **yes** |
| `s[start..end]` | `s.slice(start, end + 1)` — includes `end`, clamped | **yes** |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let name = "prismio"

    if (name == "prismio") { println("matched") }
    if (name < "rust") { println("sorts first") }

    let head = name[0..<4]
    let label = "lang: " + head
    println(label)
    return 0
}
```

A `String` is a pointer, so a raw address comparison would quietly answer
"not equal" for two equal strings. `==` is the content comparison, and there is no
way to spell the address one.

`+` and `[a..b]` produce an owned value, released like any call's result:
`println(a + b)` frees the joined string once `println` returns.

A chain of `+` is **one** call, not a nest of them: `a + b + c` becomes
`a.concat(b, c)`, one allocation rather than one per `+`. Up to six parts are
supported; past that, build a `Vec<String>` and call `join` on it.

Both sides of `+` must be Strings. Nothing is promoted implicitly, so write
`"n = " + count.toString()`.

## No user-defined operator overloading

Prismio 0.1 has [traits](/language/traits) and [`impl` blocks](/language/methods),
but a trait cannot give a type an operator: the String operators above are compiler
desugarings for one built-in type, not an overloadable protocol. Structs and lists
do not acquire arithmetic or comparison behavior merely because their fields or
elements support it. Write a named function for domain-specific operations.
