import React from "react";
import Link from "next/link";
import {ArrowRight, ArrowUpRight, Code2, FileUser, Heart, Mail, MessageSquare, Sparkles} from "lucide-react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@prismio/ui/FooterMain";
import {DISCORD_INVITE_LINK} from "@prismio/utils";

export const metadata = {
    title: "Team · Prismio Systems Language",
    description: "Prismio is built by its creator, Saksham Jaiswal. See what exists in 0.1, what doesn't yet, and how to contribute.",
};

const AREAS = [
    {
        area: "Frontend",
        today: "Self-hosted parser and semantic analysis, generics with monomorphization, and diagnostics with source spans.",
        missing: "Diagnostic codes are not stable yet.",
        tone: "bg-emerald-400",
    },
    {
        area: "Adaptive Inference Framework (AIF)",
        today: "Allocation sites are classified into stack, region, unique, reference-counted, and cycle-aware storage, with `--why` to explain each choice.",
        missing: "Experimental. The meaning of each tier can still change.",
        tone: "bg-amber-400",
    },
    {
        area: "LLVM backend",
        today: "Typed AST lowered to LLVM 23 IR, native linking, `-g` DWARF, cross-compilation, and a JIT.",
        missing: "No mobile toolchains.",
        tone: "bg-emerald-400",
    },
    {
        area: "Runtime and standard library",
        today: "Native threads, typed `Channel<T>`, `Vec<T>`, `Map<K, V>`, and file I/O.",
        missing: "No async, atomics, mutexes, or sets and queues yet.",
        tone: "bg-amber-400",
    },
    {
        area: "Tooling",
        today: "The `prismio` CLI and the UMS manifest, with a lockfile and local path dependencies.",
        missing: "No package registry, formatter, linter, or language server.",
        tone: "bg-rose-400",
    },
    {
        area: "Benchmarks",
        today: "Differential benchmarks of identical algorithms against C++ and Rust, reported as medians.",
        missing: "Coverage is limited to the workloads written so far.",
        tone: "bg-sky-400",
    },
];

const CARD = "rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/70 backdrop-blur-xl";

export default function TeamPage() {
    return (
        <div className="relative min-h-screen bg-[#070709] text-white selection:bg-indigo-500/30 selection:text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Ambient background */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(ellipse_at_70%_10%,rgba(67,56,202,0.16),transparent_52%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[800px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <HeaderMain />

            <main className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:py-28">
                {/* Hero */}
                <section className="border-b border-white/[0.08] pb-20">
                    <div className="grid items-end gap-8 lg:grid-cols-12 lg:gap-16">
                        <div className="lg:col-span-8">
                            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
                                Who builds{" "}
                                <span className="text-sky-300">Prismio.</span>
                            </h1>

                            <p className="mt-8 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
                                Prismio is developed by its creator, and contributions come in through GitHub,
                                Discord, and RFCs. This page says who that is, what exists in 0.1, and where
                                help is most useful.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:justify-end">
                            <a
                                href={DISCORD_INVITE_LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4752c4]"
                            >
                                <MessageSquare size={16} />
                                Join Discord
                            </a>

                            <a
                                href="https://github.com/prismio-lang/prismio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
                            >
                                <Code2 size={16} />
                                GitHub
                                <ArrowUpRight size={13} className="opacity-60" />
                            </a>
                        </div>
                    </div>
                </section>

                {/* Creator */}
                <section className="border-b border-white/[0.08] py-24">
                    <div className={`${CARD} p-8 md:p-12`}>
                        <div className="grid gap-8 lg:grid-cols-12 lg:gap-14">
                            <div className="space-y-1.5 lg:col-span-4">
                                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                    Saksham Jaiswal
                                </h2>
                                <p className="text-sm text-indigo-300">Creator and lead compiler architect</p>
                            </div>

                            <div className="space-y-6 lg:col-span-8">
                                <div className="space-y-4 text-base leading-7 text-zinc-300">
                                    <p>
                                        Saksham created Prismio and wrote its self-hosted compiler, the Adaptive
                                        Inference Framework (AIF), and the LLVM 23 backend. The language grew out of
                                        wanting developer speed and predictable latency in the same tool.
                                    </p>
                                    <p>
                                        The work centres on compiler-directed memory placement and escape analysis,
                                        with the compiler explaining its decisions rather than hiding them.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <Link
                                        href="/team/saksham-jaiswal"
                                        className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
                                    >
                                        Read the personal note
                                        <ArrowRight size={14} />
                                    </Link>

                                    <a
                                        href="https://github.com/saksham1319"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                                    >
                                        <Code2 size={14} className="text-indigo-400" />
                                        GitHub
                                        <ArrowUpRight size={12} className="opacity-60" />
                                    </a>
                                    <a
                                        href="https://saksham1319.vercel.app"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                                    >
                                        <FileUser size={14} className="text-teal-400" />
                                        Portfolio
                                        <ArrowUpRight size={12} className="opacity-60" />
                                    </a>
                                    <a
                                        href="mailto:saksham6975@gmail.com"
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                                    >
                                        <Mail size={14} className="text-sky-400" />
                                        Contact
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Where the work is */}
                <section className="border-b border-white/[0.08] py-24">
                    <div className="max-w-3xl">
                        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                            Where the work is.
                        </h2>
                        <p className="mt-4 text-base leading-7 text-zinc-400">
                            Every part of the toolchain is written and maintained by one person today. This is
                            what exists in 0.1 and what doesn&apos;t, which is also where outside contributions
                            help most.
                        </p>
                    </div>

                    <div className={`${CARD} mt-12 overflow-hidden`}>
                        <div className="hidden grid-cols-12 gap-8 border-b border-white/[0.08] px-8 py-4 text-xs font-medium uppercase tracking-wider text-zinc-400 md:grid">
                            <span className="col-span-3">Area</span>
                            <span className="col-span-5">What exists</span>
                            <span className="col-span-4">What&apos;s missing</span>
                        </div>

                        <dl className="divide-y divide-white/[0.08]">
                            {AREAS.map(({area, today, missing, tone}) => (
                                <div key={area} className="grid gap-3 px-8 py-6 md:grid-cols-12 md:gap-8">
                                    <dt className="flex items-start gap-2.5 text-sm font-semibold text-white md:col-span-3">
                                        <span aria-hidden className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} />
                                        {area}
                                    </dt>
                                    <dd className="text-sm leading-6 text-zinc-300 md:col-span-5">
                                        <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-400 md:hidden">
                                            What exists
                                        </span>
                                        {renderCode(today)}
                                    </dd>
                                    <dd className="text-sm leading-6 text-zinc-400 md:col-span-4">
                                        <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-400 md:hidden">
                                            What&apos;s missing
                                        </span>
                                        {renderCode(missing)}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>

                {/* CTA */}
                <section className="pt-20 md:pt-28 text-center">
                    <div className="mx-auto max-w-3xl space-y-6">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Join the Prismio community today.
                        </h2>
                        <p className="mx-auto max-w-xl text-base text-zinc-400">
                            Whether you want to write a compiler lowering pass, propose a library API, or
                            sponsor CI hardware, you&apos;re welcome here.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                            <a
                                href={DISCORD_INVITE_LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#4752c4]"
                            >
                                <MessageSquare size={16} />
                                Join the Discord
                            </a>

                            <Link
                                href="/community"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
                            >
                                Community Hub
                                <ArrowRight size={14} />
                            </Link>

                            <Link
                                href="/sponsors"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
                            >
                                <Heart size={16} className="text-rose-400" />
                                Sponsor Infrastructure
                            </Link>
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
