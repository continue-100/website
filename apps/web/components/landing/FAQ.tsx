'use client';

import React from "react";
import {Accordion} from "@heroui/react";
import {ChevronDown} from "lucide-react";
import {faqItems} from "@/config/faq";

export default function FAQ() {
    return (
        <section aria-labelledby="faq-heading" className="mx-auto max-w-7xl px-6 pb-4">
            <div className="grid gap-12 border-t border-white/[0.1] pt-24 md:pt-28 lg:grid-cols-12 lg:gap-20">
                <div className="lg:col-span-4">
                    <h2 id="faq-heading" className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                        Frequently asked questions
                    </h2>
                    <p className="mt-6 text-base leading-7 text-zinc-400">
                        Short answers about what Prismio is today. The documentation has the full detail.
                    </p>
                </div>

                <Accordion
                    hideSeparator
                    className="w-full bg-transparent p-0 lg:col-span-8"
                >
                    {faqItems.map(({question, answer}, index) => (
                        <Accordion.Item key={question} id={`faq-${index}`} className="border-b! border-solid! border-white/[0.1]! bg-transparent px-0 last:border-b-0!">
                            <Accordion.Heading>
                                <Accordion.Trigger className="w-full justify-between gap-6 px-5 py-6 text-left text-lg font-semibold text-white transition-colors hover:text-indigo-200 focus-visible:ring-2 focus-visible:ring-indigo-400">
                                    {question}
                                    <Accordion.Indicator className="shrink-0 text-zinc-400">
                                        <ChevronDown size={20} />
                                    </Accordion.Indicator>
                                </Accordion.Trigger>
                            </Accordion.Heading>
                            <Accordion.Panel>
                                <Accordion.Body className="max-w-3xl px-5 pb-7 pt-0 text-base leading-7 text-zinc-300">
                                    {answer}
                                </Accordion.Body>
                            </Accordion.Panel>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
