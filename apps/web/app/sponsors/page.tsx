import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Heart,
    Server,
    Cpu,
    ShieldCheck,
    ArrowRight,
    CheckCircle2,
    Mail,
    Scale,
    ExternalLink,
    Terminal,
} from "lucide-react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@prismio/ui/FooterMain";

export const metadata = {
    title: "Sponsors & Project Stewardship · Prismio",
    description: "Sustaining independent systems programming language development through community contributions and infrastructure sponsorship.",
};

const EXPENSE_AREAS = [
    {
        icon: Server,
        title: "Dedicated Bare-Metal CI Hardware",
        tag: "x86_64 & AArch64",
        detail: "Prismio's test suite compiles native binaries, validates DWARF emission, and runs 78 canonical benchmarks against Clang++ and Rust (rustc). Maintaining dedicated bare-metal instances ensures reproducible, non-virtualized timing data and eliminates noisy-neighbor variance.",
    },
    {
        icon: Cpu,
        title: "Core Compiler Research Grants",
        tag: "Uninterrupted Engineering",
        detail: "Funding dedicated developer time to tackle foundational language engineering: proving Adaptive Inference Framework (AIF) placement theorems, writing native LLVM 23 lowering passes, and designing memory-safe concurrency primitives.",
    },
    {
        icon: Terminal,
        tag: "Global Mirrors",
        title: "Release Distribution & Registry Mirrors",
        detail: "Providing fast, geographically distributed binary mirrors for compiler tarballs, bootstrap toolchains, package registries, and developer documentation without relying on commercial ad-supported networks.",
    },
];

const SPONSORSHIP_LEVELS = [
    {
        tier: "Institutional & Infrastructure Partner",
        forWhom: "Corporations, universities, and hardware vendors who depend on deterministic memory management or want to accelerate systems toolchain research.",
        perks: [
            "Prominent citation on website, documentation portal, and compiler release notes",
            "Direct technical advisory channel with core maintainers for ecosystem feedback",
            "Co-authored engineering case studies or benchmark analysis reports",
        ],
        actionText: "Discuss Institutional Sponsorship",
        actionHref: "mailto:saksham6975@gmail.com?subject=Prismio%20Institutional%20Sponsorship",
        external: true,
        highlight: true,
    },
    {
        tier: "Engineering Supporter",
        forWhom: "Engineering teams, studios, and startups actively building on or experimenting with Prismio.",
        perks: [
            "Company or project logo on the official GitHub repository and website",
            "Cited in quarterly milestone retrospectives and release changelogs",
            "Dedicated Discord engineering backer role and technical channel access",
        ],
        actionText: "Support as a Team ($100/mo)",
        actionHref: "https://github.com/sponsors/prismio-lang",
        external: true,
        highlight: false,
    },
    {
        tier: "Individual Backer",
        forWhom: "Individual programmers, researchers, and hobbyists who want to see independent systems languages thrive.",
        perks: [
            "Listed on the website backer roster and repository credits",
            "Supporter badge on Discord community hub",
            "Direct impact on funding continuous CI compute and toolchain distribution",
        ],
        actionText: "Back on GitHub Sponsors ($5–$25/mo)",
        actionHref: "https://github.com/sponsors/prismio-lang",
        external: true,
        highlight: false,
    },
];

const STEWARDSHIP_PRINCIPLES = [
    {
        title: "100% Permissive Open Source",
        copy: "The compiler, standard library, verifier shims, and documentation are published under Apache-2.0. There will never be an enterprise tier, proprietary compiler flag, or closed source standard library module.",
    },
    {
        title: "Decisions on technical merit",
        copy: "Financial contributions do not buy unilateral feature approval. Syntax changes, semantic decisions, and memory models are decided on technical merit, in the open on GitHub.",
    },
    {
        title: "Public Fiscal Accountability",
        copy: "Sponsorship funds are routed through public fiscal platforms (such as GitHub Sponsors) with transparent ledger reporting. Funds are spent exclusively on server infrastructure, CI runners, and verified maintainer stipends.",
    },
];

