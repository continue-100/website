'use client';

import React, { useState, useMemo } from 'react';
import {
    Search,
    CircleSlash2,
    Database,
    Cpu,
    HardDrive,
    Zap,
    Layers,
    ShieldAlert,
    X,
} from 'lucide-react';
import { RawBenchmarkItem, CategorySummary } from '@/lib/benchmarks';

interface UnsupportedCatalogProps {
    unsupported: RawBenchmarkItem[];
    categories: CategorySummary[];
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    algorithms: Zap,
    data_structures: Database,
    compute: Cpu,
    memory: Layers,
    io: HardDrive,
    adversarial: ShieldAlert,
};

const CATEGORY_NAMES: Record<string, string> = {
    algorithms: 'Algorithms',
    data_structures: 'Data Structures',
    compute: 'Compute & Concurrency',
    memory: 'Memory & Allocation',
    io: 'I/O & Networking',
    adversarial: 'Adversarial',
};

export default function UnsupportedCatalog({ unsupported, categories }: UnsupportedCatalogProps) {
    const [search, setSearch] = useState('');

    // Filter items
    const filteredItems = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return unsupported;
        return unsupported.filter((item) => {
            const matchName = item.name.toLowerCase().includes(q);
            const matchCat = (CATEGORY_NAMES[item.category] || item.category).toLowerCase().includes(q);
            const matchFeature = (item.missing_feature || '').toLowerCase().includes(q);
            const matchProf = (item.profile || '').toLowerCase().includes(q);
            return matchName || matchCat || matchFeature || matchProf;
        });
    }, [unsupported, search]);

    // Group filtered items by category
    const groupedByCategory = useMemo(() => {
        const groups: Record<string, RawBenchmarkItem[]> = {};
        filteredItems.forEach((item) => {
            const list = groups[item.category] ?? [];
            list.push(item);
            groups[item.category] = list;
        });
        return groups;
    }, [filteredItems]);

    const activeCategoryKeys = Object.keys(groupedByCategory);

    return (
        <section aria-labelledby="unsupported-heading" className="space-y-8 border-t border-white/[0.09] pt-16">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                    <h2 id="unsupported-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white">
                        Unsupported means exactly that.
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                        The suite does not award a comparison result when Prismio lacks the ordinary feature
                        the workload is meant to evaluate. Rather than hiding gaps or using benchmark-only shims,
                        missing capabilities are documented as formal roadmap obligations.
                    </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <CircleSlash2 size={15} className="text-amber-300" />
                    <span>
                        <strong className="text-white font-mono">{unsupported.length}</strong> cataloged gaps across{' '}
                        {categories.filter((c) => c.unsupported > 0).length} domains
                    </span>
                </div>
            </div>

            {/* Search Box */}
            <div className="flex items-center">
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search missing features, containers, runtimes..."
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
            </div>

            {/* Categorized Cards Grid */}
            {activeCategoryKeys.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.08] bg-[#0b0c10] p-12 text-center text-xs text-zinc-500">
                    No unsupported capabilities match &quot;{search}&quot;.
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {activeCategoryKeys.map((catKey) => {
                        const items = groupedByCategory[catKey] || [];
                        const Icon = CATEGORY_ICONS[catKey] || CircleSlash2;
                        const title = CATEGORY_NAMES[catKey] || catKey;

                        return (
                            <div
                                key={catKey}
                                className="flex flex-col rounded-2xl border border-white/10 bg-[#0b0c10] overflow-hidden"
                            >
                                {/* Category Header */}
                                <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-5 py-3.5">
                                    <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
                                        <Icon size={16} className="text-amber-400" />
                                        <span>{title}</span>
                                    </div>
                                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                                        {items.length} {items.length === 1 ? 'gap' : 'gaps'}
                                    </span>
                                </div>

                                {/* Items in this Category */}
                                <div className="divide-y divide-white/[0.06] p-2 flex-1">
                                    {items.map((item) => (
                                        <div key={item.name} className="p-3 space-y-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-xs font-medium text-zinc-200">
                                                    {item.name}
                                                </span>
                                                <span className="rounded border border-white/[0.08] bg-white/[0.02] px-1.5 py-0.5 text-[10px] text-zinc-500">
                                                    {item.profile}
                                                </span>
                                            </div>
                                            <p className="text-[11px] leading-relaxed text-zinc-400">
                                                {item.missing_feature || 'Pending implementation.'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
