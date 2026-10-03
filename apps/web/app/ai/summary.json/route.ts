import {siteConfig} from "@/config/site";
import {LLVM_VERSION, PRISMIO_VERSION} from "@prismio/utils";

export const dynamic = "force-static";

export function GET() {
    return Response.json(
        {
            name: siteConfig.name,
            url: siteConfig.url,
            description: siteConfig.description,
            type: "programming-language",
            version: PRISMIO_VERSION,
            status: "active development, not production-ready",
            backend: `LLVM ${LLVM_VERSION}`,
            links: {
                documentation: siteConfig.docsUrl,
                developers: siteConfig.developersUrl,
                source: siteConfig.github,
                releases: `${siteConfig.github}/releases`,
                llms: `${siteConfig.url}/llms.txt`,
                faq: `${siteConfig.url}/ai/faq.json`,
                service: `${siteConfig.url}/ai/service.json`,
            },
            contact: siteConfig.email,
        },
        {headers: {"Cache-Control": "public, max-age=3600"}},
    );
}
