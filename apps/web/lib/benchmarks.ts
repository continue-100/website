import rawResults from '@/data/results.json';

export interface LanguageRunData {
    elapsed_ns_median: number;
    wall_ns_median: number;
    elapsed_ns_samples: number[];
    peak_rss_bytes_median?: number;
    peak_rss_bytes_samples?: number[];
}

export interface RawBenchmarkItem {
    name: string;
    category: string;
    status: 'implemented' | 'unsupported';
    profile: string;
    measure?: string;
    result?: number;
    missing_feature?: string;
    languages?: {
        prismio?: LanguageRunData;
        cpp?: LanguageRunData;
        rust?: LanguageRunData;
    };
}

export interface BenchmarkItem {
    name: string;
    category: string;
    categoryLabel: string;
    status: 'implemented' | 'unsupported';
    profile: string;
    measure?: string;
    result?: number;
    missing_feature?: string;
    isElimination: boolean;

    // Computed timings and metrics
    prismioNs: number;
    cppNs: number;
    rustNs: number;
    prismioFormatted: string;
    cppFormatted: string;
    rustFormatted: string;

    // Comparison ratios (prismio / baseline)
    vsCppRatio: number;
    vsRustRatio: number;
    vsCppStatus: 'faster' | 'slower' | 'parity';
    vsRustStatus: 'faster' | 'slower' | 'parity';
    vsCppSpeedup: string; // e.g. "1.70× (-41%)" or "1.07× (+7%)"
    vsRustSpeedup: string;

    // Overall outcome
    outcome: 'prismio-win' | 'prismio-loss' | 'parity';

    // Jitter & Stability
    jitterPct: number | null;
    stabilityText: string;

    // Peak RSS memory
    prismioRss: number;
    cppRss: number;
    rustRss: number;
    prismioRssFormatted: string;

    // Raw samples for inspection
    prismioSamples: number[];
    cppSamples: number[];
    rustSamples: number[];
}

export interface CategorySummary {
    key: string;
    label: string;
    total: number;
    implemented: number;
    unsupported: number;
    vsCppGeomean: number;
    vsRustGeomean: number;
}

export interface ToolchainMetric {
    raw: number;
    formatted: string;
}

export interface ToolchainData {
    compileTime: {
        prismio: ToolchainMetric;
        cpp: ToolchainMetric;
        rust: ToolchainMetric;
        vsCppSpeedupPct: number;
        vsRustSpeedupPct: number;
    };
    binarySize: {
        prismio: ToolchainMetric;
        cpp: ToolchainMetric;
        rust: ToolchainMetric;
        vsRustReductionPct: number;
        vsCppReductionPct: number;
    };
}

export interface BenchmarkDataset {
    generatedAt: string;
    formattedDate: string;
    runs: number;
    buildCommands: Record<string, string>;
    eliminationNs: number;
    toolchain: ToolchainData;

    stats: {
        total: number;
        implemented: number;
        unsupported: number;
        eliminated: number;

        cppGeomean: number;
        rustGeomean: number;
        cppSpeedupPct: number;
        rustSpeedupPct: number;

        winsVsCpp: number;
        parityVsCpp: number;
        lossesVsCpp: number;

        winsVsRust: number;
        parityVsRust: number;
        lossesVsRust: number;

        fastestMarginCpp: number;
        fastestMarginRust: number;
    };

    categories: CategorySummary[];
    benchmarks: BenchmarkItem[];
    unsupported: RawBenchmarkItem[];
    eliminations: BenchmarkItem[];
    featured: Array<{
        name: string;
        profile: string;
        prismio: string;
        cpp: string;
        rust: string;
        note: string;
        tone: 'win' | 'mixed';
    }>;
}

const CATEGORY_LABELS: Record<string, string> = {
    algorithms: 'Algorithms',
    data_structures: 'Data structures',
    compute: 'Compute',
    memory: 'Memory',
    io: 'I/O and parsing',
    adversarial: 'Adversarial',
};

export function formatDuration(ns: number): string {
    if (ns >= 1e9) return `${(ns / 1e9).toFixed(2)} s`;
    if (ns >= 1e6) return `${(ns / 1e6).toFixed(2)} ms`;
    if (ns >= 1e3) return `${(ns / 1e3).toFixed(1)} µs`;
    return `${ns} ns`;
}

