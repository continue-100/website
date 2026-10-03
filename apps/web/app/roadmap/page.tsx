import React from "react";
import Link from "next/link";
import {ArrowRight, ArrowUpRight, Check} from "lucide-react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@prismio/ui/FooterMain";
import {PRISMIO_VERSION} from "@prismio/utils";
import {getBenchmarkDataset} from "@/lib/benchmarks";

export const metadata = {
    title: "Roadmap · Prismio Systems Language",
    description: "What Prismio can do today, what is experimental, and what is not there yet. No dates, no promises.",
};

const CARD = "rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/70 backdrop-blur-xl";

/** When this page was last checked against the feature table in the docs. */
const CHECKED = "30 Sep 2026";

const WORKS_TODAY = [
    {
        title: "A self-hosted compiler for Windows, macOS, and Linux",
        detail: "The lexer, parser, semantic analysis, and LLVM backend are written in Prismio. It builds native executables, cross-compiles with `--target`, and writes debug information with `-g`.",
    },
    {
        title: "A practical language core",
        detail: "Structs, enums, `Option` and `Result`, pattern matching, traits, generics, closures, and `impl` blocks.",
    },
    {
        title: "Collections and text",
        detail: "`Vec`, `Map`, slices, fixed-size arrays, strings, and a `StringBuilder`.",
    },
    {
        title: "A standard library",
        detail: "Twenty importable modules, including files, input, time, math, terminal colours, and process access.",
    },
    {
        title: "Channels between threads",
        detail: "Typed channels with blocking send and receive. Plain data is copied across, not boxed.",
    },
    {
        title: "Projects and C interop",
        detail: "A `build.ums` manifest with build profiles, a lockfile, path dependencies, and native C sources. Functions in C libraries are called directly.",
    },
];

const EXPERIMENTAL = [
    {
        title: "Ownership checks and memory placement",
        detail: "The compiler enforces moves and borrows and decides where each allocation lives, and it can explain why. The rules and their cost model can still change.",
    },
    {
        title: "Tasks",
        detail: "`spawn`, `join`, and `Task<R>` run work on native threads.",
    },
    {
        title: "Data layout views",
        detail: "You can ask for an array-of-structs or struct-of-arrays view of your data.",
    },
];

const NOT_YET = [
    {
        area: "Standard library",
        items: [
            "Networking (sockets)",
            "JSON parsing and writing",
            "Regular expressions",
            "More collections: deque, linked list, sets, sorted map, priority queue",
            "Random numbers",
            "Calendar dates, time zones, and timers",
            "Memory-mapped files",
        ],
    },
    {
        area: "Language",
        items: [
            "`async` and `await`",
            "Atomics, locks, and other synchronization types",
            "`select` over channels, and non-blocking send and receive",
            "Exceptions and the `?` operator",
            "Macros and compile-time code generation",
            "User-written lifetimes",
            "Aliased imports, and `if` and `match` as expressions",
        ],
    },
    {
        area: "Tooling",
        items: [
            "A formatter and a linter",
            "A language server for editors",
            "A package registry with version solving",
            "Importing modules from a dependency by path",
            "C++ sources and library targets in the manifest",
        ],
    },
    {
        area: "Performance and platforms",
        items: [
            "Explicit SIMD vector types",
            "Custom allocators for containers",
            "A work-stealing thread pool",
            "Android and iOS toolchains",
        ],
    },
];

function renderCode(text: string) {
    return text.split("`").map((part, i) =>
        i % 2 === 1 ? (
            <code key={i} className="font-mono text-[0.9em] text-indigo-300">
                {part}
            </code>
        ) : (
            part
        ),
    );
}

