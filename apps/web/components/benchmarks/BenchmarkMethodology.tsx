'use client';

import React, { useState } from 'react';
import { Cpu, Layers, Gauge, Terminal, Check, Copy, CheckCircle2, ShieldAlert } from 'lucide-react';
import BenchmarkRunCommands from './BenchmarkRunCommands';

interface BenchmarkMethodologyProps {
    eliminationNs?: number;
    runs?: number;
}

const BUILD_COMMANDS = {
    all: `# 1. Prismio Native Release Build (LLVM 23 backend)
prismio build benchmarks/prismio/suite.psm -o benchmarks/build/prismio-suite

# 2. Clang++ C++20 Build (-O3 release, POSIX threads)
clang++ -O3 -std=c++20 -pthread \\
  benchmarks/cpp/{suite,algorithms,compute,data_structures,memory,io,adversarial}.cpp \\
  -o benchmarks/build/cpp-suite

# 3. Rustc Release Build (opt-level=3, edition 2021)
rustc -C opt-level=3 --edition=2021 benchmarks/rust/suite.rs \\
  -o benchmarks/build/rust-suite`,
    prismio: `# Prismio Native Release Build
# Compiles with LLVM 23 Native Backend & Whole-Program Optimization
prismio build benchmarks/prismio/suite.psm -o benchmarks/build/prismio-suite`,
    cpp: `# Clang++ C++20 Production Build
# -O3 optimization, C++20 standard, native target architecture
clang++ -O3 -std=c++20 -pthread \\
  benchmarks/cpp/{suite,algorithms,compute,data_structures,memory,io,adversarial}.cpp \\
  -o benchmarks/build/cpp-suite`,
    rust: `# Rustc Release Build
# -C opt-level=3 maximum optimization, edition 2021
rustc -C opt-level=3 --edition=2021 benchmarks/rust/suite.rs \\
  -o benchmarks/build/rust-suite`,
};

type CommandTab = 'all' | 'prismio' | 'cpp' | 'rust';

function CodePrismio() {
    return (
        <div className="space-y-1">
            <div className="text-zinc-500 italic select-none"># Prismio Native Release Build</div>
            <div className="text-zinc-500 italic select-none"># Compiles with LLVM 23 Native Backend &amp; Whole-Program Optimization</div>
            <div className="pt-1">
                <span className="text-emerald-400 font-semibold">prismio</span>{' '}
                <span className="text-sky-300">build</span>{' '}
                <span className="text-zinc-200">benchmarks/prismio/suite.psm</span>{' '}
                <span className="text-cyan-400 font-medium">-o</span>{' '}
                <span className="text-emerald-300">benchmarks/build/prismio-suite</span>
            </div>
        </div>
    );
}

function CodeCpp() {
    return (
        <div className="space-y-1">
            <div className="text-zinc-500 italic select-none"># Clang++ C++20 Production Build</div>
            <div className="text-zinc-500 italic select-none"># -O3 optimization, C++20 standard, native target architecture</div>
            <div className="pt-1">
                <span className="text-amber-400 font-semibold">clang++</span>{' '}
                <span className="text-cyan-400 font-medium">-O3</span>{' '}
                <span className="text-cyan-400 font-medium">-std=c++20</span>{' '}
                <span className="text-cyan-400 font-medium">-pthread</span>{' '}
                <span className="text-zinc-500">\</span>
            </div>
            <div className="pl-4">
                <span className="text-zinc-200">benchmarks/cpp/&#123;suite,algorithms,compute,data_structures,memory,io,adversarial&#125;.cpp</span>{' '}
                <span className="text-zinc-500">\</span>
            </div>
            <div className="pl-4">
                <span className="text-cyan-400 font-medium">-o</span>{' '}
                <span className="text-amber-300">benchmarks/build/cpp-suite</span>
            </div>
        </div>
    );
}

function CodeRust() {
    return (
        <div className="space-y-1">
            <div className="text-zinc-500 italic select-none"># Rustc Release Build</div>
            <div className="text-zinc-500 italic select-none"># -C opt-level=3 maximum optimization, edition 2021</div>
            <div className="pt-1">
                <span className="text-indigo-400 font-semibold">rustc</span>{' '}
                <span className="text-cyan-400 font-medium">-C</span>{' '}
                <span className="text-teal-300">opt-level=3</span>{' '}
                <span className="text-cyan-400 font-medium">--edition=2021</span>{' '}
                <span className="text-zinc-200">benchmarks/rust/suite.rs</span>{' '}
                <span className="text-zinc-500">\</span>
            </div>
            <div className="pl-4">
                <span className="text-cyan-400 font-medium">-o</span>{' '}
                <span className="text-indigo-300">benchmarks/build/rust-suite</span>
            </div>
        </div>
    );
}

