import React from "react";
import Link from "next/link";
import Image from "next/image";
import {DISCORD_INVITE_LINK} from "@prismio/utils";

export default function FooterMain() {
    return (
        <footer className="relative border-t border-zinc-200 bg-[#fafafa] mt-24 text-sm">
            <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-2 md:grid-cols-4 gap-12">
                {/* Column — About */}
                <div className="space-y-4 col-span-2 md:col-span-1">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <Image src="/icons/prismio.png" alt="Logo" width={32} height={32}/>
                        </div>
                        <span className="font-semibold text-xl text-zinc-900">Prismio</span>
                    </Link>

                    <p className="text-zinc-500 leading-relaxed max-w-xs text-xs">
                        A self-hosted systems language with explainable memory inference,
                        LLVM-native code generation, and direct C interoperability.
                    </p>
                </div>

                {/* Column — Ecosystem */}
                <div className="space-y-3 md:pl-4">
                    <h5 className="font-semibold text-zinc-900 text-xs tracking-tight uppercase">Ecosystem</h5>
                    <FooterLink href="https://docs.prismio.org" external>Documentation</FooterLink>
                    <FooterLink href="https://developers.prismio.org" external>Developer Portal</FooterLink>
                    <FooterLink href="/">Package Registry</FooterLink>
                    <FooterLink href="https://play.prismio.org" external>Interactive Playground</FooterLink>
                </div>

                {/* Column — Project */}
                <div className="space-y-3 md:pl-8">
                    <h5 className="font-semibold text-zinc-900 text-xs tracking-tight uppercase">Project</h5>
                    <FooterLink href="https://prismio.org/benchmarks" external>Benchmarks</FooterLink>
                    <FooterLink href="https://prismio.org/roadmap" external>Roadmap</FooterLink>
                    <FooterLink href="https://github.com/prismio-lang/prismio" external>GitHub Repository</FooterLink>
                    <FooterLink href="https://github.com/prismio-lang/prismio/issues" external>Issue Tracker</FooterLink>
                </div>

                {/* Column — Community */}
                <div className="space-y-3 md:pl-12">
                    <h5 className="font-semibold text-zinc-900 text-xs tracking-tight uppercase">Community</h5>
                    <FooterLink href="https://prismio.org/community" external>Community Overview</FooterLink>
                    <FooterLink href="https://prismio.org/sponsors" external>Sponsors</FooterLink>
                    <FooterLink href={DISCORD_INVITE_LINK} external>Discord Community</FooterLink>
                </div>
            </div>

            <div className="border-t border-zinc-200 px-8 py-6 text-center text-xs text-zinc-400">
                © {new Date().getFullYear()} Prismio Language Contributors. Permissively licensed under Apache-2.0 / MIT.
            </div>
        </footer>
    );
}

function FooterLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
    if (external) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-zinc-500 hover:text-zinc-900 transition-colors text-xs"
            >
                {children}
            </a>
        );
    }
    return (
        <Link
            href={href}
            className="block text-zinc-500 hover:text-zinc-900 transition-colors text-xs"
        >
            {children}
        </Link>
    );
}
