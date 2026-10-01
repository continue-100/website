---
title: Pattern matching
description: Match integer and fieldless enum values with literal and wildcard arms in Prismio 0.1.
status: stable
version: "0.1.0"
lastUpdated: "2026-08-09"
tags: [match, patterns, enums, control-flow]
related: [language/enums, language/control-flow, specification/evaluation]
---

`match` is a multi-way statement over an `Int` or fieldless enum value. It compares the scrutinee against arms in source order and executes the block of the first matching arm.

The syntax is:

```prismio
match (expression) {
    pattern => { statements }
    _ => { fallback statements }
}
```

<!-- prismio-check: pass -->
```prismio
enum Color { Red, Green, Blue }

fn score(color: Color) -> Int {
    let mut result = 0
    match (color) {
        Color.Red => { result = 10 }
        Color.Green => { result = 20 }
        _ => { result = 0 }
    }
    return result
}

fn main() -> Int { return score(Color.Green) }
```

Because `match` is a statement, `score` stores the selected number in a mutable binding and returns it afterward. Returning directly from arms is another option when every reachable function path remains valid.

## Enum patterns

Use a qualified `Enum.Variant` pattern. Qualification identifies the enum declaration and validates the variant name, even though the resulting 0.1 value uses `Int` compatibility.

```prismio
enum Direction { North, East, South, West }

fn axis(direction: Direction) -> Int {
    let mut result = 0
    match (direction) {
        Direction.North => { result = 1 }
        Direction.South => { result = 1 }
        Direction.East => { result = 2 }
        Direction.West => { result = 2 }
        _ => { result = 0 }
    }
    return result
}
```

Fieldless enums have no payload to destructure. Raw ordinal assumptions should not cross FFI or persistence boundaries.

## Integer patterns

Integer-like pattern expressions are compared against an `Int` scrutinee.

<!-- prismio-check: pass -->
```prismio
fn category(code: Int) -> Int {
    let mut result = -1
    match (code) {
        0 => { result = 10 }
        1 => { result = 20 }
        2 => { result = 30 }
        _ => { result = 0 }
    }
    return result
}

fn main() -> Int { return category(1) - 20 }
```

String patterns, structural patterns, range patterns, and user-defined equality are not implemented.

## Wildcard arm

`_` matches any value that reaches it. Put it last for a conventional fallback. Since arms are tested in source order, an earlier wildcard makes every following arm unreachable in behavior even though the compiler may not diagnose the coverage.

## Exhaustiveness and duplicates

Supported patterns are integer-like expressions, enum variants, and `_`. Arms are tested in source order. The compiler does not currently enforce exhaustiveness or reject duplicate patterns, so include `_` whenever an unmatched value must be handled.

An enum declaration is closed, but the match checker does not yet prove every variant appears. A non-exhaustive statement simply performs no arm action for an unmatched value. That can leave a result binding unchanged and hide a bug when variants are added.

```prismio
let mut label = 0
match (state) {
    State.Ready => { label = 1 }
    _ => { label = -1 }
}
```

Duplicate patterns are also not rejected in 0.1. The first matching arm wins; later duplicates cannot run. Treat duplicates and an early wildcard as code-review errors even when compilation succeeds.

## Scope and control transfer

Every arm body is a block with its own lexical scope. Bindings declared in one arm are unavailable in another arm or after the match. `return` exits the function, while `break` and `continue` apply only when the match appears inside a loop.

A match that every value reaches — a payload enum with each variant covered, or any match with a `_` arm — ends the function when each of its arms does, the way an `if` with an `else` does. So it can be a function's last statement, and a statement after it is unreachable code, which is an error:

<!-- prismio-check: pass -->
```prismio
fn sign(n: Int) -> Int {
    match (n) {
        0 => { return 0 }
        _ => { return 1 }
    }
}

fn main() -> Int {
    return sign(0)
}
```

An integer match without a `_` arm does not end the function, because a value no arm names falls through it.

## Invalid scrutinees

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let text = "ready"
    match (text) {
        _ => { return 0 }
    }
}
```

Strings are not supported match scrutinees in 0.1. Use string operations or map the input into a fieldless enum first.

## Variant patterns

A match over an enum with [payload variants](/language/enums) uses variant patterns, which bind the values the variant carries:

<!-- prismio-check: pass -->
```prismio
enum Shape {
    Dot,
    Circle(Int),
    Rect(Int, Int)
}

fn area(s: Shape) -> Int {
    match (s) {
        Shape.Dot => { return 0 }
        Shape.Circle(r) => { return 3 * r * r }
        Shape.Rect(w, h) => { return w * h }
    }
}

fn main() -> Int {
    return area(Shape.Rect(3, 4)) - 12
}
```

Each name in a pattern is a fresh binding scoped to that arm, typed from the variant's declaration. The number of names must equal the number of values the variant carries. A `_` arm may accompany variant arms and matches anything not already taken.

### Exhaustiveness

A match over a payload enum must handle every variant, or carry a `_` arm. Omitting one is an error that names what is missing:

```
error: this match does not cover Dot, Rect of `Shape`; add the missing arms or a `_` arm
```

Without the check, an unhandled variant fell through the tag comparisons to the end of the statement, so the match silently did nothing for exactly the input the author forgot — and for a `Result`, that input is usually the error.

A second arm for a variant an earlier arm already matches is rejected as unreachable, since the arms are tested in source order and the first one always wins.

Exhaustiveness applies to **payload** enums only. A fieldless enum still matches as an integer, where the scrutinee is not confined to the declared variants, so matching a subset stays legal there.

Guards, alternatives, ranges, string patterns, nested destructuring, and match expressions are not implemented.

Future pattern syntax is intentionally not specified here. When those features exist, this page will define their precedence, binding ownership, exhaustiveness rules, and diagnostics from compiler-tested behavior.
