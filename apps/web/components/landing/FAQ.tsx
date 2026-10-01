import React from "react";
import {faqItems} from "@/config/faq";

export default function FAQ() {
    return (
        <section aria-labelledby="faq-heading" className="mx-auto max-w-7xl px-6 pt-24 md:pt-32">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
                <div className="lg:col-span-4">
                    <h2 id="faq-heading" className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                        Frequently asked questions
                    </h2>
                    <p className="mt-6 text-base leading-7 text-zinc-400">
                        Short answers about what Prismio is today. The documentation has the full detail.
                    </p>
                </div>
                <dl className="divide-y divide-white/[0.08] lg:col-span-8">
                    {faqItems.map(({question, answer}) => (
                        <div key={question} className="py-6 first:pt-0">
                            <dt className="text-lg font-semibold text-white">{question}</dt>
                            <dd className="mt-2 text-base leading-7 text-zinc-400">{answer}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
