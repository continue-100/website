import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    FileUser,
    Mail,
    Send,
    Sparkles,
    Terminal,
} from "lucide-react";
import HeaderMain from "@/components/HeaderMain";
import DiscordIcon from "@/components/icons/DiscordIcon";
import GithubIcon from "@/components/icons/GithubIcon";
import LinkedinIcon from "@/components/icons/LinkedinIcon";
import FooterMain from "@prismio/ui/FooterMain";
import {DISCORD_INVITE_LINK} from "@prismio/utils";

export const metadata = {
    title: "Author's Note & Technical Journey · Saksham Jaiswal · Prismio",
    description: "A note from Saksham Jaiswal on compiler architecture, the vision behind Prismio, and building a self-hosted systems language.",
};

const LINKEDIN_URL = "https://www.linkedin.com/in/saksham6975";

// One treatment per role: Email is the action, the profiles are where to find the work.
const PRIMARY_LINK =
    "inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070709]";
const PROFILE_LINK =
    "inline-flex w-full min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 sm:w-auto sm:px-5";

const PROFILE_LINKS = [
    {label: "GitHub", href: "https://github.com/saksham1319", icon: <GithubIcon size={16}/>},
    {label: "LinkedIn", href: LINKEDIN_URL, icon: <LinkedinIcon size={16} className="text-[#70b5f9]"/>},
    {label: "Portfolio", href: "https://saksham1319.vercel.app", icon: <FileUser size={16} className="text-zinc-300"/>},
];

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

            <main className="relative z-10 mx-auto max-w-7xl px-4 pb-0 pt-12 sm:px-5 md:pt-28">
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
                        <h1 className="font-fraunces text-4xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white leading-[1.1]">
                            Why I built a systems language from{" "}
                            <span className="italic text-zinc-400">scratch.</span>
                        </h1>

                        <p className="text-zinc-300 text-base sm:text-lg leading-relaxed max-w-xl">
                            A reflection on compiler architecture, designing the Adaptive Inference Framework (AIF),
                            and why systems programming deserves human-explainable determinism.
                        </p>

                        {/* Contact & profiles: one primary action, then the places to find the work */}
                        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                            <a
                                href="mailto:saksham6975@gmail.com"
                                className={`${PRIMARY_LINK} justify-center`}
                            >
                                <Mail size={15}/>
                                <span>Email me</span>
                            </a>

                            <ul aria-label="Profiles" className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
                                {PROFILE_LINKS.map(({label, href, icon}) => (
                                    <li key={label}>
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${PROFILE_LINK} justify-center`}
                                        >
                                            {icon}
                                            <span>{label}</span>
                                            <ArrowUpRight size={12} aria-hidden className="hidden opacity-50 sm:block"/>
                                            <span className="sr-only">(opens in a new tab)</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right 5 Columns: Portrait */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-center lg:items-end">
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

                {/* ── 2. The Personal Note: dark, scroll-lit handwriting ── */}
                <section className="note-section relative border-b border-white/[0.08] py-24">
                    <style>{`
                        .note-section { timeline-scope: --letter; }
                        .note-progress { transform: scaleY(1); }
                        .note-sign-path { stroke-dasharray: 1; stroke-dashoffset: 0; }

                        @supports (animation-timeline: view()) {
                            .note-text p {
                                animation: note-light linear both;
                                animation-timeline: view();
                                animation-range: entry 0% entry 100%;
                            }
                            .note-letter { view-timeline: --letter block; }
                            .note-progress {
                                transform: scaleY(0);
                                animation: note-grow linear both;
                                animation-timeline: --letter;
                                animation-range: cover 15% cover 85%;
                            }
                            .note-sign-path {
                                stroke-dashoffset: 1;
                                animation: note-draw linear both;
                                animation-timeline: view();
                                animation-range: entry 10% entry 100%;
                            }
                        }
                        @keyframes note-light { from { opacity: 0.4; } to { opacity: 1; } }
                        @keyframes note-grow { to { transform: scaleY(1); } }
                        @keyframes note-draw { to { stroke-dashoffset: 0; } }
                        @media (prefers-reduced-motion: reduce) {
                            .note-text p, .note-progress, .note-sign-path { animation: none !important; }
                            .note-text p { opacity: 1; }
                            .note-progress { transform: scaleY(1); }
                            .note-sign-path { stroke-dashoffset: 0; }
                        }
                        .note-hl {
                            padding: 0.04em 0.22em;
                            border-radius: 0.28em;
                            color: #fff;
                            font-weight: 700;
                            -webkit-box-decoration-break: clone;
                            box-decoration-break: clone;
                        }
                        .note-hl-indigo { background-color: #272a47; }
                        .note-hl-teal { background-color: #103835; }
                        .note-hl-amber { background-color: #463710; }
                        .note-wavy {
                            color: #fff;
                            text-decoration: underline wavy rgba(45, 212, 191, 0.85);
                            text-decoration-thickness: 2px;
                            text-underline-offset: 7px;
                        }
                        .note-marker {
                            display: inline;
                            padding: 0 0.28em;
                            border-radius: 0.28em;
                            background-color: #22243e;
                            -webkit-box-decoration-break: clone;
                            box-decoration-break: clone;
                        }
                    `}</style>

                    <div className="pointer-events-none absolute right-0 top-1/4 h-[40rem] w-[40rem] bg-[radial-gradient(circle,rgba(67,56,202,0.16),transparent_65%)]" />

                    <div className="relative grid gap-12 lg:grid-cols-12 lg:gap-20">
                        {/* Left: title, date, reading progress */}
                        <div className="lg:col-span-4 lg:self-start lg:sticky lg:top-28">
                            <h2 className="font-fraunces text-3xl sm:text-4xl text-white font-normal tracking-tight">
                                A Note to Every Prismio Developer
                            </h2>
                            <div className="mt-6 space-y-1 font-mono text-xs uppercase tracking-wider text-zinc-400">
                                <p>Engineering Journal · Prismio v0.1.0</p>
                                <p>October 2026</p>
                            </div>
                            <div aria-hidden className="relative mt-8 hidden h-40 w-px bg-white/10 lg:block">
                                <div className="note-progress absolute inset-x-0 top-0 h-full origin-top bg-gradient-to-b from-indigo-400 to-teal-300" />
                            </div>
                        </div>

                        {/* Right: the letter, in Kalam */}
                        <div className="note-letter lg:col-span-8">
                            <div className="note-text font-kalam text-xl leading-[1.7] tracking-wide text-zinc-200 sm:text-[21px] md:text-2xl [&>p]:mb-8 max-w-2xl">
                                <p className="text-2xl font-bold text-white sm:text-3xl">Dear developer,</p>

                                <p>
                                    If you&apos;ve made it this far, you probably know a little about Prismio already. Maybe
                                    you&apos;re thinking about trying it, maybe you just stumbled across the website, or maybe
                                    you&apos;re wondering why the hell someone would build another programming language in the
                                    first place.
                                </p>

                                <p>Honestly, I wonder that sometimes too.</p>

                                <p>
                                    I&apos;ve always had this habit of building things whenever something bothers me. I don&apos;t
                                    know if that&apos;s a good habit or a terrible one. When existing things don&apos;t work the way I
                                    want, my first thought is usually <span className="italic text-sky-300">&quot;fine, I&apos;ll build it myself.&quot;</span>
                                </p>

                                <p>That&apos;s basically how Prismio started.</p>

                                <p>
                                    I started working on it on <span className="note-hl note-hl-teal">August 24, 2024</span>, and somehow, almost two years later, I&apos;m
                                    still here.
                                </p>

                                <p className="py-4 text-2xl font-bold leading-[1.75] text-white sm:text-3xl">
                                    <span className="note-marker">
                                        The hardest part was never the code. It was answering one question:{" "}
                                        <span className="text-amber-300">why?</span>
                                    </span>
                                </p>

                                <p>
                                    Why another language? Why this design? Why should the compiler make this decision? Why
                                    should you trust what it&apos;s doing?
                                </p>

                                <p>
                                    I kept coming back to one idea: the compiler should know where your data lives, and it
                                    should be able to <span className="note-hl note-hl-indigo">explain itself</span>. I don&apos;t want memory management to feel like something
                                    happening behind a curtain. I want the language and compiler to make those decisions
                                    understandable.
                                </p>

                                <p>And Prismio isn&apos;t meant to stop at the language itself.</p>

                                <p>
                                    It&apos;s the first piece of a <span className="note-wavy">much bigger ecosystem</span> I&apos;m trying to build — the compiler,
                                    tooling, package manager, libraries, and everything around them designed to actually
                                    work together. This is just where that starts.
                                </p>

                                <p>That said, Prismio is still early.</p>

                                <p>
                                    Some things are missing. Some things are rough. Some things will probably break. That&apos;s
                                    not something I want to hide from you. The roadmap is there, the source is open, and I&apos;m
                                    trying to keep the whole thing as transparent as I can.
                                </p>

                                <p>So if you&apos;re curious, <span className="note-hl note-hl-amber">give Prismio a try</span>.</p>

                                <p>
                                    And if you do, I&apos;d genuinely love to hear what happens — especially if something breaks,
                                    feels confusing, or makes you wonder <span className="italic text-sky-300">&quot;why did they do it this way?&quot;</span>
                                </p>

                                <p>Those are the things that make it better.</p>

                                <p>Thanks for being here.</p>
                            </div>

                            {/* Signature: the swash draws itself as you reach it */}
                            <div className="mt-4 max-w-2xl text-right">
                                <div className="font-kalam text-3xl font-bold text-white sm:text-4xl">Saksham Jaiswal</div>
                                <svg
                                    aria-hidden
                                    viewBox="0 0 260 18"
                                    className="ml-auto -mt-1 h-4 w-56 sm:w-64"
                                    fill="none"
                                >
                                    <defs>
                                        <linearGradient id="note-ink" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#a5b4fc" />
                                            <stop offset="100%" stopColor="#5eead4" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        className="note-sign-path"
                                        pathLength={1}
                                        d="M2 11 C 44 2, 78 16, 122 8 S 206 3, 258 10"
                                        stroke="url(#note-ink)"
                                        strokeWidth="2.25"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="mt-2 font-mono text-xs text-zinc-400">
                                    Creator &amp; Lead Compiler Architect, Prismio
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 4. Technical Collaboration & Contact ──────────────── */}
                <section className="pt-32 text-center">
                    <div className="max-w-2xl mx-auto space-y-5">
                        <h2 className="font-fraunces text-3xl sm:text-4xl text-white font-normal tracking-tight">
                            The conversation is always open.
                        </h2>
                        <p className="text-zinc-400 text-base leading-relaxed">
                            Whether you want to propose a compiler lowering pass, discuss AIF memory semantics,
                            or contribute to the standard library, feel free to reach out.
                        </p>

                        <div className="flex flex-col items-stretch gap-3 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
                            <a
                                href="mailto:saksham6975@gmail.com"
                                className="inline-flex min-h-11 items-center justify-center gap-2 px-7 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all"
                            >
                                <Mail size={15}/>
                                Email Saksham
                            </a>

                            <a
                                href={LINKEDIN_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-medium text-sm transition-all"
                            >
                                <LinkedinIcon size={16}/>
                                LinkedIn
                            </a>

                            <a
                                href={DISCORD_INVITE_LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium text-sm transition-all"
                            >
                                <DiscordIcon size={16}/>
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
