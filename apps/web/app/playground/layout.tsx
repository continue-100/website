import type {Metadata} from "next";
import type {ReactNode} from "react";

export const metadata: Metadata = {
    title: "Prismio Playground — Run Systems Code in the Browser",
    description:
        "Try Prismio systems programming examples, inspect AIF storage placement, and explore compiler output in the browser.",
    alternates: {canonical: "/playground"},
};

export default function PlaygroundLayout({children}: Readonly<{children: ReactNode}>) {
    return children;
}
