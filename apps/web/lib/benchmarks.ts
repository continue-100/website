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
    /** Written by benchmarks/run.py since schema 3: how each comparison was decided. */
    verdict?: {cpp?: RawVerdict; rust?: RawVerdict};
}

export interface RawVerdict {
    outcome: 'win' | 'parity' | 'loss';
    ratio: number;
    best_ratio: number;
    tolerance: number;
    noise: number;
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

export interface ParsedBuildCommand {
    tool: string;
    sub?: string;
    flags: string[];
    sources: string[];
    output?: string;
}

/** `environment` as benchmarks/run.py writes it (schema_version 2). Every key is optional. */
interface RawEnvironment {
    processor?: string;
    cores?: number;
    memory_bytes?: number;
    os?: string;
    target?: string;
    power?: string;
    toolchains?: {
        prismio?: {version?: string; profile?: string};
        clang?: string;
        rustc?: string;
        llvm?: string;
    };
    source?: {commit?: string; dirty?: boolean};
    harness?: {name?: string; schema_version?: number};
}

/** Display strings derived from `environment`; a key is absent when the run did not record it. */
export interface BenchmarkEnvironment {
    processor?: string;
    memory?: string;
    os?: string;
    target?: string;
    power?: string;
    prismio?: string;
    prismioProfile?: string;
    clang?: string;
    rustc?: string;
    llvm?: string;
    harness?: string;
    source?: string;
}

function describeEnvironment(raw: RawEnvironment | undefined): BenchmarkEnvironment {
    if (!raw) return {};
    const out: BenchmarkEnvironment = {};
    if (raw.processor) out.processor = raw.cores ? `${raw.processor} (${raw.cores} cores)` : raw.processor;
    if (raw.memory_bytes) out.memory = `${Math.round(raw.memory_bytes / 2 ** 30)} GB`;
    if (raw.os) out.os = raw.os;
    if (raw.target) out.target = raw.target;
    if (raw.power) out.power = raw.power;
    const tools = raw.toolchains;
    if (tools?.prismio?.version) out.prismio = tools.prismio.version;
    if (tools?.prismio?.profile) out.prismioProfile = tools.prismio.profile;
    if (tools?.clang) out.clang = tools.clang;
    if (tools?.rustc) out.rustc = tools.rustc;
    if (tools?.llvm) out.llvm = tools.llvm;
    if (raw.harness?.name) {
        out.harness = raw.harness.schema_version
            ? `${raw.harness.name} (schema v${raw.harness.schema_version})`
            : raw.harness.name;
    }
    if (raw.source?.commit) {
        out.source = raw.source.dirty ? `${raw.source.commit} (uncommitted changes)` : raw.source.commit;
    }
    return out;
}

/** Strip machine-specific absolute paths so a recorded command is safe to show publicly. */
function cleanPath(token: string): string {
    const idx = token.lastIndexOf('/benchmarks/');
    if (idx >= 0) return token.slice(idx + 1);
    return token.split('/').pop() || token;
}

function mergeSources(paths: string[]): string[] {
    const groups = new Map<string, {dir: string; ext: string; names: string[]}>();
    const order: string[] = [];
    for (const path of paths) {
        const slash = path.lastIndexOf('/');
        const dir = slash >= 0 ? path.slice(0, slash) : '';
        const file = slash >= 0 ? path.slice(slash + 1) : path;
        const dot = file.lastIndexOf('.');
        const ext = dot >= 0 ? file.slice(dot) : '';
        const name = dot >= 0 ? file.slice(0, dot) : file;
        const key = `${dir}|${ext}`;
        if (!groups.has(key)) {
            groups.set(key, {dir, ext, names: []});
            order.push(key);
        }
        groups.get(key)!.names.push(name);
    }
    return order.map((key) => {
        const {dir, ext, names} = groups.get(key)!;
        const prefix = dir ? `${dir}/` : '';
        return names.length > 1 ? `${prefix}{${names.join(',')}}${ext}` : `${prefix}${names[0]}${ext}`;
    });
}

export function parseBuildCommand(raw: string | undefined): ParsedBuildCommand | null {
    if (!raw) return null;
    const tokens = raw.trim().split(/\s+/);
    const tool = cleanPath(tokens[0] ?? '');
    if (!tool) return null;

    const flags: string[] = [];
    const paths: string[] = [];
    let sub: string | undefined;
    let output: string | undefined;

    for (let i = 1; i < tokens.length; i++) {
        const token = tokens[i] as string;
        if (token === '-o') {
            output = cleanPath(tokens[i + 1] ?? '');
            i++;
        } else if (token.startsWith('-')) {
            flags.push(token);
        } else if (token.includes('/') || /\.(psm|cpp|rs)$/.test(token)) {
            paths.push(cleanPath(token));
        } else if (!sub && flags.length === 0 && !token.includes('=')) {
            sub = token;
        } else {
            flags.push(token);
        }
    }

    return {tool, sub, flags, sources: mergeSources(paths), output};
}

export interface BenchmarkDataset {
    generatedAt: string;
    formattedDate: string;
    runs: number;
    buildCommands: Record<'prismio' | 'cpp' | 'rust', ParsedBuildCommand | null>;
    environment: BenchmarkEnvironment;
    cachedBuilds: string[];
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

function medianOf(values: number[]): number {
    const v = [...values].sort((x, y) => x - y);
    if (!v.length) return 0;
    const mid = Math.floor(v.length / 2);
    return v.length % 2 === 0 ? (v[mid - 1]! + v[mid]!) / 2 : v[mid]!;
}

/**
 * Interquartile range over the median: how much of the median is jitter. The same
 * measure benchmarks/run.py judges a result by. (A median-and-MAD figure reads a run
 * with two timing modes as 0% noise.) Quartiles interpolate linearly, which is what
 * Python's `statistics.quantiles(..., method="inclusive")` does.
 */
export function calculateSpread(samples: number[]): number {
    if (!samples || samples.length < 2) return 0;
    const v = [...samples].sort((x, y) => x - y);
    const med = medianOf(v);
    if (med <= 0) return 0;
    if (v.length < 4) return (v[v.length - 1]! - v[0]!) / med;
    const at = (q: number) => {
        const pos = (v.length - 1) * q;
        const lo = Math.floor(pos);
        const hi = Math.ceil(pos);
        return v[lo]! + (v[hi]! - v[lo]!) * (pos - lo);
    };
    return (at(0.75) - at(0.25)) / med;
}

/** The same figure as a percentage, or null when there is nothing to measure it on. */
export function calculateRobustJitter(samples: number[], med: number): number | null {
    if (!samples || samples.length <= 1 || !med) return null;
    return calculateSpread(samples) * 100;
}

/**
 * `win`, `parity` or `loss` for Prismio's samples against another arm's: a port of
 * `verdict` in benchmarks/run.py, used when a results file predates schema 3 and so
 * carries none. A win or a loss needs BOTH the ratio of medians and the ratio of best
 * runs to leave the tolerance. Noise only adds time, so the best run is the steadiest
 * estimate of what the code costs; equal best runs with different medians is the
 * signature of timing modes (a fast and a slow one), and is parity. The tolerance on
 * medians is the largest of the flat `parity`, either arm's own spread, and a fixed
 * timer/scheduler floor as a fraction of the run; on best runs only `parity` and the
 * floor, which carry no spread.
 */
export function computeVerdict(
    prismio: number[],
    other: number[],
    parity: number,
    floorNs: number,
): RawVerdict {
    const medP = medianOf(prismio);
    const medO = medianOf(other);
    const minP = Math.min(...prismio);
    const minO = Math.min(...other);
    const ratio = medP / Math.max(medO, 1);
    const bestRatio = minP / Math.max(minO, 1);
    const noise = Math.max(calculateSpread(prismio), calculateSpread(other));
    const tolMedian = Math.max(parity, noise, floorNs / Math.max(medO, 1));
    const tolBest = Math.max(parity, floorNs / Math.max(minO, 1));
    let outcome: RawVerdict['outcome'] = 'parity';
    if (ratio >= 1 + tolMedian && bestRatio >= 1 + tolBest) outcome = 'loss';
    else if (ratio <= 1 - tolMedian && bestRatio <= 1 - tolBest) outcome = 'win';
    return {outcome, ratio, best_ratio: bestRatio, tolerance: tolMedian, noise};
}

const PILL_STATUS = {win: 'faster', loss: 'slower', parity: 'parity'} as const;

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
        environment?: RawEnvironment;
        cached_builds?: string[];
        parity?: number;
        noise_model?: {floor_ns?: number};
        elimination_ns?: number;
        benchmarks: RawBenchmarkItem[];
    };

