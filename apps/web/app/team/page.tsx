import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowRight,
    ArrowUpRight,
    Code2,
    Cpu,
    GitBranch,
    Heart,
    Layers,
    Mail,
    MessageSquare,
    Shield,
    Sparkles,
    Terminal,
    Users,
    Zap,
    CheckCircle2,
    FileCode,
} from "lucide-react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@prismio/ui/FooterMain";

export const metadata = {
    title: "Team & Architecture Ownership · Prismio Systems Language",
    description: "Meet the creator, maintainers, and subsystem architects building Prismio's self-hosted compiler, memory engine, and ecosystem.",
};

const SUBSYSTEM_DOMAINS = [
    {
        title: "Frontend Parser & Semantic Analysis",
        subsystem: "core/frontend",
        lead: "Saksham Jaiswal",
        status: "Self-Hosted",
        icon: Code2,
        description:
            "Recursive-descent parser, AST builder, trait solver, monomorphization, and human-friendly diagnostic reporting with exact source spans.",
        badge: "Compiler Core",
    },
    {
        title: "Adaptive Inference Framework (AIF)",
        subsystem: "core/aif-engine",
        lead: "Saksham Jaiswal",
        status: "Core Architecture",
        icon: Cpu,
        description:
            "Formal escape analysis engine, placement graph solver, storage tier classification (T0–T4), and automated static verifiers for zero-GC memory safety.",
        badge: "Memory Engine",
    },
    {
        title: "LLVM 23 Codegen & DWARF Emitter",
        subsystem: "backend/llvm",
        lead: "Core Toolchain",
        status: "Production Ready",
        icon: Zap,
        description:
            "Typed AST lowering to LLVM 23 IR, SIMD auto-vectorization passes, zero-cost exception tables, DWARF debug symbols, and native platform linker integration.",
        badge: "Codegen & IR",
    },
    {
        title: "Standard Library & Native Channels",
        subsystem: "runtime/stdlib",
        lead: "Open Ecosystem",
        status: "Active Spec",
        icon: Layers,
        description:
            "High-performance I/O primitives, deterministic collections, atomic synchronization primitives, and typed Channel<T> message passing.",
        badge: "Standard Library",
    },
    {
        title: "Toolchain, Registry & Language Server",
        subsystem: "tools/lsp-cli",
        lead: "Developer Experience",
        status: "Active Tooling",
        icon: Terminal,
        description:
            "First-party Language Server Protocol (LSP), automated formatter, packages registry integration, and the zero-dependency `prismio` CLI.",
        badge: "Developer Tools",
    },
    {
        title: "Bare-Metal Benchmarks & Regression CI",
        subsystem: "ci/verification",
        lead: "Quality & Systems",
        status: "Continuous CI",
        icon: GitBranch,
        description:
            "Reproducible bare-metal benchmark runners across x86_64 and AArch64 comparing runtime, memory footprint, and compile times against C++ and Rust.",
        badge: "Verification",
    },
];

