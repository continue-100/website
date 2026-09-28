import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowRight, BookOpen, Terminal} from 'lucide-react';

const AVAILABLE = [
    'Self-hosted native compiler',
    'AIF storage plans and runtime verification',
    'Generics, traits, closures, enums, and pattern matching',
    'Vectors (Vec<T>), maps, slices, data views, files, and processes',
    'Native tasks and typed blocking channels',
    'UMS projects, native linking, JSON diagnostics, and DWARF',
];

const NOT_YET = [
    'Networking and async/await',
    'Regex and JSON modules',
    'User-facing atomics, mutexes, and work-stealing pools',
    'Reflection, derive generation, and explicit SIMD types',
    'Memory-mapped files and custom container allocators',
];

export default function CTA() {
    return (
        <section className="px-6 pb-8 pt-24 md:pt-32">
            <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#0b0c10] ring-1 ring-white/[0.09]">
                <div className="grid lg:grid-cols-12">
                    <div className="border-b border-white/[0.07] p-7 sm:p-10 lg:col-span-5 lg:border-b-0 lg:border-r lg:p-12">
                        <h2 className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                            A working compiler with a deliberately unfinished ecosystem.
                        </h2>
                        <p className="mt-6 text-base leading-7 text-zinc-400">
                            Prismio v0.1 is in active development. It self-hosts, emits native binaries, runs its project workflow,
                            and ships the core language, memory analysis, standard containers,
                            file and process APIs, native tasks, and typed channels.
                        </p>
                        <Link
                            href="/roadmap"
                            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 transition-colors hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            See the engineering roadmap
                            <ArrowRight size={15}/>
                        </Link>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:col-span-7">
                        <div className="border-b border-white/[0.07] p-7 sm:border-b-0 sm:border-r sm:p-10">
                            <h3 className="text-sm font-semibold text-emerald-300">Available today</h3>
                            <ul className="mt-5 space-y-3">
                                {AVAILABLE.map((item) => (
                                    <li key={item} className="flex gap-3 text-sm leading-6 text-zinc-300">
                                        <span className="mt-[0.68rem] h-1 w-1 shrink-0 rounded-full bg-emerald-300"/>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-7 sm:p-10">
                            <h3 className="text-sm font-semibold text-amber-200">Not yet supported</h3>
                            <ul className="mt-5 space-y-3">
                                {NOT_YET.map((item) => (
                                    <li key={item} className="flex gap-3 text-sm leading-6 text-zinc-400">
                                        <span className="mt-[0.68rem] h-1 w-1 shrink-0 rounded-full bg-amber-200"/>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href="/benchmarks"
                                className="mt-7 inline-flex items-center gap-2 text-sm text-zinc-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                Browse supported workloads
                                <ArrowRight size={14}/>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/[0.07] px-7 py-16 text-center sm:px-10 sm:py-20">
                    <h2 className="mx-auto max-w-3xl text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                        Build a program. Inspect what the compiler decided.
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-400">
                        Install Prismio, run an example, and ask AIF where each value lives and why.
                        The compiler, standard library, benchmark suite, and design evidence are open for inspection.
                    </p>
                    <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/install"
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            <Terminal size={16}/>
                            Install Prismio
                        </Link>
                        <a
                            href="https://docs.prismio.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            <BookOpen size={16}/>
                            Read the docs
                        </a>
                        <a
                            href="https://github.com/prismio-lang/prismio"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-11 items-center gap-2 px-3 text-sm font-medium text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            <Image src="/icons/github-mark-white.svg" alt="" width={16} height={16}/>
                            View on GitHub
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
