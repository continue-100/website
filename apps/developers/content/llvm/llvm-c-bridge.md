---
title: LLVM C API bridge
description: A categorized reference to the LLVM 23 C API used by Prismio's native backend and the ir_* operations exposed to self-hosted code.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-25"
tags: [llvm, c-api, bridge]
related: [llvm/overview, llvm/types-and-abi, llvm/functions-and-calls]
---

`src/ir/bridge.psm` is the ABI visible to the self-hosted compiler.
`runtime/llvm-api-backend.c` implements it with LLVM 23's C API. The Prismio side passes type keys,
symbol names, source positions, and integer handles; the C side owns every LLVM reference and
reports failures through the compiler diagnostic channel.

This page lists the LLVM API families the backend actually calls. The list is generated conceptually
from the current backend source, not from the larger LLVM header.

## Context, module, target, and lifetime

| LLVM function | Where Prismio uses it |
| --- | --- |
| `LLVMContextCreate`, `LLVMContextDispose` | Own the isolated type/metadata universe for one backend lifecycle |
| `LLVMModuleCreateWithNameInContext`, `LLVMDisposeModule` | Create and release the program module |
| `LLVMCreateBuilderInContext` | Create the instruction builder positioned by block helpers |
| `LLVMGetDefaultTargetTriple`, `LLVMGetTargetFromTriple` | Select the host target or validate an explicit target |
| `LLVMCreateTargetMachine`, `LLVMDisposeTargetMachine` | Materialize target-specific code-generation settings |
| `LLVMCreateTargetDataLayout`, `LLVMDisposeTargetData` | Query pointer width, sizes, offsets, and ABI alignment |
| `LLVMCopyStringRepOfTargetData`, `LLVMGetDataLayoutStr` | Copy the canonical layout string onto the module |
| `LLVMGetTarget` | Inspect the target stamped on a parsed or linked module |
| `LLVMABISizeOfType`, `LLVMABIAlignmentOfType` | Answer AIF/backend layout questions using the selected target |

`check_llvm_version` rejects an incompatible major line before building IR. `ensure_context`
creates shared LLVM state lazily. `ensure_all_targets` initializes target support once;
`ir_target_select` records the triple, layout, pointer width, and whether selection was explicit.
`ir_module_set_target` writes the result to the active module.

## Type construction and inspection

`type_from_key` uses the context integer constructors, `LLVMDoubleTypeInContext`,
`LLVMVoidTypeInContext`, and the opaque pointer type. Aggregates use:

- `LLVMStructTypeInContext` for built-in value aggregates;
- `LLVMStructCreateNamed` and `LLVMStructSetBody` for nominal program types;
- `LLVMArrayType2` for fixed arrays and vtable storage; and
- `LLVMFunctionType` for declarations, definitions, direct calls, and indirect calls.

The backend inspects types with `LLVMTypeOf`, `LLVMGetTypeKind`, `LLVMGetIntTypeWidth`,
`LLVMGetStructName`, `LLVMGetElementType`, `LLVMCountParamTypes`,
`LLVMGetParamTypes`, and `LLVMGetReturnType`. These checks support value coercion, declaration
reuse, debug-type synthesis, and validation of runtime helpers.

Constants use `LLVMConstInt`, `LLVMConstReal`, `LLVMConstNull`,
`LLVMConstPointerNull`, `LLVMConstStringInContext`, `LLVMConstArray2`,
`LLVMConstNamedStruct`, `LLVMConstExtractValue`, and `LLVMGetUndef`.
`const_from_text` is the bridge parser for numeric/null textual values; named temporaries never
go through it.

## Globals and functions

