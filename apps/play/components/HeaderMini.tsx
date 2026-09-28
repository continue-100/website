"use client";

import React, {useState, useEffect} from "react";
import Link from "next/link";
import {ArrowUpRight, Terminal} from "lucide-react";
import {Cross as Hamburger} from "hamburger-react";
import {AnimatePresence, motion} from "framer-motion";
import {Button} from "@heroui/react";
import Logo from "@prismio/ui/Logo";
import Image from "next/image";

const HeaderMini: React.FC = () => {

    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <>
            <header
                className={`
                sticky top-0 z-[80] transition-all duration-300
                ${
                    scrolled
                        ? "bg-[#070709]/80 backdrop-blur-xl border-b border-white/[0.08] shadow-xs"
                        : "bg-transparent border-b border-transparent"
                }`}>

                <div className="relative px-5 md:px-10 h-17 flex items-center">

                    <div className="flex items-center gap-2 shrink-0">
                        <Logo className="[&>span]:!text-white"/>
                        <span className="font-bold text-xl text-[#47d7b5]">Play</span>
                    </div>

                    <nav className="hidden md:flex flex-1 items-center justify-center gap-6 lg:gap-8 xl:gap-10">

                    </nav>

                    {/* Right: Actions */}

                    <div className="hidden md:flex items-center gap-3">

                        <Link
                            href="https://github.com/prismio-lang/prismio"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
                            aria-label="GitHub Repository">

                            <Image src={"/icons/github-mark-white.svg"} alt={"Github Repository"} height={24} width={24}/>
                        </Link>

                        <Link
                            href="https://developers.prismio.org"
                            target="_blank"
                            rel="noopener noreferrer">
                            <Button className={"h-10 px-6 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white font-medium text-sm transition-colors flex items-center gap-1.5"}>
                                <span>Developers</span>
                                <ArrowUpRight size={11} className="opacity-50"/>
                            </Button>
                        </Link>

                        <div className="ml-auto hidden md:flex items-center gap-3">

                            <Link href="https://prismio.org/install">
                                <Button
                                    variant="tertiary"
                                    className="h-10 px-6 rounded-full text-zinc-950 bg-white hover:bg-zinc-200 font-medium text-sm transition-colors flex items-center gap-1.5">
                                    <Terminal size={14}/>
                                    Install
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* MOBILE HAMBURGER */}
                    <div className="ml-auto md:hidden z-[90]">
                        <Hamburger toggled={isOpen} toggle={setOpen} size={22} color="#f4f4f5"/>
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
                             </div>

                            {/* Mobile Dual Developer CTAs */}
                            <div className="pt-8 flex flex-col gap-3">
                                <a
                                    href="https://developers.prismio.org"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setOpen(false)}
                                    className="w-full h-12 flex items-center justify-center gap-2 rounded-full border border-white/15 text-zinc-200 font-medium text-sm hover:bg-white/[0.06] transition-all"
                                >
                                    <span>Developer Portal</span>
                                    <ArrowUpRight size={15}/>
                                </a>

                                <Link href="https://prismio.org/install" onClick={() => setOpen(false)}>
                                    <button
                                        className="w-full h-12 rounded-full bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-all">
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

export default HeaderMini;
