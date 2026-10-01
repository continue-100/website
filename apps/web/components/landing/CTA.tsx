import React from 'react';
import Link from 'next/link';
import {ArrowRight, ArrowUpRight, BookOpen, Check, Terminal} from 'lucide-react';
import GithubIcon from '@/components/icons/GithubIcon';

const AVAILABLE = [
    'Self-hosted native compiler',
    'Experimental AIF storage plans and runtime verification',
    'Generics, traits, closures, enums, and pattern matching',
    'Vectors (Vec<T>), maps, slices, files, and processes',
    'Typed blocking channels, and experimental native tasks',
    'UMS projects, native linking, JSON diagnostics, and DWARF',
];

const NOT_YET = [
    'Networking and async/await',
    'Regex and JSON modules',
    'User-facing atomics, mutexes, and work-stealing pools',
    'Reflection, derive generation, and explicit SIMD types',
    'Memory-mapped files and custom container allocators',
];

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';

export default function CTA() {
    return (
        <section aria-labelledby="status-heading" className="mx-auto max-w-7xl px-6 py-24">
            {/* Honest status */}
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-5">
                    <h2 id="status-heading" className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                        A working compiler with a deliberately unfinished ecosystem.
                    </h2>
                    <p className="mt-6 text-base leading-7 text-zinc-300">
                        Prismio v0.1 is in active development. It self-hosts, emits native binaries, runs its project workflow,
                        and ships the core language, memory analysis, standard containers,
                        file and process APIs, native tasks, and typed channels.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
                        <Link
                            href="/roadmap"
                            className={`inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 transition-colors hover:text-indigo-200 ${FOCUS}`}
                        >
                            See the engineering roadmap
                            <ArrowRight size={15} />
                        </Link>
                        <Link
                            href="/benchmarks"
                            className={`inline-flex items-center gap-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white ${FOCUS}`}
                        >
                            Browse supported workloads
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>

                <div className="grid gap-12 sm:grid-cols-2 lg:col-span-7 lg:gap-10">
                    <div>
                        <h3 className="border-b border-white/[0.1] pb-4 text-sm font-semibold text-emerald-300">Available today</h3>
                        <ul className="mt-5 space-y-3.5">
                            {AVAILABLE.map((item) => (
                                <li key={item} className="flex gap-3 text-sm leading-6 text-zinc-200">
                                    <Check size={15} aria-hidden className="mt-1 shrink-0 text-emerald-300" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="border-b border-white/[0.1] pb-4 text-sm font-semibold text-amber-200">Not yet supported</h3>
                        <ul className="mt-5 space-y-3.5">
                            {NOT_YET.map((item) => (
                                <li key={item} className="flex gap-3 text-sm leading-6 text-zinc-300">
                                    <span aria-hidden className="mt-3 h-px w-3 shrink-0 bg-amber-200" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Final call to action */}
            <div className="mt-28 border-t border-white/[0.1] pt-20 text-center">
                <h2 className="mx-auto max-w-3xl text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                    Build a program. <span className="text-sky-300">Inspect what the compiler decided.</span>
                </h2>
                <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-300">
                    Install Prismio, run an example, and ask AIF where each value lives and why.
                    The compiler, standard library, benchmark suite, and design evidence are open for inspection.
                </p>
                <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href="/install"
                        className={`inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 ${FOCUS}`}
                    >
                        <Terminal size={16} />
                        Install Prismio
                    </Link>
                    <a
                        href="https://docs.prismio.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/[0.06] ${FOCUS}`}
                    >
                        <BookOpen size={16} />
                        Read the docs
                        <ArrowUpRight size={14} className="opacity-60" />
                    </a>
                    <a
                        href="https://github.com/prismio-lang/prismio"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex h-11 items-center gap-2 px-3 text-sm font-medium text-zinc-300 transition-colors hover:text-white ${FOCUS}`}
                    >
                        <GithubIcon size={16} />
                        View on GitHub
                    </a>
                </div>
            </div>
        </section>
    );
}
