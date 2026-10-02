---
title: Prismio guides
description: Practical guides for organizing Prismio programs, integrating C, reasoning about memory, and developing the self-hosted compiler.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-02"
tags: [guides, intellij, modules, ffi, c, aif, compiler]
related: [tutorials, language, cookbook]
---

Guides connect multiple reference rules into a maintainable workflow. They assume the reader already knows the basic syntax and call out experimental or foreign-code boundaries explicitly.

## Application development

- [Use Prismio in IntelliJ](/guides/intellij) installs the plugin, points it at a compiler, starts a project, and runs and checks code from the editor.
- [Organize source with modules](/guides/modules) explains entry-rooted dotted imports, wildcard imports, flattened names, and project layout.
- [Calling C from Prismio](/guides/calling-c) compiles your own C into a program with a `native` block, calls it through `extern fn`, and shows when the build recompiles it.
- [Call C with ownership contracts](/guides/ffi) covers exact ABI declarations, borrow/consume/retain contracts, and wrapper design.
- [Choose memory intent with AIF](/guides/memory-and-aif) starts from stable ownership, inspects allocation evidence, and adds experimental constraints only when measured.

## Compiler development

- [Develop the self-hosted compiler](/guides/compiler-development) covers generation builds, fixed points, regression tests, AIF oracles, and cross-platform checks.

Guides are task-oriented rather than normative. Follow their links into the [language reference](/language) for syntax and the [specification](/specification) for conformance requirements. For a small copyable program, use [verified examples](/examples); for one focused integration task, use the [cookbook](/cookbook).

