import React from 'react';
import Link from 'next/link';
import {ArrowRight, ArrowUpRight, BookOpen, Bug, FileText, Rocket, ShieldCheck} from 'lucide-react';
import HeaderMain from '@/components/HeaderMain';
import DiscordIcon from '@/components/icons/DiscordIcon';
import GithubIcon from '@/components/icons/GithubIcon';
import FooterMain from '@prismio/ui/FooterMain';
import {DISCORD_INVITE_LINK} from '@prismio/utils';

export const metadata = {
    title: 'Community & Contributing | Prismio',
    description:
        'Where to ask questions, report bugs, and contribute to Prismio: the Discord server, GitHub issues, and the contributing guide.',
};

const REPO = 'https://github.com/prismio-lang/prismio';
const CARD = 'rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/70 backdrop-blur-xl';

const PLACES = [
    {
        name: 'Discord',
        copy: 'Questions, troubleshooting, and conversation with the maintainer and other users. Start here if you are stuck or just curious.',
        cta: 'Join the Discord',
        href: DISCORD_INVITE_LINK,
        icon: (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#5865F2]">
                <DiscordIcon size={22} />
            </div>
        ),
        primary: true,
    },
    {
        name: 'GitHub Issues',
        copy: 'Bug reports, feature requests, and tracked work. A minimal program that reproduces the problem is the most useful thing you can include.',
        cta: 'Open the issue tracker',
        href: `${REPO}/issues`,
        icon: (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                <GithubIcon size={22} />
            </div>
        ),
        primary: false,
    },
];

const START_HERE = [
    {
        icon: BookOpen,
        title: 'Read the contributing guide',
        copy: 'Fork, branch, change, test, and open a pull request. It also covers commit messages and what a good PR looks like.',
        href: `${REPO}/blob/main/CONTRIBUTING.md`,
    },
    {
        icon: Rocket,
        title: 'Set up a local build',
        copy: 'Python 3.8+ is the only thing you install yourself. The setup script provisions the pinned LLVM and builds the first compiler from the committed seed.',
        href: `${REPO}/blob/main/CONTRIBUTING.md#prerequisites`,
    },
    {
        icon: Bug,
        title: 'Pick a good first issue',
        copy: 'Small, well-scoped tasks for people new to the codebase.',
        href: `${REPO}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`,
    },
    {
        icon: ShieldCheck,
        title: 'Report a security problem',
        copy: 'Use the security policy instead of a public issue.',
        href: `${REPO}/blob/main/SECURITY.md`,
    },
];

const AREAS = [
    {
        title: 'Compiler',
        path: 'src/',
        copy: 'The lexer, parser, semantic analysis and ownership checks, the Adaptive Inference Framework, and LLVM lowering. The compiler is written in Prismio.',
        href: `${REPO}/tree/main/src`,
        label: 'Browse src/',
    },
    {
        title: 'Standard library',
        path: 'std/',
        copy: 'Collections, strings, files, input, time, and math, written in Prismio (.psm).',
        href: `${REPO}/tree/main/std`,
        label: 'Browse std/',
    },
    {
        title: 'Benchmarks',
        path: 'benchmarks/',
        copy: 'Workloads for the Prismio, C++ and Rust suite. All three versions of a workload must be the same program and agree on the checksum.',
        href: `${REPO}/tree/main/benchmarks`,
        label: 'Browse benchmarks/',
    },
    {
        title: 'Editor support',
        path: 'intellij-plugin · prismio-tmlanguage',
        copy: 'The JetBrains plugin and the TextMate grammar used for syntax highlighting.',
        href: 'https://github.com/prismio-lang/intellij-plugin',
        label: 'Open the plugin',
    },
];

const STEPS = [
    {
        title: 'Make a small, focused change',
        copy: 'Work in src/ or std/. For anything large, open an issue first so the approach can be agreed before you write the code.',
    },
    {
        title: 'Add tests and run them',
        copy: 'Behaviour you add or fix needs a test in tests/. A pull request that adds language behaviour without one is unlikely to be merged.',
    },
    {
        title: 'Open a pull request against main',
        copy: 'CI bootstraps the compiler from the committed seed, checks that it reproduces itself (gen0 → gen1 → gen2), then runs the test suite.',
    },
];

