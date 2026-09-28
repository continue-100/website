---
title: Methods and impl blocks
description: Method call syntax and concrete or generic impl blocks in Prismio -- x.f(a) is f(x, a), and an impl block is where the free function is written.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-25"
tags: [methods, impl, receiver, self, overloads]
related: [language/functions, language/traits, language/structs]
---

Prismio 0.1 has method call syntax and `impl` blocks. It does not have dynamic
dispatch, and the two facts are connected: a method call is rewritten into an
ordinary call before overload resolution runs, so there is only one dispatch
mechanism in the language and it is the one [overloads](/language/functions) already use.

## `x.f(a)` is `f(x, a)`

A method call is a spelling, not a lookup. The receiver becomes argument zero and
everything after it shifts right.

<!-- prismio-check: pass -->
```prismio
import std.io

struct Point {
    x: Int,
    y: Int
}

fn shifted(point: Point, dx: Int, dy: Int) -> Point {
    return Point { x: point.x + dx, y: point.y + dy }
}

fn main() -> Int {
    let origin = Point { x: 0, y: 0 }

    // The same call, twice.
    let a = shifted(origin, 3, 4)
    let b = origin.shifted(3, 4)

    println(a.x + b.y)
    return 0
}
```

Because the rewrite happens before overload resolution, a method call reaches
every overload an ordinary call reaches, and nothing else. There is no separate
method namespace to search and no receiver type to look a table up in.

The receiver may be any expression, including a literal:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    println("  padded  ".trim())
    println("a,b,c".indexOf("b"))
    return 0
}
```

## Properties

A property is a function you read like a field: `s.length`, `'7'.isDigit`,
`process.pid`. It is declared with `prop` where a method has `fn`, and it is
written **without** parentheses — `s.length()` is an error, just as `s.trim` is.
The spelling tells a reader which one they are looking at.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

struct Rect { w: Int, h: Int }

impl Rect {
    prop area(self) -> Int { return self.w * self.h }
    fn scaled(self, by: Int) -> Rect { return Rect { w: self.w * by, h: self.h * by } }
}

fn main() -> Int {
    let text = "prismio"
    let r = Rect { w: 3, h: 4 }
    println(text.length)            // a property
    println(text.trim())            // a method
    println(r.scaled(2).area)       // 48
    return 0
}
```

Calling one as the other is a compile error that names the fix:

<!-- prismio-check: fail -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let text = "  padded  "
    println(text.length())   // `length` is a property, not a method
    println(text.trim)       // `trim` is a method, not a property
    return 0
}
```

**A property takes only its receiver, returns a value, and does not allocate.**
All three are checked where it is declared. The last one is the reason the two
spellings are kept apart: Prismio asks you to bind an owned result (`let t =
text.trim()`), and a field-like name that hid an allocation would hide that
obligation with it. Parentheses mean "this may allocate".

`prop` is only a keyword directly before a name in a declaration, so a variable
may still be called `prop`. A property is still a function underneath, and
`length(text)` calls it like one. A struct field always wins over a property of
the same name.

The standard library's properties are the reads that describe a value rather
than compute a new one: `length`, `isEmpty`, `first` and `last` on String and
Vec; `isDigit`, `isSpace` and the other Char classifications; `isEven`, `isNan`
and the other number predicates; `process.pid`, `process.args.count` and
`platform.current`. Everything that converts, computes or acts — `toUpper()`,
`sqrt()`, `parseInt()`, `wait()` — is a method.

## `impl` blocks

An `impl` block is where a method is *written*. It names the receiver's type once
so the methods inside need not repeat it.

<!-- prismio-check: pass -->
```prismio
import std.io

struct Point {
    x: Int,
    y: Int
}

impl Point {
    fn sum(self) -> Int {
        return self.x + self.y
    }

    fn shifted(self, dx: Int, dy: Int) -> Point {
        return Point { x: self.x + dx, y: self.y + dy }
    }
}

