'use client';

import React, {useState} from 'react';
import Link from 'next/link';
import {ArrowRight, Check, Copy, FileCode2, Terminal} from 'lucide-react';
import {LLVM_VERSION} from "@prismio/utils";

const QUICKSTART = 'curl -fsSL https://prismio.org/install.sh | sh';

interface CodeToken {
    text: string;
    cls?: string;
}

interface CodeLine {
    num: number;
    highlighted?: boolean;
    tokens: CodeToken[];
}

const SOURCE_LINES: CodeLine[] = [
    {
        num: 1,
        tokens: [
            {text: 'struct', cls: 'text-indigo-400 font-medium'},
            {text: ' '},
            {text: 'Point', cls: 'text-[#47d7b5] font-medium'},
            {text: ' {', cls: 'text-zinc-500'},
        ],
    },
    {
        num: 2,
        tokens: [
            {text: '    x', cls: 'text-zinc-300'},
            {text: ': ', cls: 'text-zinc-500'},
            {text: 'Int', cls: 'text-emerald-400'},
            {text: ',', cls: 'text-zinc-500'},
        ],
    },
    {
        num: 3,
        tokens: [
            {text: '    y', cls: 'text-zinc-300'},
            {text: ': ', cls: 'text-zinc-500'},
            {text: 'Int', cls: 'text-emerald-400'},
        ],
    },
    {
        num: 4,
        tokens: [
            {text: '}', cls: 'text-zinc-500'},
        ],
    },
    {
        num: 5,
        tokens: [
            {text: ''},
        ],
    },
    {
        num: 6,
        tokens: [
            {text: 'fn', cls: 'text-indigo-400 font-medium'},
            {text: ' '},
            {text: 'sumLocal', cls: 'text-sky-300'},
            {text: '()', cls: 'text-zinc-400'},
            {text: ' -> ', cls: 'text-indigo-300'},
            {text: 'Int', cls: 'text-emerald-400'},
            {text: ' {', cls: 'text-zinc-500'},
        ],
    },
    {
        num: 7,
        highlighted: true,
        tokens: [
            {text: '    let', cls: 'text-indigo-400 font-medium'},
            {text: ' '},
            {text: 'point', cls: 'text-zinc-100'},
            {text: ' = ', cls: 'text-zinc-400'},
            {text: 'Point', cls: 'text-[#47d7b5] font-medium'},
            {text: ' { ', cls: 'text-zinc-400'},
            {text: 'x', cls: 'text-zinc-300'},
            {text: ': ', cls: 'text-zinc-500'},
            {text: '3', cls: 'text-amber-300'},
            {text: ', ', cls: 'text-zinc-500'},
            {text: 'y', cls: 'text-zinc-300'},
            {text: ': ', cls: 'text-zinc-500'},
            {text: '4', cls: 'text-amber-300'},
            {text: ' }', cls: 'text-zinc-400'},
        ],
    },
    {
        num: 8,
        tokens: [
            {text: '    return', cls: 'text-indigo-400 font-medium'},
            {text: ' '},
            {text: 'point', cls: 'text-zinc-200'},
            {text: '.', cls: 'text-zinc-500'},
            {text: 'x', cls: 'text-zinc-300'},
            {text: ' + ', cls: 'text-indigo-300'},
            {text: 'point', cls: 'text-zinc-200'},
            {text: '.', cls: 'text-zinc-500'},
            {text: 'y', cls: 'text-zinc-300'},
        ],
    },
    {
        num: 9,
        tokens: [
            {text: '}', cls: 'text-zinc-500'},
        ],
    },
];

