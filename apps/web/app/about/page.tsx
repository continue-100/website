import React from "react";
import Link from "next/link";
import {
    ArrowRight,
    ArrowUpRight,
    Cpu,
    GitBranch,
    Layers,
    Sparkles,
    Terminal,
    Users,
    Zap,
    Code2,
    BookOpen,
    ShieldCheck,
} from "lucide-react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@prismio/ui/FooterMain";
import {PRISMIO_VERSION} from "@prismio/utils";

export const metadata = {
    title: "About · Prismio Systems Language",
    description: "The story, architectural vision, and engineering philosophy behind Prismio: human-explainable inference, native LLVM compilation, and zero-cost systems abstractions.",
};

const PILLARS = [
    {
        icon: Cpu,
        title: "Adaptive Inference Framework (AIF)",
        subtitle: "Deterministic storage without lifetime bureaucracy",
        description:
            "Instead of forcing developers to fight borrow checkers or submit to garbage collection pauses, AIF proves escape behavior and lifetimes at compile time. It assigns objects into graded tiers (T0 Stack through T4 Thread-Transfer) and outputs a verifiable, diffable storage manifest.",
        badge: "Core Innovation",
    },
    {
        icon: Zap,
        title: "LLVM 23 Native Backend",
        subtitle: "Zero intermediate runtimes, pure native code",
        description:
            "Prismio compiles directly to optimized LLVM IR and links native binaries using platform toolchains. Full DWARF debug symbol parity allows stepping through Prismio code in GDB and LLDB with exact source line mappings.",
        badge: "Performance",
    },
    {
        icon: GitBranch,
        title: "Ownership-Aware Concurrency",
        subtitle: "Native OS threads without colored functions",
        description:
            "Spawn and join work on native OS threads with typed blocking Channel<T> primitives. There is no async runtime, no futures executor, and no viral function coloring—concurrency remains structured, explicit, and lightweight.",
        badge: "Architecture",
    },
    {
        icon: Layers,
        title: "Zero-Overhead C ABI Interoperability",
        subtitle: "Direct integration with the systems ecosystem",
        description:
            "Call C functions and pass C structs directly without marshalling shims, wrapper glue, or runtime conversions. Prismio code links seamlessly against POSIX, libc, OpenGL, Vulkan, and existing C/C++ libraries.",
        badge: "Compatibility",
    },
];

const PRINCIPLES = [
    {
        num: "01",
        title: "Inference is not a black box",
        copy: "When compiler decisions impact latency and memory footprints, those decisions must be transparent. With `prismio aif --why=N`, the compiler explains the exact provenance and reasoning behind every allocation placement.",
    },
    {
        num: "02",
        title: "Density with an on-ramp",
        copy: "We value high-density engineering and complete technical rigor. But rigor is useless without clarity: all language modules provide run-ready examples, clear mental models, and failure recovery as first-class documentation.",
    },
    {
        num: "03",
        title: "Measured honesty over hype",
        copy: "Our benchmarks compare identical algorithms across Prismio, C++, and Rust using reported medians. Where standard library features are still in development, we mark them unsupported rather than using misleading stand-ins.",
    },
    {
        num: "04",
        title: "100% Permissive Open Source",
        copy: "Prismio's compiler, runtime shims, standard library, and tooling are released under Apache-2.0. There will never be an enterprise tier, proprietary compiler flag, or closed source standard library component.",
    },
];

const TIMELINE = [
    {
        phase: "2024",
        title: "Grammar & Initial Lexer/Parser",
        detail: "Formalized Prismio's grammar, AST representations, and the first working prototype written to validate language ergonomics.",
        status: "Completed",
    },
    {
        phase: "2025",
        title: "Self-Hosting & AIF Foundation",
        detail: "Bootstrapped the compiler so Prismio compiles its own AST, parser, and semantic analyzer. Formalized AIF storage placement theorems.",
        status: "Completed",
    },
    {
        phase: "Early 2026",
        title: "LLVM 23 Backend & Toolchain",
        detail: "Lowered the typed AST directly into LLVM IR, integrated native linking, built the Unified Manifest System (UMS) and local dependency resolver, and shipped DWARF support.",
        status: "Completed",
    },
    {
        phase: `Current ${PRISMIO_VERSION}`,
        title: "Ecosystem Expansion & Verification",
        detail: "Hardening the standard library, verifying memory invariant shims, publishing reproducible benchmarks, and growing the open-source contributor community.",
        status: "In Progress",
    },
];

