---
title: Time
description: The std.time module — measuring how long something took, spans of time as Duration, the wall clock, and sleeping.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-27"
tags: [standard-library, time, duration, clock, sleep]
related: [stdlib, stdlib/filesystem, language/types, roadmap]
---

`import std.time`. Time how long a piece of work takes, wait for a while, or read the date as a count since 1970.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.time

fn work() -> Int {
    let mut total = 0
    for i in 0..<1000000 { total = total + i % 7 }
    return total
}

fn main() -> Int {
    let start = Instant.now()
    let answer = work()
    let took = start.elapsed()
    println(answer)
    println(took.asMillis)                  // whole milliseconds, as an I64

    let pause = Duration.fromMillis(250)
    let later = pause.plus(Duration.fromSeconds(2))
    println(later.asMillis)                 // 2250
    println(later.asSeconds)                // 2.25

    sleep(Duration.fromMillis(20))
    println(start.elapsed().asMillis >= 20) // true

    println(unixTime().asSeconds)           // seconds since 1970-01-01 UTC
    return 0
}
```

## Two clocks, for two questions

| Call | Clock | Use it for |
| --- | --- | --- |
| `Instant.now()` | monotonic | measuring how long something took |
| `unixTime()` | the wall clock | knowing what time it is |

**Measure with `Instant`, never with `unixTime`.** The wall clock jumps when the system clock is set — by a person, or by network time sync — so two readings of it do not measure an interval. The monotonic clock never goes backwards. Its origin is unspecified (on Linux it is the last boot), so an `Instant` is for comparing with another `Instant`, not for printing.

| On an `Instant` | Returns |
| --- | --- |
| `start.elapsed()` | `Duration` from `start` until now |
| `later.since(earlier)` | `Duration` from `earlier` until `later`; negative when `earlier` is the later of the two |

`elapsed()` is a method, with parentheses, because it reads the clock: it is not a stored fact about `start`.

## `Duration`: a span of time

A `Duration` counts nanoseconds in an `I64`. **Every count in this module is an `I64`**, because an `Int` is 32 bits and holds only 2.1 seconds of nanoseconds; an `I64` spans 292 years.

| Make one | From |
| --- | --- |
| `Duration.fromNanos(n)`, `fromMicros(n)`, `fromMillis(n)`, `fromSeconds(n)` | a whole count, as an `I64` |
| `Duration.fromSecondsFloat(s)` | a `Float` of seconds, rounded to the nearest nanosecond, so `fromSecondsFloat(0.1)` is exactly 100 ms |

| Read one | Returns |
| --- | --- |
| `d.asNanos`, `d.asMicros`, `d.asMillis` | `I64`, whole units, truncated toward zero as integer division is |
| `d.asSeconds` | `Float` |
| `d.plus(other)`, `d.minus(other)` | `Duration` |

The `as*` readings are [properties](/language/methods#properties), read without parentheses. A `Duration` may be negative — `a.minus(b)` for a larger `b` is — rather than a failure to handle. Integer literals take the `I64` type where one is expected, so `Duration.fromMillis(250)` needs no cast.

## Sleeping

`sleep(duration)` blocks the calling thread for at least `duration`, and not at all for zero or a negative one. If a signal interrupts it, it goes back to sleep for what is left.

## The wall clock

`unixTime()` is the time since 1970-01-01 00:00:00 UTC, as a `Duration`. `unixTime().asSeconds` is the familiar Unix timestamp. A file's modification time from [`metadata`](/stdlib/filesystem#what-a-path-is) is the same kind of value, so the two subtract: `unixTime().minus(m.modified)` is the file's age.

## Platforms

POSIX uses `clock_gettime` (`CLOCK_MONOTONIC` and `CLOCK_REALTIME`) and `nanosleep`. Windows uses `QueryPerformanceCounter`, `GetSystemTimePreciseAsFileTime` and `Sleep`.

The benchmark suite times its Prismio programs with `Instant`, as its C++ programs use `std::chrono::steady_clock` and its Rust programs `std::time::Instant`.

## Not available yet

| Missing | Use today |
| --- | --- |
| Calendar dates, time zones, formatting a time as text | `unixTime().asSeconds`, and do the arithmetic yourself |
| Timers, timeouts, and waiting on a channel for a limited time | a task that `sleep`s, then sends on a channel |
| `Instant` arithmetic other than `since` and `elapsed` | keep the `Duration`s and add them |
| Parsing a duration from text such as `"1.5s"` | parse the number and call `fromSecondsFloat` |