    const eliminationNs = data.elimination_ns || 10000;
    const parity = data.parity ?? 0.04;
    const noiseFloorNs = data.noise_model?.floor_ns ?? 25_000;
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

        const vsCppRatio = pMed / Math.max(cMed, 1);
        const vsRustRatio = pMed / Math.max(rMed, 1);

        // The harness's own verdict when the results carry one (schema 3); otherwise
        // the same rule computed here from the samples.
        const judge = (who: 'cpp' | 'rust', other: number[]) =>
            (b.verdict?.[who] ?? computeVerdict(pSamples, other, parity, noiseFloorNs)).outcome;

        const vsCppStatus = isElimination
            ? (pMed <= eliminationNs ? 'faster' : 'parity')
            : PILL_STATUS[judge('cpp', cSamples)];

        const vsRustStatus = isElimination
            ? (pMed <= eliminationNs ? 'faster' : 'parity')
            : PILL_STATUS[judge('rust', rSamples)];

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
        buildCommands: {
            prismio: parseBuildCommand(data.build_commands?.prismio),
            cpp: parseBuildCommand(data.build_commands?.cpp),
            rust: parseBuildCommand(data.build_commands?.rust),
        },
        environment: (() => {
            const env = describeEnvironment(data.environment);
            // Runs from before schema 2 still name the compiler's profile in the recorded command
            // (`.prismio/build/debug/prismio build ...`).
            const profile = data.build_commands?.prismio?.match(/\.prismio\/build\/([^/\s]+)\//)?.[1];
            if (!env.prismioProfile && profile) env.prismioProfile = profile;
            return env;
        })(),
        cachedBuilds: data.cached_builds ?? [],
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
