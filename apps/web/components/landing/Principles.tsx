import React from 'react';

const LANGUAGE_FEATURES = [
    {
        title: 'Modern types, specialized at compile time',
        copy: 'Structs, recursive enums, pattern matching, closures, overloaded methods, bounded generics, traits, associated types, default methods, impl Trait, and explicit dyn Trait objects are part of the shipped language surface.',
        detail: 'Generic functions and types are specialized for the concrete programs that use them. Storing or returning a closure is not supported yet.',
    },
    {
        title: 'Ownership-aware native concurrency',
        copy: 'Experimental spawn and join run work on native OS threads. Typed blocking Channel<T> values move messages between workers, while c.share() makes endpoint sharing explicit.',
        detail: 'There is no async/await, atomics, or locks in 0.1, and no work-stealing executor.',
    },
    {
        title: 'Layout control for real hot loops',
        copy: 'Flat values can live inline inside Vec<T>, and Slice<T> provides bounded views. Experimental soa and aos conversions give explicit structure-of-arrays access through checked DataView<T>.',
        detail: 'The compiler specializes the element type before choosing its container representation.',
    },
    {
        title: 'A small, explicit standard surface',
        copy: 'Strings, vectors, maps, options, results, iterators, files, processes, ordering, equality, and display live in ordinary std.* modules, apart from a small built-in core such as Vec’s push and indexing. There is no prelude pulling unused facilities into a program.',
        detail: 'Import only the behavior the program intends to carry.',
    },
];

export default function Principles() {
    return (
        <section aria-labelledby="language-heading" className="mx-auto max-w-7xl px-6 py-24">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-4">
                    <h2 id="language-heading" className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                        High-level expression.
                    </h2>
                    <h2 className="text-4xl font-semibold tracking-[-0.035em] text-sky-300 md:text-5xl">
                        Systems-level control.
                    </h2>
                    <p className="mt-6 max-w-md text-base leading-7 text-zinc-400">
                        Prismio combines modern static abstraction with explicit systems boundaries:
                        native code, visible mutability, direct foreign calls, specialized generics,
                        and programmer-directed layout where it matters.
                    </p>
                </div>

                <div className="divide-y divide-white/[0.1] lg:col-span-8 lg:pt-3">
                    {LANGUAGE_FEATURES.map(({title, copy, detail}) => (
                        <article key={title} className="py-8 first:pt-0 last:pb-0">
                            <h3 className="text-xl font-semibold tracking-[-0.02em] text-white">{title}</h3>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">{copy}</p>
                            <p className="mt-3 text-sm leading-6 text-zinc-400">{detail}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
