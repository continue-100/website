import {siteConfig} from "@/config/site";
import {LLVM_VERSION, PRISMIO_VERSION} from "@prismio/utils";

export const dynamic = "force-static";

export function GET() {
    return Response.json(
        {
            name: siteConfig.name,
            url: siteConfig.url,
            type: "programming-language",
            description: siteConfig.description,
            version: PRISMIO_VERSION,
            status: "active development, not production-ready",
            capabilities: [
                "Statically typed systems programming",
                "Native machine-code compilation through LLVM",
                "Adaptive Inference Framework (AIF) memory-placement analysis",
                "Direct C interoperability",
                "Self-hosted compiler and toolchain",
            ],
            backend: {
                name: "LLVM",
                version: LLVM_VERSION,
            },
            links: {
                install: `${siteConfig.url}/install`,
                documentation: siteConfig.docsUrl,
                developers: siteConfig.developersUrl,
                playground: `${siteConfig.url}/playground`,
                source: siteConfig.github,
                releases: `${siteConfig.github}/releases`,
                llms: `${siteConfig.url}/llms.txt`,
                summary: `${siteConfig.url}/ai/summary.json`,
                faq: `${siteConfig.url}/ai/faq.json`,
            },
            limitations: [
                "Version 0.1 is pre-1.0 and language, library, AIF, and ABI contracts may change incompatibly.",
                "The compiler is not production-ready.",
                "Documentation pages marked Coming Soon describe unimplemented features.",
            ],
            contact: siteConfig.email,
        },
        {headers: {"Cache-Control": "public, max-age=3600"}},
    );
}
