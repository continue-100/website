---
title: Map
description: The std.map hash table — its methods, O(1) removal, the Key bound its keys satisfy, and why values stay scalar in Prismio 0.1.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [standard-library, map, collections, generics, traits, hash]
related: [stdlib/vec, language/generics, language/traits]
---

`Map<K, V>` is an associative container written in Prismio and shipped as `std/map.psm`. It is the first container in the language that is not built into the compiler, and it exists because [generics](/language/generics) do.

Import it explicitly. So does `std.io`: there is no prelude, and every standard module is imported the same way.

**Not available yet:** a set type and a sorted map. Both are planned. Until then a `Map<T, Bool>` stands in for a set, and sorting the keys gives a sorted traversal — see [what else is missing](/language/arrays-and-lists#not-available-yet).

<!-- prismio-check: pass -->
```prismio
import std.io
import std.map
import std.option
import std.string

fn main() -> Int {
    let stock = mapNew<String, Int>()
    stock.set("apples", 12)
    stock.set("pears", 4)
    stock.set("plums", 30)
    println(stock.set("pears", 5))          // true: pears was already there

    println(stock["apples"])                // 12
    println(stock.getOr("figs", 0))         // 0
    println(stock.has("plums"))             // true

    println(stock.remove("apples"))         // true
    println(stock.remove("apples"))         // false: already gone
    println(stock.length)                   // 2

    for (name, count) in stock {
        println(name + " " + count.toString())   // plums 30, then pears 5
    }

    stock.clear()
    println(stock.isEmpty)                  // true
    return 0
}
```

## Operations

| On a `Map<K, V>` | Returns |
|---|---|
| `mapNew<K, V>()` | an empty map. Type arguments must be written; there is no argument to infer them from. |
| `m.length`, `m.isEmpty` | `Int`, `Bool`; [properties](/language/methods#properties) |
| `m.has(key)` | `Bool` |
| `m.get(key)` | [`Option<V>`](/stdlib/option): the value, or `None` |
| `m.getOr(key, fallback)` | the value, or `fallback` when the key is absent |
| `m[key]` | the value; **stops the program** with `panic: key not in map` when the key is absent |
| `m.set(key, value)` | `Bool`: inserts or overwrites, and answers `true` if the key was already present |
| `m.remove(key)` | `Bool`: `true` if the key was there and is now gone |
| `m.clear()` | removes every entry |
| `m.values()` | `Vec<V>`: every value, in position order |
| `m.keyAt(i)`, `m.valueAt(i)` | the key and value at position `i`, for `0 <= i < m.length` |

`m[key]` is for a key the program knows is there; `m.get(key)` is the form that can say "absent". `m[key] = value` is a compile error (`x[i]` on a `Map` "reads through `at`, and has no assignment form"): write `m.set(key, value)`.

`set` answering whether the key existed is the one fact a caller cannot recover afterwards without a second lookup. Prefer `get` when a stored value could equal the fallback: `m.getOr(k, 0)` cannot tell a stored `0` from a missing key, and `m.get(k)` can.

Every method has a free-function twin that older code uses: `mapLen`, `mapHas`, `mapGet`, `mapGetOr`, `mapSet`, `mapRemove`, `mapClear`, `mapKeyAt`, `mapValueAt`, and `mapIndexOf(m, key)`, which answers a key's position or `-1`.

## Removal, and what it does to positions

`remove` is O(1). Positions follow insertion order **until the first removal**. A removal then moves the last entry into the removed one's position, so the order afterwards is not the order of insertion — in the example above, `plums` moved into the position `apples` left. This is the swap-remove that Rust's `IndexMap` offers; keeping insertion order instead would make every removal O(n).

Do not remove entries while walking the map: the entry moved into the gap would be skipped. Collect what to remove first, then remove it.

A removed `String` key is released at once. Removing many entries leaves no slow lookups behind: the table rebuilds itself in place once a quarter of it is removed entries. On the benchmark suite's `mixed_map_removal` workload the map runs in 10.9 ms, against 12.8 ms for C++'s `std::unordered_map` and 16.7 ms for Rust's `HashMap`.

## There is no `keys()`

Walk the map instead, with `for (key, value) in m`, or by position with `keyAt`:

```prismio
for (name, count) in stock { println(name) }
for i in 0..<stock.length { println(stock.keyAt(i)) }
```

Both visit the entries in position order. `keys()` returning a `Vec<K>` of copies is the obvious method, and it is missing on purpose: copies of the map's `String` keys pushed into a returned `Vec` are never released, in the current compiler. A ten-call measurement leaked 990 of 1,173 allocations. A standard-library method that leaks on every call is worse than none, and `keyAt` reads each key where it is without copying it.

## Keys implement `Key + Copy`

`Map<K: Key + Copy, V>` requires identity from `Key` in `std.key` and storage
duplication from `Copy` in `std.copy`:

| Method | Meaning |
|---|---|
| `hash(self) -> Int` | Equal keys must hash equal. Unequal keys need not hash unequally. |
| `eq(self, other: Self) -> Bool` | Content equality. Not `==`, which compares pointers for `String`. |
| `copyOf(self) -> Self` | Required by `Copy`. The map keeps its keys, and a parameter is a borrow, so an owned key must be duplicated on the way in. |

`std.key` implements it for the integer types, `Char`, `Bool` and `String`. A user type becomes a
key by implementing it — two blocks, no registration:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.map
import std.key
import std.copy

struct Point {
    x: Int,
    y: Int
}

impl Key for Point {
    fn hash(self) -> Int { return keyMixInt(self.x * 31 + self.y) }
    fn eq(self, other: Self) -> Bool { return self.x == other.x and self.y == other.y }
}

impl Copy for Point {
    fn copyOf(self) -> Self { return Point { x: self.x, y: self.y } }
}

fn main() -> Int {
    let places = mapNew<Point, Int>()
    places.set(Point { x: 1, y: 2 }, 12)
    println(places[Point { x: 1, y: 2 }])
    return 0
}
```

`copyOf` is written in the `impl Copy` block, not repeated in the `impl Key` one.
Each block is checked against its own trait, and the map's two explicit bounds
require both implementations.

**`Float` deliberately has no `Key` impl.** NaN is not equal to itself, so a NaN key could be
inserted and never found again — a silently wrong answer. `Map<Float, V>` fails at the instantiation
with `Float does not implement \`Key\``.

## Values are scalars

`V` has no bound, so an owned value type — `String`, or a struct that owns anything — is a compile
error: *cannot move out of borrowed value `value`*. Store a handle or an index instead.

Bounding `V: Copy` as well was tried and reverted: it compiles and computes correct answers, and the
map then leaks every value it holds, because `mapGetOr`, `mapGet` and `mapValueAt` all return from
the values list and the analysis stops releasing a container it has seen escape. A container that
says it cannot hold something is better than one that holds it and leaks it.

## Lookup is constant time

`Map` is an open-addressed hash table: two dense parallel arrays in insertion order, plus a probe
table of indices into them. `mapIndexOf` probes rather than scans.

Position order is part of the contract, not an accident — `keyAt` and `valueAt` iterate in it, and
rehashing moves slots rather than entries. It is insertion order until the first removal; see
[removal](#removal-and-what-it-does-to-positions).

Measured against the association list this replaced, at identical checksums:

| entries | insert | lookup (miss) |
|---|---|---|
| 1 000 | 4.8x faster | 42x faster |
| 4 000 | 9.5x faster | 63x faster |
| 16 000 | 29x faster | 204x faster |

The ratio grows with the entry count, which is what O(n) → O(1) looks like rather than a constant
factor.

**Removal leaves a marker, not a hole.** A later key's probe may pass through the removed one's
bucket, so `remove` marks the bucket rather than emptying it: a lookup probes past a marker, and an
insertion reuses the first one it passes.

## Vec

A map's keys, values and slots are each a [`Vec`](/stdlib/vec) — the growable vector, whose backing block doubles on push and stores flat elements inline.
