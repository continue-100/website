export type DocStatus = "stable" | "experimental" | "planned";

export interface DocRecord {
    title: string;
    description: string;
    status: DocStatus;
    draft?: boolean;
    version: string;
    lastUpdated: string;
    tags: string[];
    related: string[];
    slug: string;
    raw: string;
    code: string;
}

export interface DocNavNode {
    label: string;
    href?: string;
    items?: DocNavNode[];
}

export interface DocsSection {
    label: string;
    items: DocNavNode[];
}

export interface Heading {
    level: number;
    text: string;
    id: string;
}

export interface DocsSiteConfig {
    name: string;
    shortName: string;
    description: string;
    currentVersion: string;
    author: string;
    authorURL: string;
    email: string;
    siteUrl: string;
    links: {
        github: string;
        twitter?: string;
    };
}

export interface DocsSearchConfig {
    placeholder?: string;
    emptyPrompt?: string;
    categories: Record<string, string>;
}

export interface DocsStatusFact {
    status: "Stable" | "Experimental" | "Planned";
    detail: string;
}

export interface DocsHomeCard {
    href: string;
    label: string;
    detail: string;
}

export interface DocsHomeConfig {
    badge?: {
        versionText: string;
        tagline: string;
    };
    hero: {
        title: string;
        description: string;
        primaryCta: { text: string; href: string };
        secondaryCta?: { text: string; href: string };
    };
    statusFacts: DocsStatusFact[];
    foundations: {
        sectionLabel: string;
        title: string;
        description: string;
        items: DocsHomeCard[];
    };
    reference: {
        sectionLabel: string;
        title: string;
        items: DocsHomeCard[];
    };
    footer: {
        tagline: string;
        links?: Array<{ href: string; label: string }>;
    };
}

export interface DocsAppConfig {
    site: DocsSiteConfig;
    navigation: DocsSection[];
    search: DocsSearchConfig;
    home: DocsHomeConfig;
    accentColor?: "violet" | "purple" | "gray";
    brandTag?: string;
    installUrl?: string;
    showInstall?: boolean;
}
