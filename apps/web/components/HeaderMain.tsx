"use client";

import React, {useState, useEffect} from "react";
import Link from "next/link";
import {ArrowUpRight, Terminal} from "lucide-react";
import {Cross as Hamburger} from "hamburger-react";
import {AnimatePresence, motion} from "framer-motion";
import {Button, Chip} from "@heroui/react";
import Logo from "@prismio/ui/Logo";
import Image from "next/image";
import {PRISMIO_VERSION} from "@prismio/utils";

interface NavItem {
    label: string;
    href: string;
    isExternal?: boolean;
}

const HeaderMain: React.FC = () => {

    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const navLinks: NavItem[] = [
        {label: "Packages", href: "https://packages.prismio.org", isExternal: true},
        {label: "Playground", href: "https://play.prismio.org", isExternal: true},
        {label: "Benchmarks", href: "/benchmarks"},
        {label: "Roadmap", href: "/roadmap"},
        {label: "Docs", href: "https://docs.prismio.org", isExternal: true},
    ]

    return (
        <>
            <header
                className={`
                sticky top-0 z-[80] transition-all duration-300
                ${
                    scrolled
                        ? "bg-[#0b0b0b]/65 backdrop-blur-xl border-b border-white/10"
                        : "bg-transparent border-b border-transparent"
                }`}>

                <div className="relative px-5 md:px-10 h-17 flex items-center">

                    <div className="flex items-center gap-3 shrink-0">
                        <Logo/>

                        <Chip variant={"secondary"}>
                            <Chip.Label>{PRISMIO_VERSION}</Chip.Label>
                        </Chip>
                    </div>


                    <nav className="hidden md:flex flex-1 items-center justify-center gap-6 lg:gap-8 xl:gap-10">
                        {navLinks.map(({label, href, isExternal}) => {

                            if (isExternal) {
                                return (
                                    <Link
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-base font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                                        {label}
                                        <ArrowUpRight size={11} className="opacity-50"/>
                                    </Link>
                                )
                            }
                            return (
                                <Link
                                    key={label}
                                    href={href}
                                    className="text-base font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                                    {label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Right: Actions */}

                    <div className="hidden md:flex items-center gap-3">

                        <Link
                            href="https://github.com/prismio-lang/prismio"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/[0.05] transition-all"
                            aria-label="GitHub Repository">

                            <Image src={"/icons/github-mark-white.svg"} alt={"Github Repository"} height={24} width={24}/>
                        </Link>

                        <Link
                            href="https://developers.prismio.org"
                            target="_blank"
                            rel="noopener noreferrer">
                            <Button className={"h-10 px-6"}>
                                <span>Developers</span>
                                <ArrowUpRight size={11} className="opacity-50"/>
                            </Button>
                        </Link>

                        <div className="ml-auto hidden md:flex items-center gap-3">

                            <Link href="/install">
                                <Button
                                    variant="tertiary"
                                    className="h-10 px-6 rounded-full text-gray-800 bg-white">
                                    <Terminal size={14}/>
                                    Install
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* MOBILE HAMBURGER */}
                    <div className="ml-auto md:hidden z-[90]">
                        <Hamburger toggled={isOpen} toggle={setOpen} size={22}/>
                    </div>
                </div>
            </header>

            {/* ================= MOBILE MENU ================= */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{opacity: 0, y: -12}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -12}}
                        transition={{duration: 0.25, ease: "easeOut"}}
                        className="fixed inset-0 z-[70] bg-[#070709]/95 backdrop-blur-2xl px-6 pt-24 overflow-y-auto"
                    >
                        <div className="flex flex-col pb-12">
                            {/* Nav links */}
                            <div className="flex flex-col gap-1">
                                {navLinks.map(({label, href, isExternal}) => (
                                    isExternal ? (
                                        <a
                                            key={label}
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => setOpen(false)}
                                            className="flex items-center justify-between py-3.5 border-b border-white/[0.06] text-base font-medium text-gray-300 hover:text-white transition-colors"
                                        >
                                            <span>{label}</span>
                                            <ArrowUpRight size={15} className="opacity-50"/>
                                        </a>
                                    ) : (
                                        <Link
                                            key={label}
                                            href={href}
                                            onClick={() => setOpen(false)}
                                            className="flex items-center justify-between py-3.5 border-b border-white/[0.06] text-base font-medium text-gray-300 hover:text-white transition-colors"
                                        >
                                            <span>{label}</span>
                                        </Link>
                                    )
                                ))}
                            </div>

                            {/* Mobile Dual Developer CTAs */}
                            <div className="pt-8 flex flex-col gap-3">
                                <a
                                    href="https://developers.prismio.org"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setOpen(false)}
                                    className="w-full h-12 flex items-center justify-center gap-2 rounded-full border border-white/15 text-white font-medium text-sm hover:bg-white/[0.05] transition-all"
                                >
                                    <span>Developer Portal</span>
                                    <ArrowUpRight size={15}/>
                                </a>

                                <Link href="/install" onClick={() => setOpen(false)}>
                                    <button
                                        className="w-full h-12 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-all">
                                        Install Prismio
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default HeaderMain;