export default function SponsorsPage() {
    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#070709] text-white selection:bg-indigo-500/30 selection:text-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[44rem] bg-[radial-gradient(ellipse_at_68%_8%,rgba(67,56,202,0.18),transparent_54%)]" />

            <HeaderMain />

            <main className="relative z-10 mx-auto max-w-7xl px-6 pb-28 pt-16 md:pt-24">
                {/* ── Hero Section ─────────────────────────────────────── */}
                <section className="grid gap-10 border-b border-white/[0.09] pb-16 lg:grid-cols-12 lg:gap-16">
                    <div className="lg:col-span-8">
                        <div className="inline-flex items-center gap-2 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-mono text-indigo-300">
                            <Heart size={13} className="text-rose-400" />
                            <span>Project Stewardship & Sponsorship</span>
                        </div>

                        <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-white md:text-6xl">
                            Sustaining an independent systems compiler.
                        </h1>

                        <p className="mt-7 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg md:leading-8">
                            Prismio is built in the open without venture backing, proprietary licenses, or corporate control.
                            We sustain language development through community contributions, bare-metal CI hardware donations,
                            and transparent sponsorships from developers and organizations.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-4">
                            <a
                                href="https://github.com/sponsors/prismio-lang"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                <Heart size={15} className="fill-rose-600 text-rose-600" />
                                Sponsor via GitHub Sponsors
                            </a>
                            <a
                                href="mailto:saksham6975@gmail.com?subject=Prismio%20Institutional%20Sponsorship"
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                <Mail size={15} className="text-zinc-400" />
                                Inquire About Institutional Backing
                            </a>
                        </div>
                    </div>

                    <aside className="self-end border-l border-white/[0.1] pl-5 lg:col-span-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                            <Scale size={16} className="text-indigo-300" />
                            Our commitment
                        </div>
                        <p className="mt-3 text-sm leading-6 text-zinc-400">
                            Prismio will remain completely free and permissively licensed under Apache-2.0.
                            Sponsorship sustains dedicated engineering focus and bare-metal verification infrastructure.
                        </p>
                    </aside>
                </section>

                {/* ── Resource Allocation / Where Funds Go ─────────────── */}
                <section className="py-20" aria-labelledby="allocation-heading">
                    <div className="grid gap-8 md:grid-cols-12 md:gap-16">
                        <div className="md:col-span-4">
                            <h2 id="allocation-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white">
                                Where resources are deployed.
                            </h2>
                            <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
                                Language infrastructure requires predictable compute and dedicated developer hours.
                                Here is exactly how funding is utilized.
                            </p>
                        </div>

                        <div className="divide-y divide-white/[0.08] md:col-span-8">
                            {EXPENSE_AREAS.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <article key={item.title} className="grid gap-5 py-7 first:pt-0 sm:grid-cols-[2.5rem_1fr]">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-indigo-300">
                                            <IconComponent size={18} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-zinc-100">{item.title}</h3>
                                                <span className="font-mono text-[11px] text-zinc-500 rounded bg-white/[0.03] border border-white/[0.06] px-2 py-0.5">
                                                    {item.tag}
                                                </span>
                                            </div>
                                            <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">{item.detail}</p>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ── Sponsorship Tiers ─────────────────────────────────── */}
                <section className="border-t border-white/[0.09] py-20" aria-labelledby="programs-heading">
                    <div className="max-w-3xl">
                        <h2 id="programs-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                            Sponsorship programs.
                        </h2>
                        <p className="mt-4 text-sm leading-6 text-zinc-400">
                            Whether you are an individual developer backing open compiler research or an engineering organization building systems on Prismio, there is a structured avenue to participate.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 md:grid-cols-3">
                        {SPONSORSHIP_LEVELS.map((level) => (
                            <div
                                key={level.tier}
                                className={`flex flex-col justify-between rounded-2xl bg-[#0b0c10] p-7 ring-1 ${
                                    level.highlight
                                        ? "ring-indigo-500/30 bg-gradient-to-b from-[#0f1118] to-[#0b0c10]"
                                        : "ring-white/[0.08]"
                                }`}
                            >
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{level.tier}</h3>
                                    <p className="mt-3 text-xs leading-relaxed text-zinc-400">{level.forWhom}</p>

                                    <div className="mt-6 border-t border-white/[0.07] pt-5">
                                        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block">
                                            Recognition & Access
                                        </span>
                                        <ul className="mt-3 space-y-2.5">
                                            {level.perks.map((perk) => (
                                                <li key={perk} className="flex items-start gap-2.5 text-xs text-zinc-300">
                                                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                                                    <span>{perk}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-8 border-t border-white/[0.07] pt-5">
                                    <a
                                        href={level.actionHref}
                                        target={level.external ? "_blank" : undefined}
                                        rel={level.external ? "noopener noreferrer" : undefined}
                                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
                                            level.highlight
                                                ? "bg-white text-black hover:bg-zinc-200"
                                                : "border border-white/10 bg-white/[0.03] text-zinc-200 hover:border-white/20 hover:bg-white/[0.06]"
                                        }`}
                                    >
                                        <span>{level.actionText}</span>
                                        <ArrowRight size={13} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Stewardship Principles ────────────────────────────── */}
                <section className="border-t border-white/[0.09] py-20" aria-labelledby="principles-heading">
                    <div className="max-w-3xl">
                        <h2 id="principles-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                            Governance & Stewardship principles.
                        </h2>
                        <p className="mt-4 text-sm leading-6 text-zinc-400">
                            Our sponsorship model is strictly designed to protect the integrity, impartiality, and longevity of the language.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 md:grid-cols-3">
                        {STEWARDSHIP_PRINCIPLES.map((principle) => (
                            <div
                                key={principle.title}
                                className="rounded-2xl border border-white/[0.07] bg-[#0b0c10] p-6 ring-1 ring-white/[0.04]"
                            >
                                <div className="flex items-center gap-2.5 text-indigo-300 font-semibold text-sm">
                                    <ShieldCheck size={16} />
                                    <span>{principle.title}</span>
                                </div>
                                <p className="mt-3 text-xs leading-relaxed text-zinc-400">{principle.copy}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Current Backers Register Placeholder ──────────────── */}
                <section className="border-t border-white/[0.09] py-20" aria-labelledby="roster-heading">
                    <div className="overflow-hidden rounded-2xl bg-[#0b0c10] ring-1 ring-white/[0.09]">
                        <div className="border-b border-white/[0.07] px-6 py-6 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h3 id="roster-heading" className="text-xl font-semibold text-white">
                                    Supporter & Backer Roster
                                </h3>
                                <p className="mt-1 text-xs text-zinc-400">
                                    Individuals and institutions actively sustaining Prismio compiler development.
                                </p>
                            </div>
                            <a
                                href="https://github.com/sponsors/prismio-lang"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.08]"
                            >
                                <Heart size={13} className="text-rose-400" />
                                Join the Roster
                            </a>
                        </div>

                        <div className="p-8 sm:p-12 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08] text-zinc-500">
                                <Heart size={22} className="text-zinc-400" />
                            </div>
                            <h4 className="mt-4 text-base font-semibold text-zinc-200">
                                Become a Founding Supporter
                            </h4>
                            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-zinc-400">
                                Prismio v0.1 is in active development. Backers joining during this early stage are permanently recorded as founding supporters in our release logs and project credits.
                            </p>
                            <div className="mt-6">
                                <a
                                    href="https://github.com/sponsors/prismio-lang"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200"
                                >
                                    Sponsor on GitHub
                                    <ArrowRight size={13} />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <FooterMain />
        </div>
    );
}
