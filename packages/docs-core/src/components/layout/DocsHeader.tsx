"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Search, Terminal, X } from "lucide-react";
import { Logo, DocsSearch, emitter } from "@prismio/ui";
import { ThemeSwitch } from "../theme/ThemeSwitch";
import { DocsNav } from "./DocsNav";
import type { DocsSection, DocsSiteConfig } from "../../types";

export interface DocsHeaderProps {
    siteConfig: DocsSiteConfig;
    navList: DocsSection[];
    brandTag?: string;
    accentColor?: "violet" | "purple" | "gray";
    installUrl?: string;
    showInstall?: boolean;
}

export function DocsHeader({
    siteConfig,
    navList,
    brandTag,
    accentColor,
    showInstall = true,
    installUrl = "https://www.prismio.org/install",
}: DocsHeaderProps) {
    const [isOpen, setOpen] = useState(false);

    const brandTagClass =
        accentColor === "purple"
            ? "text-purple-500 font-bold"
            : accentColor === "violet"
            ? "text-violet-500 font-bold"
            : "text-zinc-900 dark:text-white font-semibold";

    useEffect(() => {
        const openSearch = () => setOpen(false);
        emitter.on("openSearchModal", openSearch);
        return () => emitter.off("openSearchModal", openSearch);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    return (
        <>
            <header className="sticky top-0 z-[80] h-16 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-[#0b0b0d]/90">
                <div className="relative flex h-full items-center justify-between px-5 sm:px-8">
                    {/* Left Section */}
                    <div className="flex items-center gap-4">
                        <div className="flex shrink-0 items-center gap-2">
                            <Logo />
                            {brandTag ? (
                                <span className={`text-xl ${brandTagClass}`}>{brandTag}</span>
                            ) : null}
                        </div>

                        <span className="hidden rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600 sm:inline dark:bg-zinc-900 dark:text-zinc-300">
                            v{siteConfig.currentVersion}
                        </span>
                    </div>

                    {/* Center Section (Search) */}
                    <div className="absolute left-1/2 top-1/2 hidden w-full max-w-[400px] -translate-x-1/2 -translate-y-1/2 lg:block">
                        <DocsSearch emitter={emitter} />
                    </div>

                    {/* Right Section (Desktop) */}
                    <div className="hidden items-center lg:flex">
                        <div className="flex items-center gap-1 pr-4">
                            <a
                                href={siteConfig.links.github}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Prismio on GitHub"
                                className="inline-flex size-9 items-center justify-center rounded-full transition-all hover:bg-zinc-100 dark:hover:bg-white/[0.08]"
                            >
                                <Image
                                    src="/icons/github-mark.svg"
                                    alt="GitHub Repository"
                                    width={20}
                                    height={20}
                                    className="opacity-75 transition-opacity hover:opacity-100 dark:hidden"
                                />
                                <Image
                                    src="/icons/github-mark-white.svg"
                                    alt="GitHub Repository"
                                    width={20}
                                    height={20}
                                    className="hidden opacity-75 transition-opacity hover:opacity-100 dark:block"
                                />
                            </a>
                            <ThemeSwitch />
                        </div>
                        {showInstall && installUrl ? (
                            <div className="flex items-center border-l border-zinc-200 pl-4 dark:border-zinc-800">
                                <Link
                                    href={installUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group inline-flex h-9 items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 text-sm font-medium text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    <Terminal size={14} className="opacity-70 transition-opacity group-hover:opacity-100" />
                                    <span>Install</span>
                                </Link>
                            </div>
                        ) : null}
                    </div>

                    {/* Right Section (Mobile) */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <button
                            type="button"
                            onClick={() => emitter.emit("openSearchModal")}
                            aria-label="Search documentation"
                            className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-600 transition-all hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/[0.08]"
                        >
                            <Search aria-hidden="true" size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpen((value) => !value)}
                            aria-expanded={isOpen}
                            aria-controls="mobile-docs-nav"
                            aria-label={isOpen ? "Close navigation" : "Open navigation"}
                            className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-600 transition-all hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/[0.08]"
                        >
                            {isOpen ? <X aria-hidden="true" size={19} /> : <Menu aria-hidden="true" size={19} />}
                        </button>
                    </div>
                </div>
            </header>

            {isOpen && (
                <div
                    id="mobile-docs-nav"
                    className="fixed inset-x-0 bottom-0 top-16 z-[70] overflow-y-auto no-scrollbar bg-white px-5 py-6 lg:hidden dark:bg-[#0b0b0d]"
                >
                    <div className="mb-5 flex items-center justify-between gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800">
                        {showInstall && installUrl ? (
                            <Link
                                href={installUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 hover:underline dark:text-white"
                            >
                                <Terminal size={14} />
                                <span>Install compiler</span>
                            </Link>
                        ) : (
                            <div />
                        )}
                        <div className="flex items-center gap-2">
                            <a
                                href={siteConfig.links.github}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Prismio on GitHub"
                                className="inline-flex size-9 items-center justify-center rounded-full transition-all hover:bg-zinc-100 dark:hover:bg-white/[0.08]"
                            >
                                <Image
                                    src="/icons/github-mark.svg"
                                    alt="GitHub Repository"
                                    width={20}
                                    height={20}
                                    className="opacity-75 transition-opacity hover:opacity-100 dark:hidden"
                                />
                                <Image
                                    src="/icons/github-mark-white.svg"
                                    alt="GitHub Repository"
                                    width={20}
                                    height={20}
                                    className="hidden opacity-75 transition-opacity hover:opacity-100 dark:block"
                                />
                            </a>
                            <ThemeSwitch />
                        </div>
                    </div>
                    <DocsNav navList={navList} onItemClick={() => setOpen(false)} className="pb-16" />
                </div>
            )}
        </>
    );
}

export default DocsHeader;
