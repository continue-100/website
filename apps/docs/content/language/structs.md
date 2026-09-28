---
title: Structs
description: Define, construct, access, mutate, and transfer nominal struct values in Prismio 0.1.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-18"
tags: [structs, fields, aggregate-types]
related: [language/types, language/ownership-and-borrowing, language/optionals]
---

A struct declares named fields and creates a nominal, move-only type. Structs group related values without introducing inheritance or an object runtime; methods are attached separately, in [`impl` blocks](/language/methods).

<!-- prismio-check: pass -->
```prismio
struct Point {
    x: Int,
    y: Int
}

fn main() -> Int {
    let point = Point { x: 4, y: 9 }
    point.x = point.x + 1
    return point.x + point.y
}
```

## Declaration syntax

Fields are written as `name: Type` entries inside braces and separated by commas.

```prismio
struct Request {
    id: U64,
    retry_count: Int,
    path: String
}
```

The declaration introduces `Request` into the program's type namespace. Field order contributes to the current compiled layout, but source code should use names rather than assuming offsets. A stable cross-version struct ABI is not promised in 0.1.

Fields may contain scalars, enums, fixed-length arrays, vectors, strings, other structs, and permitted optional types. An array field is written `Array<T, N>` and stored inside the struct — see [returning and storing arrays](/language/arrays-and-lists#returning-and-storing-arrays). A directly recursive stored field has no finite layout; model recursive links with an optional reference-shaped struct field, as shown on the [optional values](/language/optionals) page.

## Construction

A struct literal names its type and provides field initializers:

```prismio
let request = Request {
    id: 42,
    retry_count: 0,
    path: "/health"
}
```

Every declared field must receive a compatible value. Initializers are matched by field name, not by an anonymous positional tuple. A misspelled, missing, or unknown field is a compile-time error.

Struct literals are expressions and may be returned, passed to functions, or nested inside another literal. Their ownership behavior follows the destination: an owned move-only field transfers into the new struct.

## Nominal identity

Two declarations with identical fields remain different types.

<!-- prismio-check: fail -->
```prismio
struct ScreenPoint { x: Int, y: Int }
struct MapPoint { x: Int, y: Int }

fn main() -> Int {
    let screen = ScreenPoint { x: 1, y: 2 }
    let map: MapPoint = screen
    return map.x
}
```

The compiler does not perform structural conversion. Write an explicit conversion function that constructs `MapPoint` if the distinction is intentional.

## Field access and assignment

Fields are selected with `.` and initialized by name in a struct literal. Every declared field must have a compatible initializer. Two structs with the same field shapes remain different types.

Field access reads the declared field type:

```prismio
let attempts: Int = request.retry_count
```

Field assignment requires an assignable value of that field type. Compound assignment on a field is not implemented as a general assignment place; spell the operation explicitly:

```prismio
request.retry_count = request.retry_count + 1
```

Prismio 0.1 permits field assignment through a struct binding even when that binding was not declared `mut`; `mut` is enforced for direct binding reassignment. This distinction is current compiler behavior and may be tightened in a later language version.

An optional struct must be unwrapped before member access. Comparing it with `none` does not flow-narrow the expression; call `expect` and access the result.

## Ownership

Struct values move when stored into another owned location or passed to `sink`. Ordinary function parameters borrow them. Methods are attached with an [`impl` block](/language/methods) and a type satisfies a bound with [`impl <Trait> for <Type>`](/language/traits). Constructors, field visibility modifiers, and inheritance are not implemented.

<!-- prismio-check: pass -->
```prismio
struct Ticket { number: Int }

fn number(ticket: Ticket) -> Int {
    return ticket.number
}

fn close(sink ticket: Ticket) -> Int {
    return ticket.number
}

fn main() -> Int {
    let ticket = Ticket { number: 9 }
    let observed = number(ticket)
    return close(ticket) - observed
}
```

`number` borrows, so the caller can later pass `ticket` to the consuming `close`. After `close`, the binding is moved.

When a struct contains another move-only value, constructing the outer struct transfers the inner value. Reading a scalar field from a borrowed struct is safe; transferring an owned field out of a borrowed parameter is rejected where it would violate the borrow.

## Current limitations

- Methods and associated functions are written in [`impl` blocks](/language/traits),
  inherent or for a trait, and an `impl` may be generic. There is no dedicated
  constructor declaration: write an associated `new` that returns the struct, and
  `Point(3, 4)` calls it — see [calling a type](/language/methods#calling-a-type-calls-its-new).
- A field has no visibility of its own; `public`, `private` and `internal` apply to functions and methods, not to types or their fields. See [visibility](/language/modules#visibility).
- Structs may be [generic](/language/generics); there are no field defaults. A literal that omits a field is accepted, and the omitted field is zero-initialised — a null pointer, a zero number, zeroed array elements, or a recursively zeroed inline struct.
- A generic struct cannot hold an `Array<T, N>` field yet.
- There is no update syntax that copies unspecified fields.
- Layout and cross-version ABI stability are not guaranteed.
- Field assignment through an immutable binding is currently accepted and may be tightened.

Use standalone functions for behavior and keep foreign-facing layouts behind a small [FFI](/language/ffi) layer.
