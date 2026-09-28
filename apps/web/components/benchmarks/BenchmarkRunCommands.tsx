'use client';

import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

export default function BenchmarkRunCommands() {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText('prismio build\nprismio bench');
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            // fallback
        }
    };

    return (
        <div className="space-y-2.5">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                        <Terminal size={13} className="text-emerald-400" />
                        <span className="font-mono text-[11px] text-zinc-400">Terminal</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
                        aria-label="Copy benchmark build commands"
                    >
                        {copied ? (
                            <>
                                <Check size={12} className="text-emerald-400" />
                                <span className="text-emerald-400 font-medium text-[11px]">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy size={12} />
                                <span className="font-medium text-[11px]">Copy</span>
                            </>
                        )}
                    </button>
                </div>
                <div className="p-3.5 font-mono text-xs sm:text-sm space-y-1.5 select-all">
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 select-none font-bold">&gt;</span>
                        <span className="text-emerald-400 font-semibold tracking-wide">prismio build</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 select-none font-bold">&gt;</span>
                        <span className="text-emerald-400 font-semibold tracking-wide">prismio bench</span>
                    </div>
                </div>
            </div>
            <p className="text-xs leading-5 text-zinc-400">
                That&apos;s all. The Prismio CLI handles compiling the suite, invoking comparative baselines,
                sampling iterations, and validating checksums.
            </p>
        </div>
    );
}
