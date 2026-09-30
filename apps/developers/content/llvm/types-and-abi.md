---
title: Types and ABI
description: Prismio-to-LLVM type keys, storage forms, field layout, target widths, optional encoding, string ABI, and foreign-call coercion.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [llvm, types, abi]
related: [llvm/overview, runtime/collection-representations, compiler/string-representation]
---

The backend never maps a type from spelling alone when semantic information exists. Semantic
analysis stores a resolved type on each annotation and expression; `mapTypeNode` and
`getExprType` read that result and turn it into a compact bridge key. The C backend's
`type_from_key` converts the key into an `LLVMTypeRef`.

## Primitive and built-in mappings

| Prismio type | IR key | LLVM type | Important rule |
| --- | --- | --- | --- |
| `Bool` | `i1` | `LLVMInt1TypeInContext` | Boolean in SSA; inline container storage rounds to one byte |
| `Char`, `I8`, `U8` | `i8` | `LLVMInt8TypeInContext` | Signedness belongs to operations, not LLVM integer types |
| `I16`, `U16` | `i16` | `LLVMInt16TypeInContext` | Cast selection determines extension behavior |
| `Int` (also `I32`), `U32` | `i32` | `LLVMInt32TypeInContext` | `Int` is signed 32-bit; the parser renames `I32` to `Int` |
| `I64`, `U64` | `i64` | `LLVMInt64TypeInContext` | Used directly, not widened through `Int` |
| `Isize`, `Usize` | selected pointer integer | `i32` or `i64` | `ir_set_pointer_int_type` follows the target data layout |
| `Float` | `double` | `LLVMDoubleTypeInContext` | Prismio's current floating representation is 64-bit |
| `Ptr` | `ptr` | opaque LLVM pointer | Pointee types are not encoded in LLVM's pointer type |
| `String` | `struct:prismio.str` | `{ ptr, usize }` | A value pair internally, a NUL-terminated pointer at C boundaries |
| `Slice<T>` | `struct:prismio.slice` | value aggregate | Carries base, offset/length data required by the runtime contract |
| `DataView<T>` element | `struct:prismio.data_element` | value aggregate | Describes view storage rather than a heap object |
| user `struct S` | `struct:S` | named `%S` body | Locals normally hold a pointer; fields embed non-optional structs |
| `Vec<T>` (internally `List<T>`), array, `T?` | `ptr` or `ptrptr` | opaque pointer | Representation details are carried by semantic/AIF side tables |

`mapType` handles primitive names. `mapTypeNode` handles resolved annotations, list/array
markers, optionals, and nominal types. `getExprType` reads the semantic type first and has
fallbacks for literals, identifiers, calls, indexing, member access, and aggregate construction.
If a new type is added to only one of these functions, declarations and call sites can disagree;
`LLVMVerifyModule` then reports the mismatch late in emission.

## Three storage questions

The same semantic type may need three different answers:

- `storageType` returns the representation used by locals and parameters. User structs collapse
  to `ptr`; built-in value structs such as the fat string remain aggregates.
- `fieldStorageType` returns what is embedded inside a containing struct. A non-optional user
  struct remains `struct:S`, giving contiguous by-value containment.
- `ffiType` returns what a C declaration sees. It matches ordinary storage except that
  `String` becomes `ptr`, because the runtime buffer is NUL-terminated and the carried length is
  a Prismio calling-convention detail.

These functions must not be merged. If `storageType` were used for fields, a value-shaped field
would become an extra pointer and allocation. If `fieldStorageType` were used for parameters,
the calling convention would silently change. If the fat string crossed FFI unchanged, a C
function expecting `char *` would receive a two-word aggregate.

## Arrays

An array is an `[N x T]` `alloca`, and the binding holds a `ptr` to element 0 — which is why the
table above lists arrays as `ptr`. These backend entry points build and fill that storage, all in
`runtime/llvm-api-backend.c`:

| Entry point | Emitted for | What it builds |
| --- | --- | --- |
| `ir_array_alloca` | an array literal | the slot; codegen then stores each element |
| `ir_array_literal_begin` / `_elem` / `_end` | an array literal of numeric literals past 64 bytes | a private `unnamed_addr constant [N x T]`, the slot, and one `memcpy` from the constant |
| `ir_array_alloca_zeroed` | `let m: Array<T, N>` with no initializer | the slot, and one store of `[N x T]`'s null constant |
| `ir_array_copy` | `let b = a` where `typeArrayCopies` holds | a new slot and one `memcpy` of the whole array |
| `ir_array_copy_into` | `d = c` where `typeArrayCopies` holds | one `memcpy` into `d`'s existing storage |
| `ir_array_load` | `return a` in a `-> Array<T, N>` function | one load of the whole `[N x T]` out of the local's storage |
| `ir_array_from_value` | a call to a `-> Array<T, N>` function | an entry-block slot of the caller's, and one store of the returned aggregate |
| `ir_array_zero_key` | a struct literal, for every array field | one store of `[N x T]`'s null constant into the field |
| `ir_array_copy_key` | a named array field in a literal, and `s.data = x` | one `memcpy` into the field |

