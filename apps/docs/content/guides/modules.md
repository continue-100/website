---
title: Organize source with modules
description: Structure Prismio 0.1 source files with relative dotted imports and direct wildcard imports.
status: stable
version: "0.1.0"
lastUpdated: "2026-09-30"
tags: [guide, modules, imports]
related: [language/modules, specification/name-resolution, package-manager]
---

Module paths map directly to files beneath the entry file's directory. For an entry at `src/main.psm`, `import model.user` loads `src/model/user.psm`.

This guide organizes a small program without relying on package-manager, visibility, or namespace features that are not in 0.1.

## Start with a source tree

```text
src/
├── main.psm
└── model/
    ├── user.psm
    └── session.psm
```

Put a model declaration in `src/model/user.psm`:

```prismio
struct User {
    id: Int,
    active: Bool
}

fn user_is_active(user: User) -> Bool {
    return user.active
}
```

Then import it from `src/main.psm`:

```prismio
import model.user

fn main() -> Int {
    let user = User { id: 1, active: true }
    if (user_is_active(user)) { return 0 }
    return 1
}
```

Imported declarations are flattened, so the names are `User` and `user_is_active`, not `model.user.User`.

## Choose explicit or wildcard imports

```prismio
import model.user
import model.*
```

An explicit dotted import makes the dependency visible in review. A wildcard imports every direct `.psm` child in the named directory, sorted by path. It does not scan nested directories.

Use wildcard imports when a directory is deliberately one source unit and new direct children should join automatically. Use explicit imports where adding a file should not silently expand a program's dependency surface.

Do not combine an explicit file import and a wildcard out of fear that the file will be loaded twice. The resolver memoizes resolved files. Prefer one clear style for the boundary.

Wildcard imports include the package's direct `.psm` files in sorted order; they do not recursively scan subdirectories. Imported top-level declarations are flattened into one compilation unit. Cycles and diamond imports are memoized, but conflicting declarations still produce diagnostics.

## Avoid declaration conflicts

Because imported files share one program namespace, two structs with the same name conflict even when they live in different directories. Rename them at declaration time: a qualifier applies to calls, not to types, so there is no way to tell two same-named structs apart at a use site.

Functions may share a name when their arity or exact parameter types form a valid overload set. Return type alone is insufficient.

Two modules may also declare the same function with the same signature — which flattening would make ambiguous. Qualify the call with the declaring module's import path to choose one:

```prismio
import model.user
import model.session

fn main() -> Int {
    return model.user.identify() + model.session.identify()
}
```

Use `private` for a helper no other file should call, and `internal` for one that its own package may share but others may not. Both are enforced; neither is a convention.

## Handle nested directories

For `src/model/internal/id.psm`, write:

```prismio
import model.internal.id
```

`import model.*` will not include it. Keeping wildcard discovery non-recursive makes the imported file set locally inspectable.

## Understand the root

The entry file determines the import root. If you build `src/tools/check.psm` as the entry, dotted imports are still resolved beneath that file's directory under the current rule. A multi-entry project should choose layouts that make each entry's dependencies unambiguous rather than assuming a manifest-defined source root.

## Diagnose an import failure

When resolution fails:

1. confirm the entry file passed to `prismio build` or `prismio run`;
2. map dots to path separators beneath its directory;
3. append `.psm` for an explicit file import;
4. check exact case on case-sensitive file systems; and
5. remember that `directory.*` sees only direct source children.

Prismio 0.1 has no `pub`, import aliases, selective imports, manifest-defined dependencies, or package registry. Do not use URL-like or globally installed package names in import statements.

Foreign object/library linking is separate from Prismio imports. Declare symbols with `extern fn` and name the C source or library in the target's `native` or `link` block of `build.ums` ([Calling C from Prismio](/guides/calling-c)), rather than placing a library name in `import`.