| LLVM function | Bridge responsibility |
| --- | --- |
| `LLVMAddGlobal`, `LLVMGetNamedGlobal` | Define or find program globals and interned string objects |
| `LLVMSetInitializer` | Attach constant initializers |
| `LLVMSetGlobalConstant` | Mark immutable globals |
| `LLVMSetLinkage` | Select external or available-externally linkage |
| `LLVMDeleteGlobal` | Remove replaced or temporary globals |
| `LLVMAddFunction`, `LLVMGetNamedFunction` | Materialize program, runtime, generated-helper, and extern functions |
| `LLVMGetParam` | Name and store incoming parameters |
| `LLVMDeleteFunction`, `ir_delete_function_body` | Remove speculative/stub definitions while preserving valid declarations |

Parameter and call-site facts use `LLVMGetEnumAttributeKindForName`,
`LLVMCreateEnumAttribute`, `LLVMCreateStringAttribute`,
`LLVMAddAttributeAtIndex`, and `LLVMAddCallSiteAttribute`. Prismio currently uses attributes
for proven uniqueness, non-capture/borrow behavior, allocator/deallocator relationships, and
inline policy. The proof is made in semantic/AIF code; the bridge only encodes it.

## Instruction builders

Memory and aggregate operations:

- `LLVMBuildAlloca`, `LLVMBuildLoad2`, and `LLVMBuildStore` implement local slots and memory
  reads/writes.
- `LLVMBuildGEP2`, `LLVMBuildInBoundsGEP2`, and `LLVMBuildStructGEP2` address array, byte,
  field, list-header, and cold-record locations.
- `LLVMBuildMemCpy` implements struct copy and proven whole-buffer copy paths.
- `LLVMBuildInsertValue` and `LLVMBuildExtractValue` assemble/disassemble strings, slices,
  payload values, and other SSA aggregates.
- `LLVMBuildGlobalStringPtr` creates C-compatible constant text when a stable global is sufficient.

Integer and bitwise operations use `LLVMBuildAdd`, `LLVMBuildSub`, `LLVMBuildMul`,
`LLVMBuildSDiv`, `LLVMBuildSRem`, `LLVMBuildUDiv`, `LLVMBuildURem`, `LLVMBuildNeg`,
`LLVMBuildAnd`, `LLVMBuildOr`, `LLVMBuildXor`, `LLVMBuildNot`, `LLVMBuildShl`,
`LLVMBuildLShr`, and `LLVMBuildAShr`.

Floating operations use `LLVMBuildFAdd`, `LLVMBuildFSub`, `LLVMBuildFMul`,
`LLVMBuildFDiv`, `LLVMBuildFRem` (`%`, C's `fmod`), and `LLVMBuildFNeg` (unary `-`; an
`fsub 0.0, x` would turn `-0.0` into `+0.0`). Comparisons use `LLVMBuildICmp` or
`LLVMBuildFCmp` with the predicate selected by the `ir_icmp_*` or `ir_fcmp_*` wrapper. Float
`==` and the orderings are *ordered* (`oeq`, `olt`, …) and `!=` is **unordered** (`une`), so
a NaN operand makes `!=` true and everything else false, as IEEE 754 requires. `ir_fcmp_one`
is still defined because the committed seed calls it; nothing current emits it.

Conversions use `LLVMBuildZExt`, `LLVMBuildSExt`, `LLVMBuildTrunc`,
`LLVMBuildSIToFP`, `LLVMBuildUIToFP`, `LLVMBuildIntToPtr`, `LLVMBuildPtrToInt`, and
`LLVMBuildBitCast`. A float-to-integer `as` is not `LLVMBuildFPToSI`: `generateCast` calls
`llvm.fptosi.sat.<int>.f64` (or `fptoui.sat`) through `ir_call_*`, because a bare `fptosi` is
poison out of range and on NaN. The saturating form is one `fcvtzs` on AArch64.
`LLVMBuildSelect` supports branchless scalar choices and representation guards.

Calls use `LLVMBuildCall2` with an explicit `LLVMFunctionType`. The bridge does not use the
deprecated untyped call builder. Direct calls resolve a named function; trait objects and closure
adapters can supply an indirect function pointer via `ir_call_end_indirect`.

