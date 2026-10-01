'use client';

import React, { useState } from 'react';
import { Cpu, Layers, Gauge, Terminal, Check, Copy, CheckCircle2, ShieldAlert } from 'lucide-react';
import BenchmarkRunCommands from './BenchmarkRunCommands';
import type {BenchmarkEnvironment, ParsedBuildCommand} from '@/lib/benchmarks';
import {PRISMIO_VERSION} from '@prismio/utils';

type Arm = 'prismio' | 'cpp' | 'rust';
type CommandTab = 'all' | Arm;
type TokenKind = 'tool' | 'sub' | 'flag' | 'source' | 'outflag' | 'output';
type Token = {text: string; kind: TokenKind};

interface BenchmarkMethodologyProps {
    eliminationNs?: number;
    runs?: number;
    buildCommands: Record<Arm, ParsedBuildCommand | null>;
    environment?: BenchmarkEnvironment;
}

const ARM_LABEL: Record<Arm, string> = {
    prismio: 'Prismio',
    cpp: 'Clang++ (C++20)',
    rust: 'Rustc',
};

const ARM_STYLE: Record<Arm, {tool: string; output: string}> = {
    prismio: {tool: 'text-purple-300 font-semibold', output: 'text-purple-200'},
    cpp: {tool: 'text-sky-300 font-semibold', output: 'text-sky-200'},
    rust: {tool: 'text-orange-300 font-semibold', output: 'text-orange-200'},
};

const KIND_STYLE: Record<Exclude<TokenKind, 'tool' | 'output'>, string> = {
    sub: 'text-sky-300',
    flag: 'text-cyan-400 font-medium',
    source: 'text-zinc-200',
    outflag: 'text-cyan-400 font-medium',
};

/** Lay a parsed command out as lines of typed tokens (same shape for rendering and for copy). */
function layoutCommand(cmd: ParsedBuildCommand): Token[][] {
    const head: Token[] = [{text: cmd.tool, kind: 'tool'}];
    if (cmd.sub) head.push({text: cmd.sub, kind: 'sub'});
    cmd.flags.forEach((f) => head.push({text: f, kind: 'flag'}));

    const sources: Token[] = cmd.sources.map((text) => ({text, kind: 'source' as const}));
    const out: Token[] = cmd.output
        ? [{text: '-o', kind: 'outflag'}, {text: cmd.output, kind: 'output'}]
        : [];

    // A single source file stays on the first line; several get their own line.
    if (sources.length <= 1) return [[...head, ...sources, ...out]];
    return [head, sources, out].filter((line) => line.length > 0);
}

function commandText(cmd: ParsedBuildCommand): string {
    return layoutCommand(cmd)
        .map((line) => line.map((t) => t.text).join(' '))
        .join(' \\\n  ');
}