export default function AboutPage() {
    return (
        <div className="relative min-h-screen bg-[#070709] text-white selection:bg-indigo-500/30 selection:text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Ambient Background Lights */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(ellipse_at_70%_10%,rgba(67,56,202,0.16),transparent_52%)]" />
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-[800px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <HeaderMain />

            <main className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:py-28">
                {/* ── 1. Hero Section ──────────────────────────────────── */}
                <section className="grid gap-12 border-b border-white/[0.08] pb-20 lg:grid-cols-12 lg:gap-16 items-start">
                    <div className="lg:col-span-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 mb-6">
                            <Sparkles size={13} />
                            <span>The Prismio Mission</span>
                        </div>

                        <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl md:text-6xl leading-[1.05]">
                            Engineering a systems language for the{" "}
                            <span className="bg-gradient-to-r from-indigo-300 via-teal-300 to-sky-300 bg-clip-text text-transparent">
                                post-GC era.
                            </span>
                        </h1>

                        <p className="mt-8 max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">
                            Prismio is a self-hosted, statically typed systems programming language
                            engineered to eliminate the decades-old trade-off between manual memory
                            fragility and non-deterministic garbage collection. By pairing our
                            Adaptive Inference Framework (AIF) with an LLVM 23 native backend,
                            Prismio gives developers high-level static expression with low-level systems control.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link
                                href="/install"
                                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-zinc-200"
                            >
                                <Terminal size={16} />
                                Install Prismio
                            </Link>

                            <Link
                                href="/team"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 transition-all hover:bg-white/[0.06] hover:text-white"
                            >
                                <Users size={16} />
                                Meet the Team
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* Vitals Sidebar */}
                    <aside className="rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/80 p-6 backdrop-blur-xl lg:col-span-4">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                            Language Vitals
                        </h2>

                        <dl className="mt-6 space-y-4 text-sm divide-y divide-white/[0.06]">
                            <div className="flex items-center justify-between pt-3 first:pt-0">
                                <dt className="text-zinc-400">Compiler Status</dt>
                                <dd className="font-mono text-emerald-400 font-medium">Self-Hosted</dd>
                            </div>
                            <div className="flex items-center justify-between pt-3">
                                <dt className="text-zinc-400">Memory Engine</dt>
                                <dd className="font-mono text-indigo-300 font-medium">AIF-1 Verified</dd>
                            </div>
                            <div className="flex items-center justify-between pt-3">
                                <dt className="text-zinc-400">Codegen Backend</dt>
                                <dd className="font-mono text-zinc-200 font-medium">LLVM 23 Native</dd>
                            </div>
                            <div className="flex items-center justify-between pt-3">
                                <dt className="text-zinc-400">Runtime Latency</dt>
                                <dd className="font-mono text-emerald-400 font-medium">0ms GC Pause</dd>
                            </div>
                            <div className="flex items-center justify-between pt-3">
                                <dt className="text-zinc-400">C Interoperability</dt>
                                <dd className="font-mono text-zinc-200 font-medium">Direct C ABI</dd>
                            </div>
                            <div className="flex items-center justify-between pt-3">
                                <dt className="text-zinc-400">License</dt>
                                <dd className="font-mono text-zinc-200 font-medium">Apache-2.0</dd>
                            </div>
                        </dl>

                        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-black/40 p-4 text-xs text-zinc-400">
                            <span className="font-mono text-indigo-400 font-semibold block mb-1">
                                Self-Hosting Milestone
                            </span>
                            The parser, lexer, AST, semantic analyzer, and LLVM emission pipeline are written in Prismio itself.
                        </div>
                    </aside>
                </section>

                {/* ── 2. The Problem We're Solving ─────────────────────── */}
                <section className="py-24 border-b border-white/[0.08]">
                    <div className="max-w-3xl">
                        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                            The Systems Dilemma
                        </span>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                            Why the world needed another systems language.
                        </h2>
                        <p className="mt-5 text-base leading-7 text-zinc-400">
                            For decades, systems engineers have been trapped in a triangle of compromises:
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 md:grid-cols-3">
                        <div className="rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/60 p-7 backdrop-blur-xl">
                            <div className="text-rose-400 font-mono text-xs uppercase tracking-wider mb-3">
                                C / C++ Trade-Off
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Unbounded Memory Risk</h3>
                            <p className="text-sm leading-6 text-zinc-400">
                                Fast and raw, but fraught with use-after-free, memory leaks, and buffer
                                overflows that continue to represent over 70% of reported high-severity
                                vulnerabilities in systems infrastructure.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/60 p-7 backdrop-blur-xl">
                            <div className="text-amber-400 font-mono text-xs uppercase tracking-wider mb-3">
                                Rust Trade-Off
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Borrow Checker Friction</h3>
                            <p className="text-sm leading-6 text-zinc-400">
                                Affine types deliver memory safety, but fighting lifetime annotations,
                                tricky borrow-checker rules, and graph/cyclic data architectures imposes
                                steep cognitive fatigue and slows iteration cycles.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/60 p-7 backdrop-blur-xl">
                            <div className="text-sky-400 font-mono text-xs uppercase tracking-wider mb-3">
                                GC Languages Trade-Off
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Unpredictable Tail Latency</h3>
                            <p className="text-sm leading-6 text-zinc-400">
                                High developer ergonomics, but stop-the-world collectors, runtime
                                cache thrashing, and high memory multipliers make them unsuitable for
                                real-time audio, embedded systems, and hyper-dense server loops.
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 rounded-3xl border border-indigo-500/20 bg-indigo-950/[0.15] p-8 md:p-10">
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                            <div className="space-y-2 max-w-2xl">
                                <span className="text-xs font-mono uppercase tracking-widest text-[#47d7b5]">
                                    Prismio's Synthesis
                                </span>
                                <h3 className="text-2xl font-semibold text-white tracking-tight">
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
                                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors shrink-0"
                            >
                                Read Benchmarks
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── 3. Architectural Pillars ─────────────────────────── */}
                <section className="py-24 border-b border-white/[0.08]">
                    <div className="max-w-3xl">
                        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                            Foundations
                        </span>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                            The four architectural pillars.
                        </h2>
                        <p className="mt-4 text-base leading-7 text-zinc-400">
                            Prismio was built from day one as a production-grade compiler with sound theoretical
                            underpinnings and native execution.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 md:grid-cols-2">
                        {PILLARS.map(({icon: Icon, title, subtitle, description, badge}) => (
                            <div
                                key={title}
                                className="group relative rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/80 p-8 backdrop-blur-2xl transition-all duration-300 hover:border-white/20 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                                            <Icon size={22} />
                                        </div>
                                        <span className="rounded-full bg-white/[0.06] px-3 py-1 font-mono text-[11px] text-zinc-300 border border-white/[0.08]">
                                            {badge}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-semibold text-white group-hover:text-indigo-200 transition-colors">
                                        {title}
                                    </h3>
                                    <p className="mt-1 text-xs font-mono text-[#47d7b5]">{subtitle}</p>

                                    <p className="mt-4 text-sm leading-6 text-zinc-400">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── 4. Guiding Principles ────────────────────────────── */}
                <section className="py-24 border-b border-white/[0.08]">
                    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                        <div className="lg:col-span-4">
                            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                                Engineering Values
                            </span>
                            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                                How we think, design, and ship.
                            </h2>
                            <p className="mt-5 text-base leading-7 text-zinc-400">
                                Language design is as much about discipline and taste as it is about type theory.
                                These tenets govern every PR and RFC in Prismio.
                            </p>
                        </div>

                        <div className="space-y-6 lg:col-span-8">
                            {PRINCIPLES.map(({num, title, copy}) => (
                                <div
                                    key={num}
                                    className="grid gap-4 rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/60 p-7 sm:grid-cols-[4rem_1fr] backdrop-blur-xl"
                                >
                                    <span className="font-mono text-2xl font-bold text-indigo-400/60">
                                        {num}
                                    </span>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{title}</h3>
                                        <p className="mt-2 text-sm leading-6 text-zinc-400">{copy}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 5. Project Milestones & Evolution ────────────────── */}
                <section className="py-24 border-b border-white/[0.08]">
                    <div className="max-w-3xl">
                        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                            Evolution
                        </span>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                            From concept to a self-hosted toolchain.
                        </h2>
                        <p className="mt-4 text-base leading-7 text-zinc-400">
                            A track record of shipping compiler milestones without artificial hype.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {TIMELINE.map(({phase, title, detail, status}) => (
                            <div
                                key={phase}
                                className="rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/70 p-6 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-mono text-sm font-semibold text-indigo-300">
                                            {phase}
                                        </span>
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono border ${
                                                status === "Completed"
                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                            }`}
                                        >
                                            {status}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-semibold text-white">{title}</h3>
                                    <p className="mt-2 text-xs leading-5 text-zinc-400">{detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <Link
                            href="/roadmap"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            <span>View our full interactive roadmap</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </section>

                {/* ── 6. Project Origins & Stewardship ───────────────── */}
                <section id="stewardship" className="py-24 border-b border-white/[0.08]">
                    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
                        <div className="lg:col-span-5 space-y-4">
                            <span className="text-xs font-mono uppercase tracking-widest text-[#47d7b5]">
                                Project Origins &amp; Stewardship
                            </span>
                            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                                Engineered independently, stewarded openly.
                            </h2>
                            <p className="text-base leading-7 text-zinc-400">
                                Prismio was conceived and architected by Saksham Jaiswal to eliminate the long-standing compromises of manual memory hazards and garbage collection latency.
                            </p>
                            <p className="text-sm leading-6 text-zinc-500">
                                Today, the compiler toolchain, standard library, and differential benchmark suite are developed openly with an international community of systems programmers.
                            </p>

                            <div className="pt-2 flex flex-wrap items-center gap-3">
                                <Link
                                    href="/team"
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black hover:bg-zinc-200 transition-all"
                                >
                                    <Users size={16} />
                                    <span>Meet the Team &amp; Creator</span>
                                    <ArrowRight size={14} />
                                </Link>

                                <Link
                                    href="/community"
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all"
                                >
                                    <span>Community Hub</span>
                                    <ArrowUpRight size={14} className="opacity-60" />
                                </Link>
                            </div>
                        </div>

                        {/* Stewardship Commitments Grid */}
                        <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e]/80 p-6 space-y-2.5">
                                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                                    <ShieldCheck size={16} className="text-emerald-400" />
                                    <span>100% Permissive Open Source</span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    All source code, compiler passes, and standard library modules are released under the Apache License 2.0. There are no enterprise tiers or proprietary flags.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e]/80 p-6 space-y-2.5">
                                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                                    <GitBranch size={16} className="text-indigo-400" />
                                    <span>RFC-Driven Evolution</span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Every syntax change, type system extension, and stdlib addition passes through public Request for Comments (RFC) proposals reviewed in the open.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e]/80 p-6 space-y-2.5">
                                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                                    <Cpu size={16} className="text-amber-400" />
                                    <span>Zero Corporate Capture</span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Prismio is independently steered. Technical decisions are governed strictly by correctness, memory safety theorems, and bare-metal benchmark evidence.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e]/80 p-6 space-y-2.5">
                                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                                    <Code2 size={16} className="text-sky-400" />
                                    <span>Author&apos;s Technical Note</span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Read Saksham&apos;s personal essay detailing the early compiler milestones and the mathematical formulation of AIF.
                                </p>
                                <div className="pt-1">
                                    <Link
                                        href="/team/saksham-jaiswal"
                                        className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        <span>Read Saksham&apos;s Journey</span>
                                        <ArrowRight size={11} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 7. Call To Action ────────────────────────────────── */}
                <section className="py-24 text-center">
                    <div className="mx-auto max-w-3xl space-y-6">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Ready to explore the next generation of systems code?
                        </h2>
                        <p className="text-base text-zinc-400 max-w-xl mx-auto">
                            Read the complete language guide, test your code in our interactive playground,
                            or install Prismio on your machine in seconds.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                            <Link
                                href="/install"
                                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-all"
                            >
                                <Terminal size={16} />
                                Install Prismio
                            </Link>

                            <a
                                href="https://docs.prismio.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-medium text-white hover:bg-white/[0.06] transition-all"
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