## Blocks, branches, and PHI nodes

`LLVMAppendBasicBlockInContext` creates blocks and `LLVMPositionBuilderAtEnd` changes the
insertion point. `LLVMGetInsertBlock` and `LLVMGetBasicBlockTerminator` prevent emission after a
terminator. Branches and exits use `LLVMBuildBr`, `LLVMBuildCondBr`, `LLVMBuildSwitch`,
`LLVMAddCase`, `LLVMBuildRet`, `LLVMBuildRetVoid`, and `LLVMBuildUnreachable`.

Short-circuit expressions and other merged values use `LLVMBuildPhi` plus
`LLVMAddIncoming`. Inspection and rewriting utilities use `LLVMGetFirstBasicBlock`,
`LLVMGetNextBasicBlock`, `LLVMDeleteBasicBlock`, `LLVMGetFirstInstruction`,
`LLVMGetNextInstruction`, `LLVMGetInstructionOpcode`, `LLVMGetNumOperands`, and
`LLVMGetOperand`.

## Metadata and alias analysis

The backend constructs TBAA nodes with `LLVMMDStringInContext2`,
`LLVMMDNodeInContext2`, and `LLVMGetMDKindIDInContext`, then attaches them through
`LLVMSetMetadata`. Scalar, struct-path, list-header, list-element, DataView,
and scoped alias domains are separate so LLVM may move invariant header loads without assuming
unrelated element stores alias them.

Scoped no-alias metadata uses `LLVMTemporaryMDNode`, `LLVMMetadataReplaceAllUsesWith`, and
`LLVMDisposeTemporaryMDNode` while constructing recursive metadata graphs. Range metadata on
validated list lengths helps LLVM prove loop bounds.

## Verification, optimization, bitcode, and linking

`LLVMVerifyModule` is mandatory before output. `LLVMPrintModuleToString` supports textual
`.ll` output and diagnostics. `LLVMWriteBitcodeToMemoryBuffer` produces bitcode.

`LLVMCreatePassBuilderOptions`, `LLVMRunPasses`, and
`LLVMDisposePassBuilderOptions` run the selected optimization pipeline. Object emission uses
`LLVMTargetMachineEmitToFile`.

`ir_link_modules` reads modules with `LLVMCreateMemoryBufferWithContentsOfFile` and
`LLVMParseIRInContext` or bitcode parsing, checks triple/layout compatibility, and combines them
with `LLVMLinkModules2`. All owned messages and buffers are disposed on success and failure.

## ORC JIT

The run path uses `LLVMOrcCreateLLJIT`, obtains the main dylib, installs a dynamic-library search
generator, adds the current module as a thread-safe module, and looks up `main`. Error paths use
`LLVMGetErrorMessage`, `LLVMDisposeErrorMessage`, and `LLVMConsumeError`; no LLVM error object
may be silently dropped.

## Adding a bridge operation

Add the declaration to `bridge.psm`, the prototype to `prismio_llvm.h`, and the implementation
to `llvm-api-backend.c`. **A new LLVM-C function or enum value also goes in `prismio_llvm.h`.**
Every compiler build compiles the backend against the real LLVM headers (the manifest defines
`PRISMIO_LLVM_REAL_HEADERS`), and the hand-kept subset is what a translation unit without them
sees, so keep it complete: a bridge using `LLVMBuildFRem` or `LLVMRealUNE` that is missing there
fails with "call to undeclared function" the first time anything compiles the backend without the
real headers. Accept type keys and value handles rather than exposing LLVM addresses.
Check for a terminated block, use `type_from_key` and `resolve_value`, intern any produced
value, attach applicable debug/TBAA metadata, and test the operation in
`runtime/test_llvm_backend.c` plus a source-level regression. A bridge function is complete only
when the self-hosted compiler can reproduce itself with it.
