import React from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    ArrowUpRight,
    CircleSlash2,
    FileText,
    Gauge,
    Cpu,
    CheckCircle2,
    Zap,
    Scale,
    Layers,
    Terminal,
} from 'lucide-react';
import HeaderMain from '@/components/HeaderMain';
import FooterMain from '@prismio/ui/FooterMain';
import BenchmarkMatrix from '@/components/benchmarks/BenchmarkMatrix';
import UnsupportedCatalog from '@/components/benchmarks/UnsupportedCatalog';
import BenchmarkMethodology from '@/components/benchmarks/BenchmarkMethodology';
import ToolchainMetrics from '@/components/benchmarks/ToolchainMetrics';
import { getBenchmarkDataset } from '@/lib/benchmarks';

export default function BenchmarksPage() {
    const data = getBenchmarkDataset();
    const { stats, categories, benchmarks, unsupported } = data;

    const comparisonCount = stats.implemented - stats.eliminated;
    const cppWinPct = (stats.winsVsCpp / comparisonCount) * 100;
    const cppParityPct = (stats.parityVsCpp / comparisonCount) * 100;
    const cppLossPct = (stats.lossesVsCpp / comparisonCount) * 100;

    const rustWinPct = (stats.winsVsRust / comparisonCount) * 100;
    const rustParityPct = (stats.parityVsRust / comparisonCount) * 100;
    const rustLossPct = (stats.lossesVsRust / comparisonCount) * 100;

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#070709] text-white selection:bg-indigo-500/30 selection:text-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[48rem] bg-[radial-gradient(ellipse_at_26%_6%,rgba(67,56,202,0.18),transparent_54%)]" />

            <HeaderMain />

            <main className="relative z-10 mx-auto max-w-[92rem] px-3 sm:px-5 lg:px-8 pb-28 pt-16 md:pt-24 space-y-20">
                {/* Hero / Header Section */}
                <section className="grid gap-10 border-b border-white/[0.09] pb-16 lg:grid-cols-12 lg:gap-16">
                    <div className="lg:col-span-8">
                        <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-white md:text-6xl">
                            Tested against C++ and Rust.
                        </h1>
                        <p className="mt-7 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg md:leading-8">
                            Differential benchmarks evaluating Prismio against Clang++ C++20 (-O3) and Rustc 2021 (opt-level 3).
                            Every workload is tested against identical algorithms, multi-run medians, and canonical checksum verification—with
                            transparent tracking for capabilities still in development.
                        </p>
                    </div>

                    <aside className="self-end border-l border-white/[0.1] pl-5 lg:col-span-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                            <Gauge size={16} className="text-indigo-300" />
                            Latest checked-in run
                        </div>
                        <dl className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between gap-6 text-zinc-400">
                                <dt>Generated</dt>
                                <dd className="text-zinc-200 font-mono">{data.formattedDate}</dd>
                            </div>
                            <div className="flex justify-between gap-6 text-zinc-400">
                                <dt>Samples per arm</dt>
                                <dd className="text-zinc-200 font-mono">{data.runs} runs</dd>
                            </div>
                            <div className="flex justify-between gap-6 text-zinc-400">
                                <dt>Total cataloged</dt>
                                <dd className="text-zinc-200 font-mono">{stats.total} workloads</dd>
                            </div>
                            <div className="flex justify-between gap-6 text-zinc-400">
                                <dt>Implemented</dt>
                                <dd className="text-emerald-400 font-mono">{stats.implemented}</dd>
                            </div>
                            <div className="flex justify-between gap-6 text-zinc-400">
                                <dt>Documented gaps</dt>
                                <dd className="text-amber-300 font-mono">{stats.unsupported}</dd>
                            </div>
                            <div className="flex justify-between gap-6 text-zinc-400">
                                <dt>Compilation speed</dt>
                                <dd className="text-emerald-400 font-mono">{data.toolchain.compileTime.prismio.formatted}</dd>
                            </div>
                            <div className="flex justify-between gap-6 text-zinc-400">
                                <dt>Binary footprint</dt>
                                <dd className="text-zinc-200 font-mono">{data.toolchain.binarySize.prismio.formatted}</dd>
                            </div>
                        </dl>
                    </aside>
                </section>

                {/* Executive KPI Cards */}
                <section aria-label="Executive KPI Overview">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Overall vs C++ */}
                        <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-6 space-y-4">
                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                <span className="font-medium text-zinc-300">Overall vs C++</span>
                                <span className="text-amber-400 font-mono">Clang++ -O3</span>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="font-mono text-3xl font-bold text-white">
                                    {stats.cppGeomean.toFixed(2)}×
                                </span>
                                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                                    stats.cppSpeedupPct >= 0
                                        ? 'bg-emerald-500/15 text-emerald-400'
                                        : 'bg-rose-500/15 text-rose-400'
                                }`}>
                                    {stats.cppSpeedupPct >= 0
                                        ? `${stats.cppSpeedupPct.toFixed(1)}% faster`
                                        : `${Math.abs(stats.cppSpeedupPct).toFixed(1)}% slower`}
                                </span>
                            </div>
                            <p className="text-xs leading-5 text-zinc-400">
                                Geometric mean across all {comparisonCount} comparison workloads.
                            </p>
                            {/* Distribution Bar */}
                            <div className="space-y-1.5 pt-1">
                                <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                    <div style={{ width: `${cppWinPct}%` }} className="bg-emerald-400" title={`Faster: ${stats.winsVsCpp}`} />
                                    <div style={{ width: `${cppParityPct}%` }} className="bg-zinc-600" title={`Parity: ${stats.parityVsCpp}`} />
                                    <div style={{ width: `${cppLossPct}%` }} className="bg-rose-400" title={`Slower: ${stats.lossesVsCpp}`} />
                                </div>
                                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                                    <span>{stats.winsVsCpp} faster</span>
                                    <span>{stats.parityVsCpp} parity</span>
                                    <span>{stats.lossesVsCpp} slower</span>
                                </div>
                            </div>
                        </div>

                        {/* Overall vs Rust */}
                        <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-6 space-y-4">
                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                <span className="font-medium text-zinc-300">Overall vs Rust</span>
                                <span className="text-indigo-400 font-mono">rustc opt-3</span>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="font-mono text-3xl font-bold text-white">
                                    {stats.rustGeomean.toFixed(2)}×
                                </span>
                                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                                    stats.rustSpeedupPct >= 0
                                        ? 'bg-emerald-500/15 text-emerald-400'
                                        : 'bg-rose-500/15 text-rose-400'
                                }`}>
                                    {stats.rustSpeedupPct >= 0
                                        ? `${stats.rustSpeedupPct.toFixed(1)}% faster`
                                        : `${Math.abs(stats.rustSpeedupPct).toFixed(1)}% slower`}
                                </span>
                            </div>
                            <p className="text-xs leading-5 text-zinc-400">
                                Geometric mean across all {comparisonCount} comparison workloads.
                            </p>
                            {/* Distribution Bar */}
                            <div className="space-y-1.5 pt-1">
                                <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                    <div style={{ width: `${rustWinPct}%` }} className="bg-emerald-400" title={`Faster: ${stats.winsVsRust}`} />
                                    <div style={{ width: `${rustParityPct}%` }} className="bg-zinc-600" title={`Parity: ${stats.parityVsRust}`} />
                                    <div style={{ width: `${rustLossPct}%` }} className="bg-rose-400" title={`Slower: ${stats.lossesVsRust}`} />
                                </div>
                                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                                    <span>{stats.winsVsRust} faster</span>
                                    <span>{stats.parityVsRust} parity</span>
                                    <span>{stats.lossesVsRust} slower</span>
                                </div>
                            </div>
                        </div>

                        {/* Workload Coverage */}
                        <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-6 space-y-4">
                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                <span className="font-medium text-zinc-300">Catalog Coverage</span>
                                <span className="text-emerald-400 font-mono">
                                    {((stats.implemented / stats.total) * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="font-mono text-3xl font-bold text-white">
                                    {stats.implemented}
                                </span>
                                <span className="text-xs text-zinc-500 font-mono">
                                    of {stats.total} workloads
                                </span>
                            </div>
                            <p className="text-xs leading-5 text-zinc-400">
                                {stats.unsupported} missing capabilities published as documented gaps.
                            </p>
                            <div className="space-y-1.5 pt-1">
                                <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                    <div
                                        style={{ width: `${(stats.implemented / stats.total) * 100}%` }}
                                        className="bg-emerald-400"
                                    />
                                    <div
                                        style={{ width: `${(stats.unsupported / stats.total) * 100}%` }}
                                        className="bg-amber-400"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                                    <span className="text-emerald-400">{stats.implemented} implemented</span>
                                    <span className="text-amber-400">{stats.unsupported} pending</span>
                                </div>
                            </div>
                        </div>

                        {/* Dead Code Elimination */}
                        <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-6 space-y-4">
                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                <span className="font-medium text-zinc-300">Dead Code Pruning</span>
                                <span className="text-indigo-300 font-mono">LLVM Backend</span>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="font-mono text-3xl font-bold text-emerald-400">
                                    0 ns
                                </span>
                                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                                    100% eliminated
                                </span>
                            </div>
                            <p className="text-xs leading-5 text-zinc-400">
                                Complete compile-time dead branch elimination across adversarial suites.
                            </p>
                            <div className="pt-2 text-[11px] text-zinc-500">
                                Verified via binary symbol extraction and differential runtime sampling.
                            </div>
                        </div>
                    </div>
                </section>

                {/* Toolchain Compilation Speed & Binary Footprint */}
                <ToolchainMetrics toolchain={data.toolchain} />

                {/* Category Coverage Summary */}
                <section aria-labelledby="coverage-heading" className="space-y-8">
                    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
                        <div className="lg:col-span-4">
                            <h2 id="coverage-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white">
                                Coverage is part of the result.
                            </h2>
                            <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
                                {stats.implemented} of {stats.total} cataloged workloads are implemented.
                                The remaining {stats.unsupported} make an absence visible instead of allowing a bespoke benchmark-only substitute.
                            </p>
                        </div>
                        <div className="lg:col-span-8">
                            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-6 border-y border-white/[0.08] text-xs text-zinc-500">
                                <div className="py-3">Category</div>
                                <div className="py-3 text-right">Implemented</div>
                                <div className="py-3 text-right">Pending</div>
                                <div className="py-3 text-right">vs C++</div>
                                <div className="py-3 text-right">vs Rust</div>
                            </div>
                            {categories.map((item) => (
                                <div
                                    key={item.key}
                                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-6 border-b border-white/[0.08] text-sm py-4"
                                >
                                    <div className="text-zinc-200 font-medium">{item.label}</div>
                                    <div className="text-right font-mono text-emerald-400">{item.implemented}</div>
                                    <div className="text-right font-mono text-zinc-500">{item.unsupported || '—'}</div>
                                    <div className={`text-right font-mono text-xs ${
                                        item.vsCppGeomean <= 1 ? 'text-emerald-400' : 'text-zinc-300'
                                    }`}>
                                        {item.vsCppGeomean.toFixed(2)}×
                                    </div>
                                    <div className={`text-right font-mono text-xs ${
                                        item.vsRustGeomean <= 1 ? 'text-emerald-400' : 'text-zinc-300'
                                    }`}>
                                        {item.vsRustGeomean.toFixed(2)}×
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Complete Interactive Workload Matrix */}
                <section aria-labelledby="matrix-heading" className="space-y-8">
                    <div>
                        <h2 id="matrix-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                            All Workloads Matrix
                        </h2>
                        <p className="mt-3 text-sm text-zinc-400 max-w-3xl">
                            Filter, search, and inspect the individual runs. Timings represent elapsed execution medians across {data.runs} runs.
                            Click any row to view raw sample times, memory RSS, and checksum verification.
                        </p>
                    </div>

                    <BenchmarkMatrix benchmarks={benchmarks} categories={categories} />
                </section>

                {/* Unsupported Workloads Catalog */}
                <UnsupportedCatalog unsupported={unsupported} categories={categories} />

                {/* Benchmark Methodology */}
                <BenchmarkMethodology eliminationNs={data.eliminationNs} runs={data.runs} />

                {/* Reproduction Call to Action */}
                <section className="border-t border-white/[0.09] pt-16">
                    <div className="grid gap-8 rounded-2xl bg-[#0b0c10] p-7 ring-1 ring-white/[0.08] lg:grid-cols-[1fr_auto] lg:items-center md:p-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-zinc-200">
                                <FileText size={17} className="text-indigo-300" />
                                <h2 className="text-xl font-semibold tracking-[-0.02em]">Reproduce or challenge a result.</h2>
                            </div>
                            <p className="max-w-2xl text-sm leading-6 text-zinc-400">
                                The harness, benchmark sources, unsupported-workload records, and raw checked-in results
                                are fully open-source. Inspect the source arms, audit the methodology contract, or contribute workloads.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href="https://github.com/prismio-lang/prismio/tree/main/benchmarks"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                Open the suite
                                <ArrowUpRight size={16} />
                            </a>
                            <Link
                                href="/roadmap"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.1] px-5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                Read the roadmap
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <FooterMain />
        </div>
    );
}
