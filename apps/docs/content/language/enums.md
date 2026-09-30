---
title: Enums
description: Define and use fieldless nominal enum variants in Prismio 0.1.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [enums, variants, nominal-types]
related: [language/pattern-matching, language/types, language/conversions, specification/evaluation]
---

Enums declare a closed set of fieldless variant names. They are useful for readable states, tags, and small result categories that carry no attached payload. Each enum is a type of its own: a `Color` is always one of `Color`'s variants, never an arbitrary number.

<!-- prismio-check: pass -->
```prismio
enum Color {
    Red,
    Green,
    Blue
}

fn main() -> Int {
    let color = Color.Green
    if (color == Color.Green) { return 0 }
    return 1
}
```

## Declaration and construction

An enum declaration contains variant names separated by commas:

```prismio
enum ConnectionState {
    Disconnected,
    Connecting,
    Connected
}
```

Select a value with `EnumName.VariantName`:

```prismio
let state: ConnectionState = ConnectionState.Connecting
```

The enum name qualifies and validates a variant, and the variant has the enum's type. An `Int` is not a `Color`, and one enum is not another: `let c: Color = 1`, an `Int` passed for a `Color` and a `LeftState` assigned to a `RightState` are all refused.

<!-- prismio-check: fail -->
```prismio
enum LeftState { Ready, Waiting }
enum RightState { Ready, Waiting }

fn main() -> Int {
    let left: LeftState = LeftState.Missing
    return 0
}
```

The declaration has no `Missing` variant, so the selection is rejected.

## Numbers and enums

`c as Int` is a variant's zero-based ordinal. The way back is the [checked conversion](/language/conversions#into-an-enum) `n as Color?`: the variant with that ordinal, or `none` when there is none. A plain `n as Color` is an error that names `as Color?`, because `n` might be no variant at all.

<!-- prismio-check: pass -->
```prismio
import std.io

enum Color { Red, Green, Blue }

fn main() -> Int {
    println(Color.Blue as Int)               // 2
    let saved = 1
    let restored = saved as Color?
    println(restored == Color.Green as Color?) // true
    println(9 as Color? == none)             // true
    return 0
}
```

<!-- prismio-check: fail -->
```prismio
enum Color { Red, Green }

fn main() -> Int {
    let c = 7 as Color
    return 0
}
```

The error is `an Int might not be a Color; write `as Color?` and handle `none``.

## Comparison and copying

Enum values can be compared with `==` and `!=`. They are copyable, so assigning or passing one does not move the source binding.

<!-- prismio-check: pass -->
```prismio
enum Mode { Development, Production }

fn is_production(mode: Mode) -> Bool {
    return mode == Mode.Production
}

fn main() -> Int {
    let first = Mode.Production
    let second = first
    if (is_production(first) and second == Mode.Production) {
        return 0
    }
    return 1
}
```

Ordering comparisons are not the public way to compare semantic enum states. Use equality or a `match`, even though the current backend representation is integer-like.

## Matching

`match` selects enum variants. Since a value of the enum is always one of its variants, a `match` that names every variant is **exhaustive** without a `_` arm, and a function whose arms all return needs nothing after the `match`:

<!-- prismio-check: pass -->
```prismio
enum ConnectionState {
    Disconnected,
    Connecting,
    Connected
}

fn code(state: ConnectionState) -> Int {
    match (state) {
        ConnectionState.Disconnected => { return 1 }
        ConnectionState.Connecting => { return 2 }
        ConnectionState.Connected => { return 3 }
    }
}

fn main() -> Int {
    return code(ConnectionState.Connected) - 3
}
```

A `match` naming only some variants is still allowed; it runs no arm for the others. Match is statement-form in 0.1, so store a selected result in a mutable binding or return inside arms.

## Runtime representation

Variants are selected as `Enum.Variant`. Their current runtime representation uses zero-based integer ordinals in declaration order. Treat that representation as implementation-defined at FFI or persistence boundaries unless an explicit ABI guarantee is introduced.

Reordering variants can therefore change the emitted ordinal today, even though source-level code normally observes only named variants. Do not serialize raw ordinals or pass them through a foreign ABI without a conversion function that fixes an application-owned numeric contract. The same applies to a payload enum's tag, which is the variant's one-based position.

## Modeling data with a tag

A **fieldless** enum's values are copyable integer ordinals, as described above.

A variant may also carry values, and an enum may be generic:

```prismio
enum Shape {
    Dot,
    Circle(Int),
    Rect(Int, Int)
}
```

An enum with any payload variant compiles to a tagged struct rather than an integer, which makes its values owned and move-only — including the variants that carry nothing. Take them apart with [variant patterns](/language/pattern-matching). See [Option and Result](/stdlib/option) for the representation and its costs.

Discriminant assignments and methods are still not implemented. A fieldless enum is entirely unaffected by any of this and keeps its integer ordinals.

```prismio
enum ParseStatus { Success, Failure }

struct ParseResult {
    status: ParseStatus,
    value: Int
}
```

This is not a tagged union: every `ParseResult` always stores every declared field, and the compiler does not relate `status` to validity of `value`. Establish and check that invariant in ordinary functions.

## Current limitations

- Source code cannot assign explicit discriminant values.
- There are no enum methods or implementations.
- Explicit discriminants and methods are unavailable.
- Duplicate-arm detection, and a missing-arm error, apply to payload enums only. A fieldless enum's `match` is exhaustive when it names every variant, and a subset stays legal.
- The ordinal representation is not a stable serialization or FFI contract.
