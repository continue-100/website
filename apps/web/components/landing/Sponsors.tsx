import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowRight, GitPullRequest, Heart} from 'lucide-react';

const CONTRIBUTION_TRACKS = [
    {
        area: 'compiler/aif & ast',
        title: 'AIF inference and storage plans',
        copy: 'Improve escape analysis, cycle detection, and memory placement within the self-hosted compiler.',
    },
    {
        area: 'stdlib/std.*',
        title: 'Standard library modules',
        copy: 'Implement foundational data structures, platform abstractions, and native process APIs.',
    },
    {
        area: 'benchmarks & tests',
        title: 'Workload parity & verification shims',
        copy: 'Add canonical workload implementations, keep the Prismio, C++ and Rust versions equivalent, and expand test coverage.',
    },
    {
        area: 'specifications & docs',
        title: 'Language design and documentation',
        copy: 'Document language semantics, refine AIF formalization, author guides, and write the specification.',
    },
];

const RESOURCE_NEEDS = [
    {
        title: 'Continuous Integration',
        tag: 'Linux, macOS, Windows',
        copy: 'Runners for full benchmark regression runs, sanitizer suites, and the three-platform bootstrap.',
    },
    {
        title: 'Maintainer Grants',
        tag: 'Core compiler',
        copy: 'Enables focused development time on hard compiler milestones, AIF work, and the LLVM backend.',
    },
    {
        title: 'Distribution & Hosting',
        tag: 'Hosting',
        copy: 'Hosting for prebuilt toolchain archives, the documentation, and the website.',
    },
];

export default function Sponsors() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-28 md:py-36">
            {/* Section Header */}
            <div className="grid items-end gap-8 lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <h2 className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                        Open development, sustained by contributors and sponsors.
                    </h2>
                    <p className="mt-6 max-w-3xl text-base leading-7 text-zinc-400">
                        Prismio is developed openly as an independent systems language project,
                        with no proprietary layers. Development is sustained through
                        technical contributions and infrastructure sponsorship.
                    </p>
                </div>
                <div className="lg:col-span-4 lg:text-right">
                    <Link
                        href="/sponsors"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 transition-colors hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                        View full sponsorship breakdown
                        <ArrowRight size={15}/>
                    </Link>
                </div>
            </div>

            {/* Main Panel */}
            <div className="mt-12 overflow-hidden rounded-2xl bg-[#0b0c10] ring-1 ring-white/[0.09]">
                {/* Status Bar */}
                <div className="grid grid-cols-2 border-b border-white/[0.07] text-center text-sm md:grid-cols-4">
                    <div className="border-b border-r border-white/[0.07] px-4 py-5 md:border-b-0">
                        <span className="block font-mono text-xs uppercase tracking-widest text-zinc-500">Governance</span>
                        <span className="mt-1 font-mono text-sm font-semibold text-white">100% Open Source</span>
                    </div>
                    <div className="border-b border-white/[0.07] px-4 py-5 md:border-b-0 md:border-r">
                        <span className="block font-mono text-xs uppercase tracking-widest text-zinc-500">License</span>
                        <span className="mt-1 font-mono text-sm font-semibold text-emerald-300">Apache-2.0</span>
                    </div>
                    <div className="border-r border-white/[0.07] px-4 py-5">
                        <span className="block font-mono text-xs uppercase tracking-widest text-zinc-500">Development</span>
                        <span className="mt-1 font-mono text-sm font-semibold text-indigo-300">In the open on GitHub</span>
                    </div>
                    <div className="px-4 py-5">
                        <span className="block font-mono text-xs uppercase tracking-widest text-zinc-500">CI</span>
                        <span className="mt-1 font-mono text-sm font-semibold text-zinc-200">Linux, macOS, Windows</span>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-12">
                    {/* Left: Technical Contribution Tracks (7 cols) */}
                    <div className="p-6 sm:p-8 lg:col-span-7 lg:border-r lg:border-white/[0.07]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <GitPullRequest size={18} className="text-indigo-300" />
                                <h3 className="font-semibold text-white">Technical contribution tracks</h3>
                            </div>
                            <span className="font-mono text-xs text-zinc-500">github.com/prismio-lang</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-zinc-400">
                            The compiler, standard library, runtime verification shims, and documentation are organized into focused areas where contributors can audit code, propose changes, and implement features:
                        </p>

                        <div className="mt-6 divide-y divide-white/[0.07] border-y border-white/[0.07]">
                            {CONTRIBUTION_TRACKS.map((track) => (
                                <article key={track.area} className="grid gap-3 py-5 sm:grid-cols-[12rem_1fr]">
                                    <div className="font-mono text-xs text-indigo-300">{track.area}</div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-200">{track.title}</h4>
                                        <p className="mt-1 text-xs leading-5 text-zinc-400">{track.copy}</p>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="mt-7 flex flex-wrap items-center gap-4">
                            <a
                                href="https://github.com/prismio-lang/prismio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                <Image src="/icons/github-mark.svg" alt="" width={15} height={15} />
                                View on GitHub
                            </a>
                            <a
                                href="https://github.com/prismio-lang/prismio/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 transition-colors hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                Browse open compiler issues
                                <ArrowRight size={13} />
                            </a>
                        </div>
                    </div>

                    {/* Right: Financial Sponsorship & Resources (5 cols) */}
                    <div className="flex flex-col justify-between border-t border-white/[0.07] bg-[#07080b]/60 p-6 sm:p-8 lg:col-span-5 lg:border-t-0">
                        <div>
                            <div className="flex items-center gap-3">
                                <Heart size={18} className="text-zinc-300" />
                                <h3 className="font-semibold text-white">Sponsorship & Resources</h3>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-zinc-400">
                                Financial contributions directly fund hardware, test matrix servers, and dedicated compiler research:
                            </p>

                            <div className="mt-6 space-y-3.5">
                                {RESOURCE_NEEDS.map((need) => (
                                    <div key={need.title} className="rounded-xl border border-white/[0.06] bg-[#0c0d12] p-4 ring-1 ring-white/[0.03]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-zinc-200">{need.title}</span>
                                            <span className="font-mono text-[11px] text-zinc-500">{need.tag}</span>
                                        </div>
                                        <p className="mt-1.5 text-xs leading-5 text-zinc-400">{need.copy}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 border-t border-white/[0.07] pt-6">
                            <div className="flex flex-col gap-2.5">
                                <Link
                                    href="/sponsors"
                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] px-4 text-xs font-medium text-zinc-300 transition-colors hover:border-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                                >
                                    <span>Sponsorship details & tiers</span>
                                    <ArrowRight size={13} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar: Permanent Recognition */}
                <div className="border-t border-white/[0.07] bg-[#07080b] px-6 py-5 sm:px-8">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="text-xs text-zinc-400">
                            <span className="font-medium text-zinc-200">Credited in the release notes: </span>
                            Code contributors are named in the release notes.
                        </div>
                        <div className="flex items-center gap-5 text-xs font-semibold">
                            <Link
                                href="/sponsors"
                                className="inline-flex items-center gap-1.5 text-zinc-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                Sponsors page
                                <ArrowRight size={13} />
                            </Link>
                            <Link
                                href="/community"
                                className="inline-flex items-center gap-1.5 text-indigo-300 transition-colors hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                Community guidelines
                                <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