export default function RoadmapPage() {
    const {stats} = getBenchmarkDataset();

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#070709] text-white selection:bg-indigo-500/30 selection:text-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(ellipse_at_68%_8%,rgba(67,56,202,0.18),transparent_54%)]"/>

            <HeaderMain/>

            <main className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:py-28">
                {/* Hero */}
                <section className="grid items-start gap-12 border-b border-white/[0.08] pb-20 lg:grid-cols-12 lg:gap-16">
                    <div className="lg:col-span-8">
                        <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
                            What works today, and <br/><span className="text-sky-300">what doesn&apos;t yet.</span>
                        </h1>
                        <p className="mt-8 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
                            Prismio is in active development. This isn&apos;t a release calendar. It lists what the
                            compiler does today, what is experimental, and what is not there yet, with no dates.
                        </p>
                    </div>

                    <aside className={`${CARD} p-6 lg:col-span-4`}>
                        <dl className="divide-y divide-white/[0.06] text-sm">
                            <div className="flex items-center justify-between gap-4 py-3">
                                <dt className="text-zinc-400">Checked</dt>
                                <dd className="font-mono text-zinc-200">{CHECKED}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-4 py-3">
                                <dt className="text-zinc-400">Version</dt>
                                <dd className="font-mono text-indigo-300">{PRISMIO_VERSION}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-4 py-3">
                                <dt className="text-zinc-400">Dates promised</dt>
                                <dd className="font-mono text-zinc-200">None</dd>
                            </div>
                        </dl>
                        <a
                            href="https://docs.prismio.org/roadmap"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            Full feature-by-feature table
                            <ArrowUpRight size={14}/>
                        </a>
                    </aside>
                </section>

                {/* Works today */}
                <section className="border-b border-white/[0.08] py-24" aria-labelledby="works-heading">
                    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                        <div className="lg:col-span-4">
                            <h2 id="works-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                                Works today.
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-zinc-400">
                                These are in {PRISMIO_VERSION} and you can use them now.
                            </p>
                        </div>

                        <ul className={`${CARD} divide-y divide-white/[0.08] lg:col-span-8`}>
                            {WORKS_TODAY.map((item) => (
                                <li key={item.title} className="flex gap-4 px-7 py-5">
                                    <Check size={16} aria-hidden className="mt-1 shrink-0 text-emerald-400"/>
                                    <div>
                                        <h3 className="text-base font-semibold text-white">{item.title}</h3>
                                        <p className="mt-1 text-sm leading-6 text-zinc-400">{renderCode(item.detail)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Experimental */}
                <section className="border-b border-white/[0.08] py-24" aria-labelledby="experimental-heading">
                    <div className="max-w-3xl">
                        <h2 id="experimental-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                            Experimental.
                        </h2>
                        <p className="mt-4 text-base leading-7 text-zinc-400">
                            These work, but they are new. Expect changes and rough edges.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 md:grid-cols-3">
                        {EXPERIMENTAL.map((item) => (
                            <div key={item.title} className={`${CARD} p-7`}>
                                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                                <p className="mt-2 text-sm leading-7 text-zinc-400">{renderCode(item.detail)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Not yet */}
                <section className="border-b border-white/[0.08] py-24" aria-labelledby="notyet-heading">
                    <div className="max-w-3xl">
                        <h2 id="notyet-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                            Not yet.
                        </h2>
                        <p className="mt-4 text-base leading-7 text-zinc-400">
                            Missing is not the same as scheduled. These are not in {PRISMIO_VERSION}, and listing them
                            here is not a promise of when, or in what order, they will arrive.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 md:grid-cols-2">
                        {NOT_YET.map((group) => (
                            <div key={group.area} className={`${CARD} p-8`}>
                                <h3 className="text-lg font-semibold text-white">{group.area}</h3>
                                <ul className="mt-5 space-y-3">
                                    {group.items.map((item) => (
                                        <li key={item} className="flex gap-3 text-sm leading-6 text-zinc-300">
                                            <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-zinc-500"/>
                                            <span>{renderCode(item)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <p className="mt-8 text-sm leading-7 text-zinc-400">
                        The benchmark suite shows the same gaps from the other side: {stats.unsupported} workloads
                        are marked unsupported instead of being faked.{" "}
                        <Link
                            href="/benchmarks"
                            className="inline-flex items-center gap-1 font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                        >
                            See the benchmark coverage
                            <ArrowRight size={14}/>
                        </Link>
                    </p>
                </section>

                {/* Blocked */}
                <section className="pt-24" aria-labelledby="blocked-heading">
                    <div className={`${CARD} grid gap-6 border-rose-500/20 p-8 md:grid-cols-12 md:gap-10 md:p-10`}>
                        <div className="md:col-span-4">
                            <p className="font-mono text-xs uppercase tracking-[0.14em] text-rose-300">Blocked</p>
                            <h2 id="blocked-heading" className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-white">
                                WebAssembly
                            </h2>
                        </div>
                        <p className="text-sm leading-7 text-zinc-400 md:col-span-8">
                            Prismio can emit WebAssembly code, but there is no C library for the WebAssembly target to
                            build the runtime against, so a working build can&apos;t be produced from this repository
                            yet. It is blocked, not in progress. Cross-compiling to other targets works.
                        </p>
                    </div>

                    <p className="mt-10 text-sm text-zinc-400">
                        Want to help with any of this?{" "}
                        <Link
                            href="/community"
                            className="inline-flex items-center gap-1 font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                        >
                            Start at the community page
                            <ArrowRight size={14}/>
                        </Link>
                    </p>
                </section>
            </main>

            <FooterMain/>
        </div>
    );
}
