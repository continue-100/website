---
title: LLVM backend overview
description: How Prismio turns a checked program and its AIF plan into verified LLVM IR, how to read what it emitted, and the path through the C bridge for contributors changing it.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-16"
tags: [llvm, backend, codegen]
related: [compiler/pipeline-and-driver, llvm/llvm-c-bridge, llvm/runtime-ir-and-optimization]
---

## What the backend does

By the time the backend runs, the program has been parsed, type-checked, and ownership-checked, and AIF (the Adaptive Inference Framework) has decided where every allocation lives. What is left is to say all of that in **LLVM IR** — the intermediate representation LLVM optimises and turns into machine code — and to hand the result to LLVM.

Prismio does that through LLVM's **C API**, not by printing IR text, and the work is split deliberately in two:

- **The self-hosted compiler decides what the program means**, in `src/ir/*.psm`: which type a value has, when it is released, which allocation tier to use, what order declarations go in.
- **A C bridge owns the LLVM objects**, in `runtime/llvm-api-backend.c`, and is the only code that includes an LLVM header.

The split keeps LLVM headers, opaque reference types, error objects, and version churn out of Prismio code. It does **not** move language policy into C. Type selection, ownership actions, AIF tier use, declaration order, expression lowering, and control-flow shape all stay visible in Prismio. The boundary between the two halves is the `ir_*` ABI declared in `src/ir/bridge.psm`.

## See what it emitted

An output path ending in `.ll` stops the build after IR generation and writes the module as text:

<!-- prismio-check: pass -->
```prismio
fn pick(a: Int, b: Int) -> Int {
    if (a > b) {
        return a - b
    }
    return b - a
}

fn main() -> Int {
    return pick(3, 5) - 2
}
```

```bash
prismio build add.psm -o add.ll
```

```text
Wrote LLVM IR: add.ll
```

```llvm
define i32 @pick__Int_Int(i32 %0, i32 %1) {
entry:
  %a.0 = alloca i32, align 4
  store i32 %0, ptr %a.0, align 4
  %b.1 = alloca i32, align 4
  store i32 %1, ptr %b.1, align 4
  %2 = load i32, ptr %a.0, align 4
  %3 = load i32, ptr %b.1, align 4
  %4 = icmp sgt i32 %2, %3
  br i1 %4, label %label_0, label %label_2

label_0:                                          ; preds = %entry
  %5 = load i32, ptr %a.0, align 4
  %6 = load i32, ptr %b.1, align 4
  %7 = sub i32 %5, %6
  ret i32 %7

label_2:                                          ; preds = %entry
  %8 = load i32, ptr %b.1, align 4
  %9 = load i32, ptr %a.0, align 4
  %10 = sub i32 %8, %9
  ret i32 %10
}
```

Three things in that output are worth knowing before you read any more of it:

- **`pick__Int_Int` is the overload-mangled name.** Parameter types are part of a function's symbol, because Prismio allows overloading.
- **Every parameter and binding gets its own stack slot** (`alloca`), and every read is a `load`. That is how the frontend emits, and LLVM's `mem2reg` removes it. A `.ll` file is written at the bridge's configured optimisation level, which is 0 by default, so you see it raw. A native build runs a whole-program `-O3` later, after the standard library and runtime have been merged in — see [the compiler overview](/compiler/overview).
- **`Int` is `i32`.** A C `size_t` crossing an `extern fn` needs `I64`, not `Int`.

`--target` changes the triple and data layout the module is built for. The host `.ll` above carries neither line; a cross target writes both:

```bash
prismio build add.psm --target wasm32-unknown-unknown -o w.ll
```

```llvm
; ModuleID = 'self_hosted_module'
source_filename = "prismio_generated"
target datalayout = "e-m:e-p:32:32-p10:8:8-p20:8:8-i64:64-i128:128-n32:64-S128-ni:1:10:20"
target triple = "wasm32-unknown-unknown"
```

`prismio run file.psm --jit` skips the object file and the link altogether, and runs `main` in the compiler's own process through LLVM's ORC JIT. It produces the same module; only the execution path differs.

## What a backend failure looks like

A triple LLVM does not recognise is rejected before any code is generated:

```bash
prismio build add.psm --target not-a-triple -o x.ll
```

```text
error[P1043]: unknown target triple `not-a-triple`
```

LLVM validates the triple and answers with the pointer width and data layout, so there is no list of supported targets in Prismio to fall out of date.

The other backend failure is one you should never see from valid source. Before writing any output, the bridge runs `LLVMVerifyModule`, which rejects malformed control flow, type mismatches, invalid calls, and broken PHI edges. If it fails, the bridge prints `error: generated module failed verification` followed by LLVM's own message, and the build stops. **Verification failure is a compiler bug, not a user diagnostic** — semantic analysis was supposed to reject anything that could cause one. Reduce the program, then look at the lowering for the construct the verifier names.

