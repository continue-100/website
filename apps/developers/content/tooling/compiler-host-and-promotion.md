---
title: Project compiler host and promotion
description: How an installed Prismio compiler delegates to a repository-local host, checks its generation, repairs a stale one, and atomically promotes successful self-builds.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [ums, self-hosting, compiler]
related: [start/local-compiler-loop, compiler/bootstrap, testing/fixed-point-verification]
---

The compiler repository names `.prismio/build/debug/prismio` as its optional project host. This
lets compiler development use the generation produced by the checkout while retaining an installed
compiler that can recover or bootstrap.

The manifest spells the host without an extension so one `build.ums` serves every platform. On
Windows the file is `.prismio/build/debug/prismio.exe`: `umsExecutablePath` appends `.exe` to the
host path and to every executable and test target's output, as the single-file driver always has.
An extension-less host cannot be started from `cmd.exe`, which is how the build invokes it to emit
the local standard library.

## Routing

The parent compiler locates `build.ums` and reads its stable host declaration. If the host is
missing, the parent processes the project and builds it. If the host exists, the parent forwards
the complete user command so the local generation interprets the rest of the manifest.

**Every observable outcome names the toolchain that served it.** A manifest declaring
`toolchain.host` has asked for a specific compiler, and silently substituting the global one when
that compiler is missing, unrunnable or too old is how a project ends up built by something it did
not choose:

```text
Using local toolchain: /repo/.prismio/build/debug/prismio
Using global toolchain: /opt/homebrew/opt/prismio/bin/prismio
```

A manifest with no `toolchain` block has made no such choice and is told nothing. Forwarded stdout
and stderr retain their command contracts, and `cliWantsMachineOutput` suppresses the banner
entirely when the command emits JSON diagnostics or an AIF manifest — the stream was never the
question, since stdout would corrupt `aif --manifest` and stderr would corrupt JSON Lines.

## Trust

**The launcher runs only a host this machine promoted.** `toolchain.host` names a file the launcher
executes on every command -- the probes below run it too -- and the IntelliJ plugin sends `check`
when a file is opened, so a host that came with a cloned repository would run on opening it. The
handshake is no defence: any program that exits 0 passes it.

Every promotion (`promoteUmsCompilerCandidate`) writes `<host>.trusted` with the file's identity:
device, inode, size and modification time to the nanosecond (volume serial, file index, size and
last-write time on Windows) -- `host_identity` in `runtime/build_driver.c`. The launcher compares it
before anything starts the host (`compiler_host_stamp_matches`). A clone cannot carry a matching
stamp, because the inode and mtime are assigned when the checkout writes the file, and a host edited
or replaced after promotion stops matching. On a mismatch the launcher warns `P1077` and serves the
command itself; `prismio build` builds and promotes a host, which records it.

Identity rather than a content hash, because hashing a 130 MB compiler would cost about a second on
every command. The stamp, not the path, is what keeps a cloned repository from choosing a program
to run: `toolchain.host` may be relative to the manifest or absolute, and a sub-project may name its
parent's host (`../.prismio/build/debug/prismio`). `clean` removes the host only when it is the
project's own build output, relative and under `.prismio/` with no `..`, so a sub-project's `clean`
never deletes its parent's compiler.

A developer who wants a particular generation as the host runs it from the checkout under a name
other than `prismio` -- `build/gen2 build` -- which builds the host target with that generation and
promotes it. Copying a binary over the host does not work: the copy has no stamp and is untrusted.

## Generation handshake

Starting is not enough. A host from an earlier toolchain generation runs, answers `--version`, and
still cannot build: the code it emits names runtime symbols the installed runtime has since stopped
defining. That failure arrives as a linker's undefined-symbol list naming *generated* functions,
with nothing in it pointing at the compiler that emitted them.

`PRISMIO_HOST_ABI` in `runtime/prismio_runtime.h` versions the pairing between what a generation
emits and what the runtime it links defines. The hidden `prismio --internal-host-abi <token>`
reports it: the command prints the compiler's own token and exits 0 only when the argument matches.

Three outcomes, one answer. The host agrees and exits 0; it disagrees and exits 1; or it predates
the command entirely, rejects the argument as unknown (`P1039`) and also exits 1 — which is exactly
the "older than the question" case, reported without the old compiler ever having been taught to
answer. That is why the handshake works on the generation it was introduced to catch, with nothing
back-ported.

The command is answered **before** host routing, in `main`. The question is what *this* executable
emits against; a forwarded answer would describe the host being asked about, and the launcher's own
probe would recurse.

