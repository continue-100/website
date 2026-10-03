'use client';

import React, {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowUpRight, Check, Copy} from 'lucide-react';
import GithubIcon from '@/components/icons/GithubIcon';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';

// Fixed on purpose: no request to the Marketplace, so the page stays fully static. Update when a new version is published.
const PLUGIN_NAME = 'Prismio';
const PLUGIN_VERSION = '0.1.0';
const MARKETPLACE_URL = 'https://plugins.jetbrains.com/plugin/34672-prismio';
const GITHUB_URL = 'https://github.com/prismio-lang/intellij-plugin';

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
    const [copied, setCopied] = useState(false);

    const copyName = async () => {
        try {
            await navigator.clipboard.writeText(PLUGIN_NAME);
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
                    <dl className="mt-6 divide-y divide-white/[0.06] border-y border-white/[0.06] text-sm">
                        <div className="flex items-baseline justify-between gap-4 py-3">
                            <dt className="text-zinc-500">Marketplace</dt>
                            <dd className="flex items-center gap-2 text-zinc-200">
                                <span aria-hidden className="size-1.5 rounded-full bg-emerald-400" />
                                Live, v{PLUGIN_VERSION}
                            </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-4 py-3">
                            <dt className="text-zinc-500">Recommended IDE</dt>
                            <dd className="font-medium text-white">CLion</dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-4 py-3">
                            <dt className="text-zinc-500">Works in</dt>
                            <dd className="text-zinc-200">Every JetBrains IDE</dd>
                        </div>
                    </dl>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <a
                            href={MARKETPLACE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 rounded-full border border-transparent bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 ${FOCUS}`}
                        >
                            Marketplace page
                            <ArrowUpRight size={14} />
                        </a>
                        <a
                            href={GITHUB_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06] ${FOCUS}`}
                        >
                            <GithubIcon size={16} />
                            Source on GitHub
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

                    <div className="mt-6 rounded-xl border border-white/[0.08] bg-black/30 p-4 text-sm leading-7 text-zinc-300">
                        <p>
                            In your IDE open <strong className="text-white">Settings → Plugins → Marketplace</strong>, search for
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/50 px-3 py-2 font-mono text-sm text-zinc-100">
                            <span>{PLUGIN_NAME}</span>
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