## If you are changing the backend

### End-to-end call path

| Stage | Main function | What it contributes |
| --- | --- | --- |
| Driver | `compileSource` in `src/driver/compile.psm` | Runs imports, semantic analysis, AIF, target selection, code generation, and output handling |
| Module orchestration | `generateModule` | Resets backend state, registers types and declarations, emits globals, helpers, functions, and vtables |
| Function emission | `generateFunction` | Materialises a signature and entry block, stores parameters, opens debug scope, emits the body, and supplies an implicit return |
| Statement emission | `generateBlock` and `generateStatement` | Creates scopes, blocks, branches, loop exits, drops, region exits, and returns |
| Expression emission | `generateExpression` | Produces a backend value handle for literals, names, calls, aggregates, operators, casts, indexing, and closures |
| Type mapping | `mapTypeNode`, `storageType`, `ffiType` | Converts resolved Prismio types into bridge type keys |
| LLVM bridge | `ir_module_start`, `ir_function_begin`, `ir_call_end`, and other `ir_*` functions | Converts string keys and integer handles into LLVM objects |
| Validation and output | `ir_write_file` | Verifies the module, runs the pass pipeline at the configured level, verifies again, and writes the file |

`generateModule` is the backend entry point. It first discovers whether optional runtime families such as slices and DataView are actually used. It registers nominal names before bodies so recursive references can resolve, reserves null tags for nullable enums, declares external functions, builds struct bodies, generates per-type release and cyclic-child walkers, and only then emits executable functions. Trait-object vtable declarations and definitions are separate late passes, because their entries require fully resolved implementation symbols.

### State owned on each side

The Prismio side holds AST nodes, resolved semantic types, AIF queries, the active function and body, source locations, and decisions such as whether a value is owned. It passes compact type keys like `i32`, `ptr`, or `struct:Packet`, plus textual value handles such as `%17`.

The C backend owns:

- `LLVMContextRef g_ctx`, `LLVMModuleRef g_module`, and `LLVMBuilderRef g_builder`;
- the selected target triple, data layout, pointer width, target machine, and optimisation level;
- interned `LLVMValueRef` and `LLVMBasicBlockRef` handles;
- pending function declarations and call frames;
- named struct bodies, hot/cold split metadata, enum null tags, and TBAA (type-based alias analysis) nodes;
- debug-info builder state and type caches; and
- ORC JIT state when `run --jit` executes without a native link.

`ir_reset` disposes the previous module, builder, target objects, debug builder, and temporary tables. A compilation must begin from that clean state: backend handles are process-local indices, not stable identifiers that may be reused across modules.

### The bridge's value protocol

Self-hosted code cannot carry an `LLVMValueRef` directly. Builder functions therefore return an `Int` handle. `intern_value` stores the LLVM value and produces that integer; Prismio converts it to the textual form expected by the next bridge call. `resolve_value` recognises temporaries, parameters, constants, globals, and null values, checks the requested type key, and returns the actual LLVM value.

This is why the frontend must use structured operations such as `ir_add`, `ir_struct_field_ptr`, and `ir_call_end`. `ir_append` remains only as a compatibility seam; the real LLVM backend cannot safely recover typed SSA objects from arbitrary handwritten IR text.

### Module lifecycle in LLVM

`ir_module_start` creates the context, module, and builder as needed, then installs the selected target and data layout. `ir_module_set_target` writes the exact triple and layout selected by `common.target`.

Function declarations use `LLVMFunctionType` and `LLVMAddFunction`. Definitions are staged: `ir_function_begin` records the return type, `ir_function_param` records each parameter, `ir_function_body_start` materialises the function and entry block, and `ir_function_end` closes the pending state. This staging lets attributes be applied only after the complete signature exists.

Verification runs twice in `ir_write_file`: once before the pass pipeline, because optimising an already-invalid module produces far worse diagnostics than reporting the original problem, and once after it. The C bridge prints the LLVM verifier message and returns failure to the driver.

### Where to make a change

- Add source syntax or semantic behaviour in `src/parse` and `src/sema`, not in the backend.
- Add a new AST lowering in `expr.psm`, `stmt.psm`, or `module.psm`.
- Add a reusable typed LLVM operation to `bridge.psm` and `llvm-api-backend.c` together.
- Add or change a representation in `types.psm`, then audit fields, calls, debug types, releases, target sizing, and FFI conversion.
- Change allocation policy in AIF; code generation should consume the selected tier rather than infer it again.
- Add an LLVM pass only in `run_optimization`, with IR and performance evidence.

Every backend change should pass a focused source test, a textual IR or symbol assertion when shape matters, `LLVMVerifyModule`, native execution, the fixed-point compiler build, and the relevant AIF and runtime verification.
