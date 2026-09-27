---
title: Undefined and implementation-defined behavior
description: Boundaries where Prismio 0.1 rejects code, checks at runtime, or does not yet define portable behavior.
status: stable
draft: true
version: "0.1.0"
lastUpdated: "2026-09-25"
tags: [specification, undefined-behavior, portability, safety]
related: [specification/memory-model, compiler/targets, language/ffi]
---

Prismio 0.1 aims to reject known type and ownership violations, but it does not yet publish a complete undefined-behavior taxonomy. This page identifies portability boundaries so documentation does not imply guarantees absent from the compiler and runtime.

## Static rejection

Programs must be rejected for required lexical, parse, type, name-resolution, ownership, definite-return, unreachable-code, and invalid-control-transfer errors described elsewhere. Rejection is preferable to assigning undefined behavior to a statically detectable invalid program.

Examples include using a moved binding, assigning directly to an immutable binding, calling with the wrong arity/type, accessing a member on `T?`, returning a local stack array, or using `break` outside a loop.

## Defined runtime failure

`expect(none)` is a defined runtime failure path, not successful unwrapping and not a catchable language exception. The exact presentation and termination mechanism can remain implementation-specific while the program is not permitted to continue as though a value existed.

Link failure for a missing extern symbol is a build/toolchain failure rather than execution of a valid complete program.

## Current portability boundaries

The following boundaries are not portable language guarantees:

- Raw `Ptr` dereference and foreign-code behavior depend on the declared and actual C ABI contract.
- Array/list bounds behavior is not specified as a stable checked-access guarantee.
- Integer overflow, division edge cases, and invalid shift counts inherit current LLVM lowering where the compiler does not insert a check.
- Fieldless enum ordinal layout currently follows zero-based declaration order, but persistence and FFI code should not assume it without an ABI contract.
- Struct layout, padding, and alignment are backend/target defined unless an external declaration explicitly establishes a layout.
- Calling a foreign function through an incorrect declaration is outside compiler safety guarantees.
- WebAssembly output and runtime integration are experimental.

These areas require explicit application checks, narrow FFI wrappers, or target-specific documentation.

## Numeric behavior

The language defines type widths and explicit cast mechanics, but does not yet guarantee checked arithmetic for overflow, zero division, or invalid shift counts. Float-to-integer conversion is defined for every input: it truncates toward zero, saturates at the destination's bounds, and maps NaN to 0. LLVM lowering can impose preconditions whose violation is not a recoverable Prismio error.

Portable code validates divisors, shift ranges, and numeric input before performing the operation. Security-sensitive code should not infer debug trapping or wraparound without a future explicit contract.

`Float` is IEEE 754 binary64 (ISO/IEC 60559). `+ - * /` and `sqrt` are correctly rounded to nearest, ties to even. Comparisons follow IEEE 754: `!=` is true for a NaN operand, and the other comparisons are false. Signed zero is preserved through negation. `%` is C's `fmod`. The compiler may contract `a * b + c` into a fused multiply-add. Exception flags and non-default rounding modes are not exposed. Transcendental functions come from the platform C library and may differ in the last bit between targets; see [`std.math`](/stdlib/math#floating-point-semantics).

## Bounds and storage

Array and list indices must be kept within their valid ranges. The specification does not promise that every invalid access traps in one stable way. Returning local arrays is statically rejected to prevent a known stack escape, but this does not turn every raw pointer or foreign buffer operation into checked access.

Annotation-only local storage can be parsed/allocated by the current compiler without complete definite-initialization tracking. Programs must not read such a binding before an explicit assignment; its raw contents are unspecified. Initializing at declaration is the portable pattern.

## Layout and ABI

Struct field layout, padding, alignment, symbol mangling beyond declared extern behavior, enum ABI representation, and cross-version runtime representations are not stable Prismio ABI guarantees.

The current fieldless enum lowering uses declaration-order zero-based ordinals. Reordering variants can change that representation. Convert to an application-owned integer format at persistence or FFI boundaries.

`Isize` and `Usize` change with target pointer width. Raw `Ptr` provenance and lifetime follow the actual foreign/runtime contract, not the scalar copy behavior of the address value.

## Foreign code

Calling foreign code through an incorrect declaration lies outside language safety guarantees. Incorrect widths, calling conventions, retention contracts, allocators, or release functions can cause memory corruption even if Prismio semantic analysis succeeds.

FFI can also expose concurrency, long jumps, callbacks, signals, or mutation that 0.1 has no source-level model for. Such behavior is implementation/application-defined and must not be generalized into the Prismio memory model.

## Experimental behavior

AIF tier policy, report wording, annotation thresholds, and WebAssembly integration are experimental. They may be versioned and tested without becoming a permanent compatibility promise. An experimental feature still must not silently violate the stable type/ownership rules.

`expect(none)` is a defined runtime failure, not a successful conversion. Compile with `--verify` to detect supported allocation/free contract violations during testing; verification does not make raw FFI behavior safe.

## Reporting an unclassified boundary

A useful report includes the smallest source program, compiler and LLVM versions, complete command, target/host, optimization level, emitted IR when relevant, and observed result. A new classification should be accompanied by positive/negative tests and updates to this page.
