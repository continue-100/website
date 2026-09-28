---
title: Collection representations
description: The current List, Map, Slice, and DataView runtime forms, ownership modes, growth behavior, and compiler specialization points.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-18"
tags: [runtime, collections, memory]
related: [aif/layout-selection, compiler/generics-and-monomorphization, runtime/allocation-arenas-rc-and-cycles]
---

`Vec<T>` and `Map<K, V>` are compiler-recognized generic containers backed by runtime
operations. Their representations carry information ordinary user-defined generics cannot yet
express uniformly.

**Inside the compiler the vector is still called a list.** `Vec` is the spelling a program writes;
the type kind is `TypeKind.LIST`, its key is `List<...>`, the header is `RtList`, and the entry
points are `list_*`. The rename was surface-only so that mangled symbols, AIF type keys and the
Python oracle did not move — see `COLLECTIONS.md` in the compiler repository. The method surface a
program uses (`v.push(x)`, `v.insert(i, x)`, `v.length`) is lowered onto the functions below in
`src/sema/vec.psm`.

## Vec

A Vec has a header containing length, capacity, data storage, element ownership behavior, region
information, and inline element width where applicable. Capacity grows geometrically. Flat scalar
or eligible aggregate elements can be stored inline; ownership-sensitive or layout-incompatible
elements remain pointer-shaped. An eligible aggregate is a struct `ir_struct_is_flat` accepts:
every field a scalar, a nested flat struct, or an `Array<T, N>` of scalars — `type_key_is_flat`
reads the field's `arr:N:K` key through to its element.

Destination-oriented push paths can reserve an element slot and construct a flat aggregate
directly there. Growth inside a region can retain previous buffers until the region ends, which is
why capacity and arena high-water measurement matter.

## Maps

The current map is an open-addressed hash table with insertion, overwrite, lookup, and iteration.
Key support is bound by the compiler and standard traits. Deletion is not part of the supported
surface, and the benchmark catalog records that absence rather than implementing a private
substitute.

## Views

`Slice<T>` preserves identity and range information over a Vec. `DataView` can materialize
selected fields into a structure-of-arrays form and round changes back. Views are ownership
relationships, not unrestricted raw pointers.

Representation changes must update codegen, runtime slots, release behavior, AIF facts, debug
metadata, FFI restrictions, and benchmark interpretation together.

## List header and construction

`list_new_cap(capacity, elemSize)` allocates the internal `RtList` header and optional element
block. `list_new` starts empty with an unknown/boxed element strategy.
`list_new_with_capacity` reserves pointer slots.
`list_new_with_capacity_inline` reserves a byte-strided inline block.
`list_new_filled_inline(n, bits, elem_size)` is `Vec<T>.filled` for a scalar `T`: an inline block of
exactly `n` elements, length `n`, written by `memset` for a zero or one-byte pattern and by one
typed loop per width otherwise. A negative `n` is a runtime error rather than an empty Vec.

`list_set_elem_owner` records whether elements are borrowed, owned, counted, or otherwise
managed. `list_set_elem_releaser` installs a typed release callback.
`list_inline_enabled` validates whether inline storage is still legal.

**Element width is immutable.** A typed list receives its inline stride in its
constructor — `list_new_inline` — and an untyped one stays boxed for life. There
is no post-construction setter, so codegen's static answer and the runtime's
representation cannot drift apart, and a loop guard that proved `elem_size ==
stride` in a preheader cannot be invalidated by a width change inside the loop.

The previous generation stamped the stride after construction, through
`list_set_elem_inline`. That symbol is **absent from packaged runtime bitcode**.
It survives only under `PRISMIO_BOOTSTRAP_COMPAT`, in compilers built from
repository sources, so that a compiler generation still emitting the call can
link the generation that replaces it — see
[Compiler host and promotion](/tooling/compiler-host-and-promotion) for the
handshake that makes that migration self-repairing.

## Growth and mutation

