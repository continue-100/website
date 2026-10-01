import type {MetadataRoute} from "next";
import {siteConfig} from "@/config/site";

const AI_CRAWLERS = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-User",
    "Claude-SearchBot",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
    "Applebot-Extended",
    "CCBot",
];

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {userAgent: "*", allow: "/", disallow: "/api/"},
            {userAgent: AI_CRAWLERS, allow: "/", disallow: "/api/"},
        ],
        sitemap: `${siteConfig.url}/sitemap.xml`,
        host: siteConfig.url,
    };
}