const STEWARDSHIP_PRINCIPLES = [
    {
        title: "100% Permissive Open Source",
        icon: Shield,
        description:
            "The compiler, standard library, and runtime are licensed under Apache-2.0. There are no proprietary editions, telemetry, or paywalled toolchain features.",
    },
    {
        title: "Independent Architecture",
        icon: Cpu,
        description:
            "Prismio is not owned by or beholden to any advertising conglomerate or cloud vendor. Language decisions prioritize pure engineering and developer autonomy.",
    },
    {
        title: "Zero-Regression Verification",
        icon: CheckCircle2,
        description:
            "Every compiler commit and language proposal must pass rigorous memory safety verification, formal escape proofs, and bare-metal benchmark harnesses.",
    },
    {
        title: "Meritocratic RFC Process",
        icon: FileCode,
        description:
            "Syntax changes, memory mechanics, and standard library proposals are reviewed publicly via GitHub RFCs with transparent technical debate.",
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
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4752c4] transition-all shadow-lg shadow-[#5865F2]/20"
                            >
                                <MessageSquare size={16} />
                                Join Discord
                            </a>

                            <a
                                href="https://github.com/prismio-lang/prismio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-white hover:bg-white/[0.06] transition-all"
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
                        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14 items-center">
                            {/* Left Column: Portrait Frame */}
                            <div className="lg:col-span-4 flex flex-col items-center">
                                <div className="relative w-full max-w-[280px]">
                                    {/* Ambient Glow */}
                                    <div className="absolute -inset-1 rounded-2xl bg-indigo-500/15 blur-lg opacity-60" />

                                    <div className="relative rounded-2xl bg-[#0d0d12] border border-white/15 p-3.5 shadow-2xl backdrop-blur-xl">
                                        <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden border border-white/10 bg-[#14141d] group">
                                            <Image
                                                src="/images/team/saksham.jpeg"
                                                alt="Saksham Jaiswal — Creator & Lead Architect"
                                                fill
                                                className="object-cover object-center grayscale-[10%] contrast-[1.05] group-hover:grayscale-0 transition-all duration-500"
                                                priority
                                                sizes="(max-width: 768px) 100vw, 280px"
                                            />
                                            {/* Vignette */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12]/80 via-transparent to-transparent pointer-events-none" />

                                            {/* Viewfinder corners */}
                                            <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t border-l border-white/50" />
                                            <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t border-r border-white/50" />
                                            <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b border-l border-white/50" />
                                            <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b border-r border-white/50" />
                                        </div>

                                        <div className="pt-3 px-1 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                                            <div>
                                                <span className="text-zinc-200 font-medium block">Saksham Jaiswal</span>
                                                <span className="text-[10px] text-zinc-500">Prismio Architect</span>
                                            </div>
                                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px]">
                                                Lead Maintainer
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Bio, Subsystems, Links */}
                            <div className="lg:col-span-8 space-y-6">
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
                                        Compiler Frontend · Adaptive Inference Framework (AIF) · LLVM Lowering
                                    </p>
                                </div>

                                <div className="space-y-3.5 text-sm leading-7 text-zinc-300">
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

                                <div className="flex flex-wrap gap-2 pt-1">
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

                                <div className="flex flex-wrap items-center gap-4 pt-2">
                                    <Link
                                        href="/team/saksham-jaiswal"
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 hover:opacity-95 transition-all"
                                    >
                                        <Sparkles size={14} />
                                        <span>Read Personal Note & Technical Journey</span>
                                        <ArrowRight size={13} />
                                    </Link>

                                    <div className="flex items-center gap-2">
                                        <a
                                            href="https://github.com/prismio-lang"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-all"
                                        >
                                            <Code2 size={13} className="text-indigo-400" />
                                            <span>GitHub</span>
                                            <ArrowUpRight size={12} className="opacity-60" />
                                        </a>
                                        <a
                                            href="https://saksham1319.vercel.app"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-all"
                                        >
                                            <Sparkles size={13} className="text-teal-400" />
                                            <span>Portfolio</span>
                                            <ArrowUpRight size={12} className="opacity-60" />
                                        </a>
                                        <a
                                            href="mailto:saksham6975@gmail.com"
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-all"
                                        >
                                            <Mail size={13} className="text-sky-400" />
                                            <span>Contact</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 3. Compiler Architecture & Subsystem Domains ───────── */}
                <section className="py-24 border-b border-white/[0.08]">
                    <div className="max-w-3xl mb-12">
                        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                            Architecture & Subsystems
                        </span>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                            Compiler Architecture & Subsystem Domains
                        </h2>
                        <p className="mt-4 text-base text-zinc-400">
                            The Prismio toolchain is structured into modular engineering domains with clear invariants,
                            formal escape proofs, and dedicated subsystem ownership.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {SUBSYSTEM_DOMAINS.map(({title, subsystem, icon: Icon, lead, status, description, badge}) => (
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
                                    
                                    <div className="mt-2 flex items-center justify-between text-xs font-mono">
                                        <span className="text-indigo-400/80">{subsystem}</span>
                                        <span className="text-zinc-500">{status}</span>
                                    </div>

                                    <p className="mt-4 text-sm leading-6 text-zinc-400">
                                        {description}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-500">
                                    <span>Lead / Maintainer</span>
                                    <span className="text-zinc-300 font-medium">{lead}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── 4. Independent Stewardship ───────────────────────── */}
                <section className="py-24 border-b border-white/[0.08]">
                    <div className="max-w-3xl mb-12">
                        <span className="text-xs font-mono uppercase tracking-widest text-[#47d7b5]">
                            Project Stewardship
                        </span>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                            Independent, Meritocratic Governance
                        </h2>
                        <p className="mt-4 text-base text-zinc-400">
                            Prismio operates under an open-source charter designed to safeguard technical purity,
                            prevent corporate lock-in, and ensure perpetual community accessibility.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {STEWARDSHIP_PRINCIPLES.map(({title, icon: Icon, description}) => (
                            <div
                                key={title}
                                className="rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/70 p-6 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-zinc-200 border border-white/[0.08] mb-4">
                                        <Icon size={18} />
                                    </div>
                                    <h3 className="text-base font-semibold text-white">{title}</h3>
                                    <p className="mt-3 text-xs leading-6 text-zinc-400">{description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── 5. Contributor Community & Acknowledgement ───────── */}
                <section className="py-24 border-b border-white/[0.08]">
                    <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0e0e14] to-[#070709] p-8 md:p-12">
                        <div className="max-w-3xl">
                            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                                Community Ecosystem
                            </span>
                            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                                Built with the Global Systems Community
                            </h2>
                            <p className="mt-4 text-sm sm:text-base leading-7 text-zinc-400">
                                A systems language cannot thrive in isolation. Prismio is shaped continuously by the bug
                                reports, compiler fuzzer contributions, standard library proposals, and benchmark validations
                                submitted by engineers worldwide.
                            </p>
                        </div>

                        <div className="mt-10 grid gap-6 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                                <span className="font-mono text-2xl font-bold text-white block">100%</span>
                                <span className="text-xs font-mono text-zinc-400 mt-1 block">Open Source (Apache-2.0)</span>
                                <p className="text-xs text-zinc-500 mt-2">Zero proprietary compiler components or locked runtime extensions.</p>
                            </div>
                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                                <span className="font-mono text-2xl font-bold text-teal-400 block">RFC-Driven</span>
                                <span className="text-xs font-mono text-zinc-400 mt-1 block">Public Language Evolution</span>
                                <p className="text-xs text-zinc-500 mt-2">Every syntax modification and stdlib addition is peer-reviewed publicly.</p>
                            </div>
                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                                <span className="font-mono text-2xl font-bold text-indigo-400 block">Bare-Metal</span>
                                <span className="text-xs font-mono text-zinc-400 mt-1 block">Continuous Benchmarking</span>
                                <p className="text-xs text-zinc-500 mt-2">Verified against Clang++ and Rust across x86_64 and AArch64 targets.</p>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-xs text-zinc-400 text-center sm:text-left">
                                Want to get involved? Read our contribution guidelines, submit RFC proposals, and join Discord discussions.
                            </p>
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/community"
                                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors"
                                >
                                    <Users size={14} />
                                    <span>Community Hub</span>
                                </Link>
                                <a
                                    href="https://github.com/prismio-lang/prismio"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-xs font-medium text-white hover:bg-white/[0.06] transition-colors"
                                >
                                    <Code2 size={14} />
                                    <span>Contribute Code</span>
                                    <ArrowUpRight size={12} className="opacity-60" />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 6. CTA / Join the Ecosystem ─────────────────────── */}
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
                                className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#4752c4] transition-all shadow-lg shadow-[#5865F2]/20"
                            >
                                <MessageSquare size={16} />
                                Join the Discord
                            </a>

                            <Link
                                href="/sponsors"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-sm font-medium text-white hover:bg-white/[0.06] transition-all"
                            >
                                <Heart size={16} className="text-rose-400" />
                                Sponsor Infrastructure
                            </Link>

                            <Link
                                href="/about"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all"
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