function CommandView({arm, cmd, comment}: {arm: Arm; cmd: ParsedBuildCommand; comment: string}) {
    const lines = layoutCommand(cmd);
    const style = (token: Token) =>
        token.kind === 'tool'
            ? ARM_STYLE[arm].tool
            : token.kind === 'output'
              ? ARM_STYLE[arm].output
              : KIND_STYLE[token.kind];

    return (
        <div className="space-y-1">
            <div className="text-zinc-400 italic select-none">{comment}</div>
            <div className="pt-1 space-y-1">
                {lines.map((line, i) => (
                    <div key={i} className={i === 0 ? '' : 'pl-4'}>
                        {line.map((token, j) => (
                            <React.Fragment key={j}>
                                {j > 0 && ' '}
                                <span className={style(token)}>{token.text}</span>
                            </React.Fragment>
                        ))}
                        {i < lines.length - 1 && <span className="text-zinc-400"> \</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function BenchmarkMethodology({
    eliminationNs = 10000,
    runs = 5,
    buildCommands,
    environment = {},
}: BenchmarkMethodologyProps) {
    const arms = (['prismio', 'cpp', 'rust'] as Arm[]).filter((arm) => buildCommands[arm]);

    const copyText = (tab: CommandTab): string => {
        const picked = tab === 'all' ? arms : arms.filter((arm) => arm === tab);
        return picked
            .map((arm, i) => {
                const label = tab === 'all' ? `# ${i + 1}. ${ARM_LABEL[arm]}` : `# ${ARM_LABEL[arm]}`;
                return `${label}\n${commandText(buildCommands[arm] as ParsedBuildCommand)}`;
            })
            .join('\n\n');
    };

    const [activeTab, setActiveTab] = useState<CommandTab>('all');
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(copyText(activeTab));
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            // fallback
        }
    };

    return (
        <section aria-labelledby="methodology-heading" className="border-t border-white/[0.08] pt-16 space-y-10">
            {/* Header */}
            <div className="max-w-3xl space-y-3">
                <h2 id="methodology-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                    Test Environment &amp; Benchmark Methodology
                </h2>
                <p className="text-sm leading-relaxed text-zinc-400">
                    Exact host hardware specifications, compiler toolchains, optimization flags,
                    and harness parameters used for the latest checked-in benchmark run.
                </p>
            </div>

            {/* Test Environment Specifications Panel */}
            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090a0e]">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
                    {/* Panel 1: Host Environment */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                            <Cpu size={14} className="text-zinc-300" />
                            Host Hardware &amp; OS
                        </div>
                        <dl className="space-y-3 text-xs">
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Processor</dt>
                                <dd className="font-mono text-zinc-200">{environment.processor ?? 'Apple M5 (10 cores)'}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Memory</dt>
                                <dd className="font-mono text-zinc-200">{environment.memory ?? '16 GB Unified Memory'}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Operating System</dt>
                                <dd className="font-mono text-zinc-200">{environment.os ?? 'macOS 27.0 (Darwin 26A428)'}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Target Triple</dt>
                                <dd className="font-mono text-zinc-200">{environment.target ?? 'arm64-apple-darwin'}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Power State</dt>
                                <dd className="font-mono text-zinc-200">{environment.power ?? 'AC Power (No throttling)'}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Panel 2: Toolchains & Compilers */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                            <Layers size={14} className="text-zinc-300" />
                            Toolchains &amp; Compilers
                        </div>
                        <dl className="space-y-3 text-xs">
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Prismio</dt>
                                <dd className="font-mono text-purple-300 font-medium">
                                    {environment.prismio ?? PRISMIO_VERSION.replace(/^v/, '')} <span className="text-zinc-400 font-normal">(LLVM {environment.llvm ?? '23.1.1'})</span>
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Clang++</dt>
                                <dd className="font-mono text-sky-300 font-medium">
                                    {environment.clang ?? '23.1.1'} <span className="text-zinc-400 font-normal">(C++20)</span>
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Rustc</dt>
                                <dd className="font-mono text-orange-300 font-medium">
                                    {environment.rustc ?? '1.97.1'} <span className="text-zinc-400 font-normal">(Edition 2021)</span>
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Timing Harness</dt>
                                <dd className="font-mono text-zinc-200">{environment.harness ?? 'benchmarks/run.py (v1)'}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">LLVM Backend</dt>
                                <dd className="font-mono text-zinc-200">{environment.llvm ? `LLVM ${environment.llvm}` : 'Homebrew LLVM 23'}</dd>
                            </div>
                            {environment.prismioProfile && (
                                <div className="flex items-baseline justify-between gap-4">
                                    <dt className="text-zinc-400">Prismio compiler</dt>
                                    <dd className="font-mono text-zinc-200">{environment.prismioProfile} build</dd>
                                </div>
                            )}
                            {environment.source && (
                                <div className="flex items-baseline justify-between gap-4">
                                    <dt className="text-zinc-400">Source</dt>
                                    <dd className="font-mono text-zinc-200">{environment.source}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Panel 3: Measurement Harness */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                            <Gauge size={14} className="text-zinc-300" />
                            Measurement Parameters
                        </div>
                        <dl className="space-y-3 text-xs">
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Sampling</dt>
                                <dd className="font-mono text-zinc-200">{runs} independent runs / arm</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Reported Metric</dt>
                                <dd className="font-mono text-zinc-200">Median elapsed nanoseconds</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Memory Metric</dt>
                                <dd className="font-mono text-zinc-200">Peak RSS (task_info)</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">Correctness</dt>
                                <dd className="font-mono text-zinc-200">64-bit checksum verification</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-400">DCE Filter</dt>
                                <dd className="font-mono text-zinc-200">≤ {(eliminationNs / 1000).toFixed(0)} µs (excluded)</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            {/* Production Build Commands & Optimization Flags */}
            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090a0e]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-black/40 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-zinc-300" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                            Compiler Build Commands &amp; Flags
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5 text-xs">
                            <button
                                type="button"
                                aria-pressed={activeTab === 'all'}
                                onClick={() => setActiveTab('all')}
                                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                                    activeTab === 'all'
                                        ? 'bg-white/10 text-white font-medium'
                                        : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                All Arms
                            </button>
                            <button
                                type="button"
                                aria-pressed={activeTab === 'prismio'}
                                onClick={() => setActiveTab('prismio')}
                                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                                    activeTab === 'prismio'
                                        ? 'bg-purple-500/20 text-purple-300 font-medium'
                                        : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                Prismio
                            </button>
                            <button
                                type="button"
                                aria-pressed={activeTab === 'cpp'}
                                onClick={() => setActiveTab('cpp')}
                                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                                    activeTab === 'cpp'
                                        ? 'bg-sky-500/20 text-sky-300 font-medium'
                                        : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                Clang++
                            </button>
                            <button
                                type="button"
                                aria-pressed={activeTab === 'rust'}
                                onClick={() => setActiveTab('rust')}
                                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                                    activeTab === 'rust'
                                        ? 'bg-orange-500/20 text-orange-300 font-medium'
                                        : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                Rustc
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                            aria-label="Copy build command"
                        >
                            <span aria-live="polite" className="sr-only">{copied ? 'Copied to clipboard' : ''}</span>
                            {copied ? (
                                <>
                                    <Check size={12} className="text-emerald-400" />
                                    <span className="text-emerald-400 font-medium">Copied</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={12} />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="bg-black/60 p-5 font-mono text-xs leading-relaxed overflow-x-auto select-text">
                    <div className="space-y-5">
                        {arms
                            .filter((arm) => activeTab === 'all' || activeTab === arm)
                            .map((arm, i) => (
                                <CommandView
                                    key={arm}
                                    arm={arm}
                                    cmd={buildCommands[arm] as ParsedBuildCommand}
                                    comment={activeTab === 'all' ? `# ${i + 1}. ${ARM_LABEL[arm]}` : `# ${ARM_LABEL[arm]}`}
                                />
                            ))}
                    </div>
                </div>
            </div>
            {/* Run & Reproduce Locally Section */}
            <div className="rounded-xl border border-white/[0.08] bg-[#090a0e] p-6 space-y-4">
                <div className="flex items-center gap-2 text-zinc-200">
                    <Terminal size={15} className="text-zinc-300" />
                    <h3 className="text-sm font-semibold text-white">
                        Run &amp; Reproduce Locally
                    </h3>
                </div>
                <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                    The harness (<code className="text-zinc-300">benchmarks/run.py</code>), benchmark sources, and checked-in results
                    are part of the open-source repository. To build and execute the entire differential suite locally:
                </p>

                <div className="max-w-xl">
                    <BenchmarkRunCommands />
                </div>
            </div>
        </section>
    );
}
