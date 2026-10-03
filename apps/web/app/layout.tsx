import type {Metadata} from "next";
import localFont from "next/font/local";
import "./globals.css";
import React from "react";
import {siteConfig} from "@/config/site";
import {JsonLd} from "@/components/json-ld";
import {prismioStructuredData} from "@/config/structured-data";

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});

const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

const kalam = localFont({
    src: [
        { path: "./fonts/Kalam-Light.ttf", weight: "300", style: "normal" },
        { path: "./fonts/Kalam-Regular.ttf", weight: "400", style: "normal" },
        { path: "./fonts/Kalam-Bold.ttf", weight: "700", style: "normal" },
    ],
    variable: "--font-kalam",
    display: "swap",
});

const instrumentSerif = localFont({
    src: [
        { path: "./fonts/InstrumentSerif-Regular.ttf", weight: "400", style: "normal" },
        { path: "./fonts/InstrumentSerif-Italic.ttf", weight: "400", style: "italic" },
    ],
    variable: "--font-serif",
    display: "swap",
});

const fraunces = localFont({
    src: "./fonts/Fraunces-Variable.ttf",
    variable: "--font-fraunces",
    display: "swap",
});

const syne = localFont({
    src: "./fonts/Syne-Bold.ttf",
    variable: "--font-syne",
    display: "swap",
});

const bricolage = localFont({
    src: "./fonts/BricolageGrotesque-Bold.ttf",
    variable: "--font-bricolage",
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.url),
    title: "Prismio — Systems Programming Language for Native Performance",
    description: siteConfig.description,
    applicationName: siteConfig.name,
    alternates: {
        canonical: "/",
        types: {
            "application/atom+xml": siteConfig.releasesFeed,
        },
    },
    openGraph: {
        type: "website",
        siteName: siteConfig.name,
        title: "Prismio — Systems Programming Language for Native Performance",
        description: siteConfig.description,
        locale: "en_US",
        images: [{url: "/icons/prismio-banner.png", width: 489, height: 121, alt: "Prismio logo and wordmark"}],
    },
    twitter: {
        card: "summary",
        title: siteConfig.name,
        description: siteConfig.description,
        images: ["/icons/prismio.png"],
    },
    robots: {index: true, follow: true},
    keywords: [
        "Prismio",
        "systems programming language",
        "native compiler",
        "LLVM compiler",
        "C interoperability",
        "memory placement",
        "Adaptive Inference Framework",
        "open source compiler",
    ],
    authors: [
        {
            name: siteConfig.author,
            url: siteConfig.authorURL,
        },
    ],
    creator: siteConfig.author,
    publisher: siteConfig.author
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" style={{colorScheme: "dark"}} suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} ${kalam.variable} ${instrumentSerif.variable} ${fraunces.variable} ${syne.variable} ${bricolage.variable} font-sans antialiased bg-[#070709] text-zinc-100 scrollbar-none`}>
        <JsonLd data={prismioStructuredData} />
                {children}
        </body>
        </html>
    );
}
