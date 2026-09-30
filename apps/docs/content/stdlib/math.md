---
title: Math
description: The std.math module — square roots, rounding, powers, logarithms and trigonometry on Float, integer powers and divisors, and every numeric type's limits.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [standard-library, math, float, integers, ieee-754, trigonometry]
related: [stdlib, language/types, language/operators, specification/behavior]
---

`import std.math`. The numeric functions `+ - * /` don't cover: the distance between two points, a clamp, an angle, a rounding mode you can choose, and the largest value an `Int` can hold.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.math

fn main() -> Int {
    let dx = 3.0
    let dy = 4.0
    println(dx.hypot(dy))                  // 5
    println((dx * dx + dy * dy).sqrt())    // 5 -- the same, written out

    let angle = dy.atan2(dx)
    println(angle.toDegrees().round())     // 53

    println(2.5.round())                   // 3 -- halves away from zero
    println(2.5.roundEven())               // 2 -- halves to even

    println(Int.MAX)                       // 2147483647
    println((-1).floorMod(5))              // 4 -- wraps an index backwards
    return 0
}
```

## One function, three spellings

Every function here is a method, and a method is also a free function whose first argument is the receiver. So these three lines are the same call, and none costs more than another:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.math

fn main() -> Int {
    let x = 16.0
    println(x.sqrt())   // method
    println(sqrt(x))    // free function
    println(16.isEven)  // a property: read without parentheses
    return 0
}
```

