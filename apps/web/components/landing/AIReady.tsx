import React from 'react';
import {Binary, Braces, Bug, FileCode2, FileJson2, Link2, Workflow} from 'lucide-react';

interface UmsToken {
    text: string;
    cls?: string;
}

interface UmsLine {
    num: number;
    tokens: UmsToken[];
}

const UMS_LINES: UmsLine[] = [
    {
        num: 1,
        tokens: [
            {text: 'project', cls: 'text-indigo-400 font-medium'},
            {text: ' {', cls: 'text-zinc-500'},
        ],
    },
    {
        num: 2,
        tokens: [
            {text: '    name', cls: 'text-zinc-300'},
            {text: ' = ', cls: 'text-zinc-500'},
            {text: '"compiler-tools"', cls: 'text-[#47d7b5]'},
        ],
    },
    {
        num: 3,
        tokens: [
            {text: '    version', cls: 'text-zinc-300'},
            {text: ' = ', cls: 'text-zinc-500'},
            {text: '"0.1.0"', cls: 'text-[#47d7b5]'},
        ],
    },
    {
        num: 4,
        tokens: [
            {text: '}', cls: 'text-zinc-500'},
        ],
    },
    {
        num: 5,
        tokens: [
            {text: ''},
        ],
    },
    {
        num: 6,
        tokens: [
            {text: 'targets', cls: 'text-indigo-400 font-medium'},
            {text: ' {', cls: 'text-zinc-500'},
        ],
    },
    {
        num: 7,
        tokens: [
            {text: '    executable', cls: 'text-sky-300 font-medium'},
            {text: '(', cls: 'text-zinc-500'},
            {text: '"inspect"', cls: 'text-[#47d7b5]'},
            {text: ') {', cls: 'text-zinc-500'},
        ],
    },
    {
        num: 8,
        tokens: [
            {text: '        entry', cls: 'text-zinc-300'},
            {text: ' = ', cls: 'text-zinc-500'},
            {text: '"src/main.psm"', cls: 'text-[#47d7b5]'},
        ],
    },
    {
        num: 9,
        tokens: [
            {text: '    }', cls: 'text-zinc-500'},
        ],
    },
    {
        num: 10,
        tokens: [
            {text: '}', cls: 'text-zinc-500'},
        ],
    },
    {
        num: 11,
        tokens: [
            {text: ''},
        ],
    },
    {
        num: 12,
        tokens: [
            {text: 'commands', cls: 'text-indigo-400 font-medium'},
            {text: ' {', cls: 'text-zinc-500'},
        ],
    },
    {
        num: 13,
        tokens: [
            {text: '    command', cls: 'text-sky-300 font-medium'},
            {text: '(', cls: 'text-zinc-500'},
            {text: '"verify"', cls: 'text-[#47d7b5]'},
            {text: ') {', cls: 'text-zinc-500'},
        ],
    },
    {
        num: 14,
        tokens: [
            {text: '        description', cls: 'text-sky-300'},
            {text: ' = ', cls: 'text-zinc-500'},
            {text: '"Acceptance gate"', cls: 'text-[#47d7b5]'},
        ],
    },
    {
        num: 15,
        tokens: [
            {text: '        build', cls: 'text-sky-300'},
            {text: '(', cls: 'text-zinc-500'},
            {text: '"inspect"', cls: 'text-[#47d7b5]'},
            {text: ')', cls: 'text-zinc-500'},
        ],
    },
    {
        num: 16,
        tokens: [
            {text: '        run', cls: 'text-sky-300'},
            {text: '(', cls: 'text-zinc-500'},
            {text: '"inspect"', cls: 'text-[#47d7b5]'},
            {text: ', ', cls: 'text-zinc-500'},
            {text: 'args', cls: 'text-amber-300'},
            {text: ')', cls: 'text-zinc-500'},
        ],
    },
    {
        num: 17,
        tokens: [
            {text: '    }', cls: 'text-zinc-500'},
        ],
    },
    {
        num: 18,
        tokens: [
            {text: '}', cls: 'text-zinc-500'},
        ],
    },
];

const TOOLING = [
    {
        icon: FileJson2,
        title: 'Stable diagnostics',
        copy: 'prismio check runs the real frontend without generating code. Versioned JSON Lines diagnostics carry stable P#### codes, severity, files, and UTF-8 source spans.',
    },
    {
        icon: Bug,
        title: 'Native debugging',
        copy: '-g emits DWARF line tables, functions, scopes, locals, and struct layouts for LLDB and GDB. On macOS, the compiler writes a .dSYM beside the binary.',
    },
    {
        icon: Braces,
        title: 'Compiler introspection',
        copy: 'dump-ast exposes parsed source structure. AIF manifests provide a separate, stable account of inferred memory placement for CI and analysis tools.',
    },
];

