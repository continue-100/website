---
title: Runtime platforms and packaging
description: Platform abstraction, the packaged and project-local toolchain layouts, artifact discovery, and native targets.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-24"
tags: [runtime, platforms, packaging]
related: [compiler/bootstrap, tooling/debugging-targets-and-build-tracing, start/development-setup]
---

`runtime/prismio_platform.h` centralizes platform differences used by the runtime and build
driver. Windows and POSIX implementations must agree on observable language behavior even when
threads, processes, paths, libraries, and object formats differ.

## Packaged layout

```text
<prefix>/
  bin/prismio                     the compiler
  lib/runtime/*.bc                one bitcode module per runtime translation unit
  lib/runtime.hash                the source hash those modules were built from
  stdlib/*.plib                   one compiled artifact per standard-library module
  bin/LLVM-C.dll                  Windows only; elsewhere LLVM is linked into bin/prismio
```

**A prefix carries its own LLVM and needs none installed.** On macOS and Linux the compiler links
the pinned LLVM's static archives, as prepared by `tools/setup_llvm.py`, and `otool -L` or `ldd`
lists only system libraries. On Windows the release archive ships `LLVM-C.dll` rather than usable
static archives, so `tools/package.py` and `tools/install.py` copy that DLL beside the compiler.
Earlier prefixes carried `third_party/llvm-paths.json` instead. That file named the
*build machine's* LLVM so that the prefix could run that machine's `clang`, which meant a package
only worked on the machine that built it.

Everything is located relative to the running executable — `find_in_lib_dir` searches
`<exe>/../lib` then `<exe>/lib`, and `standardModulePath` reads `<exe>/../stdlib` — so a prefix
relocates as a unit and there is no installation path compiled in. **A lone `bin/prismio` is not a
compiler**: it can build a compiler from a checkout, whose build.ums names every C source it needs,
and cannot build a single ordinary program.

`lib/` holds what the driver consumes and a user never names. `stdlib/` sits outside it because it
*is* named — `import std.io` resolves through it — which is the line the split follows. Formats
are not the criterion: a `.plib` contains bitcode too. See
[Library artifacts](/runtime/library-artifacts) for both formats.

The application runtime is distinct from the compiler backend, and **the backend is not in the
package**. It used to be, as `lib/backend.a`, which nothing a user builds could link. A compiler is
built from its checkout like any other UMS project: the `prismio` target in `build.ums` lists the
runtime and backend C files as `native` sources, declares `runtime = "none"` because it carries the
checkout's runtime instead of the installed one, and links the pinned LLVM through
`third_party/llvm-link.rsp`, which `tools/setup_llvm.py` writes with `third_party/llvm-compile.rsp`.
That is why building a compiler (unlike building a program) still needs a checkout with
`third_party/llvm` set up -- and why no compiler you install knows which files make one.

## The local toolchain

`prismio build` on a project that declares `toolchain.host` writes the same layout beside the host
it promotes, with the profile directory as the `bin` directory:

```text
.prismio/build/debug/prismio       the host
.prismio/build/lib/runtime/*.bc
.prismio/build/stdlib/*.plib
```

`compiler_emit_local_toolchain` produces it, and the artifacts are byte-identical to what
`tools/package.py` would ship for the same compiler. It exists because the host would otherwise be
that lone binary: able to rebuild itself and unable to build a benchmark, a corpus program or a
test fixture. It is also what carries an uncommitted `std/` or `runtime/` edit into the next
program the project builds.

## Targets

Native and cross targets require a compatible LLVM target, object format, system libraries, and
runtime bitcode built for the requested triple, found under `lib/runtime/<triple>/`. Producing
target-shaped IR is not equivalent to shipping a runnable target. WebAssembly, for example, still
needs an embedder/runtime decision beyond IR.

**`stdlib/*.plib` is not yet target-namespaced.** Runtime bitcode is; PLIB bitcode is not, and
`clear_packaging_target_attributes` strips only `target-cpu`, `target-features` and `tune-cpu` —
CPU tuning within a target, not the triple. A finished cross build therefore has to grow the same
per-target dimension for the standard library, and that is an open design point rather than
settled behavior.

Packaging checks should verify runtime/backend separation, artifact discovery, hashes, executable
behavior, and absence of repository-only path assumptions.

## Build-driver responsibilities

`compiler_default_exe_path` derives a native output name from the source and host platform.
`compiler_temp_path_for`, `compiler_temp_private_path`, `compiler_temp_ir_path`, and
`compiler_temp_obj_path` create collision-resistant intermediate names. `compiler_publish_file`
uses an atomic/replace-safe publish step so a failed build does not expose a partial final artifact.

