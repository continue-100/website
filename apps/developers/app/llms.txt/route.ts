import { docs } from "@/libs/velite";
import { docsConfig } from "@/config/docs";
import { generateLlmsTxt } from "@prismio/docs-core";

export const dynamic = "force-static";

export function GET() {
    const { site } = docsConfig;
    return generateLlmsTxt(docs, site, {
        summary: `Source-linked implementation documentation for Prismio ${site.currentVersion}, derived from the self-hosted compiler, runtime, UMS, tests, and benchmark evidence. Experimental pages describe implemented but changeable policy; unsupported capabilities are not accepted compiler behavior.`,
        curatedLinks: [
            { title: "Contributor entry", href: `${site.siteUrl}/start` },
            { title: "Compiler architecture", href: `${site.siteUrl}/compiler/overview` },
            { title: "AIF internals", href: `${site.siteUrl}/compiler/aif-internals` },
            { title: "LLVM backend", href: `${site.siteUrl}/llvm/overview` },
            { title: "Release baseline", href: `${site.siteUrl}/releases/0.1.0` },
        ],
    });
}
