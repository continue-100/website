import React from "react";
import Link from "next/link";
import {
    ArrowRight,
    ArrowUpRight,
    Code2,
    Cpu,
    GitBranch,
    GitPullRequest,
    Heart,
    Layers,
    Mail,
    MessageSquare,
    Shield,
    Sparkles,
    Terminal,
    Users,
    Zap,
    ExternalLink,
    FileCode,
    CheckCircle2,
} from "lucide-react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@prismio/ui/FooterMain";

export const metadata = {
    title: "Team & Community · Prismio Systems Language",
    description: "Meet the engineers, compiler architects, working groups, and open-source contributors building Prismio's toolchain and ecosystem.",
};

const WORKING_GROUPS = [
    {
        title: "Compiler Frontend & Semantics",
        icon: Code2,
        lead: "Saksham Jaiswal",
        description:
            "Responsible for the lexer, parser, AST representations, trait solver, monomorphization, and human-friendly diagnostic reporting with precise source spans.",
        badge: "Core Toolchain",
    },
    {
        title: "Memory Systems & AIF Research",
        icon: Cpu,
        lead: "Compiler Core",
        description:
            "Formalizes escape analysis, placement graph theorems, storage tier classifications (T0–T4), and automated verifier shims for runtime allocation safety.",
        badge: "Research & Verification",
    },
    {
        title: "LLVM Backend & Code Generation",
        icon: Zap,
        lead: "Toolchain WG",
        description:
            "Lowers typed AST structures to LLVM 23 IR, optimizes register allocations, emits platform DWARF debug symbols, and integrates platform linkers.",
        badge: "Performance & Codegen",
    },
    {
        title: "Standard Library & Runtimes",
        icon: Layers,
        lead: "Ecosystem WG",
        description:
            "Develops pure, explicit standard library modules (I/O, collections, algorithms), native OS thread spawning, and typed Channel<T> message primitives.",
        badge: "Standard Library",
    },
    {
        title: "Tooling, Registry & DevEx",
        icon: Terminal,
        lead: "Platform WG",
        description:
            "Builds developer-facing infrastructure including the packages registry (packages.prismio.org), language server protocol (LSP), and the `prismio` CLI.",
        badge: "Developer Tools",
    },
    {
        title: "Benchmarking & CI Infrastructure",
        icon: GitBranch,
        lead: "Quality & CI WG",
        description:
            "Maintains bare-metal test runners, reproducible benchmarks against Clang++ and Rust (rustc), regression tracking, and multi-architecture verification (x86_64, AArch64).",
        badge: "Infrastructure",
    },
];

const CONTRIBUTOR_ROLES = [
    {
        title: "Compiler Engineers",
        icon: Cpu,
        description:
            "Contributing parser fixes, semantic checks, optimization passes, and backend lowerings to the self-hosted codebase.",
    },
    {
        title: "Package Authors",
        icon: Layers,
        description:
            "Publishing high-performance mathematical libraries, graphics pipelines, network drivers, and data utilities to the package registry.",
    },
    {
        title: "Benchmark & QA Testers",
        icon: GitPullRequest,
        description:
            "Running adversarial workloads, stress-testing native task concurrency, and submitting reproducible bug cases.",
    },
    {
        title: "Documentation & RFC Writers",
        icon: FileCode,
        description:
            "Refining tutorials, expanding cookbooks, translating docs, and submitting rigorous language RFC proposals.",
    },
];

const GOVERNANCE_STEPS = [
    {
        step: "01",
        title: "Public RFC Proposal",
        description: "Anyone can propose syntax enhancements, stdlib modules, or toolchain flags via GitHub RFC discussions.",
    },
    {
        step: "02",
        title: "Technical Peer Review",
        description: "Proposals are evaluated purely on memory safety, zero-cost guarantees, and developer ergonomics without corporate vetoes.",
    },
    {
        step: "03",
        title: "Reference Implementation",
        description: "Authors or maintainers draft compiler test cases, DWARF symbol checks, and memory verifier validations.",
    },
    {
        step: "04",
        title: "Benchmark Validation",
        description: "Before merging, changes are benchmarked against canonical workloads to guarantee zero accidental performance regressions.",
    },
];

