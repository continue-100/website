'use client';

import React, {useEffect, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowUpRight, Check, Copy} from 'lucide-react';
import type {JetBrainsPluginInfo} from '@/app/api/marketplace/route';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';

// What the plugin does, taken from its own Marketplace description.
const FEATURES = [
    'Syntax highlighting for .psm files and build.ums manifests',
    'Completion that knows the type in front of the dot, with imports added for you',
    'Compiler errors as you type, with a quick fix for a missing import',
    'Go to declaration, find usages, and rename',
    'Formatting, folding, brace matching, and live templates',
    'Run, build, and test from the gutter and the run menu',
];

interface IntelliJPluginCardProps {
    className?: string;
}

export default function IntelliJPluginCard({className = ''}: IntelliJPluginCardProps) {
    const [info, setInfo] = useState<JetBrainsPluginInfo | null>(null);
    const [copied, setCopied] = useState(false);

    // Until the Marketplace answers, the card assumes the cautious state: not yet installable.
    useEffect(() => {
        let cancelled = false;
        fetch('/api/marketplace')
            .then((res) => (res.ok ? res.json() : null))
            .then((data: JetBrainsPluginInfo | null) => {
                if (data && !cancelled) setInfo(data);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    const approved = info?.approved ?? false;
    const marketplaceUrl = info?.marketplaceUrl ?? 'https://plugins.jetbrains.com/plugin/34672-prismio';
    const githubUrl = info?.githubUrl ?? 'https://github.com/prismio-lang/intellij-plugin';
    const pluginName = info?.name ?? 'Prismio';

    const copyName = async () => {
        try {
            await navigator.clipboard.writeText(pluginName);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // The name stays selectable.
        }
    };

    return (
        <div className={`overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/70 backdrop-blur-xl ${className}`}>
            <div className="grid lg:grid-cols-12">
                {/* The plugin */}
                <div className="border-b border-white/[0.08] bg-white/[0.02] p-8 lg:col-span-5 lg:border-b-0 lg:border-r">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                        <Image src="/icons/intellij-prismio.svg" alt="" width={28} height={28} className="object-contain" />
                    </div>
                    <h3 className="mt-6 text-2xl font-semibold tracking-tight text-white">JetBrains IDEs</h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-400">
                        Official Prismio support for IntelliJ IDEA, CLion, and the other JetBrains IDEs.
                    </p>

                    <p
                        className={`mt-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                            approved
                                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                                : 'border-amber-500/25 bg-amber-500/10 text-amber-200'
                        }`}
                    >
                        <span aria-hidden className={`size-1.5 rounded-full ${approved ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {approved ? `On the Marketplace · v${info?.version}` : 'Waiting for JetBrains approval'}
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <a
                            href={marketplaceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${FOCUS} ${
                                approved ? 'bg-white text-black hover:bg-zinc-200' : 'border border-white/15 text-white hover:bg-white/[0.06]'
                            }`}
                        >
                            Marketplace page
                            <ArrowUpRight size={14} />
                        </a>
                        <a
                            href={githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 transition-colors hover:text-white ${FOCUS}`}
                        >
                            Source on GitHub
                            <ArrowUpRight size={13} />
                        </a>
                    </div>
                </div>

                {/* What it does, and how to get it */}
                <div className="p-8 lg:col-span-7">
                    <h4 className="text-sm font-semibold text-white">What you get</h4>
                    <ul className="mt-4 divide-y divide-white/[0.06]">
                        {FEATURES.map((feature) => (
                            <li key={feature} className="flex gap-3 py-3 text-sm leading-6 text-zinc-300">
                                <Check size={15} className="mt-1 shrink-0 text-emerald-400" aria-hidden />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    {approved ? (
                        <div className="mt-6 rounded-xl border border-white/[0.08] bg-black/30 p-4 text-sm leading-7 text-zinc-300">
                            <p>
                                In your IDE open <strong className="text-white">Settings → Plugins → Marketplace</strong>, search for
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/50 px-3 py-2 font-mono text-sm text-zinc-100">
                                <span>{pluginName}</span>
                                <button
                                    type="button"
                                    onClick={copyName}
                                    className={`inline-flex items-center gap-1.5 rounded text-xs text-zinc-300 transition-colors hover:text-white ${FOCUS}`}
                                    aria-label="Copy the plugin name"
                                >
                                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                    <span className="font-sans">{copied ? 'Copied' : 'Copy'}</span>
                                </button>
                            </div>
                            <p className="mt-2">then press Install and restart the IDE if asked.</p>
                        </div>
                    ) : (
                        <p className="mt-6 text-sm leading-7 text-zinc-400">
                            The plugin is built and released on GitHub, but it won&apos;t show up in the Marketplace search until
                            JetBrains approves it. Watch the repository for the release.
                        </p>
                    )}
                </div>
            </div>

            {/* Other editors */}
            <div className="grid divide-y divide-white/[0.08] border-t border-white/[0.08] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <a
                    href="https://github.com/prismio-lang/prismio-tmlanguage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center justify-between gap-4 px-8 py-5 transition-colors hover:bg-white/[0.03] focus-visible:ring-inset ${FOCUS}`}
                >
                    <span>
                        <span className="block text-sm font-semibold text-white">Other editors</span>
                        <span className="mt-0.5 block text-sm text-zinc-400">A TextMate grammar for syntax highlighting.</span>
                    </span>
                    <ArrowUpRight size={16} className="shrink-0 text-zinc-400 transition-colors group-hover:text-white" />
                </a>
                <Link
                    href="/roadmap"
                    className={`group flex items-center justify-between gap-4 px-8 py-5 transition-colors hover:bg-white/[0.03] focus-visible:ring-inset ${FOCUS}`}
                >
                    <span>
                        <span className="block text-sm font-semibold text-white">Language server</span>
                        <span className="mt-0.5 block text-sm text-zinc-400">Not available yet. See the roadmap.</span>
                    </span>
                    <ArrowUpRight size={16} className="shrink-0 text-zinc-400 transition-colors group-hover:text-white" />
                </Link>
            </div>
        </div>
    );
}
