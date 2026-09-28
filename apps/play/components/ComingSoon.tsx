"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import HeaderMini from "@/components/HeaderMini";
import Copyright from "@prismio/ui/Copyright";

export default function ComingSoon() {
    return (
        <div className="relative min-h-screen bg-[#070709] text-zinc-100 flex flex-col justify-between overflow-x-hidden selection:bg-[#47d7b5]/30 selection:text-white">
            {/* Subtle background ambient grid */}
            <div
                className="pointer-events-none absolute inset-0 z-0 opacity-25"
                style={{
                    backgroundImage:
                        "radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                }}
            />

            <div className="relative z-10 flex flex-col flex-1">
                <HeaderMini />

                {/* ── Main Hero ── */}
                <main className="flex-1 flex flex-col items-center">
                    <section className="w-full max-w-4xl mx-auto px-6 pt-20 sm:pt-28 pb-16 text-center">
                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08] max-w-3xl mx-auto mb-10">
                            The interactive playground for{" "}
                            <span className="relative inline-block whitespace-nowrap">
                                <span className="relative z-10">Prismio</span>
                                <span
                                    className="absolute left-0 right-0 bottom-1 sm:bottom-1.5 h-2.5 sm:h-3.5 bg-[#47d7b5]/30 rounded-xs pointer-events-none -z-0"
                                    aria-hidden="true"
                                />
                            </span>{" "}
                            is coming soon.
                        </h1>

                        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl mx-auto mb-12">
                            The official interactive compiler workspace for writing, testing, inspecting AIF memory placement, and analyzing LLVM IR for Prismio.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-wrap items-center justify-center gap-3.5">
                            <Link
                                href="https://github.com/prismio-lang/prismio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-sm transition-colors shadow-xs"
                            >
                                <Image
                                    src="/icons/github-mark.svg"
                                    alt="GitHub"
                                    width={16}
                                    height={16}
                                />
                                <span>Star on GitHub</span>
                            </Link>

                            <Link
                                href="https://prismio.org/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/25 text-zinc-200 hover:text-white font-medium text-sm transition-all shadow-none"
                            >
                                <span>Back to Prismio</span>
                                <ArrowUpRight
                                    size={15}
                                    className="text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                                />
                            </Link>
                        </div>
                    </section>
                </main>
                <Copyright/>
            </div>
        </div>
    );
}
