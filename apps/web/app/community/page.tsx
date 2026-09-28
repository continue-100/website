import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowUpRight,
    ArrowRight,
    MessageSquare,
    GitPullRequest,
    Bug,
    Cpu,
    BookOpen,
    Layers,
    ShieldCheck,
    CheckCircle2,
    Code2,
    Compass,
    Sparkles,
} from 'lucide-react';
import HeaderMain from '@/components/HeaderMain';
import FooterMain from '@prismio/ui/FooterMain';

export const metadata = {
    title: 'Community & Contributing | Prismio',
    description:
        'Join the Prismio community on Discord and GitHub. Explore RFC language proposals, contribute to the self-hosted compiler, and collaborate with systems programmers.',
};

export default function CommunityPage() {
    const hubs = [
        {
            name: 'Discord Server',
            badge: 'Real-time Chat',
            badgeColor: 'bg-[#5865F2]/15 text-[#8892f7] border-[#5865F2]/30',
            icon: (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#5865F2] shadow-md shadow-[#5865F2]/20">
                    <Image src="/icons/discord.svg" alt="Discord" width={22} height={22} className="invert" />
                </div>
            ),
            description:
                'The daily hub for real-time discussion, troubleshooting, and compiler hacking. Talk directly with core maintainers and contributors.',
            channels: [
                { name: '#compiler-dev', desc: 'LLVM 23 lowering, AIF inference & AST' },
                { name: '#proposals', desc: 'Syntax RFCs & early design feedback' },
                { name: '#help', desc: 'Setup, build troubleshooting & syntax questions' },
                { name: '#announcements', desc: 'Milestone releases & compiler progress' },
            ],
            cta: 'Join Discord Server',
            href: 'https://discord.gg/RUXJjnJF',
            primary: true,
        },
        {
            name: 'GitHub Discussions',
            badge: 'Language RFCs',
            badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
            icon: (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <MessageSquare size={20} className="text-indigo-400" />
                </div>
            ),
            description:
                'Where durable language decisions happen. Read long-form proposals, discuss type system semantics, and debate standard library APIs.',
            channels: [
                { name: 'RFC Proposals', desc: 'Formal specs for new syntax and language rules' },
                { name: 'Architecture & Ideas', desc: 'Long-term engine and runtime directions' },
                { name: 'Q&A', desc: 'Searchable answers to deep technical questions' },
                { name: 'Show and Tell', desc: 'Projects, benchmarks, and experiments' },
            ],
            cta: 'Explore Discussions',
            href: 'https://github.com/prismio-lang/prismio/discussions',
            primary: false,
        },
        {
            name: 'Issues & Tracking',
            badge: 'Active Work',
            badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
            icon: (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <GitPullRequest size={20} className="text-emerald-400" />
                </div>
            ),
            description:
                'Direct issue tracking for compiler regressions, standard library milestones, and performance test suites across Linux, macOS, and Windows.',
            channels: [
                { name: 'good-first-issue', desc: 'Curated tasks for first-time contributors' },
                { name: 'stdlib-milestones', desc: 'Implementation of Tier-1 standard modules' },
                { name: 'codegen-bug', desc: 'LLVM lowering edge cases and verification' },
                { name: 'unsupported-catalog', desc: 'Tracked language surface gaps' },
            ],
            cta: 'Browse GitHub Issues',
            href: 'https://github.com/prismio-lang/prismio/issues',
            primary: false,
        },
    ];

    const contributionPathways = [
        {
            icon: Cpu,
            title: 'Compiler Core & AIF',
            path: 'src/frontend/ · src/semantic/ · src/llvm/',
            description:
                'Work on parser recovery, bidirectional type inference, the Adaptive Inference Framework (AIF) ownership rules, and native LLVM 23 code generation.',
            skills: ['LLVM 23', 'C++', 'Type Inference', 'Compilers'],
            href: 'https://github.com/prismio-lang/prismio/tree/main/src',
        },
        {
            icon: Code2,
            title: 'Standard Library in Prismio',
            path: 'stdlib/std/ (written in pure .psm)',
            description:
                'Implement self-hosted data structures and utilities: Vec<T>, Map, string algorithms, unicode tables, and platform I/O abstractions.',
            skills: ['Prismio (.psm)', 'Data Structures', 'Zero-Cost Abstractions'],
            href: 'https://github.com/prismio-lang/prismio/tree/main/stdlib',
        },
        {
            icon: Layers,
            title: 'Differential Benchmarks',
            path: 'benchmarks/ (Prismio vs C++ vs Rust)',
            description:
                'Help expand the 78-workload maintained benchmark suite. Write 3-arm differential algorithms adhering to bit-for-bit checksum parity.',
            skills: ['C++20', 'Rust', 'Performance Analysis', 'Benchmarking'],
            href: 'https://github.com/prismio-lang/prismio/tree/main/benchmarks',
        },
        {
            icon: Compass,
            title: 'Developer Tooling & IDEs',
            path: 'tools/ · intellij-plugin · tree-sitter',
            description:
                'Enhance developer workflows: our official IntelliJ IDEA plugin, tree-sitter grammar, compiler diagnostics formatting, and UMS manifest tooling.',
            skills: ['IntelliJ SDK', 'Java/Kotlin', 'Tree-sitter', 'CLI UX'],
            href: 'https://github.com/prismio-lang/intellij-plugin',
        },
    ];

    const workflowSteps = [
        {
            step: '01',
            title: 'Discuss Intent & RFC',
            description:
                'Before large changes, open a GitHub Discussion or RFC issue to align on syntax design, naming conventions, and runtime invariants.',
        },
        {
            step: '02',
            title: 'Build & Differential Tests',
            description:
                'Implement your feature with regression tests. If measuring performance, add equivalent 3-arm implementations with checksum validation.',
        },
        {
            step: '03',
            title: '3-Generation Bootstrap',
            description:
                'Every compiler commit must survive the self-hosted bootstrap test (gen0 → gen1 → dist) before merging into main.',
        },
    ];

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#070709] text-white selection:bg-indigo-500/30 selection:text-white">
            {/* Ambient Top Glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[48rem] bg-[radial-gradient(ellipse_at_30%_6%,rgba(67,56,202,0.16),transparent_55%)]" />

            <HeaderMain />

            <main className="relative z-10 mx-auto max-w-[92rem] px-4 sm:px-6 lg:px-8 pb-28 pt-16 md:pt-24 space-y-24">
                {/* ── Hero Section ─────────────────────────────────── */}
                <section className="space-y-6 border-b border-white/[0.09] pb-16">
                    <div className="max-w-3xl space-y-4">
                        <div className="font-mono text-xs uppercase tracking-wider text-indigo-400">
                            Community &amp; Open Source
                        </div>
                        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl md:text-6xl leading-[1.02]">
                            Built in the open,{' '}
                            <span className="text-zinc-400">driven by systems developers.</span>
                        </h1>
                        <p className="text-base leading-7 text-zinc-300 md:text-lg md:leading-8 max-w-2xl">
                            Prismio is developed transparently on GitHub and Discord. Join language design debates,
                            propose standard library features, report compiler regressions, and build with us.
                        </p>
                    </div>

                    {/* Quick Metadata Anchors */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-zinc-400">
                        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5">
                            <span className="size-2 rounded-full bg-[#5865F2]" />
                            <span className="text-zinc-200">Discord</span>
                            <span className="text-zinc-500">· Real-time Chat</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5">
                            <span className="size-2 rounded-full bg-indigo-400" />
                            <span className="text-zinc-200">GitHub RFCs</span>
                            <span className="text-zinc-500">· Language Proposals</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5">
                            <span className="size-2 rounded-full bg-emerald-400" />
                            <span className="text-zinc-200">Apache-2.0</span>
                            <span className="text-zinc-500">· Permissive License</span>
                        </div>
                    </div>
                </section>

                {/* ── Primary Community Hubs Grid ──────────────────── */}
                <section aria-labelledby="hubs-heading" className="space-y-8">
                    <div>
                        <h2 id="hubs-heading" className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                            Where Discussions Happen
                        </h2>
                        <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
                            Whether you have an immediate installation issue or a detailed language design RFC,
                            here are the official channels where decisions are made.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {hubs.map((hub) => (
                            <div
                                key={hub.name}
                                className={`flex flex-col justify-between rounded-2xl border p-6 sm:p-7 transition-all ${
                                    hub.primary
                                        ? 'border-indigo-500/30 bg-[#0a0b12] hover:border-indigo-500/50'
                                        : 'border-white/[0.08] bg-[#090a0e] hover:border-white/20'
                                }`}
                            >
                                <div className="space-y-5">
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            {hub.icon}
                                            <div>
                                                <h3 className="text-base font-semibold text-white">{hub.name}</h3>
                                                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                                                    {hub.badge}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs leading-relaxed text-zinc-300">
                                        {hub.description}
                                    </p>

                                    {/* Channels / Topics */}
                                    <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3.5 space-y-2.5">
                                        <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                                            Key areas &amp; channels
                                        </span>
                                        <div className="space-y-2">
                                            {hub.channels.map((ch) => (
                                                <div key={ch.name} className="flex items-start gap-2 text-xs">
                                                    <span className="font-mono text-zinc-400 shrink-0 mt-0.5">
                                                        {ch.name.startsWith('#') ? ch.name : `# ${ch.name}`}
                                                    </span>
                                                    <span className="text-zinc-500 text-[11px] leading-tight">
                                                        · {ch.desc}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Direct CTA Button */}
                                <div className="mt-6 pt-5 border-t border-white/[0.06]">
                                    <a
                                        href={hub.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all ${
                                            hub.primary
                                                ? 'bg-[#5865F2] hover:bg-[#4752c4] text-white shadow-md shadow-[#5865F2]/20'
                                                : 'border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white'
                                        }`}
                                    >
                                        <span>{hub.cta}</span>
                                        <ArrowUpRight size={14} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Where to Contribute Matrix ───────────────────── */}
                <section aria-labelledby="contribute-heading" className="space-y-8 border-t border-white/[0.08] pt-16">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="font-mono text-xs uppercase tracking-wider text-emerald-400">
                                Areas of Impact
                            </div>
                            <h2 id="contribute-heading" className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                                Where You Can Contribute
                            </h2>
                            <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
                                Whether you prefer low-level LLVM codegen, writing pure Prismio standard library collections,
                                or improving developer tooling, there is a clear place to start.
                            </p>
                        </div>
                        <a
                            href="https://github.com/prismio-lang/prismio/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                            <span>Browse &quot;good first issue&quot; labels</span>
                            <ArrowUpRight size={13} />
                        </a>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {contributionPathways.map((item) => {
                            const Icon = item.icon;
                            return (
                                <a
                                    key={item.title}
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#090a0e] p-5 space-y-4 transition-all hover:border-white/20 hover:bg-[#0c0d12]"
                                >
                                    <div className="space-y-3">
                                        <div className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-300 group-hover:text-white transition-colors">
                                            <Icon size={17} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                                                <span>{item.title}</span>
                                                <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </h3>
                                            <div className="mt-1 font-mono text-[10px] text-zinc-500">
                                                {item.path}
                                            </div>
                                        </div>
                                        <p className="text-xs leading-relaxed text-zinc-400">
                                            {item.description}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.04]">
                                        {item.skills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </section>

                {/* ── Contributor Workflow (How We Build) ──────────── */}
                <section aria-labelledby="workflow-heading" className="space-y-8 border-t border-white/[0.08] pt-16">
                    <div>
                        <div className="font-mono text-xs uppercase tracking-wider text-indigo-400">
                            RFC &amp; Contribution Process
                        </div>
                        <h2 id="workflow-heading" className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                            How Language Changes Graduate
                        </h2>
                        <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
                            A transparent, reproducible pipeline ensures that language evolution is deliberate, tested, and self-hosted.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {workflowSteps.map((step) => (
                            <div
                                key={step.step}
                                className="rounded-xl border border-white/[0.08] bg-[#090a0e] p-6 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-semibold text-indigo-400">
                                        Step {step.step}
                                    </span>
                                </div>
                                <h3 className="text-base font-semibold text-white">
                                    {step.title}
                                </h3>
                                <p className="text-xs leading-relaxed text-zinc-400">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Code of Conduct & Standards ─────────────────── */}
                <section className="rounded-2xl border border-white/[0.08] bg-[#090a0e] p-7 md:p-8 space-y-4">
                    <div className="flex items-center gap-2.5 text-zinc-200">
                        <ShieldCheck size={18} className="text-emerald-400" />
                        <h3 className="text-base font-semibold text-white">
                            Community Standards &amp; Code of Conduct
                        </h3>
                    </div>
                    <p className="max-w-3xl text-xs leading-relaxed text-zinc-400">
                        Prismio is committed to providing a friendly, rigorous, and harassment-free environment for everyone,
                        regardless of background or experience level. We value constructive technical critique, evidence-based
                        benchmarking, and courteous collaboration across all channels.
                    </p>
                    <div className="pt-2 text-xs">
                        <a
                            href="https://github.com/prismio-lang/prismio/blob/main/CODE_OF_CONDUCT.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            <span>Read the full Code of Conduct</span>
                            <ArrowUpRight size={12} />
                        </a>
                    </div>
                </section>

                {/* ── Final Call to Action ────────────────────────── */}
                <section className="border-t border-white/[0.09] pt-16">
                    <div className="grid gap-8 rounded-2xl bg-[#0b0c10] p-7 ring-1 ring-white/[0.08] lg:grid-cols-[1fr_auto] lg:items-center md:p-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-zinc-200">
                                <BookOpen size={17} className="text-indigo-300" />
                                <h2 className="text-xl font-semibold tracking-[-0.02em]">Ready to explore the codebase?</h2>
                            </div>
                            <p className="max-w-2xl text-sm leading-6 text-zinc-400">
                                Check out the compiler source, browse the standard library, or read developer documentation to get your local environment running.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href="https://github.com/prismio-lang/prismio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
                            >
                                <Image src="/icons/github-mark.svg" alt="GitHub" width={16} height={16} />
                                <span>Browse GitHub</span>
                                <ArrowUpRight size={15} />
                            </a>
                            <Link
                                href="/install"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.1] px-5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                            >
                                <span>Installation Guide</span>
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <FooterMain />
        </div>
    );
}
