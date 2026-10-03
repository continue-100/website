import {siteConfig} from "@/config/site";
import {PRISMIO_VERSION} from "@prismio/utils";

export const dynamic = "force-static";

export function GET() {
    const body = `# Prismio

> ${siteConfig.description}

Prismio ${PRISMIO_VERSION} is the first release, published 2026-10-02, and is pre-1.0: the language and library can still change incompatibly, and it is not production-ready. Install it with: curl -fsSL https://prismio.org/install.sh | sh (macOS and Linux) or from a release archive on GitHub. Pages marked Coming Soon in the documentation describe unimplemented features and must not be presented as accepted syntax.

## Start here

- [Install](${siteConfig.url}/install): Install the compiler with a one-line script or build from source
- [About](${siteConfig.url}/about): Architecture, AIF, LLVM backend, concurrency model and C interoperability
- [Roadmap](${siteConfig.url}/roadmap): What is implemented and what is not yet
- [Benchmarks](${siteConfig.url}/benchmarks): Measured toolchain and runtime results with methodology

## Documentation

- [Documentation](${siteConfig.docsUrl}): Language reference, guides, cookbook and error index
- [Documentation index for LLMs](${siteConfig.docsUrl}/llms.txt): Page-by-page index of the documentation
- [Full documentation corpus](${siteConfig.docsUrl}/llms-full.txt): Entire documentation as Markdown
- [Developer docs](${siteConfig.developersUrl}): Compiler internals, runtime and tooling
- [Developer docs index for LLMs](${siteConfig.developersUrl}/llms.txt)

## Project

- [Source code](${siteConfig.github}): Compiler, standard library and benchmarks
- [Releases](${siteConfig.github}/releases): Release notes and downloads
- [Community](${siteConfig.url}/community): Discord, issues and contribution guide
- [Team](${siteConfig.url}/team): Creator and maintainers

## Optional

- [Machine-readable summary](${siteConfig.url}/ai/summary.json)
- [Machine-readable service description](${siteConfig.url}/ai/service.json)
- [FAQ as JSON](${siteConfig.url}/ai/faq.json)
`;

    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
}