export function formatBytes(bytes: number): string {
    if (!bytes) return '—';
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
}

export function calculateGeomean(values: number[]): number {
    if (!values.length) return 1;
    const logSum = values.reduce((acc, v) => acc + Math.log(Math.max(v, 1e-9)), 0);
    return Math.exp(logSum / values.length);
}

export function calculateRobustJitter(samples: number[], med: number): number | null {
    if (!samples || samples.length <= 1 || !med) return null;
    const devs = samples.map((s) => Math.abs(s - med)).sort((a, b) => a - b);
    const mid = Math.floor(devs.length / 2);
    const valMid = devs[mid];
    const valPrev = devs[mid - 1];
    if (valMid === undefined) return null;
    const mad = devs.length % 2 === 0 && valPrev !== undefined ? (valPrev + valMid) / 2 : valMid;
    return (1.4826 * mad / med) * 100;
}

export function getPillStatus(ratio: number, noisePct: number): 'faster' | 'slower' | 'parity' {
    const tol = Math.max(0.05, (noisePct || 0) / 100);
    if (ratio < 1.0 - tol) return 'faster';
    if (ratio > 1.0 + tol) return 'slower';
    return 'parity';
}

export function formatSpeedup(ratio: number, _status?: 'faster' | 'slower' | 'parity'): string {
    if (!ratio || !isFinite(ratio)) return '—';
    const pct = Math.round((ratio - 1) * 100);
    if (pct === 0) return `${ratio.toFixed(2)}× (parity)`;
    const sign = pct > 0 ? `+${pct}` : `${pct}`;
    return `${ratio.toFixed(2)}× (${sign}%)`;
}

