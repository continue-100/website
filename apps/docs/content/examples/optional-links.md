---
title: "Example: optional linked nodes"
description: A complete Prismio program constructing and checking an optional struct field.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [example, optional, none, struct]
related: [language/optionals, language/structs, errors/optional-needs-unwrap]
---

<!-- prismio-check: pass -->
```prismio
import std.io

struct Node {
    value: Int,
    next: Node?
}

fn next_value(node: Node) -> Int {
    if (node.next == none) { return 0 }
    let next = expect(node.next)
    return next.value
}

fn main() -> Int {
    let tail = Node { value: 9, next: none }
    let head = Node { value: 3, next: tail }
    println(next_value(head))
    return 0
}
```

Expected output: `9`.

## Ownership flow

`tail` is a move-only `Node`. Constructing `head` transfers `tail` into the optional `next` field. `head` then owns the linked data.

`next_value` receives `node` through an ordinary parameter, so it borrows rather than consumes the struct. `expect(node.next)` checks presence and produces access to the underlying `Node` for the field read.

The comparison with `none` does not itself narrow `node.next`; the explicit `expect` remains required in the non-absent path.

## What would fail

- `return node.next.value` fails because `Node?` does not have direct struct-member access.
- `Int?` cannot replace the optional struct link: it is a number that may be absent, not a reference to another `Node`.
- Reading `tail` after it has moved into `head.next` is use after move.
- Optional chaining and `if let` syntax are not part of 0.1.

Use this shape for linked optional ownership when a reference may be absent: `T?` costs nothing, because absence is the null pointer. For a scalar or a type parameter, where there is no spare representation, use [`Option<T>`](/stdlib/option) instead.
