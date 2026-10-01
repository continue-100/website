import {NextResponse} from 'next/server';

export const revalidate = 3600; // Cache on server/CDN for 1 hour

const PLUGIN_ID = 34672;

export interface JetBrainsPluginInfo {
    id: number;
    name: string;
    /** Whether JetBrains has approved the plugin, so it can be found and installed from the Marketplace. */
    approved: boolean;
    /** Latest published version, or null while nothing has been published. */
    version: string | null;
    downloads: number | null;
    marketplaceUrl: string;
    githubUrl: string;
}

// What is returned when the Marketplace cannot be reached. It claims nothing: no version, no downloads.
const UNKNOWN: JetBrainsPluginInfo = {
    id: PLUGIN_ID,
    name: 'Prismio',
    approved: false,
    version: null,
    downloads: null,
    marketplaceUrl: `https://plugins.jetbrains.com/plugin/${PLUGIN_ID}-prismio`,
    githubUrl: 'https://github.com/prismio-lang/intellij-plugin',
};

export async function GET() {
    try {
        const options = {next: {revalidate: 3600}, headers: {Accept: 'application/json'}};
        const [pluginRes, updatesRes] = await Promise.all([
            fetch(`https://plugins.jetbrains.com/api/plugins/${PLUGIN_ID}`, options),
            fetch(`https://plugins.jetbrains.com/api/plugins/${PLUGIN_ID}/updates`, options),
        ]);

        if (!pluginRes.ok) return NextResponse.json(UNKNOWN);
        const plugin = await pluginRes.json();

        let version: string | null = null;
        if (updatesRes.ok) {
            const updates = await updatesRes.json();
            if (Array.isArray(updates) && typeof updates[0]?.version === 'string') version = updates[0].version;
        }

        const result: JetBrainsPluginInfo = {
            id: PLUGIN_ID,
            name: typeof plugin.name === 'string' ? plugin.name : UNKNOWN.name,
            // Approved and with at least one published version: only then is it installable.
            approved: Boolean(plugin.approve) && version !== null,
            version,
            downloads: typeof plugin.downloads === 'number' ? plugin.downloads : null,
            marketplaceUrl: UNKNOWN.marketplaceUrl,
            githubUrl: plugin.urls?.sourceCodeUrl || UNKNOWN.githubUrl,
        };

        return NextResponse.json(result);
    } catch {
        return NextResponse.json(UNKNOWN);
    }
}
