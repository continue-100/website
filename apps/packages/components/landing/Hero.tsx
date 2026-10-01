'use client';

import React, {useState, useMemo} from 'react';
import Link from 'next/link';
import {
    BadgeCheck,
    Check,
    CheckCircle2,
    ChevronRight,
    Copy,
    Cpu,
    ExternalLink,
    FileCode2,
    Filter,
    Layers,
    Lock,
    Search,
    ShieldCheck,
    Sparkles,
    Terminal,
    UploadCloud,
    Zap,
} from 'lucide-react';
import {motion, AnimatePresence} from "framer-motion";

interface PackageMeta {
    name: string;
    version: string;
    description: string;
    category: 'stdlib' | 'ffi' | 'compiler' | 'systems' | 'data';
    abi: 'c-direct' | 'llvm-ir' | 'native-dual';
    aifMemory: 'zero-alloc' | 'stack-dominant' | 'arena-scoped';
    downloads: string;
    stars: string;
    updatedAt: string;
    author: string;
    verified: boolean;
}

const REGISTRY_PACKAGES: PackageMeta[] = [
    {
        name: "@prism/net-http",
        version: "1.4.0",
        description: "Zero-allocation asynchronous HTTP/1.1 & HTTP/2 server utilizing kernel epoll/kqueue with AIF stack-buffered frames.",
        category: "stdlib",
        abi: "c-direct",
        aifMemory: "zero-alloc",
        downloads: "128.4k",
        stars: "1,420",
        updatedAt: "2 days ago",
        author: "prismio-core",
        verified: true,
    },
    {
        name: "@prism/llvm-opt",
        version: "0.9.2",
        description: "Custom LLVM pass pipelines, vectorization heuristics, and link-time optimization (LTO) profiles for Prismio binaries.",
        category: "compiler",
        abi: "llvm-ir",
        aifMemory: "stack-dominant",
        downloads: "84.2k",
        stars: "912",
        updatedAt: "5 days ago",
        author: "prismio-core",
        verified: true,
    },
    {
        name: "zstd-native",
        version: "1.5.6",
        description: "Direct C ABI bindings to Facebook Zstandard compression with streaming SIMD dictionary acceleration and zero marshaling overhead.",
        category: "ffi",
        abi: "c-direct",
        aifMemory: "zero-alloc",
        downloads: "92.6k",
        stars: "740",
        updatedAt: "1 week ago",
        author: "systems-collective",
        verified: true,
    },
    {
        name: "@prism/simd-tensor",
        version: "0.8.0",
        description: "Hardware-accelerated multi-dimensional array tensors with AVX-512 and ARM NEON vectorized matrix kernels.",
        category: "systems",
        abi: "llvm-ir",
        aifMemory: "arena-scoped",
        downloads: "46.1k",
        stars: "610",
        updatedAt: "3 days ago",
        author: "hpc-lab",
        verified: true,
    },
    {
        name: "@prism/sqlite-raw",
        version: "3.45.1",
        description: "Type-safe compile-time SQL statement verification and direct embedded SQLite3 engine integration with zero heap copying.",
        category: "data",
        abi: "c-direct",
        aifMemory: "zero-alloc",
        downloads: "78.9k",
        stars: "830",
        updatedAt: "4 days ago",
        author: "prismio-core",
        verified: true,
    },
    {
        name: "@prism/crypto-ring",
        version: "0.5.1",
        description: "Constant-time cryptographic implementations (Ed25519, ChaCha20-Poly1305, SHA3) verified against timing side-channel attacks.",
        category: "systems",
        abi: "c-direct",
        aifMemory: "zero-alloc",
        downloads: "54.8k",
        stars: "594",
        updatedAt: "1 week ago",
        author: "sec-wg",
        verified: true,
    },
    {
        name: "@prism/async-io",
        version: "1.2.0",
        description: "High-throughput asynchronous task scheduler featuring work-stealing thread pools and timer wheel primitives.",
        category: "stdlib",
        abi: "llvm-ir",
        aifMemory: "stack-dominant",
        downloads: "112.0k",
        stars: "1,180",
        updatedAt: "1 day ago",
        author: "prismio-core",
        verified: true,
    },
    {
        name: "@prism/codec-json",
        version: "2.1.0",
        description: "Zero-copy SIMD-accelerated JSON parser with compile-time schema introspection and zero intermediate allocations.",
        category: "data",
        abi: "c-direct",
        aifMemory: "zero-alloc",
        downloads: "98.3k",
        stars: "765",
        updatedAt: "6 days ago",
        author: "prismio-core",
        verified: true,
    },
    {
        name: "@prism/tracing",
        version: "0.4.3",
        description: "Zero-cost structured span logging and OpenTelemetry-compatible tracing infrastructure designed for embedded and cloud runtimes.",
        category: "systems",
        abi: "native-dual",
        aifMemory: "stack-dominant",
        downloads: "38.5k",
        stars: "420",
        updatedAt: "2 weeks ago",
        author: "observability-team",
        verified: true,
    },
];