Pick whichever of the first two reads better. The math operations are methods, so
they always take `()` -- `x.sqrt` is an error. The predicates `isEven`, `isOdd`,
`isPowerOfTwo`, `isNan`, `isInfinite` and `isFinite` are
[properties](/language/methods#properties) and never do.

`sqrt(dx * dx + dy * dy)` is often clearer in a formula; `angle.sin().abs()` chains.

## How fast

The math compiles to the instructions a C compiler would use. `x.sqrt()` is one `fsqrt` instruction, `x.floor()` is one `frintm`, and `a.max(b)` is one `fmaxnm` on AArch64. None of them is a function call at run time, so a loop that calls them keeps its guards and can still be vectorised. `sin`, `exp`, `pow` and the other transcendental functions call the platform's C math library, as C does. The optimiser knows those calls have no side effects, so it can fold them on constants, hoist them out of loops, and merge a `sin` and `cos` of the same angle into one call.

In the benchmark suite, switching the ray tracer from its own `extern fn sqrt` to `std.math` took it from 1.22× of C++ to 1.06×, and it now runs faster than the Rust version. A program that imports `std.math` pays only for the functions it calls.

## Floating-point semantics

`Float` is an **IEEE 754 binary64** value, the standard also published as **ISO/IEC 60559**. It is the same type as C's `double` and Rust's `f64`, and it uses the hardware's arithmetic on every target:

- `+ - * /`, `sqrt` and `mulAdd` are correctly rounded (round-to-nearest, ties-to-even).
- There are infinities and a NaN. `NaN == NaN` is `false`, `NaN != NaN` is `true`, and every ordered comparison with a NaN is `false`.
- There is a negative zero. `-0.0 == 0.0` is `true`, but `1.0 / -0.0` is `-inf`, and `copySign` can see the sign.
- `%` on two Floats is C's `fmod`: the result takes the dividend's sign, so `-7.5 % 2.0` is `-1.5`, and `x % 0.0` is NaN.
- The compiler may fuse `a * b + c` into a single fused multiply-add, as C compilers do by default. When the rounding of each step matters, write `a.mulAdd(b, c)` to make the fusion explicit, or keep the product in a `let`.
- The transcendental functions (`sin`, `exp`, `ln`, `pow`, `cbrt`, …) come from the platform C library. IEEE 754 recommends, but does not require, that these round correctly. They are accurate to about an ulp everywhere, but **the last bit can differ between macOS, glibc and Windows**. If you need bit-for-bit reproducibility across machines, don't depend on them.

## Constants

Written `Type.NAME`. Each is replaced by its value where you name it, so it costs nothing and is exact to the last bit.

| Constant | Value |
| --- | --- |
| `Float.PI` | π, 3.141592653589793 |
| `Float.TAU` | 2π |
| `Float.E` | e, 2.718281828459045 |
| `Float.SQRT_2` | √2 |
| `Float.LN_2`, `Float.LN_10` | ln 2, ln 10 |
| `Float.LOG2_E`, `Float.LOG10_E` | log₂ e, log₁₀ e |
| `Float.INFINITY`, `Float.NEG_INFINITY` | ±∞ |
| `Float.NAN` | a quiet NaN |
| `Float.EPSILON` | the gap between 1.0 and the next Float, 2.2e-16 |
| `Float.MAX`, `Float.MIN` | the largest finite Float and its negative, ±1.8e308 |
| `Float.MIN_POSITIVE` | the smallest positive *normal* Float, 2.2e-308 |
| `Int.MAX`, `Int.MIN` | 2147483647, -2147483648 |
| `I8`, `I16`, `I64` `.MAX` / `.MIN` | each signed width's bounds |
| `U8`, `U16`, `U32`, `U64` `.MAX` / `.MIN` | each unsigned width's bounds; `MIN` is 0 |

## Float functions

### Rounding

| Function | Result | `2.5` | `-2.5` |
| --- | --- | --- | --- |
| `floor()` | toward −∞ | 2 | -3 |
| `ceil()` | toward +∞ | 3 | -2 |
| `trunc()` | toward zero | 2 | -2 |
| `round()` | nearest, halves away from zero (C's `round`) | 3 | -3 |
| `roundEven()` | nearest, halves to even (IEEE roundTiesToEven) | 2 | -2 |
| `fract()` | what `trunc` removed, keeping the sign | 0.5 | -0.5 |
| `toInt()` | to `Int`, toward zero, saturating | 2 | -2 |
| `toI64()` | to `I64`, the same way | 2 | -2 |

`roundEven` is the one to use when summing many rounded values, because it doesn't drift upward. `toInt()` is the same conversion as `as Int`: out-of-range values clamp to `Int.MIN`/`Int.MAX`, and NaN becomes 0.

### Sign, magnitude and comparison

| Function | Result |
| --- | --- |
| `abs()` | the magnitude; `-0.0.abs()` is `0.0` |
| `sign()` | `1.0` or `-1.0`; `±0.0` and NaN return themselves |
| `copySign(s)` | this magnitude with `s`'s sign bit |
| `min(other)`, `max(other)` | the smaller/larger; **a NaN operand is ignored** |
| `clamp(lo, hi)` | `lo` below it, `hi` above it, NaN stays NaN |
| `isNan`, `isInfinite`, `isFinite` | classification |

`min` and `max` are IEEE 754's `minNum`/`maxNum`. A running minimum over data that contains a NaN therefore gives the smallest real value instead of NaN.

### Powers and roots

| Function | Result |
| --- | --- |
| `sqrt()` | √x; NaN for a negative number |
| `cbrt()` | ∛x; defined for negatives, `(-8.0).cbrt()` is -2 |
| `pow(y)` | xʸ, C's `pow` |
| `powi(n)` | xⁿ for an `Int` n, by repeated squaring — faster than `pow` and exact for small `n` |
| `hypot(y)` | √(x² + y²) without overflowing on the way |
| `mulAdd(a, b)` | x·a + b with a single rounding (fused multiply-add) |

The compiler recognises common constant exponents: `x.pow(2.0)` compiles to `x * x`, and `x.pow(0.5)` to a square root.

### Exponentials and logarithms

| Function | Result |
| --- | --- |
| `exp()`, `exp2()` | eˣ, 2ˣ |
| `expm1()` | eˣ − 1, accurate when x is near 0 |
| `ln()` | natural log; `-inf` at 0, NaN below it |
| `ln1p()` | ln(1 + x), accurate when x is near 0 |
| `log2()`, `log10()` | exact at powers of the base: `1024.0.log2()` is exactly 10 |
| `log(base)` | any base, as `ln(x) / ln(base)` |

### Trigonometry

Angles are in radians.

| Function | Result |
| --- | --- |
| `sin()`, `cos()`, `tan()` | |
| `asin()`, `acos()`, `atan()` | inverse, in radians |
| `atan2(x)` | the angle of the point (x, self): `y.atan2(x)`, C's argument order, in (−π, π] |
| `sinh()`, `cosh()`, `tanh()` | hyperbolic |
| `asinh()`, `acosh()`, `atanh()` | inverse hyperbolic |
| `toRadians()`, `toDegrees()` | unit conversion |

## Integer functions

On `Int` unless noted. Arithmetic wraps on overflow, exactly as `*` does.

| Function | Result |
| --- | --- |
| `min(a, b)`, `max(a, b)`, `abs(x)` | branch-free; `abs(Int.MIN)` is `Int.MIN` |
| `clamp(lo, hi)` | into `[lo, hi]` |
| `sign()` | -1, 0 or 1 |
| `pow(n)` | by squaring; a negative `n` gives the truncated answer (0, or ±1 for a base of ±1) |
| `gcd(other)` | greatest common divisor, never negative |
| `lcm(other)` | least common multiple, never negative; 0 if either is 0 |
| `floorDiv(d)` | division rounded toward −∞: `(-7).floorDiv(2)` is -4, where `-7 / 2` is -3 |
| `floorMod(d)` | remainder with the divisor's sign: `(-1).floorMod(5)` is 4, where `-1 % 5` is -1 |
| `isqrt()` | ⌊√x⌋, exact for every `Int`; 0 for a negative |
| `isEven`, `isOdd`, `isPowerOfTwo` | tests |
| `toFloat()` | the same as `as Float` |

`I64` has `abs`, `min`, `max`, `clamp`, `sign`, `pow` and `toFloat`, which behave the same way. Every other integer type has `toFloat` too, and `toString` and `toString(radix)` are in [`std.string`](/stdlib/strings#parsing-and-formatting).

`floorMod` is the one to use for wrapping an index, because `%` keeps the sign of the dividend:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.math

fn main() -> Int {
    let size = 5
    let mut at = 0
    for step in 0..<3 {
        at = (at - 2).floorMod(size)
        println(at)             // 3, 1, 4
    }
    println(12.gcd(18))         // 6
    println(4.lcm(6))           // 12
    println(2.pow(10))          // 1024
    println(Int.MAX.isqrt())    // 46340
    return 0
}
```

## Worked example: a numerically careful mean

`mulAdd`, `max` and the classification tests together:

<!-- prismio-check: pass -->
```prismio
import std.io
import std.math
import std.vec

// The mean and standard deviation of the finite values, skipping NaN and ±inf.
fn summarize(xs: Vec<Float>) {
    let mut count = 0
    let mut mean = 0.0
    let mut m2 = 0.0
    let mut largest = Float.NEG_INFINITY
    for x in xs {
        if (x.isFinite) {
            count = count + 1
            let delta = x - mean
            mean = mean + delta / count.toFloat()
            m2 = delta.mulAdd(x - mean, m2)   // Welford's update, one rounding
            largest = largest.max(x)
        }
    }
    println(mean)
    println((m2 / count.toFloat()).sqrt())
    println(largest)
}

fn main() -> Int {
    let samples: Vec<Float> = [2.0, 4.0, Float.NAN, 4.0, 4.0, 5.0, Float.INFINITY, 5.0, 7.0, 9.0]
    summarize(samples)
    return 0
}
```

This prints 5, 2 and 9.

## Not available yet

| Missing | What it is | Use today |
| --- | --- | --- |
| Random numbers (`std.random`) | seeded generators, ranges, shuffles | a small xorshift or PCG in your own module — about ten lines |
| 32-bit floats | an `F32` type and its functions | `Float`; convert at the boundary with C |
| Checked and saturating integer arithmetic | `checkedAdd`, `saturatingMul`, overflow as `Option` | compare against `Int.MAX` before the operation, or compute in `I64` |
| Bit counting and rotation | `countOnes`, `leadingZeros`, `trailingZeros`, `rotateLeft` | a loop over `(x >> i) & 1`; `extern fn` to a C builtin wrapper |
| `Float` bit access | `toBits`, `fromBits`, `nextUp` | not expressible without them |
| Special functions | `erf`, `gamma`, Bessel functions | `extern fn erf(x: Float) -> Float` from the C library |
| Big integers, decimals, complex numbers | arbitrary precision, base-10 money, `a + bi` | a struct of your own; `I64` covers most counting |
| Vectors and matrices | `Vec3`, `Mat4`, SIMD types | a struct with `Float` fields; the loops vectorise where their shape allows |