`find_in_lib_dir` resolves installed artifacts under `lib/`; `find_runtime_bitcode` builds the
module-relative name, including the `<triple>/` component for an explicit target, and reports a
miss as an installation error naming the file. `find_toolchain_entry` is the separate search for
*repository* inputs — `runtime/*.c` and `std/*.psm` relative to the executable or the working
directory — used only by the bootstrap and local-toolchain paths. Keeping the two apart is why
`<prefix>/runtime/` stays free: that path already means runtime **sources**.

`compiler_runtime_source_hash` hashes the current runtime inputs; `compiler_installed_runtime_hash`
reads the packaged counterpart from `lib/runtime.hash`. The driver can therefore diagnose a
toolchain whose shipped runtime does not match the source being compiled.

## Native build stages

`compiler_build_executable(ir, exe)` is the ordinary packaged path: merge the imported PLIB and
runtime bitcode into the program module with `merge_libraries_into_program`, compile the merged
module with `compile_ir_to_object`, construct platform link arguments, and publish the executable.
There is no curated subset and no source fallback — a missing module fails the build.

`compiler_bootstrap_executable` intentionally compiles runtime sources from the working tree. It
is used when producing a new compiler generation, because a compiler's own runtime must contain C
changes made after its host was built. That path also defines `PRISMIO_BOOTSTRAP_COMPAT`, which is
how a one-generation compatibility symbol stays available to compilers without ever reaching
packaged runtime bitcode.

`compile_ir_to_object` optimizes at `-O3` and emits the object in process through `ir_emit_object`
(`llvm-api-backend.c`). It reproduces the old `clang -O3 -mllvm -enable-nontrivial-unswitch -c`
command flag for flag, and the executables it produces are byte-identical to that command's for
host, cross (`x86_64-apple-macos`) and `-g` builds. `PRISMIO_CODEGEN=clang` restores the clang
route for comparing the two. It is a measurement switch, and it needs the pinned clang.

`link_driver_command` picks who links the finished object: `PRISMIO_CC` if set, then the pinned
clang when running inside a checkout that has one, then `cc` (`clang` for an explicit `--target`,
since the driver has to accept `--target`). A Windows host build skips it and goes to
`link_program_msvc`, which runs MSVC's `link.exe` directly with the arguments clang used to pass
(`-out:`, `-defaultlib:libcmt -defaultlib:oldnames`, `-nologo`, and `-libpath:` for the VC tools and
the SDK's `ucrt` and `um` directories). It finds the tools through `vswhere` and the SDK as the
newest `Windows Kits\10\Lib\10.*` that has the architecture's `kernel32.lib` and `ucrt.lib`. A
developer prompt's `VCToolsInstallDir` and `LIB` are used as they are. UMS inputs are recorded in
both spellings: `-lfoo` becomes `foo.lib`, and `-L` becomes `/LIBPATH:`. Object files do not depend on
which LLVM wrote them, so this is the one step that uses the system toolchain, the same way
`rustc` hands its objects to `cc`. The system linker cannot be avoided anyway, because it comes
with the C library and SDK the program links against.

`native_clang_command` names the pinned clang, which is still used for compiling the runtime's C
to bitcode during bootstrap and packaging. `find_llvm_paths` reads `PRISMIO_LLVM_DIR` or the
checkout's `third_party/llvm-paths.json`. `target_clang_flags` translates the selected triple/sysroot. `compiler_set_sysroot` stores an
explicit SDK root. `compiler_link_library`, `compiler_link_search`, `compiler_link_file`, and
`compiler_link_framework` append validated UMS link inputs.

## Platform-specific behavior

`prismio_platform.h` normalizes mutex, condition-variable, thread-local, path, and export
differences. `host_is_windows` supports command selection; quoting stays in
`command_quote_arg` rather than being reproduced by UMS.
`write_dsym` runs only for supported Mach-O debug output. Windows export flags are derived by
`windows_runtime_export_flags`.

Cross-target IR is not sufficient for a runnable product. The target needs LLVM support, a
compatible sysroot/linker, runtime bitcode built for that triple, and all native dependencies.
The driver must state which artifact is missing instead of reporting a generic linker failure.

## Cache and installed-layout tests

The object cache serves the bootstrap and toolchain-source paths, which compile C. Its key includes
source/runtime bytes, target flags, optimization/debug/verification choices, and relevant native
inputs. `object_cache_disabled`, `object_cache_trace`, and `object_cache_dir` control diagnostics
and location; a cache hit must be byte-compatible with a fresh build. An ordinary program build
compiles no C and so produces no cache entries at all — `run_inline_runtime_default_test` asserts
that, because a cache entry appearing there would mean a retired source path had come back.

Packaging tests should install to a temporary prefix, move or hide the repository, run
`prismio --version`, compile and execute a program, exercise `std.*`, debug output, UMS native
links, and compare runtime hashes. Bootstrap tests additionally rebuild two generations and prove
the promoted compiler uses the new runtime sources.
