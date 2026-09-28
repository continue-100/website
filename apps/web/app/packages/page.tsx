'use client';

import React from "react";
import HeaderMain from "@/components/HeaderMain";
import FooterMain from "@prismio/ui/FooterMain";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function PackagesPage() {
    return (
        <div className="relative min-h-screen bg-[#070709] text-[#e4e4e7] overflow-x-hidden flex flex-col justify-between selection:bg-indigo-500/30 selection:text-white">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/15 via-[#070709]/50 to-[#070709] z-0 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-[600px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

            <HeaderMain />

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-24 max-w-4xl mx-auto w-full">
                {/* Coming Soon Card */}
                <div className="w-full max-w-xl bg-[#0c0c0e]/80 border border-white/[0.08] rounded-3xl p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(99,102,241,0.03)] hover:border-indigo-500/20 hover:shadow-[0_0_50px_rgba(99,102,241,0.06)] transition-all duration-500 text-center">
                    
                    {/* Pulsing Status indicator */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span className="text-[11px] font-mono font-medium text-indigo-400 uppercase tracking-widest">
                            In Active Development
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
                        Prismio Package Index
                    </h1>
                    
                    <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
                        The central registry for importing, managing, and publishing Prismio libraries is under construction. Standard libraries and tool extensions are on the way.
                    </p>

                    {/* Checklist */}
                    <div className="mt-8 pt-8 border-t border-white/[0.04] space-y-4 text-left">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-4">Development Roadmap</span>
                        
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400 font-mono">Local Resolver & Lockfile (UMS)</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">Completed</span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400 font-mono">Registry CLI publishing tools</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">In Progress</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400 font-mono">Remote Package Search & Web UI</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#16161c] text-zinc-500 border border-white/[0.04]">Planning</span>
                        </div>
                    </div>

                    {/* CTAs */}
                    <div className="mt-8 pt-6 border-t border-white/[0.04] flex items-center justify-center">
                        <Link
                            href="/"
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-full transition-all text-xs font-semibold"
                        >
                            <ArrowLeft size={14} />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </main>

            <FooterMain />
        </div>
    );
}
