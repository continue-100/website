import type {Metadata} from "next";
import type {ReactNode} from "react";

export const metadata: Metadata = {
    title: "Prismio Packages — Libraries and Tooling",
    description:
        "Explore the Prismio package ecosystem, libraries, and compiler tooling.",
    alternates: {canonical: "/packages"},
};

export default function PackagesLayout({children}: Readonly<{children: ReactNode}>) {
    return children;
}
