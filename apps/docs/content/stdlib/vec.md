---
title: Vec
description: Vec<T>, Prismio's growable vector — building one, its methods, what removing an element does to views of it, and the sorting and higher-order algorithms in std.vec.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-24"
tags: [standard-library, vec, collections, ownership]
related: [language/arrays-and-lists, language/ownership-and-borrowing, errors/container-ownership, stdlib/map]
---

`Vec<T>` is the growable, contiguous, owned sequence — the vector you reach for by default. `import std.vec` for literals and methods.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.vec

fn main() -> Int {
    let mut scores: Vec<Int> = [70, 85]
    scores.push(92)
    scores.insert(0, 60)

    println(scores.length)      // 4
    println(scores.first)       // 60
    println(scores.last)        // 92
    println(scores.contains(85))
    return 0
}
```

The type was called `List<T>` before 0.1's collections work. That spelling is now an error that names `Vec<T>`; nothing else about the type changed.

**Not available yet:** a chunked `Vec<T, N>` whose elements never move as it grows, a `VecDeque<T>` with `pushFront` and `popFront`, lazy iterator adapters (`v.iter().map(…)`), and a `pop`/`removeAt` that moves the element out instead of copying it (so works without `T: Copy`). They are planned; [what to use until then](/language/arrays-and-lists#not-available-yet).

## Build one

| Form | Gives |
|---|---|
| `let v: Vec<Int>` | an empty Vec — the same as `let v: Vec<Int> = []` |
| `Vec<Int>()`, `Vec<Int>.new()` | an empty Vec, where no annotation says what it holds: `let mut names = Vec<String>()` |
| `let v: Vec<Int> = [1, 2, 3]` | a Vec holding those elements, up to twelve of them |
| `Vec<Int>.withCapacity(n)` | an empty Vec with room for `n` elements before it reallocates; like `[]`, it needs no import |
| `Vec<Int>.filled(n, value)` | a Vec of `n` elements, each a copy of `value` — C++'s `std::vector<int>(n, value)`, Rust's `vec![value; n]` |

The element type comes from what the literal is assigned to — an annotation, a struct field, a parameter. `[1, 2]` written as a `Vec<I64>` holds `I64`s.

`filled` is how a table, a distance array or a set of flags starts out, and it replaces the `withCapacity`-and-push loop:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.display

fn main() -> Int {
    let n = 5
    let mut dist = Vec<Int>.filled(n, -1)   // "not reached yet"
    let seen = Vec<Bool>.filled(n, false)
    let row = Vec<U8>.filled(3, 255)        // the value is typed as the element
    dist[0] = 0
    println("${dist[0]} ${dist[4]} ${seen[2]} ${row[1]} ${dist.length}")
    return 0
}
```

This prints `0 -1 false 255 5`. For a scalar element — every integer width, `Float`, `Bool`, `Char` — the whole Vec is one allocation filled in one pass, and needs no import. Any other element (a `String`, a struct) must implement `Copy` and needs `import std.vec`, because each element is its own copy of `value`: changing one changes no other. A count of zero gives an empty Vec; a negative count stops the program with a runtime error, since no Vec has that length.

A literal needs its elements to implement `Copy` (every scalar, `String`, and any struct that writes the impl), because each element is duplicated into the new Vec. Past twelve elements, push them.

## Methods

`v.name(args)` is the call; properties are read without parentheses.

### Size

| Property | Answers |
|---|---|
| `v.length` | the number of elements |
| `v.isEmpty` / `v.isNotEmpty` | whether that number is zero |
| `v.capacity` | how many elements fit before the next reallocation |

### Read

