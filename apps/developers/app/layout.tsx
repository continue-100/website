import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import { docsConfig } from "@/config/docs";
import { docs } from "@/libs/velite";
import {
    DocsRootLayout,
    docsViewport,
    generateDocsRootMetadata,
} from "@prismio/docs-core";

export const metadata: Metadata = generateDocsRootMetadata(docsConfig.site);
export const viewport: Viewport = docsViewport;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <DocsRootLayout config={docsConfig} docs={docs}>
            {children}
        </DocsRootLayout>
    );
}