function CodeAll() {
    return (
        <div className="space-y-5">
            <div className="space-y-1">
                <div className="text-zinc-500 italic select-none"># 1. Prismio Native Release Build (LLVM 23 backend)</div>
                <div className="pt-0.5">
                    <span className="text-emerald-400 font-semibold">prismio</span>{' '}
                    <span className="text-sky-300">build</span>{' '}
                    <span className="text-zinc-200">benchmarks/prismio/suite.psm</span>{' '}
                    <span className="text-cyan-400 font-medium">-o</span>{' '}
                    <span className="text-emerald-300">benchmarks/build/prismio-suite</span>
                </div>
            </div>

            <div className="space-y-1">
                <div className="text-zinc-500 italic select-none"># 2. Clang++ C++20 Build (-O3 release, POSIX threads)</div>
                <div className="pt-0.5">
                    <span className="text-amber-400 font-semibold">clang++</span>{' '}
                    <span className="text-cyan-400 font-medium">-O3</span>{' '}
                    <span className="text-cyan-400 font-medium">-std=c++20</span>{' '}
                    <span className="text-cyan-400 font-medium">-pthread</span>{' '}
                    <span className="text-zinc-500">\</span>
                </div>
                <div className="pl-4">
                    <span className="text-zinc-200">benchmarks/cpp/&#123;suite,algorithms,compute,data_structures,memory,io,adversarial&#125;.cpp</span>{' '}
                    <span className="text-zinc-500">\</span>
                </div>
                <div className="pl-4">
                    <span className="text-cyan-400 font-medium">-o</span>{' '}
                    <span className="text-amber-300">benchmarks/build/cpp-suite</span>
                </div>
            </div>

            <div className="space-y-1">
                <div className="text-zinc-500 italic select-none"># 3. Rustc Release Build (opt-level=3, edition 2021)</div>
                <div className="pt-0.5">
                    <span className="text-indigo-400 font-semibold">rustc</span>{' '}
                    <span className="text-cyan-400 font-medium">-C</span>{' '}
                    <span className="text-teal-300">opt-level=3</span>{' '}
                    <span className="text-cyan-400 font-medium">--edition=2021</span>{' '}
                    <span className="text-zinc-200">benchmarks/rust/suite.rs</span>{' '}
                    <span className="text-zinc-500">\</span>
                </div>
                <div className="pl-4">
                    <span className="text-cyan-400 font-medium">-o</span>{' '}
                    <span className="text-indigo-300">benchmarks/build/rust-suite</span>
                </div>
            </div>
        </div>
    );
}

export default function BenchmarkMethodology({
    eliminationNs = 10000,
    runs = 5,
}: BenchmarkMethodologyProps) {
    const [activeTab, setActiveTab] = useState<CommandTab>('all');
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(BUILD_COMMANDS[activeTab]);
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
                <div className="font-mono text-xs uppercase tracking-wider text-emerald-400">
                    Test Environment &amp; Configurations
                </div>
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
                            <Cpu size={14} className="text-emerald-400" />
                            Host Hardware &amp; OS
                        </div>
                        <dl className="space-y-3 text-xs">
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-500">Processor</dt>
                                <dd className="font-mono text-zinc-200">Apple M5 (10 cores)</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-500">Memory</dt>
                                <dd className="font-mono text-zinc-200">16 GB Unified Memory</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-500">Operating System</dt>
                                <dd className="font-mono text-zinc-200">macOS 27.0 (Darwin 26A428)</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-500">Target Triple</dt>
                                <dd className="font-mono text-zinc-200">arm64-apple-darwin</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-500">Power State</dt>
                                <dd className="font-mono text-zinc-200">AC Power (No throttling)</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Panel 2: Toolchains & Compilers */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                            <Layers size={14} className="text-indigo-400" />
                            Toolchains &amp; Compilers
                        </div>
                        <dl className="space-y-3 text-xs">
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-500">Prismio</dt>
                                <dd className="font-mono text-emerald-400 font-medium">
                                    0.1.0 <span className="text-zinc-500 font-normal">(LLVM 23.1.1)</span>
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-500">Clang++</dt>
                                <dd className="font-mono text-amber-400 font-medium">
                                    23.1.1 <span className="text-zinc-500 font-normal">(C++20)</span>
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-500">Rustc</dt>
                                <dd className="font-mono text-indigo-400 font-medium">
                                    1.97.1 <span className="text-zinc-500 font-normal">(Edition 2021)</span>
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-500">Timing Harness</dt>
                                <dd className="font-mono text-zinc-200">benchmarks/run.py (v1)</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-500">LLVM Backend</dt>
                                <dd className="font-mono text-zinc-200">Homebrew LLVM 23</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Panel 3: Measurement Harness */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                            <Gauge size={14} className="text-amber-400" />
                            Measurement Parameters
                        </div>
                        <dl className="space-y-3 text-xs">
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-500">Sampling</dt>
                                <dd className="font-mono text-zinc-200">{runs} independent runs / arm</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-500">Reported Metric</dt>
                                <dd className="font-mono text-zinc-200">Median elapsed nanoseconds</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-500">Memory Metric</dt>
                                <dd className="font-mono text-zinc-200">Peak RSS (task_info)</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-500">Correctness</dt>
                                <dd className="font-mono text-zinc-200">64-bit checksum verification</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-zinc-500">DCE Filter</dt>
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
                        <Terminal size={14} className="text-emerald-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                            Compiler Build Commands &amp; Flags
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5 text-xs">
                            <button
                                type="button"
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
                                onClick={() => setActiveTab('prismio')}
                                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                                    activeTab === 'prismio'
                                        ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                                        : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                Prismio
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('cpp')}
                                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                                    activeTab === 'cpp'
                                        ? 'bg-amber-500/20 text-amber-400 font-medium'
                                        : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                Clang++
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('rust')}
                                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                                    activeTab === 'rust'
                                        ? 'bg-indigo-500/20 text-indigo-400 font-medium'
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
                    {activeTab === 'prismio' && <CodePrismio />}
                    {activeTab === 'cpp' && <CodeCpp />}
                    {activeTab === 'rust' && <CodeRust />}
                    {activeTab === 'all' && <CodeAll />}
                </div>
            </div>
            {/* Run & Reproduce Locally Section */}
            <div className="rounded-xl border border-white/[0.08] bg-[#090a0e] p-6 space-y-4">
                <div className="flex items-center gap-2 text-zinc-200">
                    <Terminal size={15} className="text-emerald-400" />
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