export default function TeamPage() {
    return (
        <div className="relative min-h-screen bg-[#070709] text-white selection:bg-indigo-500/30 selection:text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Background Ambient Effects */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(ellipse_at_70%_10%,rgba(67,56,202,0.16),transparent_52%)]" />
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-[800px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <HeaderMain />

            <main className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:py-28">
                {/* ── 1. Hero ──────────────────────────────────────────── */}
                <section className="border-b border-white/[0.08] pb-20">
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 mb-6">
                        <Users size={13} />
                        <span>The People Behind Prismio</span>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-12 lg:gap-16 items-end">
                        <div className="lg:col-span-8">
                            <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl md:text-6xl leading-[1.05]">
                                The architects, researchers, and{" "}
                                <span className="bg-gradient-to-r from-indigo-300 via-teal-300 to-sky-300 bg-clip-text text-transparent">
                                    builders of Prismio.
                                </span>
                            </h1>

                            <p className="mt-8 max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">
                                Prismio is engineered openly with independent stewardship, rigorous
                                peer-reviewed RFCs, and an active international community. Discover the
                                people driving compiler research, toolchain engineering, and ecosystem growth.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 lg:col-span-4 lg:justify-end">
                            <a
                                href="https://discord.gg/RUXJjnJF"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5865F2] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4752c4] transition-all shadow-lg shadow-[#5865F2]/20"
                            >
                                <MessageSquare size={16} />
                                Join Discord
                            </a>

                            <a
                                href="https://github.com/prismio-lang/prismio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white hover:bg-white/[0.06] transition-all"
                            >
                                <Code2 size={16} />
                                GitHub
                                <ArrowUpRight size={13} className="opacity-60" />
                            </a>
                        </div>
                    </div>
                </section>

                {/* ── 2. Project Creator & Lead Architect ──────────────── */}
                <section className="py-24 border-b border-white/[0.08]">
                    <div className="max-w-3xl mb-12">
                        <span className="text-xs font-mono uppercase tracking-widest text-[#47d7b5]">
                            Lead Maintainer
                        </span>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                            Creator & Lead Compiler Architect
                        </h2>
                        <p className="mt-4 text-base text-zinc-400">
                            Driving the technical vision, language grammar, and core compiler implementations.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-white/[0.1] bg-[#0c0c0e]/90 p-8 md:p-12 backdrop-blur-2xl">
                        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16 items-start">
                            <div className="lg:col-span-7 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-3xl font-bold text-white tracking-tight">
                                            Saksham Jaiswal
                                        </h3>
                                        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-mono text-indigo-300 border border-indigo-500/20">
                                            Creator & Maintainer
                                        </span>
                                    </div>
                                    <p className="text-sm font-mono text-zinc-400">
                                        Compiler Frontend · Adaptive Inference Framework · LLVM Lowering
                                    </p>
                                </div>

                                <div className="space-y-4 text-sm leading-7 text-zinc-300">
                                    <p>
                                        Saksham designed and bootstrapped Prismio from the ground up to solve
                                        the systemic tension in modern software: developer velocity vs. deterministic
                                        systems latency. He is the author of the Prismio self-hosted compiler, the
                                        Adaptive Inference Framework (AIF), and the LLVM 23 code generator.
                                    </p>
                                    <p>
                                        His research centers on compiler-directed memory placement, escape analysis
                                        solvers, and transparent systems boundaries where developers retain complete
                                        control over binary layout without runtime garbage collection penalties.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    <span className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs text-zinc-300 font-mono">
                                        Self-Hosting Compiler
                                    </span>
                                    <span className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs text-zinc-300 font-mono">
                                        AIF Placement Theorems
                                    </span>
                                    <span className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs text-zinc-300 font-mono">
                                        LLVM IR Lowering
                                    </span>
                                    <span className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs text-zinc-300 font-mono">
                                        C ABI Interop
                                    </span>
                                </div>

                                <div className="pt-2">
                                    <Link
                                        href="/team/saksham-jaiswal"
                                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 hover:opacity-95 transition-all"
                                    >
                                        <Sparkles size={14} />
                                        <span>Read Personal Note & Journey from Saksham</span>
                                        <ArrowRight size={13} />
                                    </Link>
                                </div>
                            </div>

                            <div className="lg:col-span-5 flex flex-col justify-between h-full rounded-2xl border border-white/[0.08] bg-black/40 p-6 space-y-6">
                                <div>
                                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 block mb-4">
                                        Contact & Channels
                                    </span>

                                    <div className="space-y-3 text-sm">
                                        <a
                                            href="https://github.com/prismio-lang"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.04] text-zinc-200 hover:text-white transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Code2 size={16} className="text-indigo-400" />
                                                <span>GitHub Profile</span>
                                            </div>
                                            <ArrowUpRight size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
                                        </a>

                                        <a
                                            href="https://saksham1319.vercel.app"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.04] text-zinc-200 hover:text-white transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Sparkles size={16} className="text-teal-400" />
                                                <span>Personal Portfolio</span>
                                            </div>
                                            <ArrowUpRight size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
                                        </a>

                                        <a
                                            href="mailto:saksham6975@gmail.com"
                                            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.04] text-zinc-200 hover:text-white transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Mail size={16} className="text-sky-400" />
                                                <span>saksham6975@gmail.com</span>
                                            </div>
                                            <ArrowUpRight size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
                                        </a>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/[0.2] p-4 text-xs text-indigo-200">
                                    <span className="font-semibold block mb-1 text-white">Stewardship Commitment</span>
                                    All source code and documentation will remain open-source forever under Apache-2.0.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 3. Compiler Working Groups ───────────────────────── */}
                <section className="py-24 border-b border-white/[0.08]">
                    <div className="max-w-3xl mb-12">
                        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                            Research & Architecture
                        </span>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                            Compiler Working Groups
                        </h2>
                        <p className="mt-4 text-base text-zinc-400">
                            Development is divided into focused research and engineering domains to maintain
                            high cohesion and rigorous verification standards.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {WORKING_GROUPS.map(({title, icon: Icon, lead, description, badge}) => (
                            <div
                                key={title}
                                className="group rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/80 p-7 backdrop-blur-xl hover:border-white/20 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                                            <Icon size={20} />
                                        </div>
                                        <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-white/[0.06]">
                                            {badge}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-semibold text-white group-hover:text-indigo-200 transition-colors">
                                        {title}
                                    </h3>
                                    <span className="text-xs font-mono text-[#47d7b5] block mt-1">
                                        Focus: {lead}
                                    </span>

                                    <p className="mt-4 text-sm leading-6 text-zinc-400">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── 4. Open-Source Contributors ──────────────────────── */}
                <section className="py-24 border-b border-white/[0.08]">
                    <div className="max-w-3xl mb-12">
                        <span className="text-xs font-mono uppercase tracking-widest text-[#47d7b5]">
                            Community Ecosystem
                        </span>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                            Powered by global contributors.
                        </h2>
                        <p className="mt-4 text-base text-zinc-400">
                            Prismio grows with every bug report, optimization pass, benchmark harness, and
                            community discussion. We welcome contributors at all levels.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {CONTRIBUTOR_ROLES.map(({title, icon: Icon, description}) => (
                            <div
                                key={title}
                                className="rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/60 p-6 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-zinc-200 border border-white/[0.08] mb-4">
                                        <Icon size={18} />
                                    </div>
                                    <h3 className="text-base font-semibold text-white">{title}</h3>
                                    <p className="mt-2 text-xs leading-5 text-zinc-400">{description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 rounded-3xl border border-white/[0.08] bg-black/40 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 text-center md:text-left">
                            <h4 className="text-lg font-semibold text-white">
                                Want to join the contributors list?
                            </h4>
                            <p className="text-sm text-zinc-400 max-w-xl">
                                We curate issues tagged <span className="font-mono text-indigo-300">good-first-issue</span> to
                                help new contributors write their first compiler pass or stdlib function.
                            </p>
                        </div>

                        <a
                            href="https://github.com/prismio-lang/prismio/issues?q=is%3Aissue+is%3Aopen+label%3Agood-first-issue"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors shrink-0"
                        >
                            <GitPullRequest size={16} />
                            View Good First Issues
                        </a>
                    </div>
                </section>

                {/* ── 5. RFC Governance ────────────────────────────────── */}
                <section className="py-24 border-b border-white/[0.08]">
                    <div className="max-w-3xl mb-12">
                        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                            Transparent Stewardship
                        </span>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                            How technical decisions are made.
                        </h2>
                        <p className="mt-4 text-base text-zinc-400">
                            Prismio has no secret roadmaps or corporate steering committees. Features are
                            designed through public Request for Comments (RFC) proposals.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {GOVERNANCE_STEPS.map(({step, title, description}) => (
                            <div
                                key={step}
                                className="rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/70 p-6 flex flex-col justify-between"
                            >
                                <div>
                                    <span className="font-mono text-2xl font-bold text-indigo-400/60 block mb-3">
                                        {step}
                                    </span>
                                    <h3 className="text-base font-semibold text-white">{title}</h3>
                                    <p className="mt-2 text-xs leading-5 text-zinc-400">{description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── 6. CTA / Join the Team ───────────────────────────── */}
                <section className="py-24 text-center">
                    <div className="mx-auto max-w-3xl space-y-6">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Join the Prismio community today.
                        </h2>
                        <p className="text-base text-zinc-400 max-w-xl mx-auto">
                            Whether you want to write a compiler lowering pass, propose a library API,
                            or sponsor CI hardware, we would love to have you.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                            <a
                                href="https://discord.gg/RUXJjnJF"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-[#5865F2] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#4752c4] transition-all shadow-lg shadow-[#5865F2]/20"
                            >
                                <MessageSquare size={16} />
                                Join the Discord
                            </a>

                            <Link
                                href="/sponsors"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-medium text-white hover:bg-white/[0.06] transition-all"
                            >
                                <Heart size={16} className="text-rose-400" />
                                Sponsor Infrastructure
                            </Link>

                            <Link
                                href="/about"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all"
                            >
                                About the Language
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <FooterMain />
        </div>
    );
}