fn main() -> Int {
    let point = Point { x: 1, y: 2 }
    println(point.shifted(10, 20).sum())
    return 0
}
```

Each method is lowered to a plain top-level function whose first parameter is the
receiver, so the two spellings below declare the same thing:

```text
impl Point { fn sum(self) -> Int { ... } }
fn sum(self: Point) -> Int { ... }
```

That is the whole of what `impl` does. In particular:

- A method is callable by name without a receiver -- `sum(point)` works.
- Two `impl` blocks for the same type are allowed, and so are methods of the same
  name on different types; they resolve as overloads.
- A function written inside an `impl` block with no `self` parameter belongs
  to the type. It is called `Point.origin()`, not `origin()` — see
  [type-level functions](#type-level-functions).

### Type-level functions

A function in an `impl` block that takes no `self` builds or answers something about the type rather than a value of it. It is named for the type, so two types may each have a `new` or a `default` without colliding:

<!-- prismio-check: pass -->
```prismio
import std.string

struct Config {
    retries: Int,
    name: String
}

impl Config {
    fn default() -> Config {
        return Config { retries: 3, name: "app" }
    }

    fn named(name: String) -> Config {
        let mut c = Self.default()
        c.name = name
        return c
    }
}

struct Box<T> { value: T }

impl<T> Box<T> {
    fn new(value: T) -> Box<T> { return Box<T> { value: value } }
}

fn main() -> Int {
    let web = Config.named("web")
    let n = Box.new(5)                // T inferred from the argument
    let s = Box<String>.new("x")      // or written
    return web.retries + n.value + s.value.length - 9
}
```

`Self.name()` calls one from inside the block. `default` is allowed as the name, and `Config.default()` is then the type's own default. The `default` keyword on its own stays the compiler's zero value. A bare call, `named("web")`, is an unknown function, and the error names the type it belongs to.

#### Calling a type calls its `new`

A type written as a call is a call to its `new`: `Box(5)` is `Box.new(5)`, and `Box<String>("x")` is `Box<String>.new("x")`. It is the same function, so overloading, generics and ownership are all `new`'s; the spelling is the only difference.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.map

struct Point {
    x: Int,
    y: Int
}

impl Point {
    fn new(x: Int, y: Int) -> Point { return Point { x: x, y: y } }
}

fn main() -> Int {
    let p = Point(3, 4)                       // Point.new(3, 4)
    let seen = Map<String, Int>()             // Map<String, Int>.new()
    let empty: Map<String, Int> = Map()       // <String, Int> from the annotation
    let mut words = Vec<String>()             // an empty Vec, as `[]` is
    words.push("hi")
    println(p.x + p.y + seen.length + empty.length + words.length)   // 8
    return 0
}
```

A type with no `new` is an error that says so, rather than an unknown function. A generic type's arguments come from the call's own arguments, from the call's written `<...>`, or from the annotation it is assigned to — `let m = Map()` has none of the three and is *`Map()` needs its type arguments*.

### `self`

`self` is not a reserved word. Inside an `impl` block, a parameter written as a
bare `self` -- with no `: Type` -- takes the block's type. Written with a type it
is an ordinary parameter, and outside an `impl` block it is an ordinary name.

Like every parameter, `self` is a **borrow** by default. A method does not consume
its receiver unless the parameter says `sink`. See
[ownership and borrowing](/language/ownership-and-borrowing).

`self` must be the first parameter. `x.f(a)` puts the receiver at argument zero, so
a receiver written anywhere else is a method no method call can reach:

<!-- prismio-check: fail -->
```prismio
struct Point {
    x: Int
}

impl Point {
    fn bad(dx: Int, self) -> Int {
        return self.x + dx
    }
}

fn main() -> Int {
    return 0
}
```

### Visibility on methods

