import {siteConfig} from "@/config/site";

export const dynamic = "force-static";

export function GET() {
    const body = `# AI crawler policy for ${siteConfig.url}
# Prismio is open source; indexing, retrieval and citation are welcome.

User-Agent: *
Allow: /
Disallow: /api/

# Machine-readable entry points
Summary: ${siteConfig.url}/ai/summary.json
FAQ: ${siteConfig.url}/ai/faq.json
LLMs: ${siteConfig.url}/llms.txt
Sitemap: ${siteConfig.url}/sitemap.xml
Contact: ${siteConfig.email}
`;

    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
}