export default function Hero() {
    const [copied, setCopied] = useState(false);

    const copyQuickstart = async () => {
        await navigator.clipboard.writeText(QUICKSTART);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    return (
        <section className="relative mx-auto max-w-7xl px-6 pb-28 pt-14 md:pb-36 md:pt-20">
            <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-20">
                <div className="lg:col-span-7 lg:pt-2">
                    <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl lg:text-[4rem]">
                        Serious performance.
                    </h1>
                    <h1 className="max-w-3xl mt-2 text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-white opacity-50 sm:text-6xl lg:text-[4rem]">
                        Friendly design.
                    </h1>

                    <p className="mt-8 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
                        Prismio is a statically typed systems programming language that compiles to native
                        machine code through LLVM. Its Adaptive Inference Framework decides where
                        values live, explains every placement, and can verify those decisions at runtime.
                    </p>

                    <div className="mt-9 flex flex-wrap items-center gap-3">
                        <Link
                            href="/install"
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            <Terminal size={16}/>
                            Install Prismio
                        </Link>
                        <a
                            href="https://docs.prismio.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            Read the language guide
                            <ArrowRight size={15}/>
                        </a>
                    </div>

                    <div className="mt-9 max-w-2xl border-t border-white/[0.08] pt-6">
                        <div className="mb-3 flex items-center justify-between text-xs text-zinc-500">
                            <span>Install Prismio</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-xl bg-[#0c0d11] px-4 py-3 ring-1 ring-white/[0.08] transition-colors hover:ring-white/[0.14]">
                            <code className="min-w-0 overflow-x-auto whitespace-nowrap font-mono text-xs sm:text-sm">
                                <span className="mr-2 select-none font-bold text-indigo-400">$</span>
                                <span className="font-semibold text-white">curl</span>
                                {' '}
                                <span className="text-indigo-300">-fsSL</span>
                                {' '}
                                <span className="text-[#47d7b5]">https://prismio.org/install.sh</span>
                                {' '}
                                <span className="font-medium text-zinc-500">|</span>
                                {' '}
                                <span className="font-semibold text-white">sh</span>
                            </code>
                            <button
                                type="button"
                                onClick={copyQuickstart}
                                className="inline-flex cursor-pointer shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                                aria-label="Copy quickstart command"
                            >
                                {copied ? <Check size={14} className="text-emerald-400"/> : <Copy size={14}/>}
                                <span className="font-medium">{copied ? 'Copied' : 'Copy'}</span>
                            </button>
                        </div>
                    </div>

                    <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-5 text-sm">
                        <div>
                            <dt className="text-zinc-500">Compiler</dt>
                            <dd className="mt-1 font-medium text-zinc-200">Self-hosted</dd>
                        </div>
                        <div>
                            <dt className="text-zinc-500">Backend</dt>
                            <dd className="mt-1 font-medium text-zinc-200">{`LLVM ${LLVM_VERSION} AOT + JIT`}</dd>
                        </div>
                        <div>
                            <dt className="text-zinc-500">Interop</dt>
                            <dd className="mt-1 font-medium text-zinc-200">Direct C ABI</dd>
                        </div>
                    </dl>
                </div>

                <div className="lg:col-span-5">
                    <div className="relative group">
                        {/* Ambient subtle glow */}
                        <div
                            className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-transparent to-emerald-500/10 blur-xl opacity-70 transition-opacity duration-500 group-hover:opacity-90"
                            aria-hidden="true"
                        />

                        <div className="relative overflow-hidden rounded-2xl bg-[#0b0c10] shadow-[0_24px_80px_-32px_rgba(67,56,202,0.4)] ring-1 ring-white/[0.09]">
                            {/* Top edge subtle highlight */}
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />

                            {/* Header bar */}
                            <div className="flex items-center border-b border-white/[0.07] px-4 py-3 sm:px-5">
                                <div className="flex items-center gap-3.5">
                                    <div className="flex items-center gap-2" aria-hidden="true">
                                        <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                                        <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                                        <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-md bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 text-xs font-mono text-zinc-200">
                                        <FileCode2 size={13} className="text-indigo-400" />
                                        <span>main.psm</span>
                                    </div>
                                </div>
                            </div>

                            {/* Top: Source Code with Syntax Highlighting */}
                            <div className="py-4 pl-3.5 pr-4">
                                <pre className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-[12px] leading-6 sm:text-[13px]">
                                    {SOURCE_LINES.map((line) => (
                                        <div
                                            key={line.num}
                                            className={`flex items-center rounded-sm ml-1 transition-colors ${
                                                line.highlighted
                                                    && 'bg-indigo-500/[0.12]'
                                            }`}
                                        >
                                            <span
                                                className={`mr-3 w-4 select-none text-right font-mono text-[11px] ${
                                                    line.highlighted ? 'text-indigo-400 font-semibold' : 'text-zinc-600'
                                                }`}>
                                                {line.num}
                                            </span>

                                            <code className="whitespace-pre ml-1 font-mono text-zinc-300">
                                                {line.tokens.map((tok, i) => (
                                                    <span key={i} className={tok.cls || ''}>
                                                        {tok.text}
                                                    </span>
                                                ))}
                                            </code>
                                        </div>
                                    ))}
                                </pre>
                            </div>

                            {/* Bottom: Compiler Output as Terminal Drawer */}
                            <div className="border-t border-white/[0.08] bg-[#06070a] p-4 sm:p-5 font-mono text-[11px] leading-5 sm:text-xs">
                                <div className="text-zinc-500">$ prismio aif main.psm</div>

                                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                                    <div>
                                        <div className="text-zinc-200 font-medium">Storage plan</div>
                                        <div className="mt-2 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-zinc-400">
                                            <span>Stack</span><span className="text-emerald-400">1</span>
                                            <span>Arena</span><span>0</span>
                                            <span>Unique heap</span><span>0</span>
                                            <span>Scoped heap</span><span>0</span>
                                            <span>Shared heap</span><span>0</span>
                                            <span>Cycle-managed heap</span><span>0</span>
                                        </div>
                                    </div>

                                    <div className="sm:border-l sm:border-white/[0.07] sm:pl-6">
                                        <div className="text-zinc-200 font-medium">Your code</div>
                                        <div className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-zinc-400">
                                            <span className="text-zinc-500">ID</span>
                                            <span className="font-mono text-zinc-300">1</span>

                                            <span className="text-zinc-500">Location</span>
                                            <span className="font-mono text-zinc-300">main.psm:7:23</span>

                                            <span className="text-zinc-500">Type</span>
                                            <span className="font-medium text-[#47d7b5]">Point</span>

                                            <span className="text-zinc-500">Storage</span>
                                            <span className="font-medium text-emerald-400">stack</span>
                                        </div>

                                        <div className="mt-2.5 border-t border-white/[0.07] pt-2">
                                            <div className="text-zinc-500">Reason</div>
                                            <div className="mt-0.5 text-zinc-300">small value does not escape</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer compile status bar */}
                            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-white/[0.07] bg-white/[0.015] px-4 py-2.5 sm:px-5 font-mono text-[11px]">
                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-zinc-400">
                                    <span className="text-emerald-400 font-semibold">✓</span>
                                    <span className="text-zinc-200">Finished in <span className="text-emerald-400 font-medium">14.2ms</span></span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-500 ml-auto">
                                    <span>0 warnings</span>
                                    <span className="text-zinc-700 select-none">·</span>
                                    <span className="text-zinc-400">0 errors</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
