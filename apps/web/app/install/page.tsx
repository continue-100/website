'use client';

import React, { useState, useEffect } from 'react';
import {
    Download,
    Copy,
    Check,
    Terminal,
    Cpu,
    Info,
    ExternalLink,
    Monitor,
    Sparkles,
    GitBranch,
    FolderCode,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HeaderMain from '@/components/HeaderMain';
import IntelliJPluginCard from '@/components/IntelliJPluginCard';
import { PRISMIO_VERSION, LLVM_VERSION } from '@prismio/utils';

type OS = 'macOS' | 'Linux' | 'Windows';
type Arch = 'x64' | 'arm64';
type InstallMode = 'quickstart' | 'source' | 'binaries';
type VerifyTab = 'version' | 'project' | 'aif';

interface ReleaseDetails {
    filename: string;
    size: string;
    url: string;
    installCmd?: string;
    instruction?: string;
}

interface PlatformReleases {
    x64?: ReleaseDetails;
    arm64?: ReleaseDetails;
}

interface ReleaseData {
    version: string;
    releaseDate: string;
    changelogUrl: string;
    platforms: {
        Windows: PlatformReleases;
        macOS: PlatformReleases;
        Linux: PlatformReleases;
    };
}

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function InstallPage() {
    const [installMode, setInstallMode] = useState<InstallMode>('quickstart');
    const [activeOS, setActiveOS] = useState<OS>('macOS');
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const [verifyTab, setVerifyTab] = useState<VerifyTab>('version');

    // GitHub Releases API state
    const [releases, setReleases] = useState<Record<string, ReleaseData>>({});
    const [loadingReleases, setLoadingReleases] = useState(true);

    const [detectedPlatform, setDetectedPlatform] = useState<{
        os: OS;
        arch: Arch;
        label: string;
    }>({ os: 'macOS', arch: 'arm64', label: 'macOS (Apple Silicon)' });

    // Copy to clipboard helper
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(id);
        setTimeout(() => setCopiedText(null), 2000);
    };

    // Client-side platform detection
    useEffect(() => {
        let os: OS = 'macOS';
        let arch: Arch = 'arm64';
        const ua = window.navigator.userAgent.toLowerCase();

        if (ua.includes('windows') || ua.includes('win32')) {
            os = 'Windows';
            arch = 'x64';
        } else if (ua.includes('linux')) {
            os = 'Linux';
            arch = ua.includes('aarch64') || ua.includes('arm64') ? 'arm64' : 'x64';
        } else if (ua.includes('macintosh') || ua.includes('mac os')) {
            os = 'macOS';
            arch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) || ua.includes('arm') ? 'arm64' : 'x64';
        }

        const navAny = window.navigator as any;
        if (navAny.userAgentData) {
            const p = navAny.userAgentData.platform;
            if (p === 'Windows') os = 'Windows';
            else if (p === 'Linux') os = 'Linux';
            else if (p === 'macOS') os = 'macOS';
        }

        const label = `${os} (${os === 'macOS' ? (arch === 'arm64' ? 'Apple Silicon' : 'Intel') : arch.toUpperCase()})`;
        setDetectedPlatform({ os, arch, label });
        setActiveOS(os);
    }, []);

    // Fetch GitHub releases in the background (graceful fallback if none published)
    useEffect(() => {
        const fetchReleases = async () => {
            try {
                const res = await fetch('https://api.github.com/repos/prismio-lang/prismio/releases');
                if (!res.ok) {
                    setLoadingReleases(false);
                    return;
                }
                const data = await res.json();
                const stableData = Array.isArray(data) ? data.filter((r: any) => !r.draft) : [];

                const parsed: Record<string, ReleaseData> = {};
                stableData.forEach((r: any) => {
                    const version = r.tag_name;
                    const releaseDate = new Date(r.published_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });

                    const platforms: ReleaseData['platforms'] = {
                        Windows: {},
                        macOS: {},
                        Linux: {}
                    };

                    if (r.assets && r.assets.length > 0) {
                        r.assets.forEach((asset: any) => {
                            const name = asset.name.toLowerCase();
                            const url = asset.browser_download_url;
                            const size = formatSize(asset.size);

                            if (name.includes('darwin') || name.includes('macos')) {
                                if (name.includes('arm64') || name.includes('aarch64')) {
                                    platforms.macOS.arm64 = { filename: asset.name, size, url };
                                } else {
                                    platforms.macOS.x64 = { filename: asset.name, size, url };
                                }
                            } else if (name.includes('linux')) {
                                if (name.includes('arm64') || name.includes('aarch64')) {
                                    platforms.Linux.arm64 = { filename: asset.name, size, url };
                                } else {
                                    platforms.Linux.x64 = { filename: asset.name, size, url };
                                }
                            } else if (name.includes('windows')) {
                                platforms.Windows.x64 = { filename: asset.name, size, url };
                            }
                        });
                    }

                    parsed[version] = {
                        version,
                        releaseDate,
                        changelogUrl: r.html_url,
                        platforms
                    };
                });

                setReleases(parsed);
                setLoadingReleases(false);
            } catch {
                setLoadingReleases(false);
            }
        };

        fetchReleases();
    }, []);

    const releaseVersions = Object.keys(releases);
    const activeRelease = releaseVersions[0] ? releases[releaseVersions[0]] : undefined;

    return (
        <div className="relative min-h-screen bg-[#070709] text-[#e4e4e7] overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
            {/* Background Atmosphere */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/15 via-[#070709]/50 to-[#070709] z-0" />
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-[600px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0" />

            <HeaderMain />

            <main className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-32">
                {/* ── 1. Hero ────────────────────────────────────────────── */}
                <section className="flex flex-col items-center text-center pt-8 pb-12">
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-mono text-indigo-300 mb-6">
                        <Terminal size={13} />
                        <span>Prismio {PRISMIO_VERSION} · LLVM {LLVM_VERSION}</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                        Install Prismio
                    </h1>
                    <p className="mt-4 text-base text-zinc-400 max-w-xl">
                        A compiled, statically typed language where the compiler decides how memory is managed.
                        Build it from source today or install using our quickstart script.
                    </p>

                    {/* Detected Platform Tag */}
                    <div className="mt-6 flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-1.5 text-xs text-zinc-400">
                        <Monitor size={13} className="text-zinc-500" />
                        <span>Detected platform:</span>
                        <strong className="text-zinc-200 font-mono">{detectedPlatform.label}</strong>
                    </div>

                    {/* Mode Selector Tabs */}
                    <div className="mt-10 flex flex-wrap justify-center gap-2 rounded-2xl border border-white/[0.08] bg-[#0c0d11] p-1.5 shadow-xl">
                        <button
                            type="button"
                            onClick={() => setInstallMode('quickstart')}
                            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
                                installMode === 'quickstart'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                            }`}
                        >
                            <Terminal size={14} />
                            <span>Quickstart Script</span>
                            <span className="rounded-md bg-white/20 px-1.5 py-0.2 text-[10px] uppercase font-mono">Recommended</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setInstallMode('source')}
                            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
                                installMode === 'source'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                            }`}
                        >
                            <GitBranch size={14} />
                            <span>Build from Source</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setInstallMode('binaries')}
                            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
                                installMode === 'binaries'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                            }`}
                        >
                            <Download size={14} />
                            <span>Pre-built Binaries</span>
                        </button>
                    </div>
                </section>

                {/* ── 2. Installation Content Panes ──────────────────────── */}
                <section className="mt-4">
                    {/* Tab 1: Quickstart Script */}
                    {installMode === 'quickstart' && (
                        <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-6 sm:p-8 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">One-Liner Toolchain Installer</h3>
                                    <p className="mt-1 text-xs text-zinc-400">
                                        Auto-detects architecture (x86_64, arm64) and configures the <code className="text-zinc-300">~/.prismio</code> toolchain path.
                                    </p>
                                </div>

                                <div className="flex items-center rounded-lg border border-white/[0.08] bg-black/40 p-1">
                                    {(['macOS', 'Linux', 'Windows'] as OS[]).map((os) => (
                                        <button
                                            key={os}
                                            type="button"
                                            onClick={() => setActiveOS(os)}
                                            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                                activeOS === os
                                                    ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/30'
                                                    : 'text-zinc-500 hover:text-zinc-300'
                                            }`}
                                        >
                                            {os}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {activeOS !== 'Windows' ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#06070a] px-4 py-3.5 ring-1 ring-white/[0.08]">
                                        <code className="min-w-0 overflow-x-auto whitespace-nowrap font-mono text-xs sm:text-sm text-zinc-200">
                                            <span className="mr-2 text-indigo-400 select-none font-bold">$</span>
                                            <span className="font-semibold text-white">curl</span>
                                            {' '}<span className="text-indigo-300">-fsSL</span>
                                            {' '}<span className="text-[#47d7b5]">https://prismio.org/install.sh</span>
                                            {' '}<span className="text-zinc-500">|</span>
                                            {' '}<span className="font-semibold text-white">sh</span>
                                        </code>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy('curl -fsSL https://prismio.org/install.sh | sh', 'quickstart-sh')}
                                            className="inline-flex cursor-pointer shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
                                        >
                                            {copiedText === 'quickstart-sh' ? (
                                                <>
                                                    <Check size={14} className="text-emerald-400" />
                                                    <span className="text-emerald-400">Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={14} />
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="grid gap-3 pt-2 sm:grid-cols-3 text-xs text-zinc-400">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                                            <span>Downloads matching platform archive into <code className="text-zinc-300 font-mono">~/.prismio</code></span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                                            <span>Configures environment in <code className="text-zinc-300 font-mono">.zshrc</code> / <code className="text-zinc-300 font-mono">.bashrc</code></span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                                            <span>Includes compiler, runtime, stdlib, and UMS</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#06070a] px-4 py-3.5 ring-1 ring-white/[0.08]">
                                        <code className="min-w-0 overflow-x-auto whitespace-nowrap font-mono text-xs sm:text-sm text-zinc-200">
                                            <span className="mr-2 text-indigo-400 select-none font-bold">&gt;</span>
                                            <span className="font-semibold text-white">winget</span>
                                            {' '}<span className="text-indigo-300">install</span>
                                            {' '}<span className="text-[#47d7b5]">prismio-lang.prismio</span>
                                        </code>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy('winget install prismio-lang.prismio', 'quickstart-winget')}
                                            className="inline-flex cursor-pointer shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
                                        >
                                            {copiedText === 'quickstart-winget' ? (
                                                <>
                                                    <Check size={14} className="text-emerald-400" />
                                                    <span className="text-emerald-400">Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={14} />
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Installs the official Windows package via Windows Package Manager (WinGet). Or download the portable zip directly from the Pre-built Binaries tab.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Build from Source */}
                    {installMode === 'source' && (
                        <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-6 sm:p-8 space-y-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono font-medium text-emerald-400 border border-emerald-500/20 mb-2">
                                        Self-Hosted Bootstrap
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">Build from Source (macOS, Linux, Windows)</h3>
                                    <p className="mt-1 text-xs text-zinc-400">
                                        Prismio compiles itself from a committed LLVM IR seed (<code className="text-zinc-300 font-mono">bootstrap/prismio-seed.ll</code>) to a byte-identical fixpoint.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-white/[0.06] bg-black/40 p-4 text-xs text-zinc-300 space-y-2">
                                <span className="font-semibold text-white block">System Requirements:</span>
                                <ul className="list-disc list-inside space-y-1 text-zinc-400">
                                    <li>A C toolchain (Xcode Command Line Tools on macOS, <code className="text-zinc-300 font-mono">build-essential</code> on Linux, or Visual Studio C++ on Windows).</li>
                                    <li>Python 3.8 or later.</li>
                                    <li>Pinned LLVM {LLVM_VERSION} is automatically downloaded and isolated by <code className="text-zinc-300 font-mono">setup_llvm.py</code> into <code className="text-zinc-300 font-mono">third_party/llvm</code>.</li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs text-zinc-400">
                                    <span className="font-mono text-zinc-300">Terminal Commands (POSIX)</span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(`git clone https://github.com/prismio-lang/prismio.git\ncd prismio\npython3 tools/setup_llvm.py\ntools/bootstrap.sh --seed --out build/gen0\ntools/bootstrap.sh --compiler build/gen0 --out build/gen1\npython3 tools/package.py --compiler build/gen1 --out build/dist\nexport PATH="$PWD/build/dist/bin:$PATH"`, 'source-posix')}
                                        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                                    >
                                        {copiedText === 'source-posix' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                        <span>{copiedText === 'source-posix' ? 'Copied script' : 'Copy all steps'}</span>
                                    </button>
                                </div>

                                <div className="rounded-xl bg-[#06070a] p-4 font-mono text-xs text-zinc-300 overflow-x-auto ring-1 ring-white/[0.08] space-y-2 leading-relaxed">
                                    <div className="text-zinc-500"># 1. Clone the repository</div>
                                    <div>git clone https://github.com/prismio-lang/prismio.git</div>
                                    <div>cd prismio</div>
                                    <div className="text-zinc-500 pt-1"># 2. Provision pinned LLVM {LLVM_VERSION} (isolated, system clean)</div>
                                    <div>python3 tools/setup_llvm.py</div>
                                    <div className="text-zinc-500 pt-1"># 3. Bootstrap first generation from committed seed</div>
                                    <div>tools/bootstrap.sh --seed --out build/gen0</div>
                                    <div className="text-zinc-500 pt-1"># 4. Compile second generation with self-hosted compiler</div>
                                    <div>tools/bootstrap.sh --compiler build/gen0 --out build/gen1</div>
                                    <div className="text-zinc-500 pt-1"># 5. Package distribution toolchain and export PATH</div>
                                    <div>python3 tools/package.py --compiler build/gen1 --out build/dist</div>
                                    <div>export PATH=&quot;$PWD/build/dist/bin:$PATH&quot;</div>
                                </div>

                                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-zinc-400">
                                    <strong className="text-zinc-200">On Windows:</strong> Use PowerShell equivalents:{' '}
                                    <code className="text-indigo-300 font-mono">tools\bootstrap.ps1 -Seed bootstrap\prismio-seed.ll -Out build\gen0</code>,{' '}
                                    then <code className="text-indigo-300 font-mono">-Compiler build\gen0 -Out build\gen1</code>.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Pre-built Binaries */}
                    {installMode === 'binaries' && (
                        <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-6 sm:p-8 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Standalone Binary Distributions</h3>
                                <p className="mt-1 text-xs text-zinc-400">
                                    Pre-compiled tarballs and installers published on GitHub Releases.
                                </p>
                            </div>

                            {activeRelease && (
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                                        <div className="text-xs font-mono text-zinc-400">macOS (Apple Silicon & Intel)</div>
                                        <div className="text-sm font-semibold text-white">prismio-macos-arm64.tar.gz</div>
                                        <a
                                            href="https://github.com/prismio-lang/prismio/releases"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 pt-2"
                                        >
                                            <Download size={13} />
                                            <span>Download archive</span>
                                        </a>
                                    </div>

                                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                                        <div className="text-xs font-mono text-zinc-400">Linux (x86_64 & AArch64)</div>
                                        <div className="text-sm font-semibold text-white">prismio-linux-x64.tar.gz</div>
                                        <a
                                            href="https://github.com/prismio-lang/prismio/releases"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 pt-2"
                                        >
                                            <Download size={13} />
                                            <span>Download archive</span>
                                        </a>
                                    </div>

                                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                                        <div className="text-xs font-mono text-zinc-400">Windows (x64)</div>
                                        <div className="text-sm font-semibold text-white">prismio-windows-x64.zip</div>
                                        <a
                                            href="https://github.com/prismio-lang/prismio/releases"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 pt-2"
                                        >
                                            <Download size={13} />
                                            <span>Download zip</span>
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-xl border border-white/[0.08] bg-[#06070a] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                                        <Info size={14} className="text-indigo-400" />
                                        <span>Release Status: v0.1.0 Pre-release</span>
                                    </div>
                                    <p className="text-xs text-zinc-400">
                                        Release builds are actively tested against multi-platform CI gates.
                                    </p>
                                </div>

                                <a
                                    href="https://github.com/prismio-lang/prismio/releases"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white/[0.06] border border-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/[0.1] transition-colors"
                                >
                                    <span>Browse GitHub Releases</span>
                                    <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    )}
                </section>

                {/* ── 3. Verification & First Program ────────────────────── */}
                <section className="mt-20">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white">
                            Verify Your Installation
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto">
                            Ensure the toolchain works in your environment and try your first program.
                        </p>
                    </div>

                    <div className="bg-[#0b0c10] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                        {/* Terminal Header */}
                        <div className="bg-[#121216] px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                                <span className="ml-3 text-[11px] font-mono text-zinc-500 select-none">
                                    verify-toolchain.sh
                                </span>
                            </div>

                            <div className="flex items-center gap-1 rounded-lg border border-white/[0.04] bg-[#08080a] p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setVerifyTab('version')}
                                    className={`rounded px-2.5 py-1 text-[10px] font-mono transition-colors ${
                                        verifyTab === 'version' ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    1. Version
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVerifyTab('project')}
                                    className={`rounded px-2.5 py-1 text-[10px] font-mono transition-colors ${
                                        verifyTab === 'project' ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    2. Start Project
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVerifyTab('aif')}
                                    className={`rounded px-2.5 py-1 text-[10px] font-mono transition-colors ${
                                        verifyTab === 'aif' ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    3. AIF Inspect
                                </button>
                            </div>
                        </div>

                        {/* Terminal Body */}
                        <div className="p-6 font-mono text-xs sm:text-sm text-zinc-300 bg-[#06070a] min-h-[170px] select-text overflow-x-auto whitespace-pre leading-relaxed">
                            {verifyTab === 'version' && (
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-indigo-400 font-bold">$</span>
                                        <span className="text-white">prismio --version</span>
                                    </div>
                                    <div className="text-zinc-400 mt-2">
                                        prismio {PRISMIO_VERSION} (llvm {LLVM_VERSION}.1.1, host {detectedPlatform.arch === 'arm64' ? 'aarch64' : 'x86_64'}-apple-darwin)
                                    </div>
                                    <div className="text-emerald-400 mt-2">
                                        ✓ Toolchain successfully configured in environment variables.
                                    </div>
                                </div>
                            )}

                            {verifyTab === 'project' && (
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-indigo-400 font-bold">$</span>
                                        <span className="text-white">prismio init hello &amp;&amp; cd hello</span>
                                    </div>
                                    <div className="text-zinc-400 mt-1">Created hello/build.ums and src/main.psm</div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-indigo-400 font-bold">$</span>
                                        <span className="text-white">prismio run</span>
                                    </div>
                                    <div className="text-zinc-400 mt-1">Built hello in 14.2ms</div>
                                    <div className="text-emerald-300 mt-1">Hello, Prismio!</div>
                                </div>
                            )}

                            {verifyTab === 'aif' && (
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-indigo-400 font-bold">$</span>
                                        <span className="text-white">prismio aif src/main.psm</span>
                                    </div>
                                    <div className="text-zinc-300 mt-2 font-medium">Storage plan</div>
                                    <div className="text-zinc-400 mt-1">
                                        {'  '}Stack                   3{'\n'}
                                        {'  '}Arena                   2{'\n'}
                                        {'  '}Scoped heap             1{'\n'}
                                        {'  '}Unique heap             119{'\n'}
                                        {'  '}Shared heap             0{'\n'}
                                        {'  '}Cycle-managed heap      0
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── 4. IDE & Editor Support ────────────────────────────── */}
                <section className="mt-20">
                    <div className="mb-8 border-b border-white/[0.06] pb-4">
                        <div className="font-mono text-xs text-zinc-500 uppercase tracking-wider mb-1">
                            Tooling
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            IDE &amp; Editor Support
                        </h2>
                    </div>

                    <IntelliJPluginCard />
                </section>
            </main>
        </div>
    );
}