export function getBenchmarkDataset(): BenchmarkDataset {
    const data = rawResults as unknown as {
        generated_at: string;
        runs: number;
        build_commands: Record<string, string>;
        elimination_ns?: number;
        benchmarks: RawBenchmarkItem[];
    };

    const eliminationNs = data.elimination_ns || 10000;
    const rawList = data.benchmarks || [];

    const unsupported = rawList.filter((b) => b.status === 'unsupported');
    const implementedRaw = rawList.filter((b) => b.status === 'implemented');

    const processedBenchmarks: BenchmarkItem[] = [];
    const eliminations: BenchmarkItem[] = [];

    let winsVsCpp = 0;
    let parityVsCpp = 0;
    let lossesVsCpp = 0;

    let winsVsRust = 0;
    let parityVsRust = 0;
    let lossesVsRust = 0;

    const cppRatios: number[] = [];
    const rustRatios: number[] = [];

    for (const b of implementedRaw) {
        const isElimination = b.measure === 'elimination';
        const prismioLang = b.languages?.prismio;
        const cppLang = b.languages?.cpp;
        const rustLang = b.languages?.rust;

        const pMed = prismioLang?.elapsed_ns_median ?? 0;
        const cMed = cppLang?.elapsed_ns_median ?? 0;
        const rMed = rustLang?.elapsed_ns_median ?? 0;

        const pSamples = prismioLang?.elapsed_ns_samples ?? [];
        const cSamples = cppLang?.elapsed_ns_samples ?? [];
        const rSamples = rustLang?.elapsed_ns_samples ?? [];

        const pNoise = calculateRobustJitter(pSamples, pMed) || 0;
        const cNoise = calculateRobustJitter(cSamples, cMed) || 0;
        const rNoise = calculateRobustJitter(rSamples, rMed) || 0;

        const vsCppRatio = pMed / Math.max(cMed, 1);
        const vsRustRatio = pMed / Math.max(rMed, 1);

        const vsCppStatus = isElimination
            ? (pMed <= eliminationNs ? 'faster' : 'parity')
            : getPillStatus(vsCppRatio, Math.max(pNoise, cNoise));

        const vsRustStatus = isElimination
            ? (pMed <= eliminationNs ? 'faster' : 'parity')
            : getPillStatus(vsRustRatio, Math.max(pNoise, rNoise));

        let outcome: 'prismio-win' | 'prismio-loss' | 'parity';
        if (vsCppStatus === 'slower' || vsRustStatus === 'slower') {
            outcome = 'prismio-loss';
        } else if (vsCppStatus === 'faster' || vsRustStatus === 'faster') {
            outcome = 'prismio-win';
        } else {
            outcome = 'parity';
        }

        if (!isElimination) {
            cppRatios.push(vsCppRatio);
            rustRatios.push(vsRustRatio);

            if (vsCppStatus === 'faster') winsVsCpp++;
            else if (vsCppStatus === 'parity') parityVsCpp++;
            else lossesVsCpp++;

            if (vsRustStatus === 'faster') winsVsRust++;
            else if (vsRustStatus === 'parity') parityVsRust++;
            else lossesVsRust++;
        }

        const jitter = calculateRobustJitter(pSamples, pMed);

        const item: BenchmarkItem = {
            name: b.name,
            category: b.category,
            categoryLabel: CATEGORY_LABELS[b.category] || b.category,
            status: b.status,
            profile: b.profile || 'cpu',
            measure: b.measure,
            result: b.result,
            missing_feature: b.missing_feature,
            isElimination,
            prismioNs: pMed,
            cppNs: cMed,
            rustNs: rMed,
            prismioFormatted: formatDuration(pMed),
            cppFormatted: formatDuration(cMed),
            rustFormatted: formatDuration(rMed),
            vsCppRatio,
            vsRustRatio,
            vsCppStatus,
            vsRustStatus,
            vsCppSpeedup: formatSpeedup(vsCppRatio, vsCppStatus),
            vsRustSpeedup: formatSpeedup(vsRustRatio, vsRustStatus),
            outcome,
            jitterPct: jitter,
            stabilityText: jitter !== null ? `±${jitter.toFixed(1)}%` : '—',
            prismioRss: prismioLang?.peak_rss_bytes_median ?? 0,
            cppRss: cppLang?.peak_rss_bytes_median ?? 0,
            rustRss: rustLang?.peak_rss_bytes_median ?? 0,
            prismioRssFormatted: formatBytes(prismioLang?.peak_rss_bytes_median ?? 0),
            prismioSamples: pSamples,
            cppSamples: cSamples,
            rustSamples: rSamples,
        };

        if (isElimination) {
            eliminations.push(item);
        } else {
            processedBenchmarks.push(item);
        }
    }

    const cppGeomean = calculateGeomean(cppRatios);
    const rustGeomean = calculateGeomean(rustRatios);

    const cppSpeedupPct = (1 - cppGeomean) * 100;
    const rustSpeedupPct = (1 - rustGeomean) * 100;

    const fastestMarginCpp = cppRatios.length ? 1 / Math.min(...cppRatios) : 1;
    const fastestMarginRust = rustRatios.length ? 1 / Math.min(...rustRatios) : 1;

    // Categories
    const categoryKeys = Object.keys(CATEGORY_LABELS);
    const categories: CategorySummary[] = categoryKeys.map((key) => {
        const catItems = processedBenchmarks.filter((b) => b.category === key);
        const catUnsupported = unsupported.filter((b) => b.category === key);
        const catElim = eliminations.filter((b) => b.category === key);

        const catCppRatios = catItems.map((b) => b.vsCppRatio);
        const catRustRatios = catItems.map((b) => b.vsRustRatio);

        return {
            key,
            label: CATEGORY_LABELS[key] || key,
            total: catItems.length + catUnsupported.length + catElim.length,
            implemented: catItems.length + catElim.length,
            unsupported: catUnsupported.length,
            vsCppGeomean: calculateGeomean(catCppRatios),
            vsRustGeomean: calculateGeomean(catRustRatios),
        };
    });

    // Featured benchmarks for teaser
    const featuredTargets = ['tokenization', 'recursive_tree_rebuild', 'binary_search', 'fibonacci'];
    const featured = featuredTargets.map((name) => {
        const b = processedBenchmarks.find((item) => item.name === name);
        if (!b) {
            return {
                name,
                profile: 'CPU',
                prismio: '—',
                cpp: '—',
                rust: '—',
                note: 'In latest run',
                tone: 'mixed' as const,
            };
        }

        const cppFaster = b.vsCppStatus === 'faster';
        const rustFaster = b.vsRustStatus === 'faster';

        let note = '';
        let tone: 'win' | 'mixed' = 'mixed';

        if (cppFaster && rustFaster) {
            tone = 'win';
            const cppSpeed = (1 / b.vsCppRatio).toFixed(2);
            const rustSpeed = (1 / b.vsRustRatio).toFixed(2);
            note = `${cppSpeed}× vs C++ · ${rustSpeed}× vs Rust`;
        } else if (rustFaster && !cppFaster) {
            tone = 'mixed';
            const rustSpeed = (1 / b.vsRustRatio).toFixed(2);
            note = `${rustSpeed}× vs Rust · C++ leads`;
        } else if (cppFaster && !rustFaster) {
            tone = 'mixed';
            const cppSpeed = (1 / b.vsCppRatio).toFixed(2);
            note = `${cppSpeed}× vs C++ · Rust leads`;
        } else {
            tone = 'mixed';
            note = 'At parity across all three arms';
        }

        return {
            name: b.name,
            profile: b.profile,
            prismio: b.prismioFormatted,
            cpp: b.cppFormatted,
            rust: b.rustFormatted,
            note,
            tone,
        };
    });

    // Formatted date (e.g. "27 Sep 2026")
    let formattedDate = 'Recent run';
    try {
        const d = new Date(data.generated_at);
        formattedDate = d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        // fallback
    }

    // Toolchain compile latency & binary size
    const rawCompile = (data as { compile_ns?: Record<string, number> }).compile_ns || {};
    const rawBinary = (data as { binary_bytes?: Record<string, number> }).binary_bytes || {};

    const prismioCompileNs = rawCompile.prismio || 0;
    const cppCompileNs = rawCompile.cpp || 0;
    const rustCompileNs = rawCompile.rust || 0;

    const prismioBinaryBytes = rawBinary.prismio || 0;
    const cppBinaryBytes = rawBinary.cpp || 0;
    const rustBinaryBytes = rawBinary.rust || 0;

    const vsCppCompileSpeedupPct = cppCompileNs > 0 && prismioCompileNs > 0
        ? ((cppCompileNs - prismioCompileNs) / cppCompileNs) * 100
        : 0;

    const vsRustCompileSpeedupPct = rustCompileNs > 0 && prismioCompileNs > 0
        ? ((rustCompileNs - prismioCompileNs) / rustCompileNs) * 100
        : 0;

    const vsRustBinaryReductionPct = rustBinaryBytes > 0 && prismioBinaryBytes > 0
        ? ((rustBinaryBytes - prismioBinaryBytes) / rustBinaryBytes) * 100
        : 0;

    const vsCppBinaryReductionPct = cppBinaryBytes > 0 && prismioBinaryBytes > 0
        ? ((cppBinaryBytes - prismioBinaryBytes) / cppBinaryBytes) * 100
        : 0;

    const toolchain: ToolchainData = {
        compileTime: {
            prismio: { raw: prismioCompileNs, formatted: (prismioCompileNs / 1e9).toFixed(2) + ' s' },
            cpp: { raw: cppCompileNs, formatted: (cppCompileNs / 1e9).toFixed(2) + ' s' },
            rust: { raw: rustCompileNs, formatted: (rustCompileNs / 1e9).toFixed(2) + ' s' },
            vsCppSpeedupPct: vsCppCompileSpeedupPct,
            vsRustSpeedupPct: vsRustCompileSpeedupPct,
        },
        binarySize: {
            prismio: { raw: prismioBinaryBytes, formatted: (prismioBinaryBytes / 1024).toFixed(0) + ' KB' },
            cpp: { raw: cppBinaryBytes, formatted: (cppBinaryBytes / 1024).toFixed(0) + ' KB' },
            rust: { raw: rustBinaryBytes, formatted: (rustBinaryBytes / 1024).toFixed(0) + ' KB' },
            vsRustReductionPct: vsRustBinaryReductionPct,
            vsCppReductionPct: vsCppBinaryReductionPct,
        },
    };

    return {
        generatedAt: data.generated_at,
        formattedDate,
        runs: data.runs,
        buildCommands: data.build_commands || {},
        eliminationNs,
        toolchain,
        stats: {
            total: rawList.length,
            implemented: implementedRaw.length,
            unsupported: unsupported.length,
            eliminated: eliminations.length,
            cppGeomean,
            rustGeomean,
            cppSpeedupPct,
            rustSpeedupPct,
            winsVsCpp,
            parityVsCpp,
            lossesVsCpp,
            winsVsRust,
            parityVsRust,
            lossesVsRust,
            fastestMarginCpp,
            fastestMarginRust,
        },
        categories,
        benchmarks: processedBenchmarks,
        unsupported,
        eliminations,
        featured,
    };
}
