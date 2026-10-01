---
title: Arrays, vectors, and slices
description: Fixed stack arrays, the growable Vec<T>, and bounds-checked slices in Prismio 0.1 — which to choose, how each is owned, and how to view part of one.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-24"
tags: [arrays, vec, slices, collections, indexing]
related: [language/types, language/ownership-and-borrowing, stdlib/vec]
---

Arrays and vectors both store repeated values, with different storage, size and ownership rules. Choose an array when the element count is fixed at construction and stack storage is appropriate. Choose `Vec<T>` when the sequence must grow or outlive the function that builds it.

## Arrays

An array is a fixed number of elements stored in place — in the function's own frame, or inside a struct as a [field](#returning-and-storing-arrays). Its full type is `Array<T, N>`: the element type and the length.

```prismio
let buffer: Array<U8, 64>             // 64 slots, every one 0
let exact: Array<Int, 3> = [1, 2, 3]  // the length is checked against the values
let values: [Int] = [10, 20, 30]      // shorthand: the length comes from the values
```

- **`Array<T, N>` without an initializer** reserves `N` slots, each starting at the element type's zero: `0`, `0.0`, `false`, the first variant of an enum. The element type has to have a zero, so `Array<String, 4>` is refused; use a `Vec` for elements that own memory.
- **`[T]` and `Array<T>` are shorthand** for an array whose length comes from its initializer, so they need one. `let a: [Int]` on its own is an error that suggests `Array<Int, N>`.
- **A written length has to match** the initializer, and be a positive whole number. It can be written in hex: `Array<U8, 0x100>`.

Inside a loop body, a zero-filled array starts at zero again on every iteration.

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let mut counts: Array<Int, 4>
    counts[2] = 7
    let sized: Array<Int, 3> = [1, 2, 3]
    let inferred: [Int] = [4, 5]
    return counts[0] + counts[2] + sized[2] + inferred[1] - 15
}
```

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let values: [Int]
    return 0
}
```

Arrays may be nested. Indexing proceeds one dimension at a time, and the index expression must be `Int` — Prismio does not silently convert `Usize` or another width for indexing.

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let matrix: [[Int]] = [[1, 2], [3, 4]]
    return matrix[1][0] - 3
}
```

### Length, ends and methods

An array's length is part of its type, so `a.length` is that number — read at compile time, with no call — for any array the compiler can see the length of: a local, a field, a returned value bound with `let`. `a.first` and `a.last` are `a[0]` and `a[N - 1]`. An array also has the reading and in-place methods of a [Vec](/stdlib/vec), which need `import std.vec`:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.vec

fn main() -> Int {
    let primes = [2, 3, 5, 7]            // an Array<Int, 4>, not a Vec
    println(primes.length)               // 4
    println(primes.contains(5))          // true
    println(primes.indexOf(7))           // 3
    println(primes.countOf(4))           // 0
    println(primes.last)                 // 7
    println(primes.fold(0, |total: Int, p: Int| total + p))   // 17

    let mut order = [5, 3, 4, 1]
    order.sort()                         // in place; needs `let mut`
    println(order[0])                    // 1
    return 0
}
```

| | Methods |
|---|---|
| Search | `contains`, `indexOf`, `lastIndexOf`, `countOf`, `binarySearch`, `isSorted` |
| Read | `min`, `max`, `find`, `indexWhere`, `any`, `all`, `countWhere`, `forEach`, `fold` |
| Change in place | `sort`, `sortBy`, `reverse`, `swap`, `fill`; the array has to be `let mut` and its elements numbers, `Bool`, `Char` or payload-free enums |
| Copy out | `toVec()`, a new `Vec` — the way to `sorted`, `reversed`, `take` and the other methods that return a Vec: `a.toVec().sorted()` |

An array has no `isEmpty`, because its length is at least one. A method that grows or shrinks (`push`, `insert`, `pop`, `removeAt`) is a Vec's, and asked of an array the error names the array (`` `x` is an `Array<Int, 3>`, a fixed-length array, and `push` is a `Vec` method ``) and says to write `let x: Vec<Int> = [...]` for a list that can grow. A `[T]` parameter takes any length and does not know its own, so `xs.length` and `xs.contains(1)` are errors that say so. Pass the length beside the parameter and call the long form: `contains(xs, n, 1)`, `min(xs, n)`.

### Replacing an element

