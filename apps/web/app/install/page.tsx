'use client';

import React, {useEffect, useState} from 'react';
import {ArrowUpRight, Check, Copy, Download, ExternalLink, Info} from 'lucide-react';
import HeaderMain from '@/components/HeaderMain';
import IntelliJPluginCard from '@/components/IntelliJPluginCard';
import FooterMain from '@prismio/ui/FooterMain';
import {LLVM_VERSION, PRISMIO_VERSION} from '@prismio/utils';

type OS = 'macOS' | 'Linux' | 'Windows';
type InstallMode = 'source' | 'script' | 'binaries';
type VerifyTab = 'version' | 'project' | 'aif';

interface ReleaseAsset {
    filename: string;
    size: string;
    url: string;
    platform: OS;
}

interface Release {
    version: string;
    date: string;
    assets: ReleaseAsset[];
}

interface Step {
    title: string;
    note: string;
    commands?: string[];
}

const REPO = 'https://github.com/prismio-lang/prismio';
const DOCS = 'https://docs.prismio.org';
const CARD = 'rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/70 backdrop-blur-xl';
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';

const MODES: {id: InstallMode; label: string; status: string; ready: boolean}[] = [
    {id: 'script', label: 'Install script', status: 'macOS and Linux', ready: true},
    {id: 'binaries', label: 'Prebuilt binaries', status: 'All platforms', ready: true},
    {id: 'source', label: 'Build from source', status: 'Any machine', ready: true},
];

function stepsFor(os: OS): Step[] {
    const win = os === 'Windows';
    return [
        {
            title: 'Get the source',
            note: 'Clone the repository.',
            commands: ['git clone https://github.com/prismio-lang/prismio.git', 'cd prismio'],
        },
        {
            title: 'Check your toolchain and fetch LLVM',
            note: `Reports exactly what is missing, then downloads the pinned LLVM ${LLVM_VERSION} into third_party/llvm. About 2.5 minutes the first time, instant after that.`,
            commands: [win ? 'python tools/setup.py' : 'python3 tools/setup.py'],
        },
        {
            title: 'Build the first compiler',
            note: 'Built from the committed LLVM IR seed, so a machine with no Prismio can start.',
            commands: [win ? 'tools\\bootstrap.ps1 -Seed bootstrap\\prismio-seed.ll -Out build\\gen0' : 'tools/bootstrap.sh --seed --out build/gen0'],
        },
        {
            title: 'Rebuild it with itself',
            note: 'The compiler compiles its own source. This is the one you will use.',
            commands: [win ? 'tools\\bootstrap.ps1 -Compiler build\\gen0 -Out build\\gen1' : 'tools/bootstrap.sh --compiler build/gen0 --out build/gen1'],
        },
        win
            ? {
                  title: 'Package it and add it to your PATH',
                  note: 'Run tools\\package.py as on macOS and Linux, then add build\\dist\\bin to your PATH.',
              }
            : {
                  title: 'Package it and add it to your PATH',
                  note: 'Assembles the compiler, runtime, and standard library into build/dist.',
                  commands: ['python3 tools/package.py --compiler build/gen1 --out build/dist', 'export PATH="$PWD/build/dist/bin:$PATH"'],
              },
    ];
}

/** Real output captured from the compiler (a new hello-world project). Paths are shortened. */
const VERIFY: Record<VerifyTab, {label: string; lines: {text: string; kind?: 'cmd' | 'ok'}[]}> = {
    version: {
        label: 'Version',
        lines: [
            {text: 'prismio --version', kind: 'cmd'},
            {text: `prismio ${PRISMIO_VERSION.replace(/^v/, '')}`},
            {text: `llvm ${LLVM_VERSION}.1.1`},
            {text: 'compiler <where the compiler lives>'},
            {text: 'stdlib <where the standard library lives>'},
        ],
    },
    project: {
        label: 'First project',
        lines: [
            {text: 'prismio init hello && cd hello', kind: 'cmd'},
            {text: 'created hello'},
            {text: '  hello/build.ums'},
            {text: '  hello/src/main.psm'},
            {text: '  hello/.gitignore'},
            {text: ''},
            {text: 'prismio run', kind: 'cmd'},
            {text: 'Built …/hello/.prismio/build/debug/hello'},
            {text: 'Hello, Prismio!', kind: 'ok'},
        ],
    },
    aif: {
        label: 'Memory report',
        lines: [
            {text: 'prismio aif src/main.psm', kind: 'cmd'},
            {text: 'AIF analysis'},
            {text: '  Result   converged in 7 rounds'},
            {text: ''},
            {text: 'Storage plan'},
            {text: '  Stack                   0'},
            {text: '  Arena                   2'},
            {text: '  Scoped heap             0'},
            {text: '  Unique heap             3'},
            {text: '  Shared heap             0'},
            {text: '  Cycle-managed heap      0'},
            {text: '  Cross-thread heap       0'},
        ],
    },
};

