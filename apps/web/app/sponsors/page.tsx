import React from "react";
import {Mail} from "lucide-react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@prismio/ui/FooterMain";
import {siteConfig} from "@/config/site";

export const metadata = {
    title: "Sponsors · Prismio",
    description: "Support Prismio by bank transfer. What the funding would pay for, how to sponsor, and how sponsors are credited.",
    alternates: {canonical: "/sponsors"},
};

const CARD = "rounded-3xl border border-white/[0.08] bg-[#0c0c0e]/70 backdrop-blur-xl";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400";

const sponsorMail = (subject: string) => `mailto:${siteConfig.email}?subject=${encodeURIComponent(subject)}`;

const FUNDING = [
    {
        title: "CI and benchmark hardware",
        detail: "A dedicated machine for reproducible benchmark timing, and runners for the three-platform bootstrap and the full benchmark runs.",
    },
    {
        title: "Focused development time",
        detail: "Hours spent on the hard parts: the memory model (AIF), the LLVM backend, and concurrency.",
    },
    {
        title: "Hosting",
        detail: "Hosting for prebuilt toolchain archives, the documentation, and the website.",
    },
];

const STEPS = [
    {
        title: "Send an email",
        detail: "Say who you are and roughly what you would like to give. Individuals, teams, and organizations are all welcome.",
    },
    {
        title: "Get the bank details",
        detail: "You will receive a reply with the account details. They are not published on this page.",
    },
    {
        title: "Make the transfer",
        detail: "Say how you would like to be credited, or that you would rather stay anonymous.",
    },
];

const PRINCIPLES = [
    {
        title: "100% open source",
        copy: "The compiler, standard library, verifier shims, and documentation are published under Apache-2.0. There will never be an enterprise tier, proprietary compiler flag, or closed source standard library module.",
    },
    {
        title: "Decisions on technical merit",
        copy: "Financial contributions do not buy unilateral feature approval. Syntax changes, semantic decisions, and memory models are decided on technical merit, in the open on GitHub.",
    },
    {
        title: "Money goes to the project",
        copy: "Funds are spent on infrastructure, hosting, and development time for Prismio.",
    },
];

export default function SponsorsPage() {
    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#070709] text-white selection:bg-indigo-500/30 selection:text-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(ellipse_at_68%_8%,rgba(67,56,202,0.18),transparent_54%)]" />

            <HeaderMain />

            <main className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-0 md:pt-28 md:pb-0">
                {/* Hero */}
                <section className="grid items-start gap-12 border-b border-white/[0.08] pb-20 lg:grid-cols-12 lg:gap-16">
                    <div className="lg:col-span-8">
                        <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
                            Support <span className="text-sky-300">Prismio.</span>
                        </h1>
                        <p className="mt-8 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
                            Prismio is built in the open, without venture backing or proprietary licenses.
                            Development is sustained through community contributions and sponsorship.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <a
                                href={sponsorMail("Prismio sponsorship")}
                                className={`inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 ${FOCUS}`}
                            >
                                <Mail size={16} />
                                Sponsor by bank transfer
                            </a>
                            <a
                                href={sponsorMail("Prismio sponsorship question")}
                                className={`inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/[0.06] ${FOCUS}`}
                            >
                                Ask a question first
                            </a>
                        </div>
                    </div>

                    <aside className={`${CARD} p-6 lg:col-span-4`}>
                        <h2 className="text-sm font-semibold text-white">Our commitment</h2>
                        <p className="mt-3 text-sm leading-7 text-zinc-400">
                            Prismio stays free and Apache-2.0 licensed. Sponsorship pays for infrastructure and focused
                            development time.
                        </p>
                    </aside>
                </section>

                {/* Where funding would go */}
                <section className="border-b border-white/[0.08] py-24" aria-labelledby="funding-heading">
                    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                        <div className="lg:col-span-4">
                            <h2 id="funding-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                                Where funding would go.
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-zinc-400">
                                No funding is in place yet. This is what it would pay for.
                            </p>
                        </div>

                        <div className="divide-y divide-white/[0.1] lg:col-span-8">
                            {FUNDING.map((item) => (
                                <article key={item.title} className="py-8 first:pt-0 last:pb-0">
                                    <h3 className="text-xl font-semibold tracking-[-0.02em] text-white">{item.title}</h3>
                                    <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">{item.detail}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How to sponsor */}
                <section className="border-b border-white/[0.08] pt-24" aria-labelledby="how-heading">
                    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                        <div className="lg:col-span-4">
                            <h2 id="how-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                                How to sponsor.
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-zinc-400">
                                Sponsorship is by bank transfer. There is no platform in between.
                            </p>
                        </div>

                        <ol className="space-y-9 lg:col-span-8">
                            {STEPS.map((step, i) => (
                                <li key={step.title} className="relative pl-14">
                                    <span
                                        aria-hidden
                                        className="absolute left-0 top-0 flex size-9 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/10 font-mono text-sm font-semibold text-indigo-100"
                                    >
                                        {i + 1}
                                    </span>
                                    {i < STEPS.length - 1 && (
                                        <span aria-hidden className="absolute bottom-[-2.25rem] left-[17px] top-11 w-px bg-white/[0.1]" />
                                    )}
                                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                                    <p className="mt-1 max-w-2xl text-sm leading-7 text-zinc-400">{step.detail}</p>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <p className="mt-14 max-w-3xl border-t border-white/[0.1] py-8 text-sm leading-7 text-zinc-300">
                        Sponsors who want it are credited by name or logo on this page and in the release notes.
                        Staying anonymous is fine.
                    </p>
                </section>

                {/* Principles */}
                <section className="border-b border-white/[0.08] py-24" aria-labelledby="principles-heading">
                    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                        <div className="lg:col-span-4">
                            <h2 id="principles-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                                What sponsorship does not change.
                            </h2>
                        </div>

                        <div className="divide-y divide-white/[0.1] lg:col-span-8">
                            {PRINCIPLES.map((item) => (
                                <article key={item.title} className="py-8 first:pt-0 last:pb-0">
                                    <h3 className="text-xl font-semibold tracking-[-0.02em] text-white">{item.title}</h3>
                                    <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">{item.copy}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Supporters */}
                <section className="pt-24" aria-labelledby="supporters-heading">
                    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                        <div className="lg:col-span-4">
                            <h2 id="supporters-heading" className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                                Supporters.
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-zinc-400">
                                Individuals and teams who contribute to Prismio development and infrastructure.
                            </p>
                        </div>

                        <div className="lg:col-span-8">
                            <div className={`${CARD} p-8 md:p-10`}>
                                <h3 className="text-lg font-semibold text-white">No sponsors yet</h3>
                                <p className="mt-2 text-sm leading-7 text-zinc-400">
                                    Prismio is funded directly by community contributions with no corporate or venture backing.
                                    Sponsors are credited here, in the repository, and in compiler release notes. Staying anonymous is always an option.
                                </p>
                                <div className="mt-6">
                                    <a
                                        href={sponsorMail("Prismio sponsorship")}
                                        className={`inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 ${FOCUS}`}
                                    >
                                        <Mail size={15} />
                                        Sponsor Prismio
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <FooterMain />
        </div>
    );
}
