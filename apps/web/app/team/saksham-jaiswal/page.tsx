import React from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowUpRight,
    Camera,
    Code2,
    Cpu,
    Mail,
    MessageSquare,
    Send,
    Sparkles,
    Star,
    Terminal,
    Workflow,
    Zap,
} from "lucide-react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@prismio/ui/FooterMain";

export const metadata = {
    title: "Author's Note & Technical Journey · Saksham Jaiswal · Prismio",
    description: "A note from Saksham Jaiswal on compiler architecture, the vision behind Prismio, and building a self-hosted systems language.",
};

const COMPILER_MILESTONES = [
    {
        phase: "Phase 1",
        title: "The Systems Trilemma & Grammar",
        subtitle: "Defining the language surface",
        detail: "Identified the fundamental friction between manual memory hazards (C/C++), borrow-checker friction (Rust), and GC tail latency (Go/Java). Designed Prismio's clean, semicolon-free syntax and formal grammar.",
        accent: "border-indigo-500/20 text-indigo-300",
        icon: Code2,
    },
    {
        phase: "Phase 2",
        title: "Frontend Parser & Semantic Engine",
        subtitle: "From tokens to typed AST",
        detail: "Wrote the recursive-descent parser, AST builder, and semantic analysis pass from scratch with source-span diagnostics, pattern matching, traits, and compile-time generic specialization.",
        accent: "border-teal-500/20 text-teal-300",
        icon: Workflow,
    },
    {
        phase: "Phase 3",
        title: "Adaptive Inference Framework (AIF)",
        subtitle: "Deterministic compile-time memory",
        detail: "Formulated the core escape analysis algorithms and graded storage tiers (T0 Stack to T4 Thread-Transfer). Built verifiable runtime shims and `--manifest` emission for reproducible memory audits.",
        accent: "border-amber-500/20 text-amber-300",
        icon: Cpu,
    },
    {
        phase: "Phase 4",
        title: "LLVM 23 IR Lowering & DWARF",
        subtitle: "Zero-runtime native codegen",
        detail: "Engineered the backend lowering pipeline directly into LLVM IR. Integrated platform linkers and full DWARF debug symbol emission for native GDB and LLDB stepping.",
        accent: "border-sky-500/20 text-sky-300",
        icon: Zap,
    },
    {
        phase: "Phase 5",
        title: "The Self-Hosting Milestone",
        subtitle: "Prismio compiling Prismio",
        detail: "Bootstrapped the entire toolchain: the lexer, parser, AST, sema, and LLVM emission passes were rewritten in Prismio itself, eliminating any external compiler bootstrap dependencies.",
        accent: "border-violet-500/20 text-violet-300",
        icon: Sparkles,
    },
];