| Function | Representation path |
| --- | --- |
| `list_push_slot_boxed` | Grows pointer storage and returns the destination slot for an owned pointer |
| `list_push_slot` | Selects inline or boxed slot behavior |
| `list_push_inline` | Copies a fixed-size value directly into the element block |
| `list_push_inline_scalar` | Stores scalar bits in the inline block, using `list_push_inline_scalar_slow` on growth |
| `list_push` | Ordinary boxed-pointer append |
| `list_set_inline` | Replaces an inline aggregate element |
| `list_set_inline_scalar` | Replaces an inline scalar by byte width |
| `list_set` | Replaces a boxed element and applies the configured old-element release |
| `list_set_exclusive` | Uses the proven exclusive-owner path without shared replacement behavior |

`list_inline_grow` reallocates byte-strided storage. `list_push_grow` grows pointer storage.
`list_copy_elem` and `scalar_store` centralize copying so the same width/alignment rule is used
by append and replacement.

## Capacity, insertion and removal

| Function | Method | Behaviour |
| --- | --- | --- |
| `list_capacity` | `v.capacity` | the header's `cap` |
| `list_reserve(l, n)` | `v.reserve(n)` | reallocates to exactly `n` slots when `n > cap`; growth past it still doubles |
| `list_insert`, `list_insert_inline`, `list_insert_inline_scalar`, `list_insert_str` | `v.insert(i, x)` | the matching push, then the new last element is moved down to `i`; the index is checked before the push, so a bad one exits without taking the value |
| `list_truncate(l, n, now)` | `v.truncate(n)`, `v.clear()`, `v.pop()` | discards slots `[n, len)` from the top; `n < 0` empties |
| `list_remove_at(l, i, now)` | `v.removeAt(i)` | discards slot `i` and shifts the tail down; out of range is a `runtime error:` and exit 1, not a no-op |

**A removed element that owns memory is parked, not released.** `list_discard_slot` moves the
owned pointer — a boxed element, or the heap block of a non-inline, non-view `String` pair — onto
the header's `grave` array, and `list_release` releases the grave after the live elements. So a
removal releases exactly what the Vec would have released had the element stayed, and cannot free
something a view taken earlier (`let first = v[0]`) still reads. An arena-backed list, and a list
whose elements own nothing, discard without parking.

The `now` argument is the other half of that rule: `1` releases at once. Codegen passes `0`
everywhere today (`vecRemovalReleasesNow` in `src/ir/expr.psm`); passing `1` where no element view
can be live is `COLLECTIONS.md` step 1e. `pop` and `removeAt` are `std.vec` functions over `T: Copy`
that `copyOf` the element before removing it, so the value handed back is a copy.

The grave fields are appended to `RtList`, after the prefix codegen reads
(`rt_list_header_type` in `llvm-api-backend.c`), and the array is plain `malloc` because only
`list_release` frees it.

## Reads and release

Reads mirror writes: `list_get` returns a boxed pointer; `list_get_inline` returns an address
inside inline storage; `list_get_inline_scalar` returns scalar bits. `list_len` exposes the
logical count. `list_release` walks only the representation's actual live elements, invokes the
element release policy, releases anything parked in the grave, frees the block, and frees the
header.

## Slice operations

A slice is a value containing a list owner/reference plus offset and length. `prismio_slice_check`
validates construction bounds. `list_slice_index` validates an access against the slice length
and translates it to the backing-list index. `list_slice_get` and `list_slice_set` use boxed
elements; the `_inline` variants preserve byte-strided representation.

The slice does not free the element block. AIF records view provenance so the backing list remains
live. Mutation through a slice follows the same exclusivity/ownership rules as mutation through
the original list.

## DataView operations

`data_view_begin(list, fieldCount, elemSize)` creates the view over an eligible list.
`data_view_add_column` records each logical field index, source offset, and width.
`data_view_finish` validates/builds the columnar storage. `data_view_len`,
`data_view_check_index`, and `data_view_column` serve checked reads and writes.
`data_view_to_list` reconstructs array-of-struct storage; `data_view_release` frees view-owned
column storage without releasing the borrowed source as if it were a child allocation.

Representation tests need empty/growth boundaries, every scalar width, flat structs, boxed owned
elements, replacement releases, slices of slices, aliasing mutation, DataView round trips, invalid
indices, generated fast and fallback IR, verifier counts, and observable values.