An element is replaced by assigning through its index when the element owns nothing: a number, `Bool`, `Char`, `Ptr` or an enum without payloads. The store writes into the array's own storage. An integer literal takes the element's type, as it does in a `let`.

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let mut grid: [[Int]] = [[1, 2], [3, 4]]
    grid[1][0] = 30
    let mut wide: Array<I64, 2>
    wide[0] = 4294967296
    return grid[1][0] - 30
}
```

An array whose elements own memory refuses the store, because nothing would release the value it replaces. Use a `Vec` for those.

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let names: [String] = ["a", "b"]
    names[0] = "c"
    return 0
}
```

### Copies and views

An array whose length is known is a value. `let b = a` gives `b` storage of its own and copies the elements; `d = c` copies `c`'s elements into `d`, and the two lengths have to be equal.

A parameter written `[T]` takes an array of any length, and it is a **view** of the caller's array, not a copy: a store through it is the caller's, and so is a store through a name bound from it. Because its length is not known, it cannot be copied into an `Array<T, N>`.

<!-- prismio-check: pass -->
```prismio
fn clear(inout xs: [Int]) {
    xs[0] = 0
}

fn main() -> Int {
    let mut a: [Int] = [1, 2, 3]
    let mut b = a
    b[0] = 9
    clear(a)
    return a[0] + b[0] - 9
}
```

Two kinds of array are **shared** by a second binding rather than copied, until copying them is supported:

- **An array of arrays.** `let g = grid` names the same rows, so `g[0][0] = 5` changes `grid` too.
- **An array whose elements own memory**, such as `[String]`. Its elements cannot be replaced through an index, so the sharing is never visible.

### Returning and storing arrays

**A function declared `-> Array<T, N>` returns the array by value.** The caller gets storage of its own, so a local array, a literal or a zero-filled `Array<T, N>` can all be returned. The result can be bound (a copy), indexed directly, or passed straight to a `[T]` parameter.

<!-- prismio-check: pass -->
```prismio
fn squares() -> Array<Int, 4> {
    let mut out: Array<Int, 4>
    for i in 0..<4 {
        out[i] = i * i
    }
    return out
}

fn main() -> Int {
    let mut s = squares()
    s[0] = 100
    return s[3] + squares()[2] + squares()[0] - 13
}
```

The returned array must have exactly `N` elements, and they must own nothing, as they must for any copied array. A `[T]` parameter's length is not known, so it cannot be returned as `Array<T, N>`. A function declared `-> [T]` still returns a view, so only an array it was given can leave through it — returning a local array that way is refused, with an error that points at `Array<T, N>`:

<!-- prismio-check: fail -->
```prismio
fn build() -> [Int] {
    let values = [1, 2, 3]
    return values
}

fn main() -> Int { return 0 }
```

**A struct field declared `Array<T, N>` stores the array inside the struct** — `N` elements in place, with no allocation of their own. A literal that leaves the field out zero-fills it; one that names it copies the elements in, and the lengths must match. `s.data[i]` reads and writes the struct's own elements. `let d = s.data` and `s.data = other` copy. Passed to a `[T]` parameter, `s.data` is a view, so the callee writes the struct's elements.

<!-- prismio-check: pass -->
```prismio
struct Packet {
    id: Int,
    payload: Array<U8, 8>
}

fn stamp(inout bytes: [U8]) {
    bytes[0] = 200
}

fn checksum(bytes: [U8], n: Int) -> Int {
    let mut sum = 0
    for i in 0..<n {
        sum = sum + (bytes[i] as Int)
    }
    return sum
}

fn main() -> Int {
    let p = Packet { id: 1 }
    stamp(p.payload)
    p.payload[7] = 55
    let mut copy = p.payload
    copy[0] = 0
    return checksum(p.payload, 8) - 255
}
```

A struct whose fields are all plain values — array fields included — is stored inline in a `Vec`, one contiguous block with no allocation per element. Reading one element of an array field copies it, so a struct read that way in a loop stays in the function's frame.

An array field is refused when:

- **its elements own memory**, such as `String`, or are structs, which are allocations of their own. Use a `Vec` field.
- **the struct is generic.** `struct Box<T> { items: Array<T, 4> }` is not supported yet.
- **it has no length.** A field written `[T]` would point into the frame of whichever function built the struct; write `Array<T, N>`.

<!-- prismio-check: fail -->
```prismio
struct Names {
    all: Array<String, 2>
}

fn main() -> Int { return 0 }
```

A length is written in three places only: a local `let`, a return type and a struct field. A parameter takes `[T]` and gets its length from each call; a type argument (`Vec<Array<Int, 4>>`), an optional, an `extern` signature and a module-level `let` cannot carry one.

The language does not yet promise a portable bounds-check trap for every array index. Keep indices in range and do not rely on backend behavior for memory safety.

## Vec

