import {DISCORD_INVITE_LINK} from "@prismio/utils";

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Prismio",
  url: "https://prismio.org",
  docsUrl: "https://docs.prismio.org",
  developersUrl: "https://developers.prismio.org",
  description: "Prismio is a self-hosted, statically typed systems language that compiles through LLVM, explains memory placement through AIF, and interoperates directly with C.",
  author: "Saksham Jaiswal",
  authorURL: "https://saksham1319.vercel.app",
  email: "saksham6975@gmail.com",
  github: "https://github.com/prismio-lang/prismio",
  githubOrg: "https://github.com/prismio-lang",
  releasesFeed: "https://github.com/prismio-lang/prismio/releases.atom",
  discord: DISCORD_INVITE_LINK,
};

/** Public, indexable pages of prismio.org. Redirected routes (/docs, /playground, /packages) are excluded. */
export const sitePages = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/install", priority: 0.9, changeFrequency: "monthly" },
  { path: "/benchmarks", priority: 0.8, changeFrequency: "weekly" },
  { path: "/roadmap", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/community", priority: 0.6, changeFrequency: "monthly" },
  { path: "/sponsors", priority: 0.5, changeFrequency: "monthly" },
  { path: "/team", priority: 0.5, changeFrequency: "monthly" },
  { path: "/team/saksham-jaiswal", priority: 0.4, changeFrequency: "monthly" },
] as const;
