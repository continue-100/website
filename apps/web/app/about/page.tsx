import React from "react";
import Link from "next/link";
import {ArrowRight, ArrowUpRight, BookOpen, Cpu, GitBranch, Layers, Terminal, Zap} from "lucide-react";
import type {LucideIcon} from "lucide-react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@prismio/ui/FooterMain";
import {PRISMIO_VERSION} from "@prismio/utils";

export const metadata = {
    title: "About · Prismio Systems Language",
    description: "What Prismio is, how its compiler places allocations, what works in 0.1, what doesn't yet, and how the project is run.",
};

const VITALS = [
    {label: "Version", value: PRISMIO_VERSION, tone: "text-indigo-300"},
    {label: "Compiler", value: "Self-hosted", tone: "text-emerald-400"},
    {label: "Backend", value: "LLVM 23", tone: "text-zinc-200"},
    {label: "Platforms", value: "Win · macOS · Linux", tone: "text-zinc-200"},
    {label: "License", value: "Apache-2.0", tone: "text-zinc-200"},
];

const TRADEOFFS = [
    {
        tag: "C / C++ Trade-Off",
        title: "Unbounded Memory Risk",
        tone: "text-rose-400",
        copy: "Fast and raw, but fraught with use-after-free, memory leaks, and buffer overflows that continue to represent over 70% of reported high-severity vulnerabilities in systems infrastructure.",
    },
    {
        tag: "Rust Trade-Off",
        title: "Borrow Checker Friction",
        tone: "text-amber-400",
        copy: "Affine types deliver memory safety, but fighting lifetime annotations, tricky borrow-checker rules, and graph/cyclic data architectures imposes steep cognitive fatigue and slows iteration cycles.",
    },
    {
        tag: "GC Languages Trade-Off",
        title: "Unpredictable Tail Latency",
        tone: "text-sky-400",
        copy: "High developer ergonomics, but stop-the-world collectors, runtime cache thrashing, and high memory multipliers make them unsuitable for real-time audio, embedded systems, and hyper-dense server loops.",
    },
];

const FEATURES: {
    icon: LucideIcon;
    title: string;
    copy: string;
}[] = [
    {
        icon: Cpu,
        title: "Adaptive Inference Framework",
        copy: "Experimental. The compiler classifies each allocation site as stack, region, unique, reference-counted, or cycle-aware storage, and enforces moves and borrows for move-only values. You don't annotate lifetimes. To see why a site landed where it did: `prismio aif main.psm --why=1`.",
    },
    {
        icon: Zap,
        title: "Native code through LLVM",
        copy: "The typed AST lowers to LLVM IR and links with the platform toolchain. `-g` emits DWARF debug information, and `--target` cross-compiles.",
    },
    {
        icon: GitBranch,
        title: "Native threads and channels",
        copy: "Spawn and join OS threads and pass values over blocking `Channel<T>`. There is no async runtime in 0.1.",
    },
    {
        icon: Layers,
        title: "Direct C ABI calls",
        copy: "`extern fn` binds straight to C symbols. Prismio doesn't read headers or generate bindings, so you declare each function yourself, and anything with an uncertain layout (a `String`, for example) goes through a small C adapter.",
    },
];

const SUPPORT_TONES = [
    "border-sky-500/20 bg-sky-500/10 text-sky-400",
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    "border-amber-500/20 bg-amber-500/10 text-amber-400",
];

const MISSING = [
    "`async`/`await`",
    "Atomics, mutexes, condition variables, and a specified memory-ordering model",
    "Task cancellation, timeouts, and structured-concurrency scopes",
    "A stable AIF tier contract. The meaning and cost of each tier can still change",
    "Stable diagnostic codes",
    "A formally proven borrow checker",
];

const COMMITMENTS = [
    {
        tone: "bg-emerald-400",
        title: "Apache-2.0",
        copy: "The compiler, standard library, and benchmark suite are all open source.",
    },
    {
        tone: "bg-indigo-400",
        title: "Issue first",
        copy: "Large changes start as a GitHub issue before any code is written.",
    },
    {
        tone: "bg-amber-400",
        title: "Losses get published",
        copy: "Benchmarks compare identical algorithms against C++ and Rust and report medians, including the ones Prismio loses.",
    },
];

const LINKS = [
    {href: "/team", label: "Team", hint: "The people behind it", tone: "group-hover:text-indigo-300"},
    {href: "/community", label: "Community", hint: "Discord, issues, contributing", tone: "group-hover:text-emerald-300"},
    {href: "/roadmap", label: "Roadmap", hint: "What works, what doesn't yet", tone: "group-hover:text-amber-300"},
    {href: "/benchmarks", label: "Benchmarks", hint: "Against C++ and Rust", tone: "group-hover:text-sky-300"},
];

