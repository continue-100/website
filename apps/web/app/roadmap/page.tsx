import React from "react";
import Link from "next/link";
import {
    ArrowRight,
    Check,
    CircleDot,
    GitBranch,
    ShieldCheck,
} from "lucide-react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@prismio/ui/FooterMain";

const SHIPPED = [
    {
        title: "A self-hosted compiler",
        detail: "The lexer, parser, AST, import resolver, semantic analysis, and LLVM IR generator are written in Prismio.",
    },
    {
        title: "Native code through LLVM 23",
        detail: "Prismio lowers to LLVM IR, then links a native executable through the platform toolchain.",
    },
    {
        title: "Explainable allocation inference",
        detail: "AIF assigns storage tiers, exposes a source-oriented plan, and can explain a numbered decision or verify it at runtime.",
    },
    {
        title: "A usable systems-language core",
        detail: "Types, generics, traits, closures, pattern matching, native tasks, typed channels, UMS projects, C ABI interop, JSON diagnostics, and DWARF are in the shipped surface.",
    },
];

const NEXT = [
    {
        id: "MEM-001",
        title: "Measure allocation and lifetime behavior end-to-end",
        detail: "Extend the verifier and benchmark pipeline with stable allocation-site IDs, byte and lifetime metrics, peak-live data, and unified JSON. This is observability work; it makes no speedup promise.",
        signal: "Foundational",
    },
    {
        id: "MEM-002",
        title: "Make region and cycle state safe under native tasks",
        detail: "Move ambient allocator and cycle-collection state toward a design that is safe to use from concurrent native threads, then establish stress coverage before chasing throughput.",
        signal: "Correctness first",
    },
    {
        id: "MEM-003",
        title: "Price layout choices in their container context",
        detail: "A layout split that looks cheaper per object can lose badly when it breaks flat storage. The next model needs to account for construction, locality, vectorization, and release work together.",
        signal: "Measured regression guard",
    },
    {
        id: "MEM-004",
        title: "Preserve ownership decisions in a memory-aware IR",
        detail: "Moves, borrows, drops, regions, reuse, and representation choices are currently known to AIF but are not first-class operations between semantic analysis and LLVM lowering.",
        signal: "Architectural",
    },
    {
        id: "MEM-005",
        title: "Carry ownership and region facts across calls",
        detail: "Function summaries can make escape, return provenance, and memory effects visible across boundaries instead of forcing conservative decisions at each call site.",
        signal: "Precision",
    },
];

const GAPS = [
    {
        title: "Library surface",
        detail: "Linked/deque containers, ordered maps and sets, priority queues, regex, JSON, and generic serialization are not implemented in the standard surface.",
    },
    {
        title: "Concurrency surface",
        detail: "User-facing atomics, locks, work-stealing pools, and async I/O are not implemented. Prismio currently uses native OS threads and blocking typed channels.",
    },
    {
        title: "Platform surface",
        detail: "Sockets, memory-mapped files, explicit SIMD types, and user-provided collection allocators are also outside the current supported catalog.",
    },
];

