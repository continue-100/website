import {faqItems} from "@/config/faq";
import {siteConfig} from "@/config/site";

export const dynamic = "force-static";

export function GET() {
    return Response.json(
        {
            site: siteConfig.url,
            source: `${siteConfig.docsUrl}/faq`,
            faqs: faqItems,
        },
        {headers: {"Cache-Control": "public, max-age=3600"}},
    );
}
