'use client';

import React, { useState, useMemo } from 'react';
import {
    Search,
    ChevronDown,
    ChevronRight,
    ArrowDownUp,
    X,
} from 'lucide-react';
import { BenchmarkItem, CategorySummary, formatBytes, formatDuration } from '@/lib/benchmarks';

interface BenchmarkMatrixProps {
    benchmarks: BenchmarkItem[];
    categories: CategorySummary[];
}

export default function BenchmarkMatrix({ benchmarks, categories }: BenchmarkMatrixProps) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
    const [sortColumn, setSortColumn] = useState<string>('default');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Filtering
    const filteredBenchmarks = useMemo(() => {
        const q = search.toLowerCase().trim();
        return benchmarks.filter((item) => {
            if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
            if (selectedOutcome !== 'all' && item.outcome !== selectedOutcome) return false;
            if (q) {
                const matchName = item.name.toLowerCase().includes(q);
                const matchCat = item.categoryLabel.toLowerCase().includes(q);
                const matchProf = item.profile.toLowerCase().includes(q);
                if (!matchName && !matchCat && !matchProf) return false;
            }
            return true;
        });
    }, [benchmarks, search, selectedCategory, selectedOutcome]);

    // Sorting
    const sortedBenchmarks = useMemo(() => {
        const items = [...filteredBenchmarks];
        if (sortColumn === 'default') {
            return items;
        }

        items.sort((a, b) => {
            let valA: number | string = 0;
            let valB: number | string = 0;

            switch (sortColumn) {
                case 'name':
                    valA = a.name;
                    valB = b.name;
                    break;
                case 'category':
                    valA = a.categoryLabel;
                    valB = b.categoryLabel;
                    break;
                case 'prismio':
                    valA = a.prismioNs;
                    valB = b.prismioNs;
                    break;
                case 'cpp':
                    valA = a.cppNs;
                    valB = b.cppNs;
                    break;
                case 'rust':
                    valA = a.rustNs;
                    valB = b.rustNs;
                    break;
                case 'vs-cpp':
                    valA = a.vsCppRatio;
                    valB = b.vsCppRatio;
                    break;
                case 'vs-rust':
                    valA = a.vsRustRatio;
                    valB = b.vsRustRatio;
                    break;
                case 'jitter':
                    valA = a.jitterPct ?? 0;
                    valB = b.jitterPct ?? 0;
                    break;
                default:
                    return 0;
            }

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }

            return sortDirection === 'asc'
                ? (valA as number) - (valB as number)
                : (valB as number) - (valA as number);
        });

        return items;
    }, [filteredBenchmarks, sortColumn, sortDirection]);

    const handleSort = (col: string) => {
        if (sortColumn === col) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(col);
            setSortDirection('asc');
        }
    };

    const toggleRow = (name: string) => {
        setExpandedRow(expandedRow === name ? null : name);
    };

    return (
        <div className="space-y-6">
            {/* Category Navigation Bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-4">
                <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        selectedCategory === 'all'
                            ? 'bg-white text-black font-semibold'
                            : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
                    }`}
                >
                    <span>All Workloads</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        selectedCategory === 'all' ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'
                    }`}>
                        {benchmarks.length}
                    </span>
                </button>

                {categories.map((cat) => {
                    const isActive = selectedCategory === cat.key;
                    return (
                        <button
                            key={cat.key}
                            type="button"
                            onClick={() => setSelectedCategory(cat.key)}
                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
                                isActive
                                    ? 'bg-white text-black font-semibold'
                                    : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
                            }`}
                        >
                            <span>{cat.label}</span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                                isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'
                            }`}>
                                {cat.implemented}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Search Box */}
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search workload, category, or profile..."
                        className="w-full rounded-xl border border-white/10 bg-[#0b0c10] py-2 pl-9 pr-8 text-xs text-white placeholder-zinc-500 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* Outcome Filter Pills */}
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-zinc-500 mr-1 hidden md:inline">Outcome:</span>
                    <button
                        type="button"
                        onClick={() => setSelectedOutcome('all')}
                        className={`rounded-lg px-2.5 py-1 transition-colors ${
                            selectedOutcome === 'all'
                                ? 'bg-white/15 text-white font-medium'
                                : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedOutcome('prismio-win')}
                        className={`rounded-lg px-2.5 py-1 transition-colors ${
                            selectedOutcome === 'prismio-win'
                                ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                                : 'text-zinc-400 hover:text-emerald-300'
                        }`}
                    >
                        Prismio Leads
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedOutcome('parity')}
                        className={`rounded-lg px-2.5 py-1 transition-colors ${
                            selectedOutcome === 'parity'
                                ? 'bg-zinc-700/50 text-zinc-200 font-medium'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        Parity
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedOutcome('prismio-loss')}
                        className={`rounded-lg px-2.5 py-1 transition-colors ${
                            selectedOutcome === 'prismio-loss'
                                ? 'bg-rose-500/20 text-rose-300 font-medium'
                                : 'text-zinc-400 hover:text-rose-300'
                        }`}
                    >
                        Baseline Leads
                    </button>
                </div>
            </div>

            {/* Results Count & Quick Stats Bar */}
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                <span>
                    Showing <strong className="text-white">{sortedBenchmarks.length}</strong> of{' '}
                    {benchmarks.length} workloads
                </span>
                {(search || selectedCategory !== 'all' || selectedOutcome !== 'all') && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearch('');
                            setSelectedCategory('all');
                            setSelectedOutcome('all');
                        }}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        Reset filters
                    </button>
                )}
            </div>

            {/* Workload Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0b0c10]/60">
                <table className="w-full min-w-[58rem] border-collapse text-left text-xs">
                    <thead>
                        <tr className="border-b border-white/[0.08] bg-white/[0.02] text-zinc-400 font-medium select-none">
                            <th
                                onClick={() => handleSort('name')}
                                className="cursor-pointer py-4 pl-6 pr-4 hover:text-white transition-colors"
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    Workload
                                    <ArrowDownUp size={11} className="opacity-60" />
                                </span>
                            </th>
                            <th
                                onClick={() => handleSort('category')}
                                className="cursor-pointer px-4 py-4 hover:text-white transition-colors"
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    Category
                                    <ArrowDownUp size={11} className="opacity-60" />
                                </span>
                            </th>
                            <th
                                onClick={() => handleSort('prismio')}
                                className="cursor-pointer px-4 py-4 text-right hover:text-white transition-colors"
                            >
                                <span className="inline-flex items-center justify-end gap-1.5 text-emerald-400">
                                    Prismio
                                    <ArrowDownUp size={11} className="opacity-60" />
                                </span>
                            </th>
                            <th
                                onClick={() => handleSort('cpp')}
                                className="cursor-pointer px-4 py-4 text-right hover:text-white transition-colors"
                            >
                                <span className="inline-flex items-center justify-end gap-1.5 text-amber-300">
                                    C++20 (-O3)
                                    <ArrowDownUp size={11} className="opacity-60" />
                                </span>
                            </th>
                            <th
                                onClick={() => handleSort('rust')}
                                className="cursor-pointer px-4 py-4 text-right hover:text-white transition-colors"
                            >
                                <span className="inline-flex items-center justify-end gap-1.5 text-indigo-300">
                                    Rust (opt-3)
                                    <ArrowDownUp size={11} className="opacity-60" />
                                </span>
                            </th>
                            <th
                                onClick={() => handleSort('vs-cpp')}
                                className="cursor-pointer px-4 py-4 text-right hover:text-white transition-colors"
                            >
                                <span className="inline-flex items-center justify-end gap-1.5 text-amber-300">
                                    vs C++
                                    <ArrowDownUp size={11} className="opacity-60" />
                                </span>
                            </th>
                            <th
                                onClick={() => handleSort('vs-rust')}
                                className="cursor-pointer px-4 py-4 text-right hover:text-white transition-colors"
                            >
                                <span className="inline-flex items-center justify-end gap-1.5 text-indigo-300">
                                    vs Rust
                                    <ArrowDownUp size={11} className="opacity-60" />
                                </span>
                            </th>
                            <th className="py-4 pr-6 text-right">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                        {sortedBenchmarks.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-zinc-500">
                                    No benchmark workloads match the selected filter criteria.
                                </td>
                            </tr>
                        ) : (
                            sortedBenchmarks.map((item) => {
                                const isExpanded = expandedRow === item.name;

                                return (
                                    <React.Fragment key={item.name}>
                                        <tr
                                            onClick={() => toggleRow(item.name)}
                                            className={`group cursor-pointer transition-colors hover:bg-white/[0.03] ${
                                                isExpanded ? 'bg-white/[0.04]' : ''
                                            }`}
                                        >
                                            {/* Workload Name & Profile */}
                                            <td className="py-4 pl-6 pr-4">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </span>
                                                    <div>
                                                        <span className="font-mono text-sm font-medium text-zinc-100">
                                                            {item.name}
                                                        </span>
                                                        <span className="ml-2 inline-block rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-[11px] text-zinc-400">
                                                            {item.profile}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="px-4 py-4 text-sm text-zinc-400">
                                                {item.categoryLabel}
                                            </td>

                                            {/* Prismio Elapsed Median */}
                                            <td className="px-4 py-4 text-right font-mono text-sm font-medium text-white">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span>{item.prismioFormatted}</span>
                                                    {item.jitterPct !== null && item.jitterPct <= 2.5 && (
                                                        <span
                                                            className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400 font-sans"
                                                            title={`Run consistency (MAD): ±${item.jitterPct.toFixed(1)}%`}
                                                        >
                                                            {item.stabilityText}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* C++ Elapsed Median */}
                                            <td className="px-4 py-4 text-right font-mono text-sm text-zinc-300">
                                                {item.cppFormatted}
                                            </td>

                                            {/* Rust Elapsed Median */}
                                            <td className="px-4 py-4 text-right font-mono text-sm text-zinc-300">
                                                {item.rustFormatted}
                                            </td>

                                            {/* vs C++ Delta Pill */}
                                            <td className="px-4 py-4 text-right font-mono">
                                                <span
                                                    className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold ${
                                                        item.vsCppStatus === 'faster'
                                                            ? 'bg-emerald-500/15 text-emerald-400'
                                                            : item.vsCppStatus === 'slower'
                                                            ? 'bg-rose-500/15 text-rose-400'
                                                            : 'bg-zinc-800 text-zinc-400'
                                                    }`}
                                                >
                                                    {item.vsCppSpeedup}
                                                </span>
                                            </td>

                                            {/* vs Rust Delta Pill */}
                                            <td className="px-4 py-4 text-right font-mono">
                                                <span
                                                    className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold ${
                                                        item.vsRustStatus === 'faster'
                                                            ? 'bg-emerald-500/15 text-emerald-400'
                                                            : item.vsRustStatus === 'slower'
                                                            ? 'bg-rose-500/15 text-rose-400'
                                                            : 'bg-zinc-800 text-zinc-400'
                                                    }`}
                                                >
                                                    {item.vsRustSpeedup}
                                                </span>
                                            </td>

                                            {/* Action / Chevron */}
                                            <td className="py-4 pr-6 text-right text-zinc-500">
                                                <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">
                                                    {isExpanded ? 'Hide' : 'Inspect'}
                                                </span>
                                            </td>
                                        </tr>

                                        {/* Expanded Details Sub-Panel */}
                                        {isExpanded && (
                                            <tr className="bg-black/40">
                                                <td colSpan={8} className="px-6 py-4">
                                                    <div className="space-y-4 rounded-xl border border-white/[0.08] bg-[#090a0e] p-5">
                                                        {/* Clean Header: Workload & Raw Checksum */}
                                                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono font-medium text-white">{item.name}</span>
                                                                <span className="font-mono text-[11px] text-zinc-500">({item.profile})</span>
                                                            </div>

                                                            {item.result !== undefined && (
                                                                <div className="font-mono text-xs text-zinc-400">
                                                                    <span className="text-zinc-500">Checksum:</span>{' '}
                                                                    <span className="text-zinc-200">{item.result.toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* 3 Compiler Arm Columns */}
                                                        <div className="grid gap-3 md:grid-cols-3">
                                                            {/* Prismio */}
                                                            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-semibold text-emerald-400">Prismio</span>
                                                                    <span className="font-mono text-[11px] text-zinc-500">Target</span>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3">
                                                                    <div>
                                                                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">Runtime</div>
                                                                        <div className="font-mono text-sm font-semibold text-white mt-0.5">
                                                                            {item.prismioFormatted}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">Peak RSS</div>
                                                                        <div className="font-mono text-sm font-semibold text-zinc-200 mt-0.5">
                                                                            {formatBytes(item.prismioRss)}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="border-t border-white/[0.06] pt-2 text-[11px] text-zinc-400 flex items-center justify-between">
                                                                    <span className="text-zinc-500">Jitter (MAD):</span>
                                                                    <span className="font-mono text-zinc-300">{item.stabilityText}</span>
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <div className="text-zinc-500 text-[10px] uppercase tracking-wider">Samples (5 runs)</div>
                                                                    <div className="font-mono text-[10px] text-zinc-400 break-words leading-relaxed">
                                                                        {item.prismioSamples.map((s) => {
                                                                            const isMedian = s === item.prismioNs;
                                                                            return isMedian ? `${formatDuration(s)}*` : formatDuration(s);
                                                                        }).join(', ')}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Clang++ */}
                                                            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-semibold text-amber-400">Clang++ (-O3)</span>
                                                                    <span className="font-mono text-[11px] text-zinc-400">{item.vsCppSpeedup}</span>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3">
                                                                    <div>
                                                                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">Runtime</div>
                                                                        <div className="font-mono text-sm font-semibold text-white mt-0.5">
                                                                            {item.cppFormatted}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">Peak RSS</div>
                                                                        <div className="font-mono text-sm font-semibold text-zinc-200 mt-0.5">
                                                                            {formatBytes(item.cppRss)}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="border-t border-white/[0.06] pt-2 text-[11px] text-zinc-400 flex items-center justify-between">
                                                                    <span className="text-zinc-500">Dialect:</span>
                                                                    <span className="font-mono text-zinc-300">C++20</span>
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <div className="text-zinc-500 text-[10px] uppercase tracking-wider">Samples (5 runs)</div>
                                                                    <div className="font-mono text-[10px] text-zinc-400 break-words leading-relaxed">
                                                                        {item.cppSamples.map((s) => {
                                                                            const isMedian = s === item.cppNs;
                                                                            return isMedian ? `${formatDuration(s)}*` : formatDuration(s);
                                                                        }).join(', ')}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Rust */}
                                                            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-semibold text-indigo-400">Rustc (opt-3)</span>
                                                                    <span className="font-mono text-[11px] text-zinc-400">{item.vsRustSpeedup}</span>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3">
                                                                    <div>
                                                                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">Runtime</div>
                                                                        <div className="font-mono text-sm font-semibold text-white mt-0.5">
                                                                            {item.rustFormatted}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">Peak RSS</div>
                                                                        <div className="font-mono text-sm font-semibold text-zinc-200 mt-0.5">
                                                                            {formatBytes(item.rustRss)}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="border-t border-white/[0.06] pt-2 text-[11px] text-zinc-400 flex items-center justify-between">
                                                                    <span className="text-zinc-500">Edition:</span>
                                                                    <span className="font-mono text-zinc-300">Rust 2021</span>
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <div className="text-zinc-500 text-[10px] uppercase tracking-wider">Samples (5 runs)</div>
                                                                    <div className="font-mono text-[10px] text-zinc-400 break-words leading-relaxed">
                                                                        {item.rustSamples.map((s) => {
                                                                            const isMedian = s === item.rustNs;
                                                                            return isMedian ? `${formatDuration(s)}*` : formatDuration(s);
                                                                        }).join(', ')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
