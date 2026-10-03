import { docs } from "@/libs/velite";
import { docsConfig } from "@/config/docs";
import { generateLlmsFullTxt } from "@prismio/docs-core";

export const dynamic = "force-static";

export function GET() {
    return generateLlmsFullTxt(
        docs,
        docsConfig.site,
        "full documentation corpus\n\nThis Markdown-first export is generated from the same content records as docs.prismio.org. “experimental” means implemented but changeable; “planned” means the feature is not accepted by compiler 0.1.0."
    );
}