export default function CommunityPage() {
    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#070709] text-white selection:bg-indigo-500/30 selection:text-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(ellipse_at_70%_10%,rgba(67,56,202,0.16),transparent_52%)]" />

            <HeaderMain />

            <main className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:py-28">
                {/* Hero */}
                <section className="border-b border-white/[0.08] pb-20">
                    <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
                        Where Prismio is{' '} <br/>
                        <span className="text-sky-300">discussed and built.</span>
                    </h1>
                    <p className="mt-8 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
                        Prismio is developed on GitHub, with a Discord server for questions and conversation.
                        Both are open to everyone: report a bug, ask a question, or send a patch.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <a
                            href={DISCORD_INVITE_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4752c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                        >
                            <DiscordIcon size={16} />
                            Join Discord
                        </a>
                        <a
                            href={REPO}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                        >
                            <GithubIcon size={16} />
                            GitHub
                            <ArrowUpRight size={13} className="opacity-60" />
                        </a>
                    </div>
                </section>

                {/* Where to talk */}
                <section aria-labelledby="talk-heading" className="border-b border-white/[0.08] py-24">
                    <h2 id="talk-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                        Where to talk.
                    </h2>
                    <div className="mt-12 grid gap-6 md:grid-cols-2">
                        {PLACES.map(({name, copy, cta, href, icon, primary}) => (
                            <div
                                key={name}
                                className={`${CARD} flex flex-col justify-between p-8 ${
                                    primary ? 'border-indigo-500/30' : ''
                                }`}
                            >
                                <div className="space-y-5">
                                    <div className="flex items-center gap-4">
                                        {icon}
                                        <h3 className="text-xl font-semibold text-white">{name}</h3>
                                    </div>
                                    <p className="text-sm leading-7 text-zinc-400">{copy}</p>
                                </div>
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                                >
                                    {cta}
                                    <ArrowUpRight size={14} />
                                </a>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Start here */}
                <section aria-labelledby="start-heading" className="border-b border-white/[0.08] py-24">
                    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                        <div className="lg:col-span-4">
                            <h2 id="start-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                                Start here.
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-zinc-400">
                                Everything you need to go from reading to a first pull request.
                            </p>
                        </div>

                        <ul className={`${CARD} divide-y divide-white/[0.08] overflow-hidden lg:col-span-8`}>
                            {START_HERE.map(({icon: Icon, title, copy, href}) => (
                                <li key={title}>
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-start gap-4 px-7 py-5 transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40"
                                    >
                                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                                            <Icon size={17} />
                                        </span>
                                        <span className="flex-1">
                                            <span className="block text-base font-semibold text-white transition-colors group-hover:text-indigo-200">
                                                {title}
                                            </span>
                                            <span className="mt-1 block text-sm leading-6 text-zinc-400">{copy}</span>
                                        </span>
                                        <ArrowUpRight size={16} className="mt-1 shrink-0 text-zinc-400 transition-colors group-hover:text-white" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Where help fits */}
                <section aria-labelledby="areas-heading" className="border-b border-white/[0.08] py-24">
                    <h2 id="areas-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                        Where help fits.
                    </h2>

                    <dl className="mt-12 divide-y divide-white/[0.08] border-y border-white/[0.08]">
                        {AREAS.map(({title, path, copy, href, label}) => (
                            <div key={title} className="grid gap-4 py-8 md:grid-cols-12 md:gap-8">
                                <dt className="md:col-span-4">
                                    <span className="block text-lg font-semibold text-white">{title}</span>
                                    <span className="mt-1 block font-mono text-xs text-zinc-400">{path}</span>
                                </dt>
                                <dd className="text-sm leading-7 text-zinc-400 md:col-span-6">{copy}</dd>
                                <dd className="md:col-span-2 md:text-right">
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                                    >
                                        {label}
                                        <ArrowUpRight size={13} />
                                    </a>
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>

                {/* How a change lands */}
                <section aria-labelledby="flow-heading" className="border-b border-white/[0.08] py-24">
                    <h2 id="flow-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                        How a change lands.
                    </h2>

                    <ol className="mt-12 grid gap-6 md:grid-cols-3">
                        {STEPS.map(({title, copy}, i) => (
                            <li key={title} className={`${CARD} p-7`}>
                                <span className="font-mono text-sm text-indigo-300">Step {i + 1}</span>
                                <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
                                <p className="mt-2 text-sm leading-7 text-zinc-400">{copy}</p>
                            </li>
                        ))}
                    </ol>

                    <p className="mt-10 flex items-center gap-3 text-sm text-zinc-400">
                        <FileText size={16} className="shrink-0 text-zinc-400" />
                        <span>
                            Prismio follows the Contributor Covenant.{' '}
                            <a
                                href={`${REPO}/blob/main/CONTRIBUTING.md#code-of-conduct`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                            >
                                Read the Code of Conduct
                            </a>
                            .
                        </span>
                    </p>
                </section>

                {/* Closing CTA */}
                <section className="pt-24 text-center">
                    <div className="mx-auto max-w-3xl space-y-6">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Rather just try it first?
                        </h2>
                        <p className="mx-auto max-w-xl text-base text-zinc-400">
                            Install Prismio, write something small, and report where it broke.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                            <Link
                                href="/install"
                                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                Install Prismio
                                <ArrowRight size={15} />
                            </Link>
                            <a
                                href="https://docs.prismio.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                Read the docs
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