const NEXT = [
    {title: 'Write your first program', href: `${DOCS}/tutorials/first-program`},
    {title: 'Hello, Prismio, line by line', href: `${DOCS}/start/hello-world`},
    {title: 'Build and run programs', href: `${DOCS}/start/build-and-run`},
];

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${units[i]}`;
};

function platformOf(name: string): OS | null {
    const n = name.toLowerCase();
    if (n.includes('darwin') || n.includes('macos')) return 'macOS';
    if (n.includes('linux')) return 'Linux';
    if (n.includes('windows')) return 'Windows';
    return null;
}

/** First word bright, flags in sky, the rest quiet: enough to scan a command at a glance. */
function Command({text}: {text: string}) {
    return (
        <>
            {text.split(' ').map((word, i) => (
                <React.Fragment key={i}>
                    {i > 0 && ' '}
                    <span
                        className={
                            i === 0 ? 'font-semibold text-white' : word.startsWith('-') ? 'text-sky-300' : 'text-zinc-300'
                        }
                    >
                        {word}
                    </span>
                </React.Fragment>
            ))}
        </>
    );
}

export default function InstallPage() {
    const [mode, setMode] = useState<InstallMode>('script');
    const [os, setOs] = useState<OS>('macOS');
    const [detected, setDetected] = useState<OS | null>(null);
    const [verifyTab, setVerifyTab] = useState<VerifyTab>('version');
    const [copied, setCopied] = useState<string | null>(null);
    const [release, setRelease] = useState<Release | null>(null);

    const copy = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(id);
            setTimeout(() => setCopied((current) => (current === id ? null : current)), 2000);
        } catch {
            // Clipboard unavailable; the text is still selectable.
        }
    };

    // Which OS the visitor is on. The CPU architecture is not guessed: browsers do not report it reliably.
    useEffect(() => {
        const nav = window.navigator as Navigator & {userAgentData?: {platform?: string}};
        const hint = (nav.userAgentData?.platform ?? '').toLowerCase();
        const ua = nav.userAgent.toLowerCase();
        const found: OS = hint === 'windows' || ua.includes('windows') ? 'Windows' : hint === 'linux' || ua.includes('linux') ? 'Linux' : 'macOS';
        setOs(found);
        setDetected(found);
    }, []);

    // The latest published release, for the download list. The page works without it.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('https://api.github.com/repos/prismio-lang/prismio/releases');
                if (!res.ok) return;
                const data = (await res.json()) as {
                    tag_name: string;
                    draft: boolean;
                    published_at: string;
                    assets: {name: string; size: number; browser_download_url: string}[];
                }[];
                const latest = Array.isArray(data) ? data.find((r) => !r.draft) : undefined;
                if (!latest || cancelled) return;
                const assets: ReleaseAsset[] = [];
                for (const asset of latest.assets ?? []) {
                    const platform = platformOf(asset.name);
                    if (platform) {
                        assets.push({filename: asset.name, size: formatSize(asset.size), url: asset.browser_download_url, platform});
                    }
                }
                setRelease({
                    version: latest.tag_name,
                    date: new Date(latest.published_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
                    assets,
                });
            } catch {
                // Offline or rate limited: the page works without it.
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const steps = stepsFor(os);
    const allCommands = steps.flatMap((step) => step.commands ?? []).join('\n');
    const prompt = os === 'Windows' ? '>' : '$';
    const verify = VERIFY[verifyTab];

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#070709] text-[#e4e4e7] selection:bg-indigo-500/30 selection:text-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(67,56,202,0.18),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[800px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <HeaderMain />

            <main className="relative z-10 mx-auto max-w-4xl py-20 md:py-28">
                {/* Hero */}
                <section className="text-center">
                    <h1 className="text-5xl font-semibold tracking-[-0.045em] text-white sm:text-6xl">
                        Install <span className="text-sky-300">Prismio</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-zinc-300 sm:text-lg">
                        {PRISMIO_VERSION} is the first release. Install it with one command, download an archive, or build it from source.
                    </p>

                    {/* At a glance */}
                    <dl className="mx-auto mt-10 grid max-w-3xl divide-y divide-white/[0.08] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0e]/70 text-left sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="px-5 py-4">
                            <dt className="text-xs text-zinc-400">Version</dt>
                            <dd className="mt-1 font-mono text-sm text-white">
                                {PRISMIO_VERSION} <span className="text-zinc-400">· LLVM {LLVM_VERSION}</span>
                            </dd>
                        </div>
                        <div className="px-5 py-4">
                            <dt className="text-xs text-zinc-400">Platforms</dt>
                            <dd className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm">
                                {(['macOS', 'Linux', 'Windows'] as OS[]).map((name) => (
                                    <span key={name} className={`inline-flex items-center gap-1.5 ${detected === name ? 'text-white' : 'text-zinc-400'}`}>
                                        {detected === name && <span aria-hidden className="size-1.5 rounded-full bg-[#47d7b5]" />}
                                        {name}
                                    </span>
                                ))}
                            </dd>
                        </div>
                        <div className="px-5 py-4">
                            <dt className="text-xs text-zinc-400">You need</dt>
                            <dd className="mt-1 font-mono text-sm text-white">A C toolchain</dd>
                        </div>
                    </dl>

                    {/* Method selector */}
                    <div role="tablist" aria-label="Installation method" className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
                        {MODES.map(({id, label, status, ready}) => {
                            const active = mode === id;
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setMode(id)}
                                    className={`rounded-2xl border px-5 py-4 text-left transition-colors ${FOCUS} ${
                                        active
                                            ? 'border-indigo-400/50 bg-indigo-500/15'
                                            : 'border-white/[0.08] bg-[#0c0c0e]/70 hover:border-white/20 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    <span className="block text-sm font-semibold text-white">{label}</span>
                                    <span className={`mt-1.5 flex items-center gap-2 font-mono text-xs ${ready ? 'text-emerald-300' : 'text-zinc-400'}`}>
                                        <span aria-hidden className={`size-1.5 rounded-full ${ready ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                                        {status}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Method panes */}
                <section className="mt-12" role="tabpanel">
                    {mode === 'source' && (
                        <div>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">Build from source</h2>
                                    <p className="mt-2 max-w-lg text-sm leading-7 text-zinc-400">
                                        Five steps, and everything lands in the folder you clone into.
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <div role="group" aria-label="Operating system" className="flex rounded-lg border border-white/[0.08] bg-black/40 p-1">
                                        {(['macOS', 'Linux', 'Windows'] as OS[]).map((name) => (
                                            <button
                                                key={name}
                                                type="button"
                                                aria-pressed={os === name}
                                                onClick={() => setOs(name)}
                                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${FOCUS} ${
                                                    os === name ? 'bg-indigo-500/25 font-semibold text-indigo-100' : 'text-zinc-400 hover:text-zinc-200'
                                                }`}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => copy(allCommands, 'all')}
                                        className={`inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white ${FOCUS}`}
                                    >
                                        {copied === 'all' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                        {copied === 'all' ? 'Copied' : 'Copy all'}
                                    </button>
                                </div>
                            </div>

                            {os === 'Windows' && (
                                <p className="mt-5 flex gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm leading-6 text-zinc-300">
                                    <Info size={16} className="mt-0.5 shrink-0 text-sky-300" />
                                    Windows is the least exercised platform. CI builds and tests it, but most development happens on macOS and Linux.
                                </p>
                            )}

                            <ol className="mt-10 space-y-8">
                                {steps.map((step, i) => (
                                    <li key={step.title} className="relative pl-14">
                                        <span
                                            aria-hidden
                                            className="absolute left-0 top-0 flex size-9 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/10 font-mono text-sm font-semibold text-indigo-100"
                                        >
                                            {i + 1}
                                        </span>
                                        {i < steps.length - 1 && <span aria-hidden className="absolute bottom-[-2rem] left-[17px] top-11 w-px bg-white/[0.1]" />}

                                        <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                                        <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">{step.note}</p>

                                        {step.commands && (
                                            <div className="group relative mt-4 overflow-hidden rounded-xl bg-[#06070a] ring-1 ring-white/[0.08]">
                                                <pre className="overflow-x-auto py-3.5 pl-4 pr-14 font-mono text-sm leading-relaxed">
                                                    {step.commands.map((command, j) => (
                                                        <div key={j}>
                                                            <span className="mr-3 select-none text-indigo-400">{prompt}</span>
                                                            <Command text={command} />
                                                        </div>
                                                    ))}
                                                </pre>
                                                <button
                                                    type="button"
                                                    aria-label={`Copy step ${i + 1}`}
                                                    onClick={() => copy(step.commands!.join('\n'), `step-${i}`)}
                                                    className={`absolute right-2.5 top-2.5 inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.08] hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 ${FOCUS}`}
                                                >
                                                    {copied === `step-${i}` ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ol>
                            <span aria-live="polite" className="sr-only">{copied ? 'Copied to clipboard' : ''}</span>
                        </div>
                    )}

                    {mode === 'script' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">Install script</h2>
                                <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-400">
                                    One command downloads the archive for your platform, checks its SHA-256 against the one published beside it, and
                                    installs into <code className="font-mono text-zinc-200">~/.prismio</code>. It then adds that directory to your PATH in{' '}
                                    <code className="font-mono text-zinc-200">.zshrc</code>, <code className="font-mono text-zinc-200">.bashrc</code> or the
                                    profile your shell uses. It refuses to install an archive that does not match.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Preview label="macOS and Linux" prompt="$" command="curl -fsSL https://prismio.org/install.sh | sh" />
                            </div>
                            <p className="max-w-xl text-sm leading-7 text-zinc-400">
                                <span className="font-semibold text-zinc-200">Windows:</span> download the <code className="font-mono text-zinc-200">.zip</code> from
                                the Prebuilt binaries tab, unpack it, and put its <code className="font-mono text-zinc-200">bin</code> directory on your PATH.
                            </p>
                            <p className="max-w-xl text-sm leading-7 text-zinc-400">
                                Set <code className="font-mono text-zinc-200">PRISMIO_VERSION</code> to install a specific release,{' '}
                                <code className="font-mono text-zinc-200">PRISMIO_INSTALL</code> to choose the directory, and{' '}
                                <code className="font-mono text-zinc-200">PRISMIO_NO_MODIFY_PATH=1</code> to leave your shell profile alone. The
                                compiler carries its own LLVM but links programs with your system&apos;s C tools: the Xcode Command Line Tools on
                                macOS, or <code className="font-mono text-zinc-200">build-essential</code> on Debian and Ubuntu. Details in the{' '}
                                <a href={`${DOCS}/start/installation`} className={`text-sky-300 underline underline-offset-4 ${FOCUS}`}>installation guide</a>.
                            </p>
                        </div>
                    )}

                    {mode === 'binaries' && (
                        <div className="space-y-6">
                            {release && release.assets.length > 0 ? (
                                <>
                                    <div>
                                        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">Prebuilt binaries</h2>
                                        <p className="mt-2 text-sm text-zinc-400">
                                            {release.version}, published {release.date}.
                                        </p>
                                    </div>
                                    <ul className={`${CARD} divide-y divide-white/[0.08] overflow-hidden`}>
                                        {release.assets.map((asset) => (
                                            <li key={asset.url}>
                                                <a
                                                    href={asset.url}
                                                    className={`flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-white/[0.03] focus-visible:ring-inset ${FOCUS}`}
                                                >
                                                    <span>
                                                        <span className="block text-sm font-semibold text-white">{asset.filename}</span>
                                                        <span className="mt-0.5 block font-mono text-xs text-zinc-400">
                                                            {asset.platform} · {asset.size}
                                                        </span>
                                                    </span>
                                                    <Download size={16} className="shrink-0 text-zinc-300" />
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <div>
                                    <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">Prebuilt binaries</h2>
                                    <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-400">
                                        Archives for macOS, Linux and Windows are on GitHub Releases, named{' '}
                                        <code className="font-mono text-zinc-200">prismio-&lt;version&gt;-&lt;os&gt;-&lt;arch&gt;</code>.
                                    </p>
                                </div>
                            )}
                            <p className="max-w-xl text-sm leading-7 text-zinc-400">
                                Every archive has a <code className="font-mono text-zinc-200">.sha256</code> beside it. The archives are{' '}
                                <span className="font-semibold text-zinc-200">not signed</span>: the checksum shows the download is intact, not who
                                made it, so take both from the release page. The ARM64 builds for Linux and Windows are built and tested on virtual
                                machines rather than in CI, so treat them as less exercised than the x64 and macOS archives.
                            </p>
                            <a
                                href={`${REPO}/releases`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.1] ${FOCUS}`}
                            >
                                GitHub Releases
                                <ExternalLink size={13} />
                            </a>
                        </div>
                    )}
                </section>

                {/* Check it works */}
                <section className="mt-28" aria-labelledby="verify-heading">
                    <h2 id="verify-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white">
                        Check it works.
                    </h2>
                    <p className="mt-2 max-w-lg text-sm leading-7 text-zinc-400">
                        Three commands to run once the toolchain is on your PATH. This is what the compiler prints.
                    </p>

                    <div className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#06070a]">
                        <div role="group" aria-label="Verification step" className="flex gap-1 border-b border-white/[0.06] bg-[#0c0d11] p-2">
                            {(Object.keys(VERIFY) as VerifyTab[]).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    aria-pressed={verifyTab === key}
                                    onClick={() => setVerifyTab(key)}
                                    className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${FOCUS} ${
                                        verifyTab === key ? 'bg-indigo-500/25 font-semibold text-indigo-100' : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                >
                                    {VERIFY[key].label}
                                </button>
                            ))}
                        </div>
                        <pre className="min-h-[15rem] overflow-x-auto p-6 font-mono text-sm leading-relaxed">
                            {verify.lines.map((line, i) =>
                                line.kind === 'cmd' ? (
                                    <div key={i} className="mt-4 first:mt-0">
                                        <span className="mr-3 select-none text-indigo-400">$</span>
                                        <Command text={line.text} />
                                    </div>
                                ) : (
                                    <div key={i} className={line.kind === 'ok' ? 'font-semibold text-[#47d7b5]' : 'text-zinc-400'}>
                                        {line.text || ' '}
                                    </div>
                                ),
                            )}
                        </pre>
                    </div>
                </section>

                {/* Next */}
                <section className="mt-28" aria-labelledby="next-heading">
                    <h2 id="next-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white">
                        Then write something.
                    </h2>
                    <ul className="mt-8 divide-y divide-white/[0.08] border-y border-white/[0.08]">
                        {NEXT.map((item) => (
                            <li key={item.href}>
                                <a
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`group flex items-center justify-between gap-4 py-5 transition-colors ${FOCUS}`}
                                >
                                    <span className="text-base font-medium text-zinc-200 transition-colors group-hover:text-white">{item.title}</span>
                                    <ArrowUpRight size={16} className="shrink-0 text-zinc-400 transition-colors group-hover:text-indigo-300" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Editors */}
                <section className="mt-28" aria-labelledby="editors-heading">
                    <h2 id="editors-heading" className="mb-8 text-3xl font-semibold tracking-[-0.03em] text-white">
                        Editor support
                    </h2>
                    <IntelliJPluginCard />
                </section>
            </main>

            <FooterMain />
        </div>
    );
}

/** A command that works once the release exists: shown, not copyable, so nobody pastes something that fails today. */
function Preview({label, prompt, command}: {label: string; prompt: string; command: string}) {
    return (
        <div className="rounded-xl border border-dashed border-white/15 p-4">
            <p className="text-xs text-zinc-400">{label}</p>
            <code className="mt-3 block overflow-x-auto whitespace-nowrap font-mono text-sm">
                <span className="mr-3 select-none text-indigo-400">{prompt}</span>
                <Command text={command} />
            </code>
        </div>
    );
}
