---
title: Type-system rules
description: Prismio 0.1 type categories, inference, compatibility, optional types, overloads, and explicit conversions.
status: stable
draft: true
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [specification, type-system, inference, conversion]
related: [language/types, language/functions, specification/memory-model]
---

Every expression has a statically determined type. A binding without an annotation takes its initializer's type. A binding with both must have a compatible initializer. A binding with neither is invalid.

Type inference is local and does not make a binding polymorphic or dynamic. Once a binding's type is selected, later assignment must preserve it.

## Type universe

Primitive types are `Int` (also spelled `I32`), `I8`, `I16`, `I64`, `Isize`, `U8`, `U16`, `U32`, `U64`, `Usize`, `Float`, `Bool`, `Char`, `String`, and `Ptr`. Struct names introduce nominal types. Enum names introduce nominal enum types. `Array<T, N>` forms an array type of element `T` and length `N`, an integer literal; `[T]` and `Array<T>` spell it with the length taken from an initializer. `Vec<T>` forms the built-in growable vector type. `List<T>`, its former spelling, is rejected with a diagnostic naming `Vec<T>`.

`Int` is signed 32-bit. `Float` is the sole floating-point type: IEEE 754 binary64 (ISO/IEC 60559). `Isize` and `Usize` use target pointer width. `Char` is byte-sized in 0.1.

Struct identity is nominal: distinct declarations do not become compatible because their fields coincide. Enum identity is nominal as well: a variant expression has its enum's type, and neither `Int` nor another enum is compatible with it in either direction. `c as Int` yields the ordinal; `n as E?` is the only conversion into an enum. `Vec<T>` is a built-in type constructor, separate from [generics](/language/generics): it predates them and is not an instance of them. An enum with payload variants is not an `Int` — it compiles to a tagged struct and is nominal and move-only like any other struct.

## Literal typing

Decimal integer literals are checked against a contextual integer type when one is available. An ordinary uncontextualized integer uses the compiler's default behavior centered on `Int`; larger values require a compatible contextual width. Floating literals have `Float`, Boolean literals have `Bool`, character literals have `Char`, and string literals produce `String`.

`none` requires or receives an optional reference-shaped context. It is not a universal inhabitant of every type.

## Compatibility

Arithmetic and bitwise operations require exact compatible operand types. The compiler does not implicitly widen numeric values. `as` performs explicit conversions; the type written after it says whether the conversion can fail. The full rules are in [conversions](/language/conversions).

Assignment, argument passing, return, field initialization, and Vec/array element operations require the type expected by their context. Ownership mode changes whether a move-only value is borrowed or transferred; it does not make incompatible types assignable.

For `x as T`, which cannot fail:

- signed widening sign-extends;
- unsigned, Boolean, and character widening zero-extends;
- integer narrowing keeps low-order bits;
- float-to-integer truncates toward zero, saturating at the destination's bounds, with NaN converting to 0;
- integer/float conversions may lose precision;
- `x as String` is `x.toString()`, for every number, `Bool`, `Char` and `String`;
- an enum converts to `Int` as its ordinal; nothing converts to `Bool`, and only `E` itself converts to an enum `E`; and
- a `String` converts to a number or `Bool` only when it is a string literal the compiler reads at compile time, and it is an error when that text does not read as the target.

For `x as T?`, which answers `none` instead of failing:

- between numbers, `none` exactly when `x` is not a value of `T`: out of range, a sign `T` cannot hold, or from a `Float` a NaN, an infinity or a non-integral value;
- from a `T?`, `none` stays `none`;
- from a `String`, the corresponding parse (`s as Int?` is `s.parseInt()`); and
- from an integer to an enum `E`, the variant whose ordinal it is, or `none`.

## Optional formation and elimination

`T?` is well-formed when `T` is a struct, string, Vec, raw pointer, number, `Bool`, `Char` or fieldless enum. For a reference the optional is a nullable pointer; for a scalar it is a present flag beside the value, with value semantics. `none` inhabits a compatible optional context, and a `T` is accepted where a `T?` is expected. An optional value is not usable as `T`; `expect` performs a checked unwrap. Equality and inequality with `none` are allowed but do not refine later expression types.

Optionality preserves the ownership category of an underlying owned value. Constructing an optional from a move-only struct transfers it into the optional owner. `expect` checks presence but does not introduce general first-class references.

Optional arrays, `T??`, optional chaining, and coalescing are absent. [`Option<T>`](/stdlib/option) is a library type over payload-carrying enum variants.

## Functions and overloads

Function parameter and return types are declared. A call must select a declaration by name, argument count, and exact parameter types. Return type does not distinguish an overload. Default/named arguments and implicit numeric coercion do not participate.

For a move-only argument, an ordinary parameter borrows, `inout` mutably borrows, and `sink` transfers. For copy types, values are copied under current value semantics.

## Aggregate typing

An array literal's elements must agree on an element type, and its type records its element count. A declared `Array<T, N>` must agree with a literal initializer's count, and an assignment between two arrays of known length requires equal lengths. A length may be written on a local declaration, a function's return type and a struct field, and is rejected elsewhere — a parameter, a type argument, an enum payload, an optional, an `extern` signature, a module-level `let` — and on a field of a generic struct. A struct field of array type must carry one. `Array` is the only type constructor that takes an integer argument. An array returned by value or stored in a field must have elements that own nothing; a struct literal initialises an array field by copying, so its length must equal the field's. An index has type `Int`.

A struct literal must name a declared struct and initialize its fields with compatible values. Member selection uses the receiver's nominal declaration. Enum variants are selected and validated with `Enum.Variant`, and have the enum's type.

An array literal written where a `Vec<T>` is expected becomes a Vec: its elements are typed against `T`, and `[]` takes `T` from the context alone. Vec methods that store an element must agree on that element type.

## Control-flow typing

The condition of `if` and `while` must be `Bool`. `match` accepts integers and fieldless enums in 0.1; a match on a fieldless enum is exhaustive when it names every variant. Every returned expression must match the declared return type, and all reachable paths of a value-returning function must return.

`if`, loops, and `match` have statement behavior and do not synthesize a selected value type. `break` and `continue` carry no value.

## Excluded type forms

There are no tuple types, user type aliases, union types, arbitrary references, function-value types, closure types, trait objects, or user-written lifetime types.