export default function AIReady() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-28 md:py-36">
            <div className="max-w-4xl">
                <h2 className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                    One toolchain, from source file to self-hosted project.
                </h2>
                <p className="mt-6 max-w-3xl text-base leading-7 text-zinc-400">
                    Prismio’s compiler, project model, native linkage, diagnostics, and memory
                    analysis form one development loop. The lexer, parser, import resolver,
                    semantic analyzer, AIF engine, and LLVM IR generator are themselves written in Prismio.
                </p>
            </div>

            <div className="mt-14 grid overflow-hidden rounded-2xl bg-[#0b0c10] ring-1 ring-white/[0.09] lg:grid-cols-12">
                <div className="border-b border-white/[0.07] p-6 sm:p-8 lg:col-span-5 lg:border-b-0 lg:border-r">
                    <div className="flex items-center gap-3 text-zinc-200">
                        <Workflow size={18} className="text-indigo-300"/>
                        <h3 className="font-semibold">Unified Manifest System</h3>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-zinc-400">
                        <code className="text-zinc-200">build.ums</code> declares project metadata,
                        executable and test targets, dependencies, native link inputs, and
                        project-defined commands. Prismio finds the nearest manifest and writes
                        profile-specific artifacts under <code className="text-zinc-200">.prismio/build/</code>.
                    </p>

                    <div className="mt-7 overflow-hidden rounded-xl bg-[#06070a] ring-1 ring-white/[0.08]">
                        <div className="flex items-center justify-between border-b border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
                            <div className="flex items-center gap-2">
                                <FileCode2 size={13} className="text-indigo-400" />
                                <span className="font-mono text-xs text-zinc-300">build.ums</span>
                            </div>
                            <span className="font-mono text-[10px] text-zinc-600">manifest</span>
                        </div>

                        <pre className="overflow-x-auto p-4 sm:p-5 font-mono text-[11px] leading-5 sm:text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {UMS_LINES.map((line) => (
                                <div key={line.num} className="flex items-center">
                                    <span className="mr-3 w-4 select-none text-right font-mono text-[11px] text-zinc-600">
                                        {line.num}
                                    </span>
                                    <code className="whitespace-pre">
                                        {line.tokens.map((tok, i) => (
                                            <span key={i} className={tok.cls || ''}>
                                                {tok.text}
                                            </span>
                                        ))}
                                    </code>
                                </div>
                            ))}
                        </pre>
                    </div>
                </div>

                <div className="lg:col-span-7">
                    <div className="grid border-b border-white/[0.07] sm:grid-cols-2">
                        <article className="border-b border-white/[0.07] p-6 sm:border-b-0 sm:border-r sm:p-8">
                            <div className="flex items-center gap-3 text-zinc-200">
                                <Binary size={18} className="text-emerald-300"/>
                                <h3 className="font-semibold">Self-hosted by design</h3>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-zinc-400">
                                A committed seed builds the first local generation. Later generations
                                compile themselves, with failed rebuilds leaving the last working compiler intact.
                            </p>
                        </article>
                        <article className="p-6 sm:p-8">
                            <div className="flex items-center gap-3 text-zinc-200">
                                <Link2 size={18} className="text-sky-300"/>
                                <h3 className="font-semibold">Direct C interoperability</h3>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-zinc-400">
                                Declare C functions with <code className="text-zinc-200">extern fn</code>.
                                Ownership contracts such as borrow, consume, produce, and alias keep
                                the foreign boundary visible to memory analysis.
                            </p>
                        </article>
                    </div>

                    <div className="p-6 sm:p-8">
                        <h3 className="text-xl font-semibold tracking-[-0.02em] text-white">
                            Reliable interfaces for editors, CI, and coding agents.
                        </h3>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                            Tools consume structured compiler output instead of scraping terminal prose.
                        </p>

                        <div className="mt-6 divide-y divide-white/[0.07] border-y border-white/[0.07]">
                            {TOOLING.map(({icon: Icon, title, copy}) => (
                                <article key={title} className="grid gap-3 py-5 sm:grid-cols-[2.25rem_1fr]">
                                    <Icon size={17} className="mt-0.5 text-indigo-300"/>
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-200">{title}</h4>
                                        <p className="mt-1.5 text-sm leading-6 text-zinc-500">{copy}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