`Vec<T>` is the growable vector: one contiguous, owned block that doubles as it fills. Build one with a literal, change it with its methods, and read it by index or with `for`.

<!-- prismio-check: pass -->
```prismio
import std.vec

fn sumFirstTwo(values: Vec<Int>) -> Int {
    return values[0] + values[1]
}

fn main() -> Int {
    let mut values: Vec<Int> = [20]
    values.push(22)
    return sumFirstTwo(values) - 42
}
```

The literal takes its element type from where it is written, so `[]` is an empty `Vec<Int>` above and an empty `Vec<String>` somewhere else. The parameter in `sumFirstTwo` borrows the Vec, so `main` still owns it after the call.

A `Vec` binding with no initializer starts empty: `let items: Vec<Item>` is `let items: Vec<Item> = []`, as `Array<T, N>` on its own is zeroed slots.

The full method list — `push`, `insert`, `pop`, `removeAt`, `contains`, `sort` and the rest — is on the [Vec page](/stdlib/vec).

**Storage follows the element type.** Scalars, `String`s and structs with no pointer-bearing fields — `Array<T, N>` fields included — live directly in the Vec's block; everything else is stored as one pointer per element. The choice is made per concrete type when the program is compiled, including inside generic code, and it changes nothing about how the Vec is used. Neither layout is a stable C ABI.

## Vec ownership

A Vec is move-only, and it owns its elements. `push` moves a value in, so the name it came from cannot be used again:

<!-- prismio-check: fail -->
```prismio
import std.vec

struct Item { value: Int }

fn main() -> Int {
    let items: Vec<Item>
    let item = Item { value: 7 }
    items.push(item)
    return item.value
}
```

`items[0]` is a view of the element, not a copy. Methods that hand an element out — `pop`, `removeAt`, `get` — return a copy instead, so they need `T: Copy`.

`items[i] = x` replaces an element. Storing a view — `items[i] = items[j]`, or `others.push(items[0])` — puts one element in two slots. That is allowed, and it changes how the element's type is stored: the compiler counts references to it from then on, so each slot's release is safe. Store `copyOf(items[j])` instead when two independent values are what you want.

