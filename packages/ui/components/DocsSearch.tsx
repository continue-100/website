"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import defaultEmitter from "../lib/emitter";
import { Kbd } from "@heroui/react/kbd";

export interface DocsSearchProps {
    /**
     * Event emitter to trigger the search modal.
     * Calls emitter.emit("openSearchModal") on click.
     */
    emitter?: {
        emit: (event: "openSearchModal" | string, ...args: unknown[]) => void;
    };
    /**
     * Custom click callback. If provided, overrides the default emitter action.
     */
    onClick?: () => void;
    /**
     * Placeholder text displayed on the button.
     * @default "Search concepts, errors, and examples"
     */
    placeholder?: string;
    /**
     * Optional additional CSS classes.
     */
    className?: string;
}

export default function DocsSearch({
    emitter,
    onClick,
    placeholder = "Search concepts, errors, and examples",
    className = "",
}: DocsSearchProps = {}) {
    const [isMac, setIsMac] = useState(true);

    useEffect(() => {
        if (typeof navigator !== "undefined") {
            setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
        }
    }, []);

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (emitter) {
            emitter.emit("openSearchModal");
        } else {
            defaultEmitter.emit("openSearchModal");
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label={placeholder}
            aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
            className={`group relative mx-auto hidden h-9 w-full max-w-md items-center gap-2.5 rounded-lg border border-zinc-200/80 bg-zinc-50/70 px-3 text-left text-sm text-zinc-500 backdrop-blur-xs transition-all duration-150 hover:border-zinc-300 hover:bg-zinc-100/80 hover:text-zinc-800 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 lg:flex dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 dark:focus-visible:ring-zinc-600 ${className}`}
        >
            <Search
                aria-hidden="true"
                size={15}
                className="shrink-0 text-zinc-400 transition-colors duration-150 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
            />
            <span className="min-w-0 flex-1 truncate text-xs sm:text-sm font-normal text-zinc-500 transition-colors duration-150 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200">
                {placeholder}
            </span>
            <div className="ml-auto flex items-center gap-1 select-none">
                <Kbd className="text-zinc-600 dark:text-zinc-300">
                    <Kbd.Abbr keyValue={isMac ? "command" : "ctrl"} />
                    <Kbd.Content>K</Kbd.Content>
                </Kbd>
            </div>
        </button>
    );
}