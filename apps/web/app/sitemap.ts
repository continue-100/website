import type {MetadataRoute} from "next";
import {siteConfig, sitePages} from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();
    return sitePages.map(({path, priority, changeFrequency}) => ({
        url: path === "/" ? siteConfig.url : `${siteConfig.url}${path}`,
        lastModified,
        changeFrequency,
        priority,
    }));
}
