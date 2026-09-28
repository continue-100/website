import React from 'react';
import {Braces, Boxes, GitBranch, Rows3} from 'lucide-react';

const LANGUAGE_FEATURES = [
    {
        title: 'Modern types, specialized at compile time',
        copy: 'Structs, recursive enums, pattern matching, closures, overloaded methods, bounded generics, traits, associated types, default methods, impl Trait, and explicit dyn Trait objects are part of the shipped language surface.',
        detail: 'Generic functions and types are specialized for the concrete programs that use them.',
        icon: Braces,
    },
    {
        title: 'Ownership-aware native concurrency',
        copy: 'spawn and join run work on native OS threads. Typed blocking Channel<T> values move messages between workers, while chan_share makes endpoint sharing explicit.',
        detail: 'No async runtime, futures, or work-stealing executor is implied.',
        icon: GitBranch,
    },
    {
        title: 'Layout control for real hot loops',
        copy: 'Flat values can live inline inside Vec<T>. Slice<T> provides bounded views, while soa and aos perform explicit structure-of-arrays conversion through checked DataView<T> access.',
        detail: 'The compiler specializes the element type before choosing its container representation.',
        icon: Rows3,
    },
    {
        title: 'A small, explicit standard surface',
        copy: 'Strings, vectors, maps, options, results, iterators, files, processes, ordering, equality, and display live in ordinary std.* modules. There is no implicit prelude pulling unused facilities into a program.',
        detail: 'Import only the behavior the program intends to carry.',
        icon: Boxes,
    },
];

export default function Principles() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-28 md:py-36">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-4">
                    <h2 className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                        High-level expression.
                    </h2>
                    <h2 className="text-4xl font-semibold tracking-[-0.035em] text-white opacity-50 md:text-5xl">
                       Systems-level control.
                    </h2>
                    <p className="mt-6 max-w-md text-base leading-7 text-zinc-400">
                        Prismio combines modern static abstraction with explicit systems boundaries:
                        native code, visible mutability, direct foreign calls, specialized generics,
                        and programmer-directed layout where it matters.
                    </p>
                </div>

                <div className="border-t border-white/[0.08] lg:col-span-8">
                    {LANGUAGE_FEATURES.map(({title, copy, detail, icon: Icon}) => (
                        <article
                            key={title}
                            className="grid gap-5 border-b border-white/[0.08] py-8 sm:grid-cols-[3rem_1fr] sm:py-10"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/[0.08] text-indigo-300 ring-1 ring-indigo-400/15">
                                <Icon size={18}/>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold tracking-[-0.02em] text-zinc-100">{title}</h3>
                                <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300 sm:text-base sm:leading-7">
                                    {copy}
                                </p>
                                <p className="mt-3 text-sm leading-6 text-zinc-500">{detail}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
