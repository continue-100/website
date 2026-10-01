import React from 'react';
import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import {getBenchmarkDataset} from '@/lib/benchmarks';

export default function BenchmarkTeaser() {
    const data = getBenchmarkDataset();
    const {stats, featured, runs} = data;
    const compared = stats.implemented - stats.eliminated;

    const arms = [
        {
            key: 'cpp',
            label: 'vs C++',
            detail: 'Clang++ -O3',
            tone: 'text-sky-300',
            dot: 'bg-sky-400',
            geomean: stats.cppGeomean,
            speedupPct: stats.cppSpeedupPct,
            wins: stats.winsVsCpp,
            parity: stats.parityVsCpp,
            losses: stats.lossesVsCpp,
        },
        {
            key: 'rust',
            label: 'vs Rust',
            detail: 'rustc opt-level 3',
            tone: 'text-orange-300',
            dot: 'bg-orange-400',
            geomean: stats.rustGeomean,
            speedupPct: stats.rustSpeedupPct,
            wins: stats.winsVsRust,
            parity: stats.parityVsRust,
            losses: stats.lossesVsRust,
        },
    ];

    const facts = [
        {label: 'Implemented', value: String(stats.implemented)},
        {label: 'Documented gaps', value: String(stats.unsupported)},
        {label: 'Compile time', value: data.toolchain.compileTime.prismio.formatted},
        {label: 'Binary size', value: data.toolchain.binarySize.prismio.formatted},
    ];

    return (
        <section aria-labelledby="bench-heading" className="mx-auto max-w-7xl px-6 py-24">
            <div className="grid items-end gap-8 lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <h2 id="bench-heading" className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                        Performance claims with receipts.
                    </h2>
                    <p className="mt-6 max-w-3xl text-base leading-7 text-zinc-300">
                        The maintained suite contains {stats.total} canonical workloads across {data.categories.length} categories.{' '}
                        {stats.implemented} run equivalent Prismio, C++, and Rust implementations with
                        checksum validation and median timing. The other {stats.unsupported} are published as
                        unsupported capabilities rather than hidden behind benchmark-only substitutes.
                    </p>
                </div>
                <div className="lg:col-span-4 lg:text-right">
                    <Link
                        href="/benchmarks"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 transition-colors hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                        Open the complete benchmark report
                        <ArrowRight size={15} />
                    </Link>
                </div>
            </div>

            {/* Headline ratios */}
            <div className="mt-14 grid divide-y divide-white/[0.1] border-y border-white/[0.1] md:grid-cols-2 md:divide-x md:divide-y-0">
                {arms.map((arm) => {
                    const faster = arm.speedupPct >= 0;
                    return (
                        <div key={arm.key} className="py-9 md:px-10 md:first:pl-0 md:last:pr-0">
                            <div className={`flex items-center gap-2.5 text-sm font-medium ${arm.tone}`}>
                                <span aria-hidden className={`size-2 rounded-full ${arm.dot}`} />
                                {arm.label}
                                <span className="font-mono text-xs font-normal text-zinc-400">{arm.detail}</span>
                            </div>
                            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                                <span className="font-mono text-6xl font-semibold tracking-tight text-white">
                                    {arm.geomean.toFixed(2)}×
                                </span>
                                <span
                                    className={`rounded-md px-2.5 py-1 text-sm font-medium ${
                                        faster ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                                    }`}
                                >
                                    {Math.abs(arm.speedupPct).toFixed(1)}% {faster ? 'faster' : 'slower'}
                                </span>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-zinc-400">
                                Geometric mean of the time ratio across {compared} workloads. Lower is faster.
                            </p>
                            <p className="mt-2 font-mono text-xs text-zinc-300">
                                {arm.wins} faster · {arm.parity} parity · {arm.losses} slower
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* The rest of the numbers, as one line of facts */}
            <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
                {facts.map((fact) => (
                    <div key={fact.label} className="flex items-baseline gap-2">
                        <dt className="text-zinc-400">{fact.label}</dt>
                        <dd className="font-mono font-semibold text-white">{fact.value}</dd>
                    </div>
                ))}
            </dl>

            {/* Featured workloads */}
            <div className="mt-12 overflow-x-auto rounded-2xl border border-white/[0.1] bg-[#0b0c10]/60">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <caption className="sr-only">Featured workloads with median time per language</caption>
                    <thead>
                        <tr className="border-b border-white/[0.08] text-xs text-zinc-400">
                            <th scope="col" className="px-6 py-4 font-medium">Workload</th>
                            <th scope="col" className="px-4 py-4 font-medium text-purple-300">
                                <span className="inline-flex items-center gap-2">
                                    <span aria-hidden className="size-1.5 rounded-full bg-purple-400" />
                                    Prismio
                                </span>
                            </th>
                            <th scope="col" className="px-4 py-4 font-medium text-sky-300">
                                <span className="inline-flex items-center gap-2">
                                    <span aria-hidden className="size-1.5 rounded-full bg-sky-400" />
                                    C++20
                                </span>
                            </th>
                            <th scope="col" className="px-4 py-4 font-medium text-orange-300">
                                <span className="inline-flex items-center gap-2">
                                    <span aria-hidden className="size-1.5 rounded-full bg-orange-400" />
                                    Rust
                                </span>
                            </th>
                            <th scope="col" className="px-6 py-4 font-medium">Readout</th>
                        </tr>
                    </thead>
                    <tbody>
                        {featured.map((result) => (
                            <tr key={result.name} className="border-b border-white/[0.06] transition-colors last:border-0 hover:bg-white/[0.02]">
                                <th scope="row" className="px-6 py-5 text-left font-mono text-xs font-normal text-zinc-200">{result.name}</th>
                                <td className="px-4 py-5 font-mono text-xs font-semibold text-purple-200">{result.prismio}</td>
                                <td className="px-4 py-5 font-mono text-xs text-zinc-300">{result.cpp}</td>
                                <td className="px-4 py-5 font-mono text-xs text-zinc-300">{result.rust}</td>
                                <td className={`px-6 py-5 text-xs ${result.tone === 'win' ? 'text-emerald-300' : 'text-zinc-300'}`}>
                                    {result.note}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ul className="mt-8 grid gap-4 text-sm leading-6 text-zinc-400 sm:grid-cols-2 sm:gap-10">
                <li className="flex gap-3">
                    <span aria-hidden className="mt-3 h-px w-3 shrink-0 bg-zinc-500" />
                    <span>
                        Each workload is written to express the same algorithm in all three languages and must produce the
                        same checksum. Known differences are listed in the suite’s README. Fixtures are created outside the
                        timed region.
                    </span>
                </li>
                <li className="flex gap-3">
                    <span aria-hidden className="mt-3 h-px w-3 shrink-0 bg-zinc-500" />
                    <span>
                        Missing standard-library capabilities remain visible in the catalog instead of being replaced with
                        private benchmark implementations.
                    </span>
                </li>
            </ul>

            <p className="mt-6 text-xs leading-5 text-zinc-400">
                Featured medians are from the latest checked-in {runs}-run result set ({data.formattedDate}). Results vary by
                machine and toolchain.
            </p>
        </section>
    );
}
