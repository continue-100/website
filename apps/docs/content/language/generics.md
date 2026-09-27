---
title: Generics
description: Generic functions and types in Prismio, type argument inference, and the monomorphization that makes them free at runtime.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [generics, type-parameters, monomorphization]
related: [language/traits, language/functions, language/structs, stdlib/map]
---

Functions and structs may take type parameters, written in angle brackets after the name.

```prismio
fn identity<T>(x: T) -> T {
    return x
}

struct Box<T> {
    value: T
}

struct Pair<K, V> {
    key: K,
    value: V
}
```

A generic declaration is a template, not a declaration. Nothing is compiled for it until it is used, so a generic that is written and never called costs nothing in the binary.

## Monomorphization

Each distinct set of type arguments produces its own copy, with the type parameters replaced by the arguments. `Box<Int>` and `Box<String>` are two unrelated structs with two different layouts:

```llvm
%"Box$Int"    = type { i32 }
%"Box$String" = type { ptr }
```

There is no boxing, no type tag, and no indirect call. A field of type `T` instantiated at `Int` is an `i32` in the struct, exactly as if it had been written out by hand. This is what makes the abstraction free rather than merely cheap.

The instantiated name — `Box$Int` — appears in the emitted IR and in linker output. `$` cannot occur in a Prismio identifier, so an instantiation can never collide with a declared name.

## Using a generic type

Write the type arguments wherever the type is named, including in a struct literal:

<!-- prismio-check: pass -->
```prismio
struct Box<T> {
    value: T
}

fn main() -> Int {
    let boxed = Box<Int> { value: 7 }
    return boxed.value - 7
}
```

Generic types nest, and the inner instantiation is created first:

<!-- prismio-check: pass -->
```prismio
struct Box<T> {
    value: T
}

fn main() -> Int {
    let nested = Box<Box<Int>> { value: Box<Int> { value: 9 } }
    return nested.value.value - 9
}
```

A generic type may refer to itself through an optional field, which is how linked structures are written:

<!-- prismio-check: pass -->
```prismio
struct Node<T> {
    value: T,
    next: Node<T>?
}

fn main() -> Int {
    let tail = Node<Int> { value: 2, next: none }
    let head = Node<Int> { value: 1, next: tail }
    let after = expect(head.next)
    return after.value - 2
}
```

## Type argument inference

At a call, type arguments are normally inferred from the types of the arguments passed. Inference is structural, so a parameter written `Vec<T>` binds `T` to the argument's element type:

<!-- prismio-check: pass -->
```prismio
import std.vec

fn firstOr<T>(items: Vec<T>, fallback: T) -> T {
    if (items.isEmpty) { return fallback }
    return items[0]
}

fn main() -> Int {
    let values: Vec<Int> = [10]
    return firstOr(values, 0) - 10
}
```

The same structural inference applies to `Slice<T>` parameters and return types:

<!-- prismio-check: pass -->
```prismio
import std.vec

fn first<T>(items: Slice<T>) -> T {
    return items[0]
}

fn main() -> Int {
    let values: Vec<Int> = [42]
    return first(values[0..<1]) - 42
}
```

Type arguments are solved from argument positions, never from the expected return type. One kind of argument answers more than its own type: a closure passed for a parameter with a [closure bound](/language/closures#closure-bounds) also solves the parameters in the bound's result, so `fn describe<U, F: Fn(Int) -> U>(n: Int, f: F) -> U` learns `U` from what the closure returns.

When a call has no argument that mentions a type parameter — a constructor is the usual case — write the arguments out:

<!-- prismio-check: pass -->
```prismio
struct Box<T> {
    value: T
}

fn emptyBox<T>(seed: T) -> Box<T> {
    return Box<T> { value: seed }
}

fn main() -> Int {
    let boxed = emptyBox<Int>(3)
    return boxed.value - 3
}
```

## Checking happens per instantiation

A template's body is checked once for each set of type arguments it is used with,
not once at its declaration. Trait bounds are checked first, and an operation the
body performs must be valid for the type actually substituted.

For example, `Map<K: Key, V>` in [the standard library](/stdlib/map) rejects a
key type without a `Key` implementation. The error appears at the instantiation,
naming the use that caused it rather than blaming the generic declaration.

A consequence worth knowing: a mistake in a generic body that only affects one type argument is not reported until something instantiates it at that type.

## Instantiation terminates

Monomorphization turns a generic into one concrete copy per set of type
arguments, so a generic that instantiates itself with a *larger* type has no
fixpoint — each step asks for a copy that does not exist yet, forever.

Prismio bounds the nesting depth of a type argument at 32 and reports the
generic that grows, rather than running out of memory or stack:

<!-- prismio-check: fail -->
```prismio
import std.io

struct Box<T> { value: T }

fn grow<T>(v: T) -> Int {
    let b = Box<T> { value: v }
    return grow(b)
}

fn main() -> Int {
    return grow(1)
}
```

```text
error: instantiating `grow` does not terminate: its type argument
       `Box$Struct_Box$Struct_Box$...` grows at every step
  note: a generic that instantiates itself with a larger type has no fixpoint;
        take the recursive argument by a type that does not grow
```

The error is reported against the **declaration**, not the call. The call site is
wherever the recursion happened to be unrolled, which is not where the mistake
lives. The same bound covers trait bound solving, so a cyclic chain of
implementations is reported instead of diverging.

Recursion itself is fine — it is recursion that *grows the type* that cannot
work. `fn count<T>(v: T, n: Int) -> Int` calling itself with the same `T`
instantiates once.

## Limits in 0.1

- Type parameters may carry one or more [trait bounds](/language/traits), joined
  with `+`, or after the signature in a `where` clause. See
  [Traits](/language/traits) for both spellings.
- A generic that instantiates itself with a strictly larger type argument has no
  fixpoint. Instantiation is bounded, so this is reported as an error naming the
  growing type rather than compiling forever.
- Generic inherent and trait impls such as `impl<T> Box<T>` and
  `impl<T: Bound> Trait for Box<T>` are supported. Traits may themselves be
  generic, as in `trait From<T>` and `impl From<Int> for String`; their arguments
  may also appear in bounds such as `U: From<Int>`.
- **No variance, no specialization, no partial instantiation.**
- Type parameters are solved independently of one another; there is no unification across parameters, apart from a closure bound's result being solved from the closure.
- **An unsized array cannot be a type argument.** `Vec<[Int]>`, a parameter or field of type `Box<[Int]>`, and a function returning `Option<[Int]>` are refused, and so is a generic function that puts its own `T` into a type when `T` is an array (`fn wrap<T>(x: T) -> Option<T>` called with an array). Without a length, an array is a view of elements in the frame that declared it, and a container carrying it out of that function would read a dead frame. The diagnostic says what to use instead:

  ```text
  error[P4001]: an array cannot be a type argument
    note: it would point into the frame that declared it; use a `Vec`, or a struct with an `Array<T, N>` field
  ```

  A generic function's own `T` may still be an array when it only hands the value back — `fn same<T>(x: T) -> T` returns the view to the frame that owns it.
