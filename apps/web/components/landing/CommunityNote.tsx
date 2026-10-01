import React from 'react';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';

const LINKS = [
    {
        title: 'Contribute',
        copy: 'Where to talk, how to set up a build, and how a change lands.',
        href: '/community',
        external: false,
    },
    {
        title: 'Sponsor the project',
        copy: 'Fund the CI runners, hosting, and focused compiler time.',
        href: '/sponsors',
        external: false,
    },
    {
        title: 'Browse open issues',
        copy: 'Bug reports, requests, and tracked work on GitHub.',
        href: 'https://github.com/prismio-lang/prismio/issues',
        external: true,
    },
];

const FACTS = [
    {label: 'License', value: 'Apache-2.0'},
    {label: 'Development', value: 'In the open on GitHub'},
    {label: 'CI', value: 'Linux, macOS, Windows'},
];

export default function CommunityNote() {
    return (
        <section aria-labelledby="community-heading" className="mx-auto max-w-7xl px-6 py-24">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-5">
                    <h2 id="community-heading" className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                        Developed in the open.
                    </h2>
                    <p className="mt-6 text-base leading-7 text-zinc-300">
                        Prismio is developed openly as an independent systems language project,
                        with no proprietary layers. Development is sustained through
                        technical contributions and infrastructure sponsorship.
                    </p>
                    <dl className="mt-8 space-y-2 text-sm">
                        {FACTS.map((fact) => (
                            <div key={fact.label} className="flex items-baseline gap-3">
                                <dt className="w-28 shrink-0 text-zinc-400">{fact.label}</dt>
                                <dd className="font-mono text-zinc-100">{fact.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <ul className="divide-y divide-white/[0.1] border-y border-white/[0.1] lg:col-span-7">
                    {LINKS.map((item) => {
                        const className =
                            'group flex items-center justify-between gap-6 py-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400';
                        const inner = (
                            <>
                                <span>
                                    <span className="block text-lg font-semibold text-white transition-colors group-hover:text-indigo-200">
                                        {item.title}
                                    </span>
                                    <span className="mt-1 block text-sm leading-6 text-zinc-400">{item.copy}</span>
                                </span>
                                <ArrowUpRight size={18} className="shrink-0 text-zinc-400 transition-colors group-hover:text-indigo-300" />
                            </>
                        );
                        return (
                            <li key={item.title}>
                                {item.external ? (
                                    <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
                                        {inner}
                                    </a>
                                ) : (
                                    <Link href={item.href} className={className}>
                                        {inner}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
