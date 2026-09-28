"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeSwitch() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Use light theme" : "Use dark theme"}
            title={isDark ? "Use light theme" : "Use dark theme"}
            className="inline-flex size-9 items-center justify-center rounded-full text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
        >
            {isDark ? (
                <Sun aria-hidden="true" size={18} className="transition-transform duration-200 hover:rotate-45" />
            ) : (
                <Moon aria-hidden="true" size={18} className="transition-transform duration-200 hover:-rotate-12" />
            )}
        </button>
    );
}

export default ThemeSwitch;