export default function RoadmapPage() {
    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#070709] text-white selection:bg-indigo-500/30 selection:text-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[44rem] bg-[radial-gradient(ellipse_at_68%_8%,rgba(67,56,202,0.18),transparent_54%)]"/>

            <HeaderMain/>

            <main className="relative z-10 mx-auto max-w-7xl px-6 pb-28 pt-16 md:pt-24">
                <section className="grid gap-10 border-b border-white/[0.09] pb-16 lg:grid-cols-12 lg:gap-16">
                    <div className="lg:col-span-8">
                        <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-white md:text-6xl">
                            A roadmap that separates what works from what must be proved next.
                        </h1>
                        <p className="mt-7 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg md:leading-8">
                            Prismio is in active development. This is not a release calendar: it is the
                            engineering direction behind the compiler, with the current implementation
                            kept distinct from measured problems, proposed work, and unsupported surface area.
                        </p>
                    </div>

                    <aside className="self-end border-l border-white/[0.1] pl-5 lg:col-span-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                            <CircleDot size={15} className="text-indigo-300"/>
                            Current state
                        </div>
                        <p className="mt-3 text-sm leading-6 text-zinc-400">
                            The compiler self-hosts, emits native binaries, and has an AIF-1 conformance level.
                            Dates and version numbers are intentionally omitted until they can be kept as commitments.
                        </p>
                    </aside>
                </section>

                <section className="py-20" aria-labelledby="shipped-heading">
                    <div className="grid gap-8 md:grid-cols-12 md:gap-16">
                        <div className="md:col-span-4">
                            <h2 id="shipped-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white">
                                Established in the current compiler.
                            </h2>
                            <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
                                These are present capabilities, not roadmap aspirations.
                            </p>
                        </div>
                        <div className="divide-y divide-white/[0.08] md:col-span-8">
                            {SHIPPED.map((item) => (
                                <article key={item.title} className="grid gap-4 py-6 first:pt-0 sm:grid-cols-[1.15rem_1fr]">
                                    <Check size={16} className="mt-1 text-emerald-300"/>
                                    <div>
                                        <h3 className="font-medium text-zinc-100">{item.title}</h3>
                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{item.detail}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-t border-white/[0.09] py-20" aria-labelledby="next-heading">
                    <div className="max-w-3xl">
                        <h2 id="next-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                            The next work starts with evidence, not feature theater.
                        </h2>
                        <p className="mt-5 text-base leading-7 text-zinc-400">
                            The active memory optimization tracker identifies these as high-leverage directions.
                            Each is an engineering hypothesis with its own measurement requirement, not a promised performance number.
                        </p>
                    </div>

                    <div className="mt-12 border-t border-white/[0.08]">
                        {NEXT.map((item) => (
                            <article key={item.id} className="grid gap-5 border-b border-white/[0.08] py-8 md:grid-cols-12 md:gap-10">
                                <div className="font-mono text-xs text-indigo-300 md:col-span-2">{item.id}</div>
                                <div className="md:col-span-6">
                                    <h3 className="text-lg font-medium tracking-[-0.015em] text-zinc-100">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-zinc-400">{item.detail}</p>
                                </div>
                                <div className="self-start text-sm text-zinc-500 md:col-span-4 md:text-right">{item.signal}</div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="grid gap-10 border-t border-white/[0.09] py-20 lg:grid-cols-12 lg:gap-16" aria-labelledby="gaps-heading">
                    <div className="lg:col-span-4">
                        <h2 id="gaps-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white">
                            Missing is not the same as scheduled.
                        </h2>
                        <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
                            The benchmark suite marks 16 workloads unsupported rather than supplying stand-ins.
                            Their missing capabilities are visible here without pretending every one has a release date.
                        </p>
                        <Link
                            href="/benchmarks"
                            className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-indigo-300 transition-colors hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            Read the benchmark coverage
                            <ArrowRight size={15}/>
                        </Link>
                    </div>
                    <div className="divide-y divide-white/[0.08] lg:col-span-8">
                        {GAPS.map((item) => (
                            <article key={item.title} className="py-6 first:pt-0">
                                <h3 className="font-medium text-zinc-200">{item.title}</h3>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{item.detail}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="border-t border-white/[0.09] py-16">
                    <div className="grid gap-8 rounded-2xl bg-[#0b0c10] p-7 ring-1 ring-white/[0.08] md:grid-cols-[1fr_auto] md:items-center md:p-10">
                        <div>
                            <div className="flex items-center gap-2 text-zinc-200">
                                <GitBranch size={17} className="text-indigo-300"/>
                                <h2 className="text-xl font-semibold tracking-[-0.02em]">Follow the work where it happens.</h2>
                            </div>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                                Architecture notes, source changes, benchmark evidence, issues, and discussions are open.
                                Contributions are most useful when they include a reproducible case or a clear design question.
                            </p>
                        </div>
                        <a
                            href="https://github.com/prismio-lang/prismio/discussions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            <ShieldCheck size={16}/>
                            Join the discussion
                        </a>
                    </div>
                </section>
            </main>

            <FooterMain/>
        </div>
    );
}