export default function SakshamAuthorPage() {
    return (
        <div className="relative min-h-screen bg-[#070709] text-white selection:bg-indigo-500/30 selection:text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overflow-x-clip">
            {/* Subtle Atmospheric Light — Restrained & Cinematic */}
            <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(67,56,202,0.18),rgba(15,23,42,0.1),transparent_70%)] blur-3xl" />
            <div className="pointer-events-none absolute top-[1200px] right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08),transparent_70%)] blur-3xl" />

            {/* Technical Grid Background */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)]" />

            <HeaderMain />

            <main className="relative z-10 mx-auto max-w-6xl px-6 py-12 md:py-20">
                {/* Back Link */}
                <div className="mb-12">
                    <Link
                        href="/team"
                        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-200 transition-colors group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Team & Contributors</span>
                    </Link>
                </div>

                {/* ── Hero: Technical & Editorial in Fraunces ───────────── */}
                <section className="grid gap-12 lg:grid-cols-12 lg:gap-14 items-start pb-20 border-b border-white/[0.08]">
                    
                    {/* Left 7 Columns: Editorial Headline & Bio */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-mono text-indigo-300">
                            <span>Compiler Architect</span>
                            <span className="text-zinc-500">/</span>
                            <span>Saksham Jaiswal</span>
                        </div>

                        {/* Title locked in Fraunces */}
                        <h1 className="font-fraunces text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white leading-[1.08]">
                            Why I built a systems language from{" "}
                            <span className="italic text-zinc-400">scratch.</span>
                        </h1>

                        <p className="text-zinc-300 text-base sm:text-lg leading-relaxed max-w-xl">
                            A reflection on compiler architecture, designing the Adaptive Inference Framework (AIF),
                            and why systems programming deserves human-explainable determinism.
                        </p>

                        {/* Refined Technical Badges */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-mono">
                            <span className="rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1 text-zinc-300">
                                Creator & Lead Architect
                            </span>
                            <span className="rounded-full bg-indigo-500/10 border border-indigo-500/25 px-3 py-1 text-indigo-300">
                                Self-Hosted v0.1.0
                            </span>
                            <span className="rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1 text-zinc-400">
                                AIF Memory Engine
                            </span>
                        </div>

                        {/* Quick Contact & Links */}
                        <div className="pt-4 flex flex-wrap items-center gap-3 text-sm">
                            <a
                                href="https://github.com/prismio-lang"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 font-medium text-white transition-all"
                            >
                                <Code2 size={15} className="text-zinc-300" />
                                <span>GitHub</span>
                                <ArrowUpRight size={12} className="opacity-50" />
                            </a>

                            <a
                                href="https://saksham1319.vercel.app"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 font-medium text-white transition-all"
                            >
                                <Sparkles size={15} className="text-zinc-300" />
                                <span>Portfolio</span>
                                <ArrowUpRight size={12} className="opacity-50" />
                            </a>

                            <a
                                href="mailto:saksham6975@gmail.com"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 font-medium text-white transition-all"
                            >
                                <Mail size={15} className="text-zinc-300" />
                                <span>Email</span>
                            </a>
                        </div>
                    </div>

                    {/* Right 5 Columns: Architectural Portrait Frame */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-center">
                        <div className="relative w-full max-w-sm">
                            
                            {/* Quiet Ambient Shadow */}
                            <div className="absolute -inset-1 rounded-[2rem] bg-indigo-500/10 blur-xl opacity-50" />

                            {/* Gallery / Studio Portrait Frame */}
                            <div className="relative rounded-[1.75rem] bg-[#0d0d12] border border-white/15 p-5 shadow-2xl backdrop-blur-xl">
                                
                                {/* Photo Area / Target Container */}
                                <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#14141d] to-[#0a0a0f] flex flex-col items-center justify-center text-center p-6">
                                    
                                    {/* Viewfinder Registration Corners */}
                                    <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-white/40" />
                                    <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-white/40" />
                                    <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-white/40" />
                                    <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-white/40" />

                                    {/* Center Icon */}
                                    <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/15 flex items-center justify-center mb-4">
                                        <Camera size={26} className="text-zinc-400" />
                                    </div>

                                    {/* Placeholder Label with Fraunces */}
                                    <div className="space-y-1">
                                        <span className="font-fraunces text-2xl text-white block">
                                            Saksham Jaiswal
                                        </span>
                                        <span className="text-xs font-mono text-zinc-400 block">
                                            Creator & Compiler Architect
                                        </span>
                                    </div>

                                    <div className="mt-4 px-3 py-1 rounded-full text-[10px] font-mono text-zinc-500 bg-white/[0.03] border border-white/[0.06]">
                                        Photo Space · 4:5 Aspect Ratio
                                    </div>
                                </div>

                                {/* Frame Footnote */}
                                <div className="pt-4 px-1 flex items-center justify-between text-xs text-zinc-400 font-mono">
                                    <div>
                                        <div className="text-zinc-200 font-medium">Prismio Compiler Architecture</div>
                                        <div className="text-[10px] text-zinc-600 mt-0.5">Self-Hosted Toolchain · 2026</div>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-zinc-400">
                                        v0.1.0
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 2. The Personal Note from Author (Kalam Font) ──────── */}
                <section className="py-24 border-b border-white/[0.08]">
                    
                    <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                            From the Compiler Creator
                        </span>
                        <h2 className="font-fraunces text-3xl sm:text-5xl text-white font-normal tracking-tight">
                            A Note to Every Prismio Developer
                        </h2>
                        <p className="text-zinc-400 text-sm sm:text-base">
                            Why this compiler exists, the philosophy of AIF, and what we are building together.
                        </p>
                    </div>

                    {/* The Manuscript Card */}
                    <div className="relative mx-auto max-w-4xl rounded-3xl bg-[#0c0c10]/95 border border-white/15 p-8 sm:p-12 md:p-16 shadow-2xl backdrop-blur-2xl">
                        
                        {/* Top Margin Stamp */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6 mb-8">
                            <div className="flex items-center gap-2.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="font-mono text-xs text-zinc-400 tracking-wider uppercase">
                                    Engineering Journal · Prismio v0.1.0
                                </span>
                            </div>

                            <span className="font-mono text-xs text-zinc-500">
                                September 2026
                            </span>
                        </div>

                        {/* THE LETTER BODY — IN KALAM FONT (LOCKED) */}
                        <div className="font-kalam text-lg sm:text-xl md:text-2xl text-zinc-200 leading-[1.9] sm:leading-[2] space-y-7 tracking-wide">
                            
                            <p className="text-white text-2xl sm:text-3xl font-bold font-kalam">
                                Dear friend & fellow engineer,
                            </p>

                            <p>
                                If you are compiling your first <span className="text-indigo-300 font-semibold underline decoration-indigo-500/40">.psm</span> program 
                                today or inspecting an allocation plan with <code className="text-sm font-mono bg-white/[0.06] px-2 py-0.5 rounded text-indigo-200">prismio aif</code>, 
                                I want to share why this project exists and what drove me to build an entire language from scratch.
                            </p>

                            <p>
                                For a long time, systems programming has felt bounded by a rigid dilemma:
                            </p>

                            <ul className="list-disc list-inside space-y-2 pl-2 text-zinc-300 text-base sm:text-lg">
                                <li><strong className="text-white">C/C++</strong> gives you total hardware control, but leaves you vulnerable to memory corruption, use-after-free, and silent buffer overflows.</li>
                                <li><strong className="text-white">Rust</strong> proves safety through affine types, but the borrow checker can become deeply agonizing when modeling cyclic graphs, self-referential structures, or concurrent pipelines.</li>
                                <li><strong className="text-white">Garbage-collected languages</strong> (Go, Java) offer developer velocity, but runtime pause spikes and memory multipliers make them unsuitable when tail latency and hardware predictability truly matter.</li>
                            </ul>

                            {/* Quote highlight */}
                            <div className="my-7 pl-6 border-l-2 border-indigo-400/60 py-2 bg-indigo-500/[0.03] rounded-r-xl">
                                <p className="font-kalam text-xl sm:text-2xl text-indigo-200 italic">
                                    "Why should the programmer be forced to guess or manually annotate lifetimes everywhere, when the compiler can prove escape provenance mathematically?"
                                </p>
                            </div>

                            <p>
                                That single question led me to design the <span className="text-indigo-300 font-bold">Adaptive Inference Framework (AIF)</span>. 
                                Instead of forcing you to fight a borrow checker or submit to a garbage collector, the compiler analyzes ownership, 
                                escape boundaries, and layout before code generation. It automatically places data in the cheapest safe tier—stack, 
                                arena, or heap—and produces verifiable evidence for why every single placement occurred.
                            </p>

                            <p>
                                Building this wasn't easy. Writing a self-hosted compiler means writing the lexer, parser, type checker, 
                                and LLVM lowering passes, and then rewriting the entire compiler in your own new language until it can compile itself. 
                                The moment Prismio became self-hosted—when the compiler successfully generated native machine code for its own 
                                source tree without any external host compiler—was one of the most rewarding milestones of my life.
                            </p>

                            <p className="text-white text-xl sm:text-2xl font-semibold">
                                Here is my commitment to every developer who uses Prismio:
                            </p>

                            <ul className="list-disc list-inside space-y-2.5 pl-2 text-zinc-300">
                                <li><strong className="text-white">Predictable Latency:</strong> 0ms stop-the-world pauses. Deterministic memory placement.</li>
                                <li><strong className="text-white">Zero-Overhead C ABI:</strong> Seamlessly call into existing C libraries without translation shims or runtime overhead.</li>
                                <li><strong className="text-white">Transparent Inference:</strong> Inference is never a black box. If the compiler makes a layout decision, it can explain why.</li>
                                <li><strong className="text-white">100% Permissive Open Source:</strong> The compiler, stdlib, and tooling will always remain free under Apache-2.0.</li>
                            </ul>

                            <p>
                                Thank you for being here, for running our compiler, and for exploring what's possible when we challenge conventional 
                                systems language trade-offs. I invite you to write programs, push the boundaries, submit RFCs, and help shape this ecosystem.
                            </p>

                            {/* Handwritten Signature in Kalam */}
                            <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                                <div>
                                    <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">
                                        With appreciation & dedication to craft,
                                    </div>
                                    <div className="font-kalam text-3xl sm:text-4xl text-white font-bold">
                                        Saksham Jaiswal
                                    </div>
                                    <div className="text-xs font-mono text-indigo-300 mt-1">
                                        Creator & Lead Compiler Architect, Prismio
                                    </div>
                                </div>

                                <div className="font-mono text-xs text-zinc-500 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5">
                                    Self-hosted · Shipped v0.1.0
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 3. Compiler Engineering Milestones (Fraunces) ──────── */}
                <section className="py-24 border-b border-white/[0.08]">
                    <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                            Engineering Evolution
                        </span>
                        <h2 className="font-fraunces text-3xl sm:text-5xl text-white font-normal tracking-tight">
                            Key Milestones of the Compiler
                        </h2>
                        <p className="text-zinc-400 text-sm sm:text-base">
                            The technical trajectory from initial grammar specification to a self-hosted LLVM toolchain.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {COMPILER_MILESTONES.map(({phase, title, subtitle, detail, accent, icon: Icon}) => (
                            <div
                                key={phase}
                                className={`rounded-2xl border bg-[#0c0c10]/70 p-7 backdrop-blur-xl transition-all duration-300 hover:border-white/20 flex flex-col justify-between ${accent}`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/10 text-white">
                                            {phase}
                                        </span>
                                        <Icon size={18} className="opacity-70" />
                                    </div>

                                    <h3 className="font-fraunces text-2xl text-white font-normal mb-1">
                                        {title}
                                    </h3>
                                    <p className="text-xs font-mono text-zinc-400 mb-3">
                                        {subtitle}
                                    </p>
                                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                                        {detail}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* 6th Card: Future Roadmap */}
                        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/[0.15] p-7 backdrop-blur-xl flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                                        Next Up
                                    </span>
                                    <Star size={18} className="text-amber-300" />
                                </div>

                                <h3 className="font-fraunces text-2xl text-white font-normal mb-1">
                                    Ecosystem & Tooling
                                </h3>
                                <p className="text-xs font-mono text-indigo-300 mb-3">
                                    Native tasks & standard library
                                </p>
                                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                                    Making region and cycle state safe under concurrent native tasks, expanding the standard container surface, and growing package ecosystem tooling.
                                </p>
                            </div>

                            <div className="pt-6">
                                <Link
                                    href="/roadmap"
                                    className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-indigo-300 hover:text-white transition-colors"
                                >
                                    <span>Explore the 2026 Roadmap</span>
                                    <ArrowUpRight size={13} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 4. Technical Collaboration & Contact ──────────────── */}
                <section className="py-24 text-center">
                    <div className="max-w-2xl mx-auto space-y-5">
                        <h2 className="font-fraunces text-3xl sm:text-5xl text-white font-normal tracking-tight">
                            The conversation is always open.
                        </h2>
                        <p className="text-zinc-400 text-base leading-relaxed">
                            Whether you want to propose a compiler lowering pass, discuss AIF memory semantics,
                            or contribute to the standard library, feel free to reach out.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                            <a
                                href="mailto:saksham6975@gmail.com"
                                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all"
                            >
                                <Send size={15} />
                                Email Saksham
                            </a>

                            <a
                                href="https://discord.gg/RUXJjnJF"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium text-sm transition-all shadow-lg shadow-[#5865F2]/20"
                            >
                                <MessageSquare size={16} />
                                Discord
                            </a>

                            <Link
                                href="/install"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/15 text-white hover:bg-white/[0.08] font-medium text-sm transition-all"
                            >
                                <Terminal size={15} />
                                Install Prismio
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <FooterMain />
        </div>
    );
}