const FILTER_TABS = [
    { id: "all", label: "All Modules" },
    { id: "stdlib", label: "Core Stdlib (@prism/*)" },
    { id: "ffi", label: "Direct C FFI" },
    { id: "compiler", label: "Compiler Passes" },
    { id: "systems", label: "Low-Level Systems" },
    { id: "data", label: "Serialization & Data" },
];

export default function Hero() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [copiedPkg, setCopiedPkg] = useState<string | null>(null);

    const handleCopy = (cmd: string, id: string) => {
        navigator.clipboard.writeText(cmd);
        setCopiedPkg(id);
        setTimeout(() => setCopiedPkg(null), 1800);
    };

    const filteredPackages = useMemo(() => {
        return REGISTRY_PACKAGES.filter((pkg) => {
            const matchesTab = activeTab === "all" || pkg.category === activeTab;
            const matchesQuery =
                searchQuery === "" ||
                pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pkg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pkg.author.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesQuery;
        });
    }, [searchQuery, activeTab]);

    return (
        <div className="flex flex-col items-center w-full">
            {/* ── Top Registry Hero ────────────────────────────────────── */}
            <section className="w-full max-w-6xl mx-auto px-6 pt-14 pb-12 relative z-20">

                <div className="text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] text-zinc-950 leading-[1.05] mb-5">
                        Native libraries.
                        <br />
                        <span className="text-zinc-500 font-medium ">Verified for the compiler.</span>
                    </h1>

                    <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto mb-10">
                        The official registry for Prismio modules, runtime extensions, and C ABI interfaces.
                        Packaged via the Unified Manifest System (<code className="bg-zinc-100 border border-zinc-300 px-1.5 py-0.5 rounded text-zinc-800 font-mono text-xs">build.ums</code>)
                        and verified by the Adaptive Inference Framework.
                    </p>
                </div>

                {/* ── Search Bar & Filter Strip ───────────────────────── */}
                <div className="w-full max-w-3xl mx-auto">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                            <Search className="h-5 w-5 text-zinc-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter packages by name, symbol, C ABI, or target architecture..."
                            className="w-full h-13 pl-12 pr-12 bg-white border-2 border-zinc-300 focus:border-zinc-950 rounded-xl text-sm sm:text-base text-zinc-950 font-medium placeholder:text-zinc-400 focus:outline-none transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute inset-y-0 right-3 flex items-center px-2 text-xs font-mono text-zinc-400 hover:text-zinc-800 cursor-pointer"
                            >
                                CLEAR
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {FILTER_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer ${
                                    activeTab === tab.id
                                        ? "bg-zinc-900 text-white border-zinc-900 font-semibold"
                                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-950"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Technical Pillar Specs ──────────────────────────── */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto border-t border-zinc-200 pt-8">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 font-mono uppercase tracking-wider">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <span>Unified Manifest (`build.ums`)</span>
                        </div>
                        <p className="text-xs text-zinc-600 leading-relaxed">
                            Dependencies declare target ABIs, feature flags, and linker passes declaratively. No hidden install scripts.
                        </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 font-mono uppercase tracking-wider">
                            <Zap className="w-4 h-4 text-amber-600" />
                            <span>AIF Allocation Attestation</span>
                        </div>
                        <p className="text-xs text-zinc-600 leading-relaxed">
                            Packages are analyzed by the compiler prior to publishing. Escape analysis and stack-lifetime metrics are certified.
                        </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 font-mono uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Direct C ABI Linking</span>
                        </div>
                        <p className="text-xs text-zinc-600 leading-relaxed">
                            Zero glue code or runtime wrappers. Standard C dynamic and static archives bind with native symbol resolution.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Spotlight Package Section ──────────────────────────── */}
            <section className="w-full max-w-6xl mx-auto px-6 py-6 relative z-10">
                <div className="flex flex-col lg:flex-row bg-white border-2 border-zinc-300 rounded-2xl overflow-hidden">
                    <div className="flex-1 p-8 md:p-10 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2.5 mb-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-zinc-900 text-white uppercase tracking-wider">
                                    CORE STDLIB
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 border border-emerald-300 text-emerald-800">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    AIF VERIFIED ZERO-HEAP
                                </span>
                            </div>

                            <Link
                                href="/package/@prism/net-http"
                                className="inline-flex items-center gap-2 mb-3 group"
                            >
                                <h2 className="text-3xl font-bold tracking-tight text-zinc-950 group-hover:text-indigo-600 transition-colors">
                                    @prism/net-http
                                </h2>
                                <BadgeCheck className="w-6 h-6 text-indigo-600" />
                            </Link>

                            <p className="text-sm sm:text-base text-zinc-600 mb-6 max-w-xl leading-relaxed">
                                High-throughput, non-blocking asynchronous HTTP/1.1 & HTTP/2 protocol engine.
                                Implemented with direct kernel event queues (<code className="font-mono text-xs">epoll</code> on Linux, <code className="font-mono text-xs">kqueue</code> on macOS, <code className="font-mono text-xs">IOCP</code> on Windows)
                                and compiler-enforced stack frame reuse.
                            </p>

                            <div className="grid grid-cols-3 gap-4 border-t border-zinc-200 pt-4 mb-6 text-xs max-w-md">
                                <div>
                                    <span className="text-zinc-400 block font-mono text-[11px]">ABI Standard</span>
                                    <span className="font-semibold text-zinc-900 font-mono">c-direct</span>
                                </div>
                                <div>
                                    <span className="text-zinc-400 block font-mono text-[11px]">Steady Allocations</span>
                                    <span className="font-semibold text-emerald-700 font-mono">0 bytes (stack)</span>
                                </div>
                                <div>
                                    <span className="text-zinc-400 block font-mono text-[11px]">Compiler Target</span>
                                    <span className="font-semibold text-zinc-900 font-mono">LLVM 23 AOT + JIT</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <Link
                                href="/package/@prism/net-http"
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-950 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-colors"
                            >
                                <span>Inspect Module Documentation</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                            <span className="text-xs text-zinc-500 font-mono">
                                Published by <span className="font-bold text-zinc-900">prismio-core</span>
                            </span>
                        </div>
                    </div>

                    <div className="w-full lg:w-[460px] bg-zinc-50 border-t lg:border-t-0 lg:border-l-2 border-zinc-300 p-6 sm:p-8 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                                    Quick Dependency Add
                                </span>
                            </div>
                            <div className="bg-white border border-zinc-300 rounded-lg p-1.5 flex items-center justify-between mb-6">
                                <code className="text-xs px-2.5 font-mono font-semibold text-zinc-900">
                                    prism add @prism/net-http
                                </code>
                                <button
                                    type="button"
                                    onClick={() => handleCopy("prism add @prism/net-http", "spotlight-cli")}
                                    className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors text-zinc-600 hover:text-zinc-950 focus:outline-none cursor-pointer"
                                    aria-label="Copy install command"
                                >
                                    {copiedPkg === "spotlight-cli" ? (
                                        <Check className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                                    Prismio Usage Example
                                </span>
                            </div>
                            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono overflow-x-auto text-zinc-200 leading-relaxed">
                                <div className="text-zinc-500">// Stack-allocated async HTTP handler</div>
                                <div><span className="text-indigo-400 font-semibold">import</span> <span className="text-zinc-100">&#123; Server, Request, Response &#125;</span> <span className="text-indigo-400 font-semibold">from</span> <span className="text-[#47d7b5]">"@prism/net-http"</span></div>
                                <div className="mt-3"><span className="text-indigo-400 font-semibold">fn</span> <span className="text-sky-300 font-semibold">handle</span>(req: &Request) -&gt; Response &#123;</div>
                                <div className="pl-4 text-zinc-300">let res = Response.ok()</div>
                                <div className="pl-4 text-zinc-300">res.header(<span className="text-emerald-400">"X-Engine"</span>, <span className="text-emerald-400">"Prismio-Native"</span>)</div>
                                <div className="pl-4 text-zinc-300">return res.json(&#123; status: <span className="text-emerald-400">"healthy"</span>, pid: 401 &#125;)</div>
                                <div className="text-zinc-500">&#125;</div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-zinc-200 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                            <span>Target: <strong className="text-zinc-800">x86_64, aarch64</strong></span>
                            <span>Integrity: <strong className="text-emerald-700">sha256:7f4a...9b1</strong></span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Package Catalog Grid ───────────────────────────────── */}
            <section className="w-full max-w-6xl mx-auto px-6 py-12 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-zinc-200 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
                            Registry Packages
                        </h2>
                        <p className="mt-1 text-xs text-zinc-500">
                            Showing {filteredPackages.length} of {REGISTRY_PACKAGES.length} verified packages conforming to the Unified Manifest specification.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>All artifacts checked against compiler runtime shims</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPackages.map((pkg) => (
                        <div
                            key={pkg.name}
                            className="flex flex-col justify-between p-6 bg-white border border-zinc-300 hover:border-zinc-950 rounded-xl transition-colors duration-150"
                        >
                            <div>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex flex-col gap-1">
                                        <Link
                                            href={`/package/${encodeURIComponent(pkg.name)}`}
                                            className="flex items-center gap-1.5 w-fit group"
                                        >
                                            <h3 className="text-base font-bold text-zinc-950 group-hover:text-indigo-600 transition-colors font-mono">
                                                {pkg.name}
                                            </h3>
                                            {pkg.verified && (
                                                <BadgeCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                                            )}
                                        </Link>

                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 border border-zinc-200 text-zinc-800">
                                                ABI: {pkg.abi}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                                                pkg.aifMemory === 'zero-alloc'
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                    : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                                            }`}>
                                                AIF: {pkg.aifMemory}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right font-mono">
                                        <span className="text-xs font-bold text-zinc-950 block">v{pkg.version}</span>
                                        <span className="text-[10px] text-zinc-400">release</span>
                                    </div>
                                </div>

                                <p className="text-xs leading-relaxed text-zinc-600 mb-6 mt-3">
                                    {pkg.description}
                                </p>
                            </div>

                            <div className="border-t border-zinc-100 pt-3 flex flex-col gap-3">
                                <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                                    <span>Downloads: <strong className="text-zinc-900 font-semibold">{pkg.downloads}</strong></span>
                                    <span>Updated: <strong className="text-zinc-700">{pkg.updatedAt}</strong></span>
                                </div>

                                <div className="flex items-center justify-between gap-2 bg-zinc-50 border border-zinc-300 rounded-lg p-1">
                                    <code className="text-[11px] px-2 font-mono font-medium text-zinc-900 truncate">
                                        prism add {pkg.name}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(`prism add ${pkg.name}`, pkg.name)}
                                        className="p-1 hover:bg-white rounded border border-transparent hover:border-zinc-300 transition-colors text-zinc-500 hover:text-zinc-950 focus:outline-none cursor-pointer shrink-0"
                                        aria-label="Copy command"
                                    >
                                        {copiedPkg === pkg.name ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Unified Manifest Architecture (build.ums) ──────────── */}
            <section className="w-full max-w-6xl mx-auto px-6 py-12 relative z-10">
                <div className="border border-zinc-300 rounded-2xl bg-zinc-50 p-8 md:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        <div className="lg:col-span-6 flex flex-col gap-5">
                            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded w-fit">
                                <FileCode2 size={14} />
                                <span>Unified Manifest System (build.ums)</span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
                                Deterministic packaging with zero arbitrary build scripts.
                            </h2>

                            <p className="text-sm text-zinc-600 leading-relaxed">
                                Unlike package managers that execute arbitrary scripts during installation, Prismio packages are defined entirely within a single declarative <code className="bg-zinc-200/80 px-1.5 py-0.5 rounded font-mono text-xs text-zinc-900">build.ums</code> manifest.
                            </p>

                            <div className="space-y-4 text-xs">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded bg-zinc-900 text-white font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                                        1
                                    </div>
                                    <div>
                                        <strong className="text-zinc-900 block font-semibold">Strict Semantic Resolution</strong>
                                        <span className="text-zinc-600">The dependency resolver uses a SAT-based constraint solver to eliminate phantom dependencies and version skew.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded bg-zinc-900 text-white font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                                        2
                                    </div>
                                    <div>
                                        <strong className="text-zinc-900 block font-semibold">Hermetic Compilation Isolation</strong>
                                        <span className="text-zinc-600">Modules cannot access network sockets or write arbitrary disk paths during compiler build passes.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded bg-zinc-900 text-white font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                                        3
                                    </div>
                                    <div>
                                        <strong className="text-zinc-900 block font-semibold">Lockfile Cryptographic Attestation</strong>
                                        <span className="text-zinc-600">The generated <code className="font-mono text-zinc-900">prism.lock</code> records SHA-256 tree digests for reproducible bit-identical binaries across platforms.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-6">
                            <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 text-xs font-mono text-zinc-400">
                                    <div className="flex items-center gap-2">
                                        <FileCode2 size={13} className="text-indigo-400" />
                                        <span>build.ums</span>
                                    </div>
                                    <span className="text-[11px] text-zinc-500">Manifest v1</span>
                                </div>
                                <pre className="p-5 text-xs font-mono leading-relaxed text-zinc-200 overflow-x-auto">
                                    <div className="text-zinc-500">// Package manifest for @prism/net-http</div>
                                    <div><span className="text-indigo-400 font-semibold">package</span> <span className="text-[#47d7b5]">"@prism/net-http"</span> &#123;</div>
                                    <div className="pl-4"><span className="text-zinc-400">version:</span> <span className="text-emerald-400">"1.4.0"</span>,</div>
                                    <div className="pl-4"><span className="text-zinc-400">license:</span> <span className="text-emerald-400">"Apache-2.0 OR MIT"</span>,</div>
                                    <div className="pl-4"><span className="text-zinc-400">authors:</span> [<span className="text-emerald-400">"Prismio Systems Team &lt;core@prismio.org&gt;"</span>],</div>
                                    <div className="pl-4"><span className="text-zinc-400">repository:</span> <span className="text-emerald-400">"https://github.com/prismio-lang/prismio"</span>,</div>
                                    <div className="mt-2 pl-4"><span className="text-indigo-300 font-semibold">dependencies:</span> &#123;</div>
                                    <div className="pl-8"><span className="text-zinc-300">"@prism/core-sys":</span> <span className="text-emerald-400">"^1.0.0"</span>,</div>
                                    <div className="pl-8"><span className="text-zinc-300">"zstd-native":</span> &#123; <span className="text-zinc-400">version:</span> <span className="text-emerald-400">"1.5.6"</span>, <span className="text-zinc-400">optional:</span> <span className="text-amber-400">true</span> &#125;,</div>
                                    <div className="pl-4">&#125;,</div>
                                    <div className="mt-2 pl-4"><span className="text-indigo-300 font-semibold">target "native"</span> &#123;</div>
                                    <div className="pl-8"><span className="text-zinc-400">abi:</span> <span className="text-emerald-400">"c-direct"</span>,</div>
                                    <div className="pl-8"><span className="text-zinc-400">aif_mode:</span> <span className="text-emerald-400">"strict-inference"</span>,</div>
                                    <div className="pl-8"><span className="text-zinc-400">lto:</span> <span className="text-amber-400">true</span>,</div>
                                    <div className="pl-4">&#125;</div>
                                    <div>&#125;</div>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Publishing Workflow (#publishing) ──────────────────── */}
            <section id="publishing" className="w-full max-w-6xl mx-auto px-6 py-12 pb-24 relative z-10">
                <div className="border border-zinc-300 rounded-2xl bg-white p-8 md:p-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-zinc-200 gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded w-fit mb-2">
                                <UploadCloud size={14} />
                                <span>Maintainer Workflow</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
                                Publishing to packages.prismio.org
                            </h2>
                        </div>

                        <Link
                            href="https://docs.prismio.org/package-manager"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                            <span>Read Full CLI Publishing Specification</span>
                            <ExternalLink size={13} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col justify-between p-6 rounded-xl border border-zinc-300 bg-zinc-50">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="w-7 h-7 rounded-md bg-zinc-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                                        1
                                    </span>
                                    <span className="text-[11px] font-mono text-zinc-500 font-semibold uppercase">Auth</span>
                                </div>
                                <h3 className="text-sm font-bold text-zinc-900 mb-2">Authenticate Toolchain</h3>
                                <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                                    Authenticate your local CLI environment via Ed25519 registry key pairs or FIDO2 hardware tokens.
                                </p>
                            </div>
                            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-[11px] text-zinc-200">
                                <span className="text-indigo-400">$</span> prism auth login
                            </div>
                        </div>

                        <div className="flex flex-col justify-between p-6 rounded-xl border border-zinc-300 bg-zinc-50">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="w-7 h-7 rounded-md bg-zinc-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                                        2
                                    </span>
                                    <span className="text-[11px] font-mono text-zinc-500 font-semibold uppercase">Verify</span>
                                </div>
                                <h3 className="text-sm font-bold text-zinc-900 mb-2">AIF Pre-Flight Check</h3>
                                <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                                    Run the compiler's static verifier across your module's export signatures and memory bounds.
                                </p>
                            </div>
                            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-[11px] text-zinc-200">
                                <span className="text-indigo-400">$</span> prism package verify
                            </div>
                        </div>

                        <div className="flex flex-col justify-between p-6 rounded-xl border border-zinc-300 bg-zinc-50">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="w-7 h-7 rounded-md bg-zinc-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                                        3
                                    </span>
                                    <span className="text-[11px] font-mono text-zinc-500 font-semibold uppercase">Release</span>
                                </div>
                                <h3 className="text-sm font-bold text-zinc-900 mb-2">Sign & Publish</h3>
                                <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                                    Builds bit-identical source archives, stamps SHA-256 digests, and registers the release.
                                </p>
                            </div>
                            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-[11px] text-zinc-200">
                                <span className="text-indigo-400">$</span> prism publish
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
