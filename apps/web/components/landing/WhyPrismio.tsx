import React from 'react';
import {ArrowDown, CheckCircle2} from 'lucide-react';

const STEPS = [
    {
        command: 'prismio aif main.psm',
        title: 'Inspect the storage plan',
        copy: 'See every potential allocation site grouped by stack, compiler-placed arena, owned heap, shared heap, cycle management, and thread transfer.',
    },
    {
        command: 'prismio aif main.psm --why=7',
        title: 'Ask why a decision was made',
        copy: 'Trace the minimal cause of one placement and see which repairs are valid—and which would contradict facts already proven by the analysis.',
    },
    {
        command: 'prismio build main.psm --verify',
        title: 'Check the emitted program',
        copy: 'Run the real binary against verifier shims that report allocations, releases, leaks, and invalid releases without changing the program’s code generation decisions.',
    },
];

export default function WhyPrismio() {
    return (
        <section className="relative py-28 md:py-36">
            <div className="absolute inset-0 bg-indigo-950/[0.13]"/>
            <div className="relative mx-auto max-w-7xl px-6">
                <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
                    <div className="lg:col-span-5">
                        <h2 className="max-w-xl text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                            Memory decisions you can inspect, diff, and verify.
                        </h2>
                        <p className="mt-6 max-w-xl text-base leading-7 text-zinc-300">
                            The Adaptive Inference Framework (experimental in 0.1) analyzes escape behavior, ownership,
                            thread transfer, and layout before code generation. It chooses the
                            cheapest safe placement it can prove—and produces evidence for the decision.
                        </p>

                        <blockquote className="mt-10 max-w-lg border-t border-white/[0.1] pt-6 text-xl leading-8 tracking-[-0.02em] text-indigo-200">
                            Inference is not a black box when its output affects performance.
                        </blockquote>

                        <div className="mt-10 grid grid-cols-2 gap-8 text-sm">
                            <div>
                                <div className="font-mono text-2xl font-semibold text-white">T0–T4b</div>
                                <div className="mt-1 leading-5 text-zinc-500">Graded storage tiers, not one allocation strategy. What each tier means can still change.</div>
                            </div>
                            <div>
                                <div className="font-mono text-2xl font-semibold text-white">1.2 Draft</div>
                                <div className="mt-1 leading-5 text-zinc-500">The current AIF policy. It is not a stable contract between compilers.</div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="overflow-hidden rounded-2xl bg-[#0a0b0f] ring-1 ring-white/[0.09]">
                            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                                <span className="text-sm font-medium text-zinc-200">AIF workflow</span>
                                <span className="font-mono text-xs text-zinc-600">manifest schema 1</span>
                            </div>

                            <div className="px-5 sm:px-7">
                                {STEPS.map((step, index) => (
                                    <React.Fragment key={step.command}>
                                        <article className="grid gap-4 py-7 sm:grid-cols-[12rem_1fr] sm:gap-8 sm:py-8">
                                            <code className="text-xs leading-5 text-indigo-300">{step.command}</code>
                                            <div>
                                                <h3 className="text-lg font-semibold text-zinc-100">{step.title}</h3>
                                                <p className="mt-2 text-sm leading-6 text-zinc-400">{step.copy}</p>
                                            </div>
                                        </article>
                                        {index < STEPS.length - 1 && (
                                            <div className="flex items-center gap-3 border-t border-white/[0.06] text-zinc-700">
                                                <ArrowDown size={14}/>
                                                <span className="text-[10px] uppercase tracking-[0.14em]">next</span>
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 border-t border-white/[0.07] bg-emerald-500/[0.04] px-5 py-4 text-xs text-emerald-300 sm:px-7">
                                <CheckCircle2 size={15}/>
                                <span>Use <code>--manifest</code> to create a diffable record for CI.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
