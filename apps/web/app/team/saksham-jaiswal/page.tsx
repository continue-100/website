import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    Code2, FileUser,
    Mail,
    MessageSquare,
    Send,
    Sparkles,
    Terminal,
} from "lucide-react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@prismio/ui/FooterMain";
import {DISCORD_INVITE_LINK} from "@prismio/utils";

export const metadata = {
    title: "Author's Note & Technical Journey · Saksham Jaiswal · Prismio",
    description: "A note from Saksham Jaiswal on compiler architecture, the vision behind Prismio, and building a self-hosted systems language.",
};

export default function SakshamAuthorPage() {
    return (
        <div
            className="relative min-h-screen bg-[#070709] text-white selection:bg-indigo-500/30 selection:text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overflow-x-clip">
            {/* Subtle Atmospheric Light — Restrained & Cinematic */}
            <div
                className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(67,56,202,0.18),rgba(15,23,42,0.1),transparent_70%)] blur-3xl"/>
            <div
                className="pointer-events-none absolute top-[1200px] right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08),transparent_70%)] blur-3xl"/>

            {/* Technical Grid Background */}
            <div
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)]"/>

            <HeaderMain/>

            <main className="relative z-10 mx-auto max-w-6xl px-6 py-12 md:py-28">
                {/* Back Link */}
                <div className="mb-12">
                    <Link
                        href="/team"
                        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-zinc-200 transition-colors group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/>
                        <span>Back to Team</span>
                    </Link>
                </div>

                {/* ── Hero: Technical & Editorial in Fraunces ───────────── */}
                <section
                    className="grid gap-12 lg:grid-cols-12 lg:gap-14 items-start pb-20 border-b border-white/[0.08]">

                    {/* Left 7 Columns: Editorial Headline & Bio */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Title locked in Fraunces */}
                        <h1 className="font-fraunces text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white leading-[1.08]">
                            Why I built a systems language from{" "}
                            <span className="italic text-zinc-400">scratch.</span>
                        </h1>

                        <p className="text-zinc-300 text-base sm:text-lg leading-relaxed max-w-xl">
                            A reflection on compiler architecture, designing the Adaptive Inference Framework (AIF),
                            and why systems programming deserves human-explainable determinism.
                        </p>

                        {/* Quick Contact & Links */}
                        <div className="pt-4 flex flex-wrap items-center gap-3 text-sm">
                            <a
                                href="https://github.com/saksham1319"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 font-medium text-white transition-all"
                            >
                                <Code2 size={15} className="text-zinc-300"/>
                                <span>GitHub</span>
                                <ArrowUpRight size={12} className="opacity-50"/>
                            </a>

                            <a
                                href="https://saksham1319.vercel.app"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 font-medium text-white transition-all"
                            >
                                <FileUser size={15} className="text-zinc-300"/>
                                <span>Portfolio</span>
                                <ArrowUpRight size={12} className="opacity-50"/>
                            </a>
                        </div>
                    </div>

                    {/* Right 5 Columns: Portrait */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-center">
                        <figure className="relative w-full max-w-[260px]">
                            <div className="absolute -inset-1 rounded-[2rem] bg-indigo-500/10 blur-xl opacity-50"/>
                            <div className="relative rounded-3xl border border-white/15 bg-[#0d0d12] p-3 shadow-2xl">
                                <div
                                    className="relative w-full aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-[#14141d]">
                                    <Image
                                        src="/images/team/saksham.jpeg"
                                        alt="Saksham Jaiswal, creator of Prismio"
                                        fill
                                        className="object-cover object-center"
                                        priority
                                        sizes="(max-width: 768px) 70vw, 260px"
                                    />
                                </div>
                                <figcaption className="px-1 pt-3">
                                    <span className="block font-fraunces text-lg text-white">Saksham Jaiswal</span>
                                    <span className="mt-0.5 block text-sm text-zinc-400">Creator and lead compiler architect</span>
                                </figcaption>
                            </div>
                        </figure>
                    </div>
                </section>

                {/* ── 2. The Personal Note from Author (Kalam Font) ──────── */}
                <section className="py-24 border-b border-white/[0.08]">

                    <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                        <h2 className="font-fraunces text-3xl sm:text-5xl text-white font-normal tracking-tight">
                            A Note to Every Prismio Developer
                        </h2>
                    </div>

                    {/* The Manuscript Card */}
                    <div
                        className="relative mx-auto max-w-4xl rounded-3xl bg-[#0c0c10]/95 border border-white/15 p-8 sm:p-12 md:p-16 shadow-2xl backdrop-blur-2xl">

                        {/* Top Margin Stamp */}
                        <div
                            className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6 mb-8">
                            <span className="font-mono text-xs text-zinc-400 tracking-wider uppercase">
                                Engineering Journal · Prismio v0.1.0
                            </span>

                            <span className="font-mono text-xs text-zinc-400">
                                October 2026
                            </span>
                        </div>

                        {/* THE LETTER BODY — IN KALAM FONT (LOCKED) */}
                        <div
                            className="font-kalam text-lg sm:text-xl md:text-2xl text-zinc-200 leading-[1.9] sm:leading-[2] space-y-7 tracking-wide">

                            <p className="text-white text-2xl sm:text-3xl font-bold font-kalam">
                                Dear developer,
                            </p>

                            <p>
                                If you&apos;ve made it this far, you probably know a little about Prismio already. Maybe
                                you&apos;re thinking about trying it, maybe you just stumbled across the website, or maybe
                                you&apos;re wondering why the hell someone would build another programming language in the
                                first place.
                            </p>

                            <p>
                                Honestly, I wonder that sometimes too.
                            </p>
                            <p>
                                I&apos;ve always had this habit of building things whenever something bothers me. I don&apos;t
                                know if that&apos;s a good habit or a terrible one. When existing things don&apos;t work the way I
                                want, my first thought is usually &quot;fine, I&apos;ll build it myself.&quot;
                            </p>

                            <p>That&apos;s basically how Prismio started.</p>

                            <p>I started working on it on August 24, 2024, and somehow, almost two years later, I&apos;m
                                still here.</p>

                            {/* Pull quote */}
                            <div className="my-7 rounded-2xl bg-indigo-500/[0.06] px-7 py-6">
                                <p className="font-kalam text-xl sm:text-2xl text-zinc-100 italic">
                                    The hardest part was never the code. It was answering one question: why?
                                </p>
                            </div>

                            <p>
                                Why another language? Why this design? Why should the compiler make this decision? Why
                                should you trust what it&apos;s doing?
                            </p>

                            <p>
                                I kept coming back to one idea: the compiler should know where your data lives, and it
                                should be able to explain itself. I don&apos;t want memory management to feel like something
                                happening behind a curtain. I want the language and compiler to make those decisions
                                understandable.
                            </p>

                            <p>
                                And Prismio isn&apos;t meant to stop at the language itself.
                            </p>

                            <p>
                                It&apos;s the first piece of a much bigger ecosystem I&apos;m trying to build — the compiler,
                                tooling, package manager, libraries, and everything around them designed to actually
                                work together. This is just where that starts.
                            </p>

                            <p>That said, Prismio is still early.</p>

                            <p>Some things are missing. Some things are rough. Some things will probably break. That&apos;s
                                not something I want to hide from you. The roadmap is there, the source is open, and I&apos;m
                                trying to keep the whole thing as transparent as I can.</p>

                            <p>So if you&apos;re curious, give Prismio a try.</p>

                            <p>And if you do, I&apos;d genuinely love to hear what happens — especially if something breaks,
                                feels confusing, or makes you wonder &quot;why did they do it this way?&quot;</p>

                            <p>Those are the things that make it better.</p>

                            <p>Thanks for being here.</p>

                            {/* Handwritten Signature in Kalam */}
                            <div className="pt-8 border-t border-white/[0.08] text-right">
                                <div className="font-kalam text-3xl sm:text-4xl text-white font-bold">
                                    Saksham Jaiswal
                                </div>
                                <div className="text-xs font-mono text-indigo-300 mt-1">
                                    Creator &amp; Lead Compiler Architect, Prismio
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 4. Technical Collaboration & Contact ──────────────── */}
                <section className="pt-12 md:pt-28 text-center">
                    <div className="max-w-2xl mx-auto space-y-5">
                        <h2 className="font-fraunces text-3xl sm:text-5xl text-white font-normal tracking-tight">
                            The conversation is always open.
                        </h2>
                        <p className="text-zinc-400 text-base leading-relaxed">
                            Whether you want to propose a compiler lowering pass, discuss AIF memory semantics,
                            or contribute to the standard library, feel free to reach out.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                            <a
                                href="mailto:saksham6975@gmail.com"
                                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all"
                            >
                                <Send size={15}/>
                                Email Saksham
                            </a>

                            <a
                                href={DISCORD_INVITE_LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium text-sm transition-all"
                            >
                                <MessageSquare size={16}/>
                                Discord
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <FooterMain/>
        </div>
    );
}