Removing an element that another name still views is safe: a removed element that owns memory is released with the Vec, not at the removal. See [removing an element another name still reads](/stdlib/vec#removing-an-element-another-name-still-reads).

## Slices

`Slice<T>` is a copyable, non-owning view of a range in a `Vec<T>`. Create one with a range: `values[1..<3]` stops before index 3, and `values[1..3]` includes it. Slicing another Slice composes the offsets rather than copying elements.

<!-- prismio-check: pass -->
```prismio
import std.vec

fn main() -> Int {
    let mut values: Vec<Int> = [10, 20, 30]

    let mut middle: Slice<Int> = values[1..<3]
    middle[0] = 40
    let tail = middle[1..<2]
    return middle[0] + tail[0] - 70
}
```

A Slice has the same reading methods as a Vec (`contains`, `indexOf`, `min`, `max`, `find`, `fold`, `forEach`, `any`, `countWhere` and the rest of the table in [std.vec](/stdlib/vec)), and `sort`, `sortBy`, `reverse`, `swap` and `fill` write through to the Vec it views; `toVec()` copies it out. `view.length` returns the view's length, `view[index]` reads through it, and `view[index] = value` writes to the underlying Vec. Overlapping slices are permitted in one task; a write through either is visible through the other.

A write through a Slice changes the Vec it views, so it needs what a write into that Vec needs. The view's own binding is `let mut`, or an `inout` parameter, as for a [Vec](/language/variables#immutability-and-reassignment). And the view has to be of something changeable. Two kinds of Slice are read-only:

- a slice of a Vec that is not `mut`, of an ordinary parameter, or of another read-only view;
- a Slice returned by a function that has no `inout` parameter. Such a function was only allowed to read what it was given, so the view it returns can only be read too.

<!-- prismio-check: fail -->
```prismio
import std.vec

fn main() -> Int {
    let values: Vec<Int> = [10, 20, 30]
    let mut view = values[0..<2]
    view[0] = 1
    return 0
}
```

```text
error[P4001]: cannot change what `view` views: the view is read-only
```

`mut` on a read-only view lets the binding be pointed at another range. It does not make the view writable. A binding that starts as a writable view cannot later be given a read-only one, because a store written before that assignment in a loop would run through it on the next pass. Reading through any view needs nothing, and a function that only reads a Slice takes it as an ordinary parameter.

A Slice stores the Vec's identity, an offset and a length — not a pointer into the element block. Growing the Vec may move that block, and an existing Slice stays valid because each access finds the block again. Construction and every access are bounds checked: an invalid range or an out-of-range access stops the program with a bounds error instead of reading freed memory.

The memory analysis keeps the viewed Vec alive at least as long as any Slice of it, so a Slice can be returned from a function without a written lifetime. A Slice cannot be stored directly in a Vec, because its three-word descriptor does not fit a boxed slot; wrap it in a struct to keep a collection of views.

A Slice is not a C buffer. An `extern fn` taking or returning `Slice<T>` is rejected until explicit marshalling exists; copy into a C-compatible buffer at the boundary.

## Bounds and iteration

Indices are `Int`.

- **A Slice checks every access** and stops the program on an out-of-range index.
- **A Vec does not.** `values[i]` outside `[0, length)` answers the element type's zero. Check `values.length` first, or use `values.get(i)`, which answers `Option.None` for a missing element.

`for x in values` visits each element in order and borrows the Vec, which stays usable afterwards. `for (i, x) in values` gives the index as well, and a range over `0..<values.length` works when only the index matters. [Control flow](/language/control-flow#collections-for-x-in-items) covers every collection `for` accepts.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.vec

fn main() -> Int {
    let values: Vec<Int> = [3, 4, 5]
    for v in values {
        println(v)
    }
    for (i, v) in values {
        println(i * v)
    }
    return 0
}
```

## Choosing

| | `Array<T, N>` / `[T]` | `Vec<T>` |
| --- | --- | --- |
| Storage | the function's frame, or the struct holding it | heap block |
| Size | fixed: written as `N`, or taken from the initializer | grows with `push` and `insert` |
| Literal | `[1, 2, 3]` | `[1, 2, 3]` where a `Vec` is expected |
| Without values | `Array<T, N>`, zero-filled | `[]` |
| Assignment | copy (a `[T]` parameter is a view) | move |
| Returned from a function | by value, declared `-> Array<T, N>` | yes |
| In a struct field | in place, declared `Array<T, N>` | yes, as a pointer to the Vec |
| `for x in …` | yes, when the length is known | yes |
| `.length` | yes, when the length is known | yes |
| Index type | `Int` | `Int` |

## DataView

Programmer-directed SoA data views are experimental. For an eligible flat struct `T`, `soa(rows)` consumes a `Vec<T>` into a move-only `DataView<T>`, `view.length` borrows its length, and `view[index].field` reads or mutates the corresponding column through a checked handle-and-index descriptor. Nested flat fields can be mutated as well. A struct holding an `Array<T, N>` field is not eligible: a column holds one scalar per row. `aos(view)` consumes the view and rebuilds a `Vec<T>` containing those changes. An `extern fn` taking or returning a DataView is rejected until explicit marshalling exists.

## Not available yet

These are not in Prismio 0.1. Each is planned, and this page will say so when one ships.

| Missing | Use today |
| --- | --- |
| **A parameter of one fixed length** (`xs: Array<Int, 4>`), compiled once per length | a `[T]` parameter, with the length passed beside it |
| **`.length` on a `[T]` parameter**, and `for x in` over one | a length passed beside the parameter: `for i in 0..<n` |
| **An array field in a generic struct**, or one whose elements own memory | a struct without type parameters, or a `Vec<T>` field |
| **Copying an array of arrays**, or of elements that own memory (today a second binding shares them) | copy row by row into an `Array<T, N>` |
| **Slices of arrays** — `Slice<T>` views a `Vec<T>` only | index the array directly, or build a `Vec<T>` |
| **Bounds checks on array indexing** | keep indices in range; a `Slice` checks every access |
| **Chunked vectors** — `Vec<T, N>` and `Vec<T, Chunk>`, whose elements never move as they grow | `Vec<T>` |
| **A moving `pop`/`removeAt`** — handing the element out rather than a copy, so a `T` without `Copy` can be popped | read the last element with `v[v.length - 1]`, then `truncate` |
| **`VecDeque<T>`**, a double-ended queue | a `Vec<T>` used as a stack, or with a moving head index |
| **Sets** — `Set<T>` / a hash set | `Map<T, Bool>` from [std.map](/stdlib/map) |
| **A sorted map** (B-tree) | `Map<K, V>`, sorting its keys when order matters |
| **A priority queue** (binary heap) | a `Vec<T>` kept sorted with `sort`, or scanned for the minimum |
| **A linked list** | `Vec<T>`, or an enum with a payload for a recursive structure |
| **Comprehensions** (`[x * 2 for x in xs]`) | a loop that pushes into a `Vec<T>` |

There is deliberately no `[T; N]` spelling: `Array<T, N>` is how a length is written.
