import React from 'react';
import Terminal, {type TerminalLine} from './Terminal';

// Output below is real: it was captured from the compiler for the hero's sample program, then shortened.
const STEPS: {
    title: string;
    copy: string;
    lines: TerminalLine[];
}[] = [
    {
        title: 'Inspect the storage plan',
        copy: 'See every potential allocation site grouped by stack, compiler-placed arena, owned heap, shared heap, cycle management, and thread transfer.',
        lines: [
            {text: 'prismio aif main.psm', kind: 'cmd'},
            {text: 'Storage plan', kind: 'key'},
            {text: '  Stack                   1'},
            {text: '  Arena                   0'},
            {text: '  Unique heap             0'},
            {text: '  Cross-thread heap       0'},
        ],
    },
    {
        title: 'Ask why a decision was made',
        copy: 'Trace the minimal cause of one placement and see which repairs are valid—and which would contradict facts already proven by the analysis.',
        lines: [
            {text: 'prismio aif main.psm --why=1', kind: 'cmd'},
            {text: 'Allocation 1', kind: 'key'},
            {text: '  Location   main.psm:7:23'},
            {text: '  Type       Point'},
            {text: '  Storage    stack'},
            {text: '  Reason     small value does not escape'},
        ],
    },
    {
        title: 'Check the emitted program',
        copy: 'Run the real binary against verifier shims that report allocations, releases, leaks, and invalid releases without changing the program’s code generation decisions.',
        lines: [{text: 'prismio build main.psm --verify', kind: 'cmd'}],
    },
];

const FACTS = [
    {term: 'T0–T4b', detail: 'Graded storage tiers, not one allocation strategy. What each tier means can still change.'},
    {term: '1.2 Draft', detail: 'The current AIF policy. It is not a stable contract between compilers.'},
];

export default function WhyPrismio() {
    return (
        <section aria-labelledby="aif-heading" className="mx-auto max-w-7xl px-6 py-24">
            <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
                <div className="lg:col-span-5">
                    <h2 id="aif-heading" className="max-w-xl text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                        Memory decisions you can inspect, diff, and verify.
                    </h2>
                    <p className="mt-6 max-w-xl text-base leading-7 text-zinc-300">
                        The Adaptive Inference Framework is experimental in 0.1. It analyzes escape behavior,
                        ownership, thread transfer, and layout before code generation. It chooses a safe
                        placement and produces evidence for the decision.
                    </p>

                    <p className="mt-10 max-w-lg text-xl leading-8 tracking-[-0.02em] text-sky-200">
                        Inference is not a black box when its output affects performance.
                    </p>

                    <dl className="mt-10 divide-y divide-white/[0.1] border-y border-white/[0.1]">
                        {FACTS.map((fact) => (
                            <div key={fact.term} className="grid gap-1 py-4 sm:grid-cols-[7.5rem_1fr] sm:gap-6">
                                <dt className="font-mono text-sm font-semibold text-white">{fact.term}</dt>
                                <dd className="text-sm leading-6 text-zinc-400">{fact.detail}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div className="lg:col-span-7">
                    <ol className="space-y-10">
                        {STEPS.map((step, i) => (
                            <li key={step.title} className="relative pl-14">
                                <span
                                    aria-hidden
                                    className="absolute left-0 top-0 flex size-9 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/10 font-mono text-sm font-semibold text-indigo-100"
                                >
                                    {i + 1}
                                </span>
                                {i < STEPS.length - 1 && (
                                    <span aria-hidden className="absolute bottom-[-2.5rem] left-[17px] top-11 w-px bg-white/[0.1]" />
                                )}
                                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                                <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">{step.copy}</p>
                                <div className="mt-4">
                                    <Terminal lines={step.lines} label={`Terminal: ${step.lines[0]?.text}`} />
                                </div>
                            </li>
                        ))}
                    </ol>

                    <p className="mt-10 text-sm leading-6 text-zinc-400">
                        Use <code className="font-mono text-zinc-200">--manifest</code> to create a diffable record for CI.
                    </p>
                </div>
            </div>
        </section>
    );
}