A table written as a literal is the case the constant path is for. Stored element by element, a
1642-element range table was rebuilt in the frame on every call, and a binary search over it
measured 2.4x slower than the same ranges decoded from hex digits in a string. Copied from a
constant, LLVM drops the copy where the frame array is only read and indexes the constant directly:
4.2x *faster* than the string. The 64-byte threshold is clang's (`shouldSplitConstantStore`).
The array is still frame storage the program may write — the constant is only where its initial
contents come from.

**Every array slot is created in the entry block** (`array_slot`), wherever codegen is when it asks,
exactly as `ir_alloca` does for scalars. Two reasons, both measured before the change:

- A slot built at the current position inside a loop allocated again on every iteration. Ten
  million iterations of `let a: [Int] = [i, 1, 2]` exited 139 at `-O0`; at `-O3` it survived only
  because the optimizer deleted the array.
- mem2reg and SROA promote only allocas in the entry block (the LLVM tutorial's
  [Kaleidoscope chapter 7](https://llvm.org/docs/tutorial/MyFirstLanguageFrontend/LangImpl07.html)
  states it for mem2reg, and SROA reuses the same promotion). An array declared inside a branch or
  a loop could otherwise never be split into registers, however small.

The *initialisation* stays where the declaration is: the zeroing store and the copies are emitted
at the current position, so a declaration in a loop body starts at zero, or at its copied value, on
every iteration. The zeroing store is lowered to `memset` and deleted by dead-store elimination when
every element is written before it is read. The `memcpy` alignment is the element's ABI alignment,
read from the module's data layout as `ir_copy_struct` does.

An index store, `a[i] = v`, is `ir_elem_ptr` at the element's own IR type followed by
`ir_store_ptr` — the address `generateIndex` reads through — with no release, which is why sema
admits it only for elements that own nothing.

**An array travels by value under one key, `arr:N:K`** — `N` elements of backend key `K`, which
`type_from_key` builds as `[N x K]` and `irArrayValueKey` spells. Two places use it:

- **A `-> Array<T, N>` return.** `irArrayReturnKey` reads the declaration, and the signature, every
  `return` and every call agree through it: `generateFunction` returns the aggregate,
  `generateReturn` loads it out of the local's storage with `ir_array_load`, and the caller stores
  it into a slot of its own with `ir_array_from_value`, so the call's value is an address like any
  array's. LLVM demotes a large aggregate return to a hidden out-pointer itself. Debug info keeps
  describing the result as a pointer.
- **An `Array<T, N>` struct field.** `fieldTypeFor` gives the field the key, so it is `N` elements
  of the struct's own body. `generateMemberAccess` returns the field's address rather than loading
  it, so `s.data[i]` indexes the struct's bytes and `s.data` passed to a `[T]` parameter is a view
  of them. A struct literal zeroes every array field first and then copies the named ones over;
  LLVM drops the zeroing of any it overwrites. `type_key_is_flat` treats the key as flat when its
  element is, so a `Vec` stores such a struct inline, and `di_type_for` describes it as a
  `DW_TAG_array_type` member with a subrange of `N`.

## Named structs and layout

`ir_struct_type_begin`, `ir_struct_type_field`, and `ir_struct_type_end` build named LLVM
struct bodies. The backend first creates an opaque named type through `LLVMStructCreateNamed`;
after every field key has been converted by `type_from_key`, `LLVMStructSetBody` completes it.
Opaque-first construction permits recursive pointer edges while semantic analysis rejects
impossible direct containment cycles.

When AIF selects hot/cold splitting, `ir_struct_type_split(hotCount)` tells the backend to keep
the first fields in the hot body and place the remaining fields in a cold body reached through one
link word. `ir_struct_field_ptr` is the single access choke point: it uses
`LLVMBuildStructGEP2` directly for hot fields and follows the cold link before addressing cold
fields. Callers continue to use the logical field index.

`ir_struct_size`, `ir_struct_field_offset`, and `ir_struct_field_size` query the selected
`LLVMTargetDataRef` with `LLVMABISizeOfType` and `LLVMABIAlignmentOfType`. AIF uses these
target-aware results; it must not copy host `sizeof` assumptions into a cross build.

## Scalars in pointer-sized slots

Generic list machinery sometimes stores a scalar in a pointer-sized runtime slot without
allocating a box. `scalarBitsOf` identifies the exact bit width. `scalarToSlot` extends integer
bits or bitcasts a `double` before converting them to the slot width. `slotToScalar` reverses
the operation. `scalarInlineBytes` instead returns the byte stride for inline list storage;
`Bool` consumes one byte because indexed addressing cannot name a single packed bit.

Signedness determines the chosen instruction:

- `ir_sext` versus `ir_zext` for widening;
- `ir_sdiv`/`ir_srem` versus `ir_udiv`/`ir_urem`;
- signed versus unsigned `ir_icmp_*`; and
- `ir_sitofp` versus `ir_uitofp`, and `llvm.fptosi.sat` versus `llvm.fptoui.sat` for a
  float-to-integer cast, which saturates rather than producing poison.

LLVM integer types themselves are signless, so using the correct builder is the only place this
meaning survives.

### A scalar `T?` in a slot

A scalar's `T?` is `opt:K`, the literal struct `{ i1, K }`, which has no width to store by and
no bits to widen. In a container it is kept as its **carrier**, one integer twice the payload's
width: the value in the high half, the present flag in the low one, so a zeroed row reads as
`none`. `optCarrierKey` (src/ir/types.psm) picks the width -- `i16` for a payload of 8 bits or
fewer, `i32` for 16, `i64` for 32 -- and `ir_opt_pack`/`ir_opt_unpack` in the backend are the
only definition of the layout. `scalarToSlot`, `slotToScalar` and the inline-bits helpers pack
and unpack at the boundary, and the guarded flat loop operations are handed the carrier key
(`flatScalarKey`), never `opt:K`, so every scalar container path takes a `T?` unchanged.

A 64-bit payload (`Float?`, `I64?`) has no carrier on the runtime's i64 channel, so its row is
the 16-byte `{ i1, K }` itself, reached by address as a flat struct element is: `scalarToSlot`
spills it and `slotToScalar` loads it. That is only correct because a list of one is always
inline (`inlineElemSizeOfList` returns 16 for it).

## Checked conversions

`x as T?` between numbers is `generateCheckedCast` (src/ir/expr.psm), and it is straight-line
code: a present flag from a few compares, and the value converted regardless of the flag.

- **Narrowing** is a round trip: truncate, extend back by the *target's* signedness, compare with
  the source. That one test catches both a magnitude too large and a sign the target cannot hold.
- **Equal or greater width** can only lose a sign: one `icmp sge value, 0` when the signedness
  changes (except unsigned widening to signed, which always fits).
- **From a Float**: `llvm.trunc.f64(x) == x` for wholeness and `low <= x < high` for range,
  with power-of-two bounds a double holds exactly (`2^63` is exclusive, so `I64.MAX` never has to
  be represented). NaN fails every ordered compare and an infinity fails the range. The value is
  computed with the *saturating* intrinsic even though the flag has excluded every input that
  would saturate, because a plain `fptosi` of an out-of-range input is poison, and the value is
  computed whether or not the flag is set.
- **Into an enum**: `icmp ult n, count`, with the count sema recorded on the cast node (`i3`).

A written cast (`child2` holds the annotation) is checked; an unwritten one is sema's
`semaWrapPresent`, a present value placed where a `T?` is expected, and is `generatePresent`.
`s as T?` and `x as String` never reach codegen: sema rewrites them into `s.parseT()` and
`toString(x)`, bound to std.string, and `"12" as Int` is read by sema and left as a cast of the
number literal.

## Optional and enum encoding

Reference-shaped optionals use a null pointer. A scalar's `T?` is `{ i1, K }` by value (key
`opt:K`), which `type_from_key` builds as a literal struct so every `Int?` in a module is one
uniqued type; its zero is `none`. Payload enums use a generated aggregate containing
a tag and payload storage. When an enum can reserve one pointer pattern, `ir_enum_reserve_null`,
`ir_enum_set_null_tag`, and `ir_enum_tag` support null-pointer optimization. The backend uses
`LLVMBuildICmp` against `LLVMConstNull` to recover the logical tag.

Changing an ABI-visible type requires synchronized updates to semantic keys, `types.psm`,
`type_from_key`, struct registration, field access, call coercion, debug metadata, runtime
headers, AIF size queries, serialization of build artifacts, and fixed-point tests. A module that
verifies can still have the wrong ABI, so native C-boundary tests are mandatory.
