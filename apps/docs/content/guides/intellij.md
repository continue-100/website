---
title: Use Prismio in IntelliJ
description: Install the Prismio plugin for JetBrains IDEs, start a project, and run and check code from the editor.
status: stable
version: "0.1.0"
lastUpdated: "2026-10-02"
tags: [guide, intellij, editor, tooling]
related: [start/installation, start/build-and-run, compiler/cli, stdlib/term]
---

Writing Prismio in a plain text editor means switching to a terminal to see whether it compiles. The Prismio plugin for JetBrains IDEs shows the compiler's errors as you type, fills the run menu from your project, and creates new projects for you.

The plugin does not bundle a compiler. It uses the `prismio` you installed, so [install the toolchain](/start/installation) first.

## Install the plugin

1. Open **Settings | Plugins | Marketplace**.
2. Search for **Prismio** and click **Install**.
3. Restart the IDE if it asks.

It needs a JetBrains IDE from 2026.2 on, and works in IntelliJ IDEA and CLion, where it has been tested. It also passes JetBrains' compatibility check against WebStorm and RustRover 2026.2, but has not been used in them by hand. IDEs older than 2026.2 cannot install it.

## Choose a compiler

The plugin finds `prismio` on your `PATH` by itself. If it cannot, or you want a different one, open **Settings | Languages & Frameworks | Prismio**, browse to the compiler, or press **Auto-Detect**. When Auto-Detect finds nothing, it says where it looked.

Completion and error checking come from the compiler you pick, so a newer or older compiler shows its own functions and methods. There is nothing else to configure.

## Start a project

**File | New | Project | Prismio** asks for a name and a location. It has two more options:

- **Compiler**, filled in with the one the plugin found and the version shown under it: a green tick and `prismio 0.1.0`, or the reason it cannot be used. **Create** stays unavailable until the field holds a working compiler.
- **Create Git repository**, as in other languages. It appears only when the IDE has its Git plugin.

The dialog looks a little different in each IDE, but has the same options. In IntelliJ IDEA it shows Name, Location, the Git checkbox and Compiler. In CLion and the other IDEs, which show a Location field with no separate name, the plugin adds a **Name** field below it that follows the last folder of the location, so changing either one changes the other.

You get the same files `prismio init` writes:

```text
my-project/
├── .gitignore
├── build.ums
└── src/
    └── main.psm
```

To add a manifest to a folder that already has code, use **New | UMS Manifest**. It creates `build.ums` in that folder, named after the folder.

## Run and build

The run menu is built from your `build.ums`: a **Run** entry for each executable target, plus **Build**, **Test** and every command the manifest declares. Green run buttons also appear beside `fn main` and beside each target and command in the manifest.

**Run Current File** runs a file that has a `main`. If the file is the entry of a target, it runs as that target.

Errors in the output are links: click `src/main.psm:12:5` to jump to that line. Output colors, such as a program's [`std.term`](/stdlib/term) styling, show in the IDE console when your toolchain supports them.

## Errors as you type

The compiler checks your code as you type, including changes you have not saved, and marks problems in the file. On a missing name, Alt+Enter offers to add the `import` for it. A file that belongs to a larger program is checked as part of that program. If an error in another file stops the check before it reaches yours, one note says so.

## Documentation comments

Write documentation above a declaration with `///` lines or a `/** ... */` block, and Ctrl+Q shows it for the name:

```prismio
/**
 * The next id after `current`.
 */
fn nextId(current: Int) -> Int {
    return current + 1
}
```

The compiler itself treats these as ordinary comments; only the editor reads them as documentation. The plugin turns on the IDE's **Render documentation comments** setting the first time it runs, so these comments show rendered instead of as source. That setting is global, so it applies to every language, and you can turn it off under **Settings | Editor | General | Appearance**; the plugin will not turn it back on.

Formatting treats `/** */` like `/* */`, and keeps a comment's leading stars lined up.

## Not available yet

- Only IntelliJ IDEA and CLion have been used by hand. WebStorm, RustRover and the rest of the 2026.2 IDEs pass the compatibility check but are not confirmed.
- Where an IDE shows no Name field of its own (CLion and others), the New Project dialog lists Name below Location, not above it.
- The plugin shows what the compiler reports and adds no checks of its own.
- Only a manifest named `build.ums` is recognised.

For how the plugin works and how to contribute to it, see the [developer documentation](https://developers.prismio.org/tooling/intellij-plugin).
