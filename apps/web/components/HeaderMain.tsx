"use client";

import React, {useState, useEffect} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {ArrowUpRight, Terminal} from "lucide-react";
import {Cross as Hamburger} from "hamburger-react";
import {AnimatePresence, motion} from "framer-motion";
import {Chip} from "@heroui/react";
import Logo from "@prismio/ui/Logo";
import Image from "next/image";
import {PRISMIO_VERSION} from "@prismio/utils";

interface NavItem {
    label: string;
    href: string;
    isExternal?: boolean;
}

const GITHUB_URL = "https://github.com/prismio-lang/prismio";

const NAV_LINKS: NavItem[] = [
    {label: "Docs", href: "https://docs.prismio.org", isExternal: true},
    {label: "Benchmarks", href: "/benchmarks"},
    {label: "Roadmap", href: "/roadmap"},
    {label: "About", href: "/about"},
    {label: "Community", href: "/community"},
    {label: "Developers", href: "https://developers.prismio.org", isExternal: true},
];

const INSTALL_BUTTON =
    "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-200";

const HeaderMain: React.FC = () => {

    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Close the mobile menu on navigation.
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    // While the mobile menu is open: lock page scroll and close on Escape.
    useEffect(() => {
        if (!isOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen]);

    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

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


                    <nav aria-label="Main"
                         className="hidden md:flex flex-1 items-center justify-center gap-6 lg:gap-8 xl:gap-10">
                        {NAV_LINKS.map(({label, href, isExternal}) => {
                            const base = "text-base font-medium transition-colors flex items-center gap-1";

                            if (isExternal) {
                                return (
                                    <a
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${base} text-gray-400 hover:text-white`}>
                                        {label}
                                        <ArrowUpRight size={11} className="opacity-50"/>
                                    </a>
                                );
                            }

                            const active = isActive(href);
                            return (
                                <Link
                                    key={label}
                                    href={href}
                                    aria-current={active ? "page" : undefined}
                                    className={`${base} ${active ? "text-white" : "text-gray-400 hover:text-white"}`}>
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right: Actions */}

                    <div className="hidden md:flex items-center gap-3">

                        <a
                            href={GITHUB_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/[0.05] transition-all"
                            aria-label="Prismio on GitHub">

                            <Image src={"/icons/github-mark-white.svg"} alt={""} height={24} width={24}/>
                        </a>

                        <Link href="/install" className={INSTALL_BUTTON}>
                            <Terminal size={14}/>
                            Install
                        </Link>
                    </div>

                    {/* MOBILE HAMBURGER */}
                    <div className="ml-auto md:hidden z-[90]">
                        <Hamburger
                            toggled={isOpen}
                            toggle={setOpen}
                            size={22}
                            label={isOpen ? "Close menu" : "Open menu"}
                        />
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
                        <nav aria-label="Mobile" className="flex flex-col pb-12">
                            {/* Nav links */}
                            <div className="flex flex-col gap-1">
                                {NAV_LINKS.map(({label, href, isExternal}) => (
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
                                            aria-current={isActive(href) ? "page" : undefined}
                                            onClick={() => setOpen(false)}
                                            className={`flex items-center justify-between py-3.5 border-b border-white/[0.06] text-base font-medium transition-colors ${
                                                isActive(href) ? "text-white" : "text-gray-300 hover:text-white"
                                            }`}
                                        >
                                            <span>{label}</span>
                                        </Link>
                                    )
                                ))}

                                <a
                                    href={GITHUB_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center justify-between py-3.5 border-b border-white/[0.06] text-base font-medium text-gray-300 hover:text-white transition-colors"
                                >
                                    <span className="flex items-center gap-2.5">
                                        <Image src={"/icons/github-mark-white.svg"} alt={""} height={18} width={18}/>
                                        GitHub
                                    </span>
                                    <ArrowUpRight size={15} className="opacity-50"/>
                                </a>
                            </div>

                            {/* Primary action */}
                            <div className="pt-8">
                                <Link
                                    href="/install"
                                    onClick={() => setOpen(false)}
                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-black transition-colors hover:bg-gray-200"
                                >
                                    <Terminal size={15}/>
                                    Install
                                </Link>
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default HeaderMain;
