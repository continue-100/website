---
title: Control flow
description: Branch with if and else if, loop with while, loop, repeat and for over ranges and collections, and leave nested loops with labels.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-25"
tags: [control-flow, if, loops, ranges, labels, return]
related: [language/pattern-matching, language/functions, language/arrays-and-lists, specification/evaluation]
---

Control-flow constructs are statements. Conditions are parenthesized and bodies are blocks. In 0.1, `if`, loops, and `match` do not produce values; assign into a mutable binding or return from a branch when a computation must select a result.

| To… | Write |
| --- | --- |
| choose between branches | `if (c) { } else if (d) { } else { }` |
| repeat while a condition holds | `while (c) { }` |
| repeat until you `break` | `loop { }` |
| repeat a fixed number of times | `repeat(n) { }` |
| count through a range | `for i in 1..10 { }`, `for i in 0..<n step 2 { }` |
| visit every element | `for x in items { }`, `for (i, x) in items { }` |
| leave or continue an outer loop | `outer@ for … { break@outer }` |

## `if`, `else if`, `else`

```prismio
if (ready) {
    println("ready")
} else {
    println("waiting")
}
```

The condition must have type `Bool`. Integers, pointers, strings, and optionals are not implicitly interpreted as truth values.

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    let count = 1
    if (count) { return 0 }
    return 1
}
```

Compare explicitly, such as `count != 0`.

Chain as many conditions as you need with `else if`. They are tested in order and the first one that holds runs; the final `else` is optional. Any branch can hold further `if` statements.

<!-- prismio-check: pass -->
```prismio
import std.io

fn grade(score: Int) -> String {
    if (score >= 90) {
        return "A"
    } else if (score >= 80) {
        return "B"
    } else if (score >= 70) {
        if (score >= 75) { return "C+" }
        return "C"
    } else {
        return "F"
    }
}

fn main() -> Int {
    println(grade(95))
    println(grade(77))
    println(grade(12))
    return 0
}
```

Each branch establishes its own lexical scope. Since `if` is a statement, syntax such as `let sign = if (...) { ... } else { ... }` is not supported.

## `while`

`while` repeats while a Boolean condition is true. The condition is evaluated before every iteration, so a body whose condition begins false never runs.

<!-- prismio-check: pass -->
```prismio
fn main() -> Int {
    let mut sum = 0
    let mut value = 1
    while (value <= 4) {
        sum += value
        value += 1
    }
    return sum - 10
}
```

## `loop`

`loop` has no condition. It repeats until a `break` or `return`, which makes it the loop to use when the test belongs in the middle of the body.

```prismio
let mut value = 0
loop {
    value += 1
    if (value >= limit) { break }
}
```

A `loop` with no `break` never finishes, and the compiler knows it: it satisfies definite-return analysis, and code after it is rejected as unreachable.

## `repeat`

`repeat(n)` runs its body `n` times. The count is any `Int` expression, evaluated once before the first iteration; zero or less runs the body no times.

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    repeat(3) {
        println("Hello")
    }
    return 0
}
```

A count of zero is an ordinary answer to "how many times", so `repeat(0)` simply skips the body. That is the difference from `step 0` below, which asks a loop to move by nothing and is an error. A `repeat` count never runs backwards.

`repeat` has no loop variable. When you need the iteration number, count with a range instead: `for i in 0..<n`.

`repeat` is recognised only at the start of a statement followed by a parenthesised count and a block, so it remains an ordinary name everywhere else — `"ab".repeat(3)` is still the String method.

## Ranges: `for i in a..b`

A range loop visits integers from its start towards its end, counting up or down to get there:

