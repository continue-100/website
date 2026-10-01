import React from "react";
import Link from "next/link";
import Image from "next/image";
import Copyright from "./Copyright";
import {DISCORD_INVITE_LINK} from "@prismio/utils";

export default function FooterMain() {
    return (
        <footer className="relative border-t border-zinc-200 dark:border-white/10 mt-32 z-[100]">
            <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-2 md:grid-cols-4 gap-12 text-sm">
                {/* Column — About */}
                <div className="space-y-4 col-span-2 sm:col-span-1">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <Image src="/icons/prismio.png" alt="Prismio logo" width={32} height={32}/>
                        </div>
                        <span className="font-semibold text-xl text-zinc-900 dark:text-white">Prismio</span>
                    </Link>

                    <p className="text-zinc-600 dark:text-gray-400 leading-relaxed max-w-xs">
                        A self-hosted systems language with explainable memory inference,
                        LLVM-native code generation, and direct C interoperability.
                    </p>
                </div>

                {/* Column — Ecosystem */}
                <div className="space-y-3 md:pl-4">
                    <h5 className="font-medium text-zinc-900 dark:text-gray-200 tracking-tight">Ecosystem</h5>
                    <FooterLink href="/install">Install</FooterLink>
                    <FooterLink href="https://docs.prismio.org" external>Documentation</FooterLink>
                    <FooterLink href="https://developers.prismio.org" external>Developers</FooterLink>
                    <FooterLink href="https://packages.prismio.org" external soon>Packages</FooterLink>
                    <FooterLink href="https://play.prismio.org" external soon>Playground</FooterLink>
                </div>

                {/* Column — Project */}
                <div className="space-y-3 md:pl-4">
                    <h5 className="font-medium text-zinc-900 dark:text-gray-200 tracking-tight">Project</h5>
                    <FooterLink href="/about">About</FooterLink>
                    <FooterLink href="/team">Team</FooterLink>
                    <FooterLink href="/benchmarks">Benchmarks</FooterLink>
                    <FooterLink href="/roadmap">Roadmap</FooterLink>
                    <FooterLink href="https://github.com/prismio-lang/prismio" external>GitHub</FooterLink>
                    <FooterLink href="https://github.com/prismio-lang/prismio/issues" external>Issues</FooterLink>
                    <FooterLink href="https://github.com/prismio-lang/prismio/blob/main/LICENSE" external>License</FooterLink>
                </div>

                {/* Column — Community */}
                <div className="space-y-3 md:pl-4">
                    <h5 className="font-medium text-zinc-900 dark:text-gray-200 tracking-tight">Community</h5>
                    <FooterLink href="/community">Community</FooterLink>
                    <FooterLink href="/sponsors">Sponsors</FooterLink>
                    <FooterLink href={DISCORD_INVITE_LINK} external>Discord</FooterLink>
                </div>
            </div>

            <Copyright/>
        </footer>
    );
}

function FooterLink({
    href,
    children,
    external,
    soon,
}: {
    href: string;
    children: React.ReactNode;
    external?: boolean;
    soon?: boolean;
}) {
    const className =
        "flex items-center gap-2 text-zinc-600 hover:text-zinc-950 dark:text-gray-400 dark:hover:text-white transition-colors";
    const content = (
        <>
            {children}
            {soon && (
                <span className="rounded-full border border-zinc-300 px-1.5 py-px text-[10px] font-medium leading-4 text-zinc-500 dark:border-white/15 dark:text-gray-400">
                    Soon
                </span>
            )}
        </>
    );

    if (external) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
                {content}
            </a>
        );
    }
    return (
        <Link href={href} className={className}>
            {content}
        </Link>
    );
}
