'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface IntelliJPluginCardProps {
    className?: string;
}

export default function IntelliJPluginCard({ className = '' }: IntelliJPluginCardProps) {
    const [copied, setCopied] = useState(false);

    const marketplaceUrl = "https://plugins.jetbrains.com/plugin/32192-prismio-language-support";
    const githubUrl = "https://github.com/prismio-lang/intellij-plugin";
    const pluginName = "Prismio Language Support";

    const handleCopy = () => {
        navigator.clipboard.writeText(pluginName);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`rounded-2xl border border-white/10 bg-[#0b0c10] p-6 sm:p-8 ${className}`}>
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                {/* Left: Quick IDE Setup */}
                <div className="lg:col-span-7 space-y-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-2">
                                <Image
                                    src="/icons/intellij-prismio.svg"
                                    alt="IntelliJ IDEA"
                                    width={24}
                                    height={24}
                                    className="object-contain"
                                />
                            </div>
                            <h3 className="text-xl font-semibold text-white">
                                Quick IDE Setup
                            </h3>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                            Official language support for Prismio (<code className="text-zinc-200">.psm</code>) in IntelliJ IDEA, CLion, and all JetBrains IDEs.
                        </p>
                    </div>

                    <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm text-zinc-300">
                        <div className="flex items-start gap-2.5">
                            <span className="font-mono text-xs text-zinc-500 mt-0.5">1.</span>
                            <span>Open <strong>Settings</strong> (<code className="text-xs text-zinc-400">⌘,</code> / <code className="text-xs text-zinc-400">Ctrl+Alt+S</code>) → <strong>Plugins</strong> → <strong>Marketplace</strong></span>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <span className="font-mono text-xs text-zinc-500 mt-0.5">2.</span>
                            <div className="flex-1">
                                <span>Search for:</span>
                                <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-zinc-200">
                                    <span>{pluginName}</span>
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                                        title="Copy name"
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={13} className="text-emerald-400" />
                                                <span className="text-emerald-400 font-sans">Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={13} />
                                                <span className="font-sans">Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <span className="font-mono text-xs text-zinc-500 mt-0.5">3.</span>
                            <span>Click <strong>Install</strong> and restart the IDE if prompted.</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs">
                        <a
                            href={marketplaceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-medium text-white hover:text-zinc-300 transition-colors"
                        >
                            <span>JetBrains Marketplace</span>
                            <ExternalLink size={12} className="opacity-70" />
                        </a>
                        <span className="text-zinc-700">·</span>
                        <a
                            href={githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
                        >
                            <span>Source Code</span>
                            <ExternalLink size={11} className="opacity-60" />
                        </a>
                    </div>
                </div>

                {/* Right: JetBrains Official Marketplace Embeddable Card Iframe */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center">
                    <div className="overflow-hidden rounded-[8px] max-w-full shadow-lg">
                        <iframe
                            src="https://plugins.jetbrains.com/embeddable/card/32192"
                            width="384px"
                            height="260px"
                            loading="lazy"
                            title="Prismio Language Support"
                            className="block border-0 max-w-full rounded-[8px]"
                            scrolling="no"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