const CARD = "rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/70 backdrop-blur-xl";

export default function AboutPage() {
    return (
        <div className="relative min-h-screen bg-[#070709] text-white selection:bg-indigo-500/30 selection:text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Ambient background */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(ellipse_at_70%_10%,rgba(67,56,202,0.18),transparent_52%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[800px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <HeaderMain />

            <main className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:py-28">
                {/* Hero */}
                <section className="grid items-start gap-12 border-b border-white/[0.08] pb-20 lg:grid-cols-12 lg:gap-16">
                    <div className="lg:col-span-8">
                        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
                            A systems language where the compiler places your memory and{" "}
                            <span className="bg-sky-300 bg-clip-text text-transparent">
                                shows its work.
                            </span>
                        </h1>

                        <p className="mt-8 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
                            Prismio is a statically typed language that compiles to native code through LLVM.
                            Instead of lifetime annotations or a tracing collector, the compiler infers where
                            each allocation should live, and{" "}
                            <code className="font-mono text-[0.9em] text-indigo-300">prismio aif --why</code>{" "}
                            explains every decision it makes.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link
                                href="/install"
                                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
                            >
                                <Terminal size={16} />
                                Install Prismio
                            </Link>
                            <a
                                href="https://docs.prismio.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.06] hover:text-white"
                            >
                                <BookOpen size={16} />
                                Read the docs
                                <ArrowUpRight size={14} className="opacity-60" />
                            </a>
                        </div>
                    </div>

                    <aside className={`${CARD} p-6 lg:col-span-4`}>
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            At a glance
                        </h2>
                        <dl className="mt-6 divide-y divide-white/[0.06] text-sm">
                            {VITALS.map(({label, value, tone}) => (
                                <div key={label} className="flex items-center justify-between gap-4 py-3.5">
                                    <dt className="text-zinc-400">{label}</dt>
                                    <dd className={`font-mono font-medium ${tone}`}>{value}</dd>
                                </div>
                            ))}
                        </dl>
                        <p className="mt-6 rounded-2xl border border-white/[0.06] bg-black/40 p-4 text-xs leading-5 text-zinc-400">
                            <span className="mb-0.5 block font-mono font-semibold text-indigo-400">
                                Self-hosting
                            </span>
                            The frontend and the LLVM backend are written in Prismio. The runtime and the LLVM
                            bridge are C.
                        </p>
                    </aside>
                </section>

                {/* The Systems Dilemma */}
                <section className="border-b border-white/[0.08] py-24">
                    <div className="max-w-3xl">
                        <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">
                            The Systems Dilemma
                        </span>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                            Why the world needed another systems language.
                        </h2>
                        <p className="mt-4 text-base leading-7 text-zinc-400">
                            For decades, systems engineers have been trapped in a triangle of compromises:
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 md:grid-cols-3">
                        {TRADEOFFS.map(({tag, title, tone, copy}) => (
                            <div key={tag} className={`${CARD} p-7`}>
                                <div className={`mb-3 font-mono text-xs uppercase tracking-wider ${tone}`}>
                                    {tag}
                                </div>
                                <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
                                <p className="text-sm leading-6 text-zinc-400">{copy}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 rounded-3xl border border-indigo-500/20 bg-indigo-950/[0.15] p-8 md:p-10">
                        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
                            <div className="max-w-2xl space-y-2">
                                <span className="font-mono text-xs uppercase tracking-widest text-[#47d7b5]">
                                    Prismio&apos;s Synthesis
                                </span>
                                <h3 className="text-xl font-semibold tracking-tight text-white">
                                    Inference replaces annotation bureaucracy.
                                </h3>
                                <p className="text-sm leading-6 text-zinc-300">
                                    Instead of forcing you to annotate every reference lifetime or suffer
                                    garbage collector pauses, Prismio uses compiler-proven escape and ownership
                                    analysis to place data in the cheapest safe tier automatically—and lets you
                                    audit every decision with verifiable manifests.
                                </p>
                            </div>
                            <Link
                                href="/benchmarks"
                                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
                            >
                                Read Benchmarks
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* What works */}
                <section className="border-b border-white/[0.08] py-24">
                    <span className="font-mono text-xs tracking-widest text-indigo-400">
                        IN {PRISMIO_VERSION}
                    </span>
                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                        What it does today.
                    </h2>

                    {/* Lead: AIF */}
                    {(() => {
                        const lead = FEATURES[0];
                        if (!lead) return null;
                        const {icon: Icon, title, copy} = lead;
                        return (
                            <div className="relative mt-12 overflow-hidden rounded-3xl border border-indigo-500/20 bg-indigo-950/[0.15] p-8 md:p-10">
                                <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
                                <div className="relative grid gap-8 lg:grid-cols-12 lg:gap-16">
                                    <div className="lg:col-span-5">
                                        <h3 className="mt-10 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                                            {title}
                                        </h3>
                                    </div>
                                    <p className="text-base leading-8 text-zinc-300 lg:col-span-7">{renderCode(copy)}</p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Supporting three */}
                    <div className={`${CARD} mt-6 grid divide-y divide-white/[0.08] md:grid-cols-3 md:divide-x md:divide-y-0`}>
                        {FEATURES.slice(1).map(({icon: Icon, title, copy}, i) => (
                            <div key={title} className="group p-8 transition-colors duration-300 hover:bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105 ${SUPPORT_TONES[i]}`}>
                                        <Icon size={18} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                                </div>
                                <p className="mt-4 text-sm leading-6 text-zinc-400">{renderCode(copy)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* What doesn't */}
                <section className="border-b border-white/[0.08] py-24">
                    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                        <div className="lg:col-span-4">
                            <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
                                Limits
                            </span>
                            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                                What it doesn&apos;t do yet.
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-zinc-400">
                                {PRISMIO_VERSION} is the first release. If you need any of these, it isn&apos;t ready for you.
                            </p>
                        </div>

                        <ul className={`${CARD} divide-y divide-white/[0.06] lg:col-span-8`}>
                            {MISSING.map((item) => (
                                <li key={item} className="flex gap-3 px-7 py-4 text-sm leading-6 text-zinc-300">
                                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/70" />
                                    <span>{renderCode(item)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* How it's run */}
                <section id="stewardship" className="border-b border-white/[0.08] py-24">
                    <div className={`${CARD} overflow-hidden`}>
                        <div className="grid gap-10 p-8 md:p-10 lg:grid-cols-12 lg:gap-16">
                            <div className="lg:col-span-5">
                                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                                    How it&apos;s run.
                                </h2>
                                <p className="mt-4 text-base leading-7 text-zinc-400">
                                    Prismio is open source and developed in the open. These are the terms the
                                    project runs on.
                                </p>
                            </div>

                            <dl className="divide-y divide-white/[0.08] lg:col-span-7">
                                {COMMITMENTS.map(({tone, title, copy}) => (
                                    <div key={title} className="grid gap-1 py-5 sm:grid-cols-[13rem_1fr] sm:gap-8">
                                        <dt className="flex items-center gap-2.5 text-sm font-semibold text-white">
                                            <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} />
                                            {title}
                                        </dt>
                                        <dd className="text-sm leading-6 text-zinc-400">{copy}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>

                        {/* Where to go next */}
                        <nav
                            aria-label="About the project"
                            className="grid grid-cols-2 divide-x divide-y divide-white/[0.08] border-t border-white/[0.08] lg:grid-cols-4 lg:divide-y-0"
                        >
                            {LINKS.map(({href, label, hint, tone}) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="group flex items-center justify-between gap-3 px-6 py-5 transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40"
                                >
                                    <span>
                                        <span className={`block text-sm font-semibold text-white transition-colors ${tone}`}>
                                            {label}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-zinc-400">{hint}</span>
                                    </span>
                                    <ArrowRight
                                        size={16}
                                        className="shrink-0 text-zinc-500 transition-all group-hover:translate-x-0.5 group-hover:text-white"
                                    />
                                </Link>
                            ))}
                        </nav>
                    </div>
                </section>

                {/* Call to action */}
                <section className="pt-28 text-center">
                    <div className="mx-auto max-w-3xl space-y-6">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Ready to explore the next generation of systems code?
                        </h2>
                        <p className="mx-auto max-w-xl text-base text-zinc-400">
                            Read the complete language guide, test your code in our interactive playground,
                            or install Prismio on your machine in seconds.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                            <Link
                                href="/install"
                                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition-all hover:bg-zinc-200"
                            >
                                <Terminal size={16} />
                                Install Prismio
                            </Link>

                            <a
                                href="https://docs.prismio.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-medium text-white transition-all hover:bg-white/[0.06]"
                            >
                                <BookOpen size={16} />
                                Read Documentation
                                <ArrowUpRight size={14} className="opacity-60" />
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <FooterMain />
        </div>
    );
}

/** Render `backtick` spans as inline code. */
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