| Form | Answers |
|---|---|
| `v[i]` | the element at `i` |
| `v.first` / `v.last` | the element at either end |
| `v.get(i)` | `Option.Some(element)`, or `Option.None` when `i` is outside `[0, length)` |
| `for x in v` | each element in order |
| `v[a..<b]`, `v[a..b]` | a [slice](/language/arrays-and-lists#slices) of the range — `..<` stops before `b`, `..` includes it |

**An index outside the Vec answers the element type's zero, not an error** — `0` for an `Int`, `""` for a `String`. Check `length` first, or use `get`, which says whether the element was there. `last` reads its receiver twice, so it has to be a name or a field of one; bind a call's result first.

### Search

Requires `T: Eq` (from `std.eq`, which covers every scalar and `String`).

| Method | Answers |
|---|---|
| `v.contains(x)` | whether any element equals `x` |
| `v.indexOf(x)` / `v.lastIndexOf(x)` | the first or last position holding `x`, or `-1` |
| `v.countOf(x)` | how many elements equal `x` |
| `v.binarySearch(x)` | the position of `x` in a **sorted** Vec, or `-1`; requires `T: Ord` |
| `v.isSorted()` | whether the elements are in order; requires `T: Ord` |
| `v.min()` / `v.max()` | the smallest or largest element as an `Option`, `Option.None` when empty; requires `T: Ord`, `T: Copy` |
| `v.find(keep)` | the first element `keep` accepts, as an `Option` |
| `v.indexWhere(keep)` | the position of the first element `keep` accepts, or `-1` |
| `v.startsWith(other)` / `v.endsWith(other)` | whether the Vec begins or ends with the elements of `other`, in order |

The searches above, `min`, `max`, `find`, `indexWhere`, `any`, `all`, `countWhere`, `forEach` and `fold` also work on an [array](/language/arrays-and-lists#length-ends-and-methods) and on a [slice](/language/arrays-and-lists#slices), and `toVec()` copies either into a Vec; the rest of this page is Vec only. A bare integer literal is the element's width: `ids.contains(2)` on a `Vec<I64>` needs no `as I64`.

### Change

Everything in this table changes the Vec, so the Vec has to be one the code may change: a `let mut` binding, or an `inout` parameter. On a plain `let` the compiler reports ``cannot change `v`, which is not declared `mut` `` — see [mutability](/language/variables#a-vecs-or-an-arrays-contents-need-mut-too).

| Method | Does |
|---|---|
| `v.push(x)` | appends `x` |
| `v.insert(i, x)` | puts `x` at `i` and moves the rest up; `i` may be `length` |
| `v[i] = x` / `v.set(i, x)` | replaces the element at `i` |
| `v.swap(i, j)` | exchanges two elements |
| `v.replace(i, x)` | replaces the element at `i` and releases the one it displaced at once; boxed struct elements only, on a local Vec nothing has read an element of yet |
| `v.pop()` | removes the last element: `Option.Some(it)`, or `Option.None` when empty |
| `v.removeAt(i)` | removes the element at `i` and returns it; everything after moves down |
| `v.truncate(n)` | keeps the first `n` elements |
| `v.clear()` | removes every element |
| `v.reserve(n)` | makes room for `n` elements in total |
| `v.extend(other)` | appends a copy of every element of `other` |
| `v.reverse()` | reverses the order in place |
| `v.removeFirst()` | removes the first element: `Option.Some(it)`, or `Option.None` when empty |
| `v.swapRemove(i)` | removes the element at `i` and returns it, by moving the last element into its place: constant time, order not kept |
| `v.retain(keep)` | keeps the elements `keep` accepts, in order |
| `v.dedup()` | removes each element equal to the one before it; sort first to remove every repeat |
| `v.fill(x)` | makes every element a copy of `x` |
| `v.sort()` / `v.sortBy(f)` | sorts in place — see [Sorting](#sorting) |

`push`, `insert` and `set` **move** the value in: the name you pushed is no longer usable. `pop`, `removeAt`, `get` and `extend` hand out copies, so they need `T: Copy`.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.vec
import std.option

fn main() -> Int {
    let mut queue: Vec<String> = ["build", "test"]
    queue.insert(0, "fetch")
    queue.push("ship")

    let next = queue.removeAt(0)
    println(next)                  // fetch

    let finished = queue.pop()
    match (finished) {
        Option.Some(task) => { println(task) }   // ship
        Option.None => { println("nothing left") }
    }

    queue.truncate(1)
    println(queue.length)          // 1
    return 0
}
```

An `insert` or `removeAt` index outside the Vec stops the program with a message naming the index and the length. A removal that did nothing would leave you holding a copy of an element you did not take.

### Copy

| Method | Gives |
|---|---|
| `v.clone()` | a new Vec with a copy of every element; requires `T: Copy` |
| `v.filter(keep)` | a new Vec of the elements `keep` accepts; requires `T: Copy` |
| `v.sorted()` / `v.reversed()` | a new Vec in order, or reversed; the original is unchanged |
| `v.take(n)` / `v.skip(n)` | the first `n` elements, or everything after them; a count past either end clamps |
| `v.concat(other)` | a new Vec of this Vec's elements, then `other`'s |

A Vec of Strings leaks the copies these methods make (a known issue, not yet fixed); a Vec of numbers does not.

## Removing an element another name still reads

`v[i]` is a view of the element, not a copy, and nothing stops the Vec losing that element while the view is still in use:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.vec

fn main() -> Int {
    let mut words: Vec<String> = ["a long enough string to own its own memory", "b"]
    let first = words[0]
    words.clear()
    println(first)       // still the string
    return 0
}
```

This is safe. **Where a view may still be in use, a removed element that owns memory is released with the Vec, not at the removal** — exactly what the Vec would have released had the element stayed, so a removal can never free something a view still reads. Scalars and structs with no owned fields own nothing, so removing them holds nothing back.

**Where no view can be in use, the removal releases at once.** `clear`, `truncate` and `removeAt` do that when the Vec was created in the same function (`let buf: Vec<String>`, `= []`), no element of it has been read, sliced or lent to another function before the removal, and — inside a loop — no view of an element is assigned to anything that outlives the iteration. The common case qualifies:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.vec
import std.string

fn main() -> Int {
    let mut buf: Vec<String>
    let mut total = 0
    let mut i = 0
    while (i < 1000) {
        buf.clear()                   // frees the last iteration's strings
        buf.push("line ".concat(i.toString(), " of the input, long enough to allocate"))
        for line in buf { total = total + line.length }
        i = i + 1
    }
    println(total)
    return 0
}
```

Anything the compiler cannot prove falls back to releasing with the Vec. So a long-lived Vec that is also read elsewhere, or passed to a function, still keeps removed `String`s until it is released itself. `pop` and `removeAt` are library functions, so a Vec they are called on counts as lent.

## Ownership

The Vec owns its elements and is itself move-only. Pushing moves the element in, so the pushed name cannot be used again:

<!-- prismio-check: fail -->
```prismio
import std.vec

struct Item { id: Int }

fn main() -> Int {
    let items: Vec<Item>
    let item = Item { id: 7 }
    items.push(item)
    return item.id
}
```

A `Vec<T>` parameter borrows the Vec, so the caller still owns it afterwards. `inout` borrows it mutably, and `sink` hands the whole Vec to the callee.

<!-- prismio-check: pass -->
```prismio
import std.vec

fn total(values: Vec<Int>) -> Int {
    let mut sum = 0
    for v in values {
        sum = sum + v
    }
    return sum
}

fn main() -> Int {
    let values: Vec<Int> = [1, 2, 3]
    return total(values) - 6
}
```

**Storage follows the element type.** Scalars, `String`s and structs with no pointer-bearing fields live directly in the Vec's block; everything else is stored as one pointer per element. That choice is made when the program is compiled and changes nothing about how the Vec is used, and neither layout is a stable foreign ABI.

**Storing an element somewhere else shares it.** `others.push(items[0])` and `items[i] = items[j]` put one element in two slots rather than copying it. That is safe — the compiler counts references to that element type from then on — but it costs the counting, and for a struct of plain fields it also moves the type out of the Vec's block into one allocation per element. Store `copyOf(items[j])` when two independent values are what you want.

## Sorting

Sorting needs an order, so it needs `T: Ord` — from `std.ord`, which covers every integer type, `Char`, `Float` and `String`.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.vec

fn main() -> Int {
    let mut xs: Vec<Int> = [5, 1, 4]
    xs.sort()
    println(xs.first)              // 1
    println(xs.binarySearch(4))    // 1
    return 0
}
```

`sort` is pattern-defeating quicksort (pdqsort) and is not stable. Ranges under 24 elements go to insertion sort. The pivot is a median of three, or of nine above 128 elements. A range that keeps splitting badly is finished by heapsort, so the worst case is O(n log n) and recursion stays O(log n) deep whatever the input.

**Ordered and repetitive input are fast, not just correct.** A Vec already in order costs about one pass, and 10 000 equal values sort in linear time.

A struct sorts once it has an `impl Ord`:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.vec
import std.ord

struct Version {
    major: Int,
    minor: Int
}

impl Ord for Version {
    fn cmp(self, other: Self) -> Int {
        if (self.major != other.major) { return cmp(self.major, other.major) }
        return cmp(self.minor, other.minor)
    }
}

fn main() -> Int {
    let older = Version { major: 1, minor: 9 }
    let newer = Version { major: 2, minor: 0 }
    println(cmp(older, newer))
    return 0
}
```

**`Float`'s order is not total.** NaN compares as neither less nor greater, so `cmp` answers 0 for it. A sort over data containing NaN has an unspecified order rather than a corrupted one.

## Higher-order

With [closures](/language/closures):

| Method | Does |
|---|---|
| `v.sortBy(order)` | sorts under a comparator answering negative, zero or positive; no `Ord` needed |
| `v.filter(keep)` | a new Vec of the elements `keep` accepts; requires `T: Copy` |
| `v.mapInto(out, f)` | appends `f(x)` for every element to `out` |
| `v.countWhere(keep)` / `v.any(keep)` / `v.all(keep)` | predicate queries |
| `v.forEach(f)` | calls `f` on every element; `f` may return nothing |
| `v.fold(initial, f)` | `f(accumulated, element)` over the elements from `initial`, left to right; `initial` is a `Copy` type, and decides the result's |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.vec

fn main() -> Int {
    let mut xs: Vec<Int> = [3, 9, 1]
    xs.sortBy(|a: Int, b: Int| b - a)
    println(xs.first)                              // 9

    let big = xs.filter(|v: Int| v > 2)
    println(big.length)                            // 2
    println(xs.countWhere(|v: Int| v % 2 == 1))    // 3
    return 0
}
```

**`mapInto` takes its destination rather than returning one.** A `map` that returned a `Vec<U>` would have to learn `U` from the closure's return type, and Prismio solves a type parameter from argument types only. With the destination as an argument, `U` is solvable.

## The runtime layer

The methods compile to runtime entry points — `v.push(x)` to `list_push`, `v[i]` to `list_get`, `v.length` to a field read. Those names are internal to the standard library: a program that calls one directly is told which method to write instead.

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let mut v: Vec<Int> = []
    list_push(v, 1)
    return v.length
}
```

``error: `list_push` is internal to the standard library`` — ``note: write `v.push(x)` ``.
