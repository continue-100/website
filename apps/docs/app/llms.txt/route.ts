import {docs} from "@/libs/velite";
import {docsConfig} from "@/config/docs";
import {generateLlmsTxt} from "@prismio/docs-core";

export const dynamic = "force-static";

export function GET() {
    const {site} = docsConfig;
    return generateLlmsTxt(docs, site, {
        summary: `Canonical reference for Prismio ${site.currentVersion}, derived from the self-hosted compiler and regression suite. Pages marked Planned describe unimplemented roadmap features and must not be presented as accepted syntax.`,
        curatedLinks: [
            {title: "Release baseline", href: `${site.siteUrl}/releases/0.1.0`},
            {title: "Formal specification", href: `${site.siteUrl}/specification`},
            {title: "Error index", href: `${site.siteUrl}/errors`},
        ],
    });
}