A method takes a visibility modifier exactly as a top-level function does, and it
means the same thing: `private` is the declaring file, `internal` is the declaring
package, and no modifier is public.

<!-- prismio-check: pass -->
```prismio
import std.io

struct Counter {
    n: Int
}

impl Counter {
    fn value(self) -> Int { return self.n }

    private fn doubled(self) -> Int { return self.n * 2 }

    internal fn tripled(self) -> Int { return self.n * 3 }

    fn quadrupled(self) -> Int { return self.doubled() + self.doubled() }
}

fn main() -> Int {
    let c = Counter { n: 5 }
    print(c.value())
    print(c.quadrupled())
    return 0
}
```

`quadrupled` calls `doubled` because they are declared in the same file. A caller
in another file may call `value` and `quadrupled`, may call `tripled` from anywhere
in the same package, and may not call `doubled` at all.

That the modifier means the same thing inside a block is not a coincidence to be
remembered separately: a method *is* a free function whose first parameter is the
receiver, and it carries the same file identity either way. See
[visibility](/language/modules#visibility).

### Generic `impl` blocks

Put type parameters immediately after `impl`. They must occur in the target type,
which lets the receiver determine them at a call:

<!-- prismio-check: pass -->
```prismio
struct Box<T> {
    value: T
}

impl<T> Box<T> {
    fn get(self) -> T {
        return self.value
    }

    fn choose(self, other: Self, first: Bool) -> T {
        if (first) { return self.value }
        return other.value
    }
}

fn main() -> Int {
    let left = Box<Int> { value: 3 }
    let right = Box<Int> { value: 7 }
    return left.choose(right, false) - 7
}
```

`Self` denotes the complete target, so it means `Box<T>` above rather than the
unapplied name `Box`. A method may add its own parameters, and impl-level bounds
are checked when that method is instantiated:

<!-- prismio-check: pass -->
```prismio
struct Box<T> {
    value: T
}

trait Scored {
    fn score(self) -> Int
}

impl Scored for Int {
    fn score(self) -> Int { return self }
}

impl<T: Scored> Box<T> {
    fn scoreOf(self) -> Int { return score(self.value) }
}

fn main() -> Int {
    let boxed = Box<Int> { value: 7 }
    return boxed.scoreOf() - 7
}
```

`impl Box<Int>` is also accepted for a concrete specialization. Trait impls may
be generic too, as in `impl<T: Scored> Display for Box<T>`; their applicability,
bounds, and overlap are checked structurally. The trait itself cannot take type
arguments yet. See [traits](/language/traits).

## Standard-library methods

`std.string` carries a method surface over its `str*` functions. The two names are
the same function:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let text = "  Prismio  "
    println(text.trim())
    println(text.trim())
    return 0
}
```

The `str*` prefix is not going away in 0.1. Prismio has no module namespacing yet,
so every top-level name in an imported module is visible unqualified; the prefix is
what keeps the standard library's names from claiming words an application wants.
The methods are additive — but they are not free of that cost, because a method is
a free function whose first parameter is the receiver, so a method name **is** a
global name. `std.string` claims 64 unprefixed names, and a program defining its
own `fn isDigit(c: Char) -> Bool` alongside it is a duplicate definition rather
than an overload.

## Chained calls and temporaries

Chaining works, and one wrinkle is worth knowing about: an intermediate result in a
chain is an owned temporary passed straight into the next call, and Prismio 0.1
does not always release it. `a.toUpper().reverse()` allocates a string for
`toUpper` that is not freed until the process exits.

The one place this does *not* apply is a chain of `+`, which is flattened into a
single call precisely so that it has no intermediate — see
[operators](/language/operators).

Binding the intermediate avoids it:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.string

fn main() -> Int {
    let upper = "ab".toUpper()
    println(upper.reverse())
    return 0
}
```

This is a leak, not a correctness bug -- the value is valid for as long as it is
used, and `--verify` reports it as leaked rather than as a violation.
