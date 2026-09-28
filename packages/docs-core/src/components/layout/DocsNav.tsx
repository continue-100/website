"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { DocNavNode, DocsSection } from "../../types";
import { activeBranch, keyFor } from "../../navigation";

export interface DocsNavProps {
    navList: DocsSection[];
    className?: string;
    onItemClick?: () => void;
}

export function DocsNav({ navList, className, onItemClick }: DocsNavProps) {
    const pathname = usePathname();
    const activeLinkRef = useRef<HTMLAnchorElement>(null);
    const pathBranch = useMemo(() => activeBranch(navList, pathname), [navList, pathname]);

    const defaultOpen = useMemo(() => {
        if (pathBranch.length) return pathBranch;
        return navList[0] ? [navList[0].label] : [];
    }, [navList, pathBranch]);

    const [openKeys, setOpenKeys] = useState<string[]>(defaultOpen);

    useEffect(() => {
        if (!pathBranch.length) return;
        const frame = requestAnimationFrame(() => {
            setOpenKeys((current) => Array.from(new Set([...current, ...pathBranch])));
        });
        return () => cancelAnimationFrame(frame);
    }, [pathBranch]);

    useEffect(() => {
        if (activeLinkRef.current) {
            activeLinkRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }, [pathname]);

    const toggle = (key: string) => {
        setOpenKeys((current) =>
            current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
        );
    };

    const renderNodes = (nodes: DocNavNode[], parents: string[], depth: number) => (
        <ul className={depth === 0 ? "space-y-0.5" : "mt-1 space-y-0.5"}>
            {nodes.map((node, index) => {
                const labels = [...parents, node.label];
                const key = keyFor(labels);
                const isOpen = openKeys.includes(key);
                const isActive = node.href === pathname;
                const hasChildren = Boolean(node.items?.length);
                const controlId = `nav-${key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`;

                return (
                    <li key={`${key}-${node.href ?? index}`}>
                        {hasChildren ? (
                            <>
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    aria-controls={controlId}
                                    onClick={() => toggle(key)}
                                    className={`group flex w-full items-center gap-2 rounded-lg text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                                        depth === 0
                                            ? "min-h-9 px-2.5 text-[0.8125rem] font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white"
                                            : "min-h-8 px-2.5 text-[0.8125rem] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white"
                                    }`}
                                >
                                    <ChevronRight
                                        aria-hidden="true"
                                        size={13}
                                        className={`shrink-0 transition-transform duration-150 ${
                                            isOpen ? "rotate-90" : ""
                                        }`}
                                    />
                                    <span>{node.label}</span>
                                </button>
                                {isOpen && (
                                    <div
                                        id={controlId}
                                        className="ml-3 mt-1 border-l border-zinc-200/80 py-1 pl-2 dark:border-zinc-800"
                                    >
                                        {renderNodes(node.items ?? [], labels, depth + 1)}
                                    </div>
                                )}
                            </>
                        ) : node.href ? (
                            <Link
                                ref={isActive ? activeLinkRef : undefined}
                                href={node.href}
                                onClick={onItemClick}
                                aria-current={isActive ? "page" : undefined}
                                className={`block rounded-md px-2.5 py-1.5 text-[0.8125rem] font-medium leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                                    isActive
                                        ? "bg-violet-50 font-semibold text-violet-800 dark:bg-violet-500/15 dark:text-violet-100"
                                        : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white"
                                }`}
                            >
                                {node.label}
                            </Link>
                        ) : null}
                    </li>
                );
            })}
        </ul>
    );

    return (
        <nav aria-label="Documentation sections" className={`no-scrollbar ${className ?? ""}`.trim()}>
            {renderNodes(navList, [], 0)}
        </nav>
    );
}

export default DocsNav;
