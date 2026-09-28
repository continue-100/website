import React from "react";
import type { Viewport } from "next";
import type { DocRecord, DocsAppConfig } from "../../types";
import { ThemeProvider } from "../theme/ThemeProvider";
import { DocsHeader } from "./DocsHeader";
import { DocsNav } from "./DocsNav";
import { DocsSearchModal } from "../search/SearchModal";

export const docsViewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    colorScheme: "light dark",
};

export const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)||!t){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})()`;

export interface DocsLayoutProps {
    config: DocsAppConfig;
    docs: DocRecord[];
    children: React.ReactNode;
}

export function DocsLayout({ config, docs, children }: DocsLayoutProps) {
    return (
        <ThemeProvider>
            <a
                href="#main-content"
                className="sr-only z-[120] rounded-md bg-white px-4 py-2 text-zinc-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
            >
                Skip to content
            </a>
            <DocsHeader
                siteConfig={config.site}
                navList={config.navigation}
                brandTag={config.brandTag}
                accentColor={config.accentColor}
                showInstall={config.showInstall}
                installUrl={config.installUrl}
            />
            <DocsSearchModal docs={docs} config={config.search} />

            <div className="relative flex min-h-[calc(100vh-4rem)]">
                <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-1/6 shrink-0 overflow-y-auto no-scrollbar border-r border-zinc-200 px-3 py-5 lg:block dark:border-zinc-800/80">
                    <DocsNav navList={config.navigation} className="w-full pb-12" />
                </aside>
                <main id="main-content" className="min-w-0 flex-1 px-5 pb-20 pt-8 sm:px-8 lg:px-8">
                    {children}
                </main>
            </div>
        </ThemeProvider>
    );
}

export function DocsRootLayout({ config, docs, children }: DocsLayoutProps) {
    return (
        <html lang="en" className="scroll-pt-20" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
            </head>
            <body className="font-sans font-[450] antialiased">
                <DocsLayout config={config} docs={docs}>
                    {children}
                </DocsLayout>
            </body>
        </html>
    );
}

export default DocsLayout;
