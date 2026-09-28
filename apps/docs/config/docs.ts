import type { DocsAppConfig } from "@prismio/docs-core";

export const docsConfig: DocsAppConfig = {
    site: {
        name: "Prismio Documentation",
        shortName: "Prismio",
        description: "Canonical documentation for the self-hosted Prismio systems language and compiler.",
        currentVersion: "0.1.0",
        author: "Saksham Jaiswal",
        authorURL: "https://saksham1319.vercel.app",
        email: "saksham6975@gmail.com",
        siteUrl: "https://docs.prismio.org",
        links: {
            github: "https://github.com/prismio-lang/prismio",
            twitter: "",
        },
    },
    brandTag: "docs",
    accentColor: "gray",
    showInstall: true,
    search: {
        placeholder: "Search concepts, errors, APIs, examples…",
        emptyPrompt: "Search versioned reference pages by title, concept, status, or compiler error.",
        categories: {
            start: "Getting started",
            tutorials: "Tutorials",
            guides: "Guides",
            language: "Language",
            specification: "Specification",
            compiler: "Compiler",
            stdlib: "Standard library",
            "package-manager": "Packages",
            examples: "Examples",
            cookbook: "Cookbook",
            migration: "Migration",
            errors: "Errors",
            releases: "Releases",
        },
    },
    home: {
        badge: {
            versionText: "Prismio 0.1.0",
            tagline: "Compiler-audited reference",
        },
        hero: {
            title: "One source of truth for Prismio.",
            description: "Documentation derived from the self-hosted compiler and its tests—written for developers, searchable by machines, and honest about what has not shipped.",
            primaryCta: {
                text: "Start reading",
                href: "/start/overview",
            },
            secondaryCta: {
                text: "Read the 0.1.0 baseline",
                href: "/releases/0.1.0",
            },
        },
        statusFacts: [
            { status: "Stable", detail: "Native compiler, core language, ownership, imports, FFI" },
            { status: "Experimental", detail: "AIF memory policy and WebAssembly targeting" },
            { status: "Planned", detail: "Traits, generics, packages, std modules, concurrency" },
        ],
        foundations: {
            sectionLabel: "Learning path",
            title: "From zero to owned data.",
            description: "A short route through the toolchain and the language rules that matter first.",
            items: [
                { href: "/start/installation", label: "Install and bootstrap", detail: "Configure LLVM 22 and build the self-hosted compiler." },
                { href: "/tutorials/first-program", label: "Write a complete program", detail: "Use functions, ranges, mutable bindings, and output." },
                { href: "/language/ownership-and-borrowing", label: "Understand ownership", detail: "Learn default borrows, sink transfers, inout, and drop." },
            ],
        },
        reference: {
            sectionLabel: "Canonical reference",
            title: "Find the rule, not a guess.",
            items: [
                { href: "/language", label: "Language reference", detail: "Accepted syntax and compiler behavior, feature by feature." },
                { href: "/specification", label: "Draft specification", detail: "Grammar, types, names, evaluation, memory, and conformance." },
                { href: "/errors", label: "Error reference", detail: "Permanent pages for every negative-suite failure class." },
                { href: "/compiler/overview", label: "Compiler internals", detail: "Self-hosting, AIF, LLVM generation, bootstrap, and targets." },
            ],
        },
        footer: {
            tagline: "Canonical for Prismio 0.1.0 · Last compiler audit: 9 Aug 2026",
            links: [
                { href: "/glossary", label: "Glossary" },
                { href: "/faq", label: "FAQ" },
                { href: "/roadmap", label: "Roadmap" },
            ],
        },
    },
    navigation: [
        {
            label: "Getting started",
            items: [
                { label: "Prismio 0.1 overview", href: "/start/overview" },
                { label: "Installation", href: "/start/installation" },
                { label: "Hello, Prismio", href: "/start/hello-world" },
                { label: "Build and run", href: "/start/build-and-run" },
            ],
        },
        {
            label: "Tutorials",
            items: [
                { label: "Tutorial index", href: "/tutorials" },
                { label: "First complete program", href: "/tutorials/first-program" },
                { label: "Model owned data", href: "/tutorials/data-model" },
            ],
        },
        {
            label: "Guides",
            items: [
                { label: "Guide index", href: "/guides" },
                { label: "Organize source", href: "/guides/modules" },
                { label: "C ownership contracts", href: "/guides/ffi" },
                { label: "Memory and AIF", href: "/guides/memory-and-aif" },
                { label: "Compiler development", href: "/guides/compiler-development" },
            ],
        },
        {
            label: "Language reference",
            items: [
                { label: "Reference index", href: "/language" },
                {
                    label: "Source and declarations",
                    items: [
                        { label: "Lexical structure", href: "/language/lexical-structure" },
                        { label: "Variables", href: "/language/variables" },
                        { label: "Functions", href: "/language/functions" },
                    ],
                },
                {
                    label: "Types and data",
                    items: [
                        { label: "Types", href: "/language/types" },
                        { label: "Structs", href: "/language/structs" },
                        { label: "Enums", href: "/language/enums" },
                        { label: "Arrays, vectors and slices", href: "/language/arrays-and-lists" },
                        { label: "Optionals", href: "/language/optionals" },
                    ],
                },
                {
                    label: "Expressions and flow",
                    items: [
                        { label: "Operators and casts", href: "/language/operators" },
                        { label: "Control flow", href: "/language/control-flow" },
                        { label: "Pattern matching", href: "/language/pattern-matching" },
                    ],
                },
                {
                    label: "Memory and interop",
                    items: [
                        { label: "Ownership and borrowing", href: "/language/ownership-and-borrowing" },
                        { label: "Memory annotations", href: "/language/annotations" },
                        { label: "Modules and imports", href: "/language/modules" },
                        { label: "Foreign functions", href: "/language/ffi" },
                        { label: "Generics", href: "/language/generics" },
                        { label: "Traits", href: "/language/traits" },
                        { label: "Closures", href: "/language/closures" },
                        { label: "Error handling", href: "/language/error-handling" },
                        { label: "Concurrency · Experimental", href: "/language/concurrency" },
                    ],
                },
                {
                    label: "Planned language features",
                    items: [
                        { label: "Lifetimes · Coming Soon", href: "/language/lifetimes" },
                        { label: "Macros · Coming Soon", href: "/language/macros" },
                    ],
                },
            ],
        },
        {
            label: "Formal specification",
            items: [
                { label: "Specification status", href: "/specification" },
                { label: "Grammar", href: "/specification/grammar" },
                { label: "Name resolution", href: "/specification/name-resolution" },
                { label: "Type system", href: "/specification/type-system" },
                { label: "Evaluation", href: "/specification/evaluation" },
                { label: "Memory model", href: "/specification/memory-model" },
                { label: "Defined behavior", href: "/specification/behavior" },
                { label: "Conformance", href: "/specification/conformance" },
            ],
        },
        {
            label: "Compiler",
            items: [
                { label: "Architecture", href: "/compiler/overview" },
                { label: "CLI reference", href: "/compiler/cli" },
                { label: "Diagnostics", href: "/compiler/diagnostics" },
                { label: "AIF", href: "/compiler/aif" },
                { label: "Toolchain layout", href: "/compiler/toolchain-layout" },
                { label: "Bootstrapping", href: "/compiler/bootstrap" },
                { label: "Targets and platforms", href: "/compiler/targets" },
            ],
        },
        {
            label: "Standard library",
            items: [
                { label: "Library status", href: "/stdlib" },
                { label: "Console I/O", href: "/stdlib/io" },
                { label: "Standard input", href: "/stdlib/input" },
                { label: "Terminal colors", href: "/stdlib/term" },
                { label: "Strings", href: "/stdlib/strings" },
                { label: "Unicode", href: "/stdlib/unicode" },
                { label: "Math", href: "/stdlib/math" },
                { label: "Vec", href: "/stdlib/vec" },
                { label: "Map", href: "/stdlib/map" },
                { label: "Option and Result", href: "/stdlib/option" },
                { label: "Filesystem", href: "/stdlib/filesystem" },
                { label: "Process and arguments", href: "/stdlib/process" },
                { label: "Time", href: "/stdlib/time" },
                { label: "Platform", href: "/stdlib/platform" },
                {
                    label: "Planned modules",
                    items: [
                        { label: "Networking · Coming Soon", href: "/stdlib/networking" },
                        { label: "Concurrency · Coming Soon", href: "/stdlib/concurrency" },
                    ],
                },
            ],
        },
        {
            label: "Packages",
            items: [{ label: "Package manager · Coming Soon", href: "/package-manager" }],
        },
        {
            label: "Examples and cookbook",
            items: [
                { label: "Verified examples", href: "/examples" },
                { label: "Control flow", href: "/examples/control-flow" },
                { label: "Owned data", href: "/examples/owned-data" },
                { label: "Optional links", href: "/examples/optional-links" },
                { label: "Cookbook", href: "/cookbook" },
                { label: "CLI arguments", href: "/cookbook/cli-arguments" },
                { label: "C FFI wrapper", href: "/cookbook/c-ffi" },
            ],
        },
        {
            label: "Error reference",
            items: [
                { label: "Error index", href: "/errors" },
                {
                    label: "Types and calls",
                    items: [
                        { label: "Type mismatch", href: "/errors/type-mismatch" },
                        { label: "Integer width mismatch", href: "/errors/integer-width-mismatch" },
                        { label: "Wrong argument count", href: "/errors/wrong-arity" },
                        { label: "Duplicate overload", href: "/errors/duplicate-overload" },
                        { label: "Unknown identifier", href: "/errors/unknown-name" },
                    ],
                },
                {
                    label: "Ownership and memory",
                    items: [
                        { label: "Use after move", href: "/errors/use-after-move" },
                        { label: "Move from borrow", href: "/errors/move-from-borrow" },
                        { label: "Move in loop", href: "/errors/move-in-loop" },
                        { label: "Invalid drop", href: "/errors/invalid-drop" },
                        { label: "Container ownership", href: "/errors/container-ownership" },
                        { label: "Optional needs unwrap", href: "/errors/optional-needs-unwrap" },
                        { label: "Return local array", href: "/errors/return-local-array" },
                        { label: "Refuted tier pin", href: "/errors/refuted-pin" },
                        { label: "Region budget exceeded", href: "/errors/region-budget-exceeded" },
                        { label: "Aliased unique parameters", href: "/errors/unique-alias" },
                    ],
                },
                {
                    label: "Syntax and control flow",
                    items: [
                        { label: "Missing return", href: "/errors/missing-return" },
                        { label: "Unreachable code", href: "/errors/unreachable-code" },
                        { label: "Immutable assignment", href: "/errors/immutable-assignment" },
                        { label: "Expected declaration", href: "/errors/unexpected-top-level-token" },
                        { label: "Unclosed block", href: "/errors/unclosed-block" },
                        { label: "Unnamed region", href: "/errors/unnamed-region" },
                        { label: "Multiple diagnostics", href: "/errors/multiple-errors" },
                    ],
                },
            ],
        },
        {
            label: "Project reference",
            items: [
                { label: "Migration guides", href: "/migration" },
                { label: "Releases and versions", href: "/releases" },
                { label: "Prismio 0.1.0", href: "/releases/0.1.0" },
                { label: "Glossary", href: "/glossary" },
                { label: "FAQ", href: "/faq" },
                { label: "Roadmap", href: "/roadmap" },
            ],
        },
    ],
};