| Syntax | Meaning | Example |
| --- | --- | --- |
| `a..b` | from `a` to **and including** `b` | `1..5` → 1, 2, 3, 4, 5; `5..1` → 5, 4, 3, 2, 1 |
| `a..<b` | from `a` to **but not including** `b` | `1..<5` → 1, 2, 3, 4; `5..<1` → 5, 4, 3, 2 |
| `… step k` | every `k`-th value, in the range's direction | `1..10 step 2` → 1, 3, 5, 7, 9; `10..0 step 2` → 10, 8, 6, 4, 2, 0 |

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    for i in 1..5 {
        print(i)
    }
    println("")

    let n = 4
    for i in 0..<n {
        print(i)
    }
    println("")

    for i in 9..0 step 3 {
        print(i)
    }
    println("")
    return 0
}
```

This prints `12345`, `0123` and `9630`.

- **`..<` is the one for indices.** A `Vec` of length `n` is indexed `0..<n`, which is empty when `n` is 0. `0..n` would visit one past the end.
- **The direction comes from the values.** `a..b` counts down when `a` is greater than `b`, whether the bounds are literals or computed. A literal range is settled when the program is compiled; a computed one costs one comparison when the loop starts.
- **Watch `0..n - 1`.** It is `0..<n` when `n` is at least 1, but when `n` is 0 it counts down, visiting 0 and then -1, where `0..<n` runs no times. The compiler warns about this shape; write `0..<n`.
- **Either bound can be any `Int` expression.** Parentheses are allowed but not required: `for i in 1..x + n * 2` and `for i in lo + 1..hi` both work, because `..` binds more loosely than arithmetic.
- **The start, the end and the step are each evaluated once**, in that order, before the first test. Changing a variable used in the end inside the body does not change how many times the loop runs, and `for i in 0..<v.length` does not recompute the length every iteration.
- **`a..a` runs once and `a..<a` runs no times**, in either direction.
- **`step` is a distance, so it must be positive.** The range already says which way to go; `step` says how far each iteration moves. A literal `step 0` or `step -2` is a compile error, and a computed step that turns out zero or negative stops the program with an error naming the line.
- **Ranges stop at the ends of `Int`.** `for i in 2147483640..2147483647` runs eight times and ends; a range down to the smallest `Int` ends there too. Neither wraps around.
- **The loop variable is an immutable `Int`** scoped to the body.

The header may be written in parentheses, which reads naturally with `step`:

```prismio
for (x in 1..10 step 2) {
    println(x)
}
```

The same two range operators select part of a String, Vec or Slice: `s[0..2]` is the first three characters and `s[0..<2]` the first two. See [slices](/language/arrays-and-lists#slices).

## Collections: `for x in items`

Without a range operator, `for` visits the elements of a collection:

| After `in` | `for x in …` gives | `for (a, b) in …` gives |
| --- | --- | --- |
| `String` | each byte, as a `Char` | index, `Char` |
| `Vec<T>` | each element | index, element |
| `Slice<T>` | each element of the view | index, element |
| `Array<T, N>`, `[T]` with a known length | each element | index, element |
| `Map<K, V>` | each key, in insertion order | key, value |
| a type implementing [`Iterator`](/language/traits) | each `next()` | — |

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string
import std.vec
import std.map

fn main() -> Int {
    let word = "prism"
    for (i, c) in word {
        if (c == 'i') { println(i) }
    }

    let scores: Vec<Int> = [70, 85, 92]
    let mut total = 0
    for score in scores { total += score }
    println(total)

    let ages = mapNew<String, Int>()
    mapSet(ages, "ann", 31)
    mapSet(ages, "bob", 42)
    for (name, age) in ages {
        println(name.concat(" is ", age.toString()))
    }

    for line in "alpha\nbeta".lines() {
        println(line)
    }
    return 0
}
```

- **The collection is borrowed, not moved**, so it is still usable after the loop.
- **The collection can be any expression.** `for line in text.lines()` evaluates `text.lines()` once, keeps the result for the loop, and releases it when the enclosing block ends. A name or a field (`for b in shelf.books`) is read in place.
- **Changing a Vec while iterating it** is not an error, but the loop visits the length it had when the loop began.
- **An array must have a known length.** A `[T]` parameter takes arrays of any length and does not know its own, so pass the length beside it and write `for i in 0..<n`.

Your own types join in by implementing `Iterator` from `std.iter` — `hasNext(self)` and `next(inout self)`. The iterator is advanced in place, so iterating a name requires a `let mut` binding; a call that returns an iterator (`for x in countdown(5)`) needs nothing.

## `break`, `continue` and labels

`break` exits the nearest enclosing loop. `continue` skips the rest of the current iteration and begins the next one; in a range loop that means the next value. Neither carries a value, and both are errors outside a loop.

<!-- prismio-check: fail -->
```prismio
fn main() -> Int {
    break
    return 0
}
```

To leave or continue a loop further out, **label** it by writing a name and `@` in front of it, then name the label after the keyword:

<!-- prismio-check: pass -->
```prismio
import std.io

fn main() -> Int {
    outer@ for row in 0..<3 {
        for column in 0..<3 {
            if (column == 2) { continue@outer }
            if (row == 2) { break@outer }
            println(row * 10 + column)
        }
    }
    return 0
}
```

This prints `0`, `1`, `10`, `11`. Any loop can carry a label — `for`, `while`, `loop` and `repeat`:

```prismio
search@ while (pending > 0) {
    loop {
        if (found) { break@search }
        pending -= 1
    }
}
```

Everything created inside the loops being left is released on the way out, exactly as for an unlabelled `break`. The compiler rejects:

- a label that no enclosing loop carries (`break@inner` outside an `inner@` loop);
- a label that repeats one already used by an enclosing loop, since `break@outer` would then silently mean the nearer one;
- a label in front of anything that is not a loop.

`break@outer` must be on the same line as `break`; a statement ends at the end of its line.

## `return`

`return expression` exits a value-returning function. A function without a result may use `return` without an expression. Every reachable path through a value-returning function must return the declared type, or end in [`panic`, `unreachable` or `exit`](/language/error-handling#when-the-program-cannot-go-on).

```prismio
fn absolute(value: Int) -> Int {
    if (value < 0) { return -value }
    return value
}
```

## Ownership inside loops

The compiler rejects moving an outer move-only binding from inside a loop when a later iteration could observe it after the move. Borrow it with an ordinary parameter, mutate through `inout`, or arrange a single ownership transfer outside the repeating region.

This conservative restriction prevents a path that succeeds once and becomes a use-after-move on the next iteration.

## Not available yet

| Missing | Use today |
| --- | --- |
| **`if` and `match` as expressions** (`let x = if (c) { 1 } else { 2 }`) | assign into a `let mut` in each branch, or `return` from a helper |
| **A `break` that carries a value** out of a `loop` | assign into a `let mut` declared before the loop, then `break` |
| **`for` over a `[T]` parameter**, whose length is not known | pass the length and write `for i in 0..<n` |
| **`(key, value)` from an `Iterator`** | return a struct from `next()` and read its fields |
| **`defer`**, exceptions, and conditional binding syntax (`if let`) | release explicitly on each path; use `Option` with `match` |
