import React from 'react';
import Link from 'next/link';
import {ArrowRight, ArrowUpRight, FileText, Gauge} from 'lucide-react';
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

    const eliminatedCount = data.eliminations.filter((item) => item.prismioNs <= data.eliminationNs).length;
    const eliminationTotal = data.eliminations.length;
    const eliminatedPct = eliminationTotal > 0 ? (eliminatedCount / eliminationTotal) * 100 : 0;

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
                                <dd className="text-zinc-200 font-mono">{stats.unsupported}</dd>
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

                {/* Headline results */}
                <section aria-label="Overall results">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                key: 'cpp',
                                title: 'Overall vs C++',
                                arm: 'Clang++ -O3',
                                armTone: 'text-sky-300',
                                geomean: stats.cppGeomean,
                                speedupPct: stats.cppSpeedupPct,
                                wins: stats.winsVsCpp,
                                parity: stats.parityVsCpp,
                                losses: stats.lossesVsCpp,
                                winPct: cppWinPct,
                                parityPct: cppParityPct,
                                lossPct: cppLossPct,
                            },
                            {
                                key: 'rust',
                                title: 'Overall vs Rust',
                                arm: 'rustc opt-level 3',
                                armTone: 'text-orange-300',
                                geomean: stats.rustGeomean,
                                speedupPct: stats.rustSpeedupPct,
                                wins: stats.winsVsRust,
                                parity: stats.parityVsRust,
                                losses: stats.lossesVsRust,
                                winPct: rustWinPct,
                                parityPct: rustParityPct,
                                lossPct: rustLossPct,
                            },
                        ].map((card) => (
                            <div key={card.key} className="rounded-2xl border border-white/10 bg-[#0b0c10] p-7 space-y-5">
                                <div className="flex items-center justify-between text-sm">
                                    <h2 className="font-medium text-zinc-200">{card.title}</h2>
                                    <span className={`font-mono text-xs ${card.armTone}`}>{card.arm}</span>
                                </div>
                                <div className="flex flex-wrap items-baseline gap-3">
                                    <span className="font-mono text-4xl font-bold text-white">
                                        {card.geomean.toFixed(2)}×
                                    </span>
                                    <span className={`rounded-md px-2 py-0.5 text-sm font-medium ${
                                        card.speedupPct >= 0
                                            ? 'bg-emerald-500/15 text-emerald-400'
                                            : 'bg-rose-500/15 text-rose-400'
                                    }`}>
                                        {card.speedupPct >= 0
                                            ? `${card.speedupPct.toFixed(1)}% faster`
                                            : `${Math.abs(card.speedupPct).toFixed(1)}% slower`}
                                    </span>
                                </div>
                                <p className="text-sm leading-6 text-zinc-400">
                                    Geometric mean of the time ratio across {comparisonCount} comparison workloads.
                                    Lower is faster; 1.00× is parity.
                                </p>
                                {/* Distribution bar: outcomes only */}
                                <div className="space-y-2 pt-1">
                                    <div
                                        role="img"
                                        aria-label={`${card.wins} faster, ${card.parity} at parity, ${card.losses} slower`}
                                        className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.06]"
                                    >
                                        <div style={{ width: `${card.winPct}%` }} className="bg-emerald-400" />
                                        <div style={{ width: `${card.parityPct}%` }} className="bg-zinc-500" />
                                        <div style={{ width: `${card.lossPct}%` }} className="bg-rose-400" />
                                    </div>
                                    <div className="flex justify-between font-mono text-xs text-zinc-400">
                                        <span>{card.wins} faster</span>
                                        <span>{card.parity} parity</span>
                                        <span>{card.losses} slower</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Dead code elimination */}
                        <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-7 space-y-5">
                            <div className="flex items-center justify-between text-sm">
                                <h2 className="font-medium text-zinc-200">Dead Code Pruning</h2>
                                <span className="font-mono text-xs text-purple-300">LLVM Backend</span>
                            </div>
                            <div className="flex flex-wrap items-baseline gap-3">
                                <span className="font-mono text-4xl font-bold text-emerald-400">
                                    {eliminatedCount}/{eliminationTotal}
                                </span>
                                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-sm font-medium text-emerald-400">
                                    {eliminatedPct.toFixed(0)}% eliminated
                                </span>
                            </div>
                            <p className="text-sm leading-6 text-zinc-400">
                                {eliminatedCount === eliminationTotal ? 'Complete compile-time' : 'Compile-time'} dead branch
                                elimination across adversarial suites. A probe counts as eliminated when it
                                runs in {(data.eliminationNs / 1000).toFixed(0)} µs or less.
                            </p>
                            <p className="text-xs text-zinc-400">
                                Verified via binary symbol extraction and differential runtime sampling.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Toolchain Compilation Speed & Binary Footprint */}
                <ToolchainMetrics
                    toolchain={data.toolchain}
                    totalWorkloads={stats.total}
                    cachedBuilds={data.cachedBuilds}
                    prismioProfile={data.environment.prismioProfile}
                />

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
                            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-6 border-y border-white/[0.08] text-xs text-zinc-400">
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
                                    <div className="text-right font-mono text-zinc-400">{item.unsupported || '—'}</div>
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
                <BenchmarkMethodology
                    eliminationNs={data.eliminationNs}
                    runs={data.runs}
                    buildCommands={data.buildCommands}
                    environment={data.environment}
                />

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