On disagreement `dispatchToUmsHost` rebuilds **only** the `toolchain.host` target with itself,
re-asks — promotion proved the new host starts, this proves the thing it was rebuilt for — and then
forwards the original command with its own arguments and profile:

| Code | Meaning |
| --- | --- |
| `P1064` | warning: the project compiler is from an older generation; rebuilding it first |
| `P1065` | warning: no target in this project builds the configured host; falling back to global |
| `P1066` | error: the rebuilt host still reports a different generation — the installed compiler is older than the project's sources |

`clean` is exempt, and that exemption is the whole of the special-casing: it removes the project's
artifacts and then the launcher removes the host itself, so rebuilding the binary about to be
deleted buys nothing.

**Bump `PRISMIO_HOST_ABI` only in the commit that breaks the pairing.** It is not a build stamp: a
bump costs every project a stage-0 rebuild of its host, so an ordinary runtime or codegen edit —
one where each generation still links what the other emits — leaves it alone. The compatibility
symbol itself survives one generation under `PRISMIO_BOOTSTRAP_COMPAT`, in compilers built from
repository sources, and never appears in packaged runtime bitcode.

## Promotion

A compiler cannot safely overwrite the executable currently running. Self-build output is staged
under a separate path. After the child succeeds, the parent replaces the project host atomically.
A failed compile or test leaves the previous working host intact.

Named `build/genN` compilers remain the correct choice when the exact generation is part of the
experiment. The project host is intentionally moving state for the ordinary edit-build-test loop.

Tests should interrupt failed builds, exercise missing and existing hosts, verify argument
forwarding, and confirm that promotion never exposes a partial binary.

## Bootstrap discovery

`umsProjectHost(startDirectory)` discovers `build.ums`, reads only the bootstrap-safe prefix
computed by `umsBootstrapPrefixLength`, and returns the configured host path. This small parser
must remain understandable to the previously installed compiler. It intentionally does not require
the entire newest UMS grammar before deciding which compiler should parse that grammar.

`dispatchToUmsHost` checks:

1. whether the current invocation is already hosted with `compiler_is_hosted`, which reads
   `PRISMIO_INTERNAL_HOSTED` once and then removes it from the environment, so no program the
   hosted compiler starts inherits it;
2. whether a project host is configured and exists;
3. whether it is the current executable via `compiler_is_current_executable`;
4. whether this machine promoted it, via `compiler_host_stamp_matches`;
5. whether it starts, via `compiler_check_executable`; and
6. whether it is the current generation, via `compiler_check_host_abi`.

`compiler_forward_cli(host)` sets a hosted-environment guard, starts the host with the original
argument vector through the same argv spawn every driver-started program uses (`compiler_spawn_wait`
-- posix_spawn, or CreateProcess with CommandLineToArgvW quoting, so a forwarded argument
containing a space stays one argument on Windows), waits, restores the caller's environment, and
returns the host's own exit status.

## Building and promoting a host

`buildUmsHostTarget` recognizes the manifest target designated as the compiler host and builds it
like any other target -- its `native` sources, `runtime = "none"`, its link response file -- into a
`.next` candidate, with `compiler_set_toolchain_root` pointing source lookups at the project's own
checkout. The candidate is not made active immediately.

The host build also produces the **rest of the toolchain** beside it — `lib/runtime/*.bc` and
`stdlib/*.plib` under the profile directory's parent — because a compiler alone in a build
directory can rebuild itself and build nothing else. In the self-replacing case the libraries are
emitted by the *candidate*, not the running compiler: they must be what the generation about to be
promoted produces, and it has already been checked. See
[Library artifacts](/runtime/library-artifacts).

`compiler_check_executable(candidate)` first verifies that the artifact exists and can execute the
required compiler probe. `checkUmsCompilerCandidate` performs the UMS-side checks.
`compiler_promote_executable(candidate, active)` publishes by safe replacement; on platforms
that cannot overwrite a running executable, it uses a staged path and rename strategy.
`promoteUmsCompilerCandidate` reports the exact failure without deleting the known-good active
host.

Host identity is path/executable identity, not merely matching `--version` text. Two builds can
claim the same version while containing different runtime sources or compiler behavior — which is
precisely why the generation handshake exists alongside the start probe.

Tests should cover an untrusted host never being started, the handshake in both directions and against a compiler that predates it, stale-host auto-repair, the `clean` exemption, recursion prevention, forwarded spaces and Unicode arguments, child exit-status
propagation, stale/missing hosts, a candidate that does not run, an interrupted promotion, Windows
running-file rules, recovery with the previous host, and a successful build whose next command is
served by the promoted compiler.
