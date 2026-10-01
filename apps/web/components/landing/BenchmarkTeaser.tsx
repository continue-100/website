import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, CircleSlash2 } from 'lucide-react';
import { getBenchmarkDataset } from '@/lib/benchmarks';

export default function BenchmarkTeaser() {
    const data = getBenchmarkDataset();
    const { stats, featured, runs } = data;

    return (
        <section className="mx-auto max-w-7xl px-6 py-28 md:py-36">
            <div className="grid items-end gap-8 lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <h2 className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                        Performance claims with receipts.
                    </h2>
                    <p className="mt-6 max-w-3xl text-base leading-7 text-zinc-400">
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

            <div className="mt-12 overflow-hidden rounded-2xl bg-[#0b0c10] ring-1 ring-white/[0.09]">
                <div className="grid grid-cols-3 sm:grid-cols-5 border-b border-white/[0.07] text-center text-sm">
                    <div className="border-r border-white/[0.07] px-3 py-5">
                        <span className="font-mono text-lg font-semibold text-white">{stats.total}</span>
                        <span className="ml-2 text-zinc-500">canonical</span>
                    </div>
                    <div className="border-r border-white/[0.07] px-3 py-5">
                        <span className="font-mono text-lg font-semibold text-emerald-300">{stats.implemented}</span>
                        <span className="ml-2 text-zinc-500">implemented</span>
                    </div>
                    <div className="border-r border-white/[0.07] sm:border-r px-3 py-5">
                        <span className="font-mono text-lg font-semibold text-amber-200">{stats.unsupported}</span>
                        <span className="ml-2 text-zinc-500">gaps</span>
                    </div>
                    <div className="border-r border-white/[0.07] px-3 py-5 hidden sm:block">
                        <span className="font-mono text-lg font-semibold text-emerald-300">{data.toolchain.compileTime.prismio.formatted}</span>
                        <span className="ml-2 text-zinc-500">build speed</span>
                    </div>
                    <div className="px-3 py-5 hidden sm:block">
                        <span className="font-mono text-lg font-semibold text-indigo-300">{data.toolchain.binarySize.prismio.formatted}</span>
                        <span className="ml-2 text-zinc-500">binary size</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                        <thead className="border-b border-white/[0.07] text-xs text-zinc-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Workload</th>
                                <th className="px-4 py-4 font-medium text-white">Prismio</th>
                                <th className="px-4 py-4 font-medium text-amber-300">C++20</th>
                                <th className="px-4 py-4 font-medium text-indigo-300">Rust</th>
                                <th className="px-6 py-4 font-medium">Readout</th>
                            </tr>
                        </thead>
                        <tbody>
                            {featured.map((result) => (
                                <tr key={result.name} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-5 font-mono text-xs text-zinc-200">{result.name}</td>
                                    <td className="px-4 py-5 font-mono text-xs font-semibold text-white">{result.prismio}</td>
                                    <td className="px-4 py-5 font-mono text-xs text-zinc-400">{result.cpp}</td>
                                    <td className="px-4 py-5 font-mono text-xs text-zinc-400">{result.rust}</td>
                                    <td className={`px-6 py-5 text-xs ${result.tone === 'win' ? 'text-emerald-300' : 'text-zinc-400'}`}>
                                        {result.note}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid gap-6 border-t border-white/[0.07] p-6 sm:grid-cols-2 sm:p-8">
                    <div className="flex gap-3">
                        <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-300" />
                        <p className="text-sm leading-6 text-zinc-400">
                            Each workload is written to express the same algorithm in all three languages and must produce the same checksum. Known differences are listed in the suite’s README. Fixtures are created outside the timed region.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <CircleSlash2 size={17} className="mt-0.5 shrink-0 text-amber-200" />
                        <p className="text-sm leading-6 text-zinc-400">
                            Missing standard-library capabilities remain visible in the catalog instead
                            of being replaced with private benchmark implementations.
                        </p>
                    </div>
                </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-zinc-600">
                Featured medians are from the latest checked-in {runs}-run result set ({data.formattedDate}). Results vary by machine and toolchain.
            </p>
        </section>
    );
}
