import { NextResponse } from 'next/server';

export const revalidate = 3600; // Cache on server/CDN for 1 hour

export interface JetBrainsPluginInfo {
    name: string;
    downloads: number;
    version: string;
    rating: number;
    pricingModel: string;
    marketplaceUrl: string;
    githubUrl: string;
}

const FALLBACK_DATA: JetBrainsPluginInfo = {
    name: 'Prismio Language Support',
    downloads: 17,
    version: '1.0.0',
    rating: 5,
    pricingModel: 'FREE',
    marketplaceUrl: 'https://plugins.jetbrains.com/plugin/32192-prismio-language-support',
    githubUrl: 'https://github.com/prismio-lang/intellij-plugin',
};

export async function GET() {
    try {
        const [pluginRes, updatesRes] = await Promise.all([
            fetch('https://plugins.jetbrains.com/api/plugins/32192', {
                next: { revalidate: 3600 },
                headers: { Accept: 'application/json' },
            }),
            fetch('https://plugins.jetbrains.com/api/plugins/32192/updates', {
                next: { revalidate: 3600 },
                headers: { Accept: 'application/json' },
            }),
        ]);

        if (!pluginRes.ok) {
            return NextResponse.json(FALLBACK_DATA);
        }

        const pluginData = await pluginRes.json();
        let version = '1.0.0';

        if (updatesRes.ok) {
            const updatesData = await updatesRes.json();
            if (Array.isArray(updatesData) && updatesData.length > 0 && updatesData[0]?.version) {
                version = updatesData[0].version;
            }
        }

        const result: JetBrainsPluginInfo = {
            name: pluginData.name || FALLBACK_DATA.name,
            downloads: typeof pluginData.downloads === 'number' ? pluginData.downloads : FALLBACK_DATA.downloads,
            version,
            rating: typeof pluginData.rating === 'number' ? pluginData.rating : FALLBACK_DATA.rating,
            pricingModel: pluginData.pricingModel || 'FREE',
            marketplaceUrl: FALLBACK_DATA.marketplaceUrl,
            githubUrl: pluginData.urls?.sourceCodeUrl || FALLBACK_DATA.githubUrl,
        };

        return NextResponse.json(result);
    } catch {
        return NextResponse.json(FALLBACK_DATA);
    }
}
