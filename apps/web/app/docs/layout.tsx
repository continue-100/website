import type {Metadata} from "next";
import type {ReactNode} from "react";

export const metadata: Metadata = {
    title: "Prismio Documentation — Language, Compiler, and Toolchain Guides",
    description:
        "Prismio language, compiler, LLVM backend, AIF, ownership, and toolchain documentation.",
    alternates: {canonical: "/docs"},
};

export default function DocsLayout({children}: Readonly<{children: ReactNode}>) {
    return children;
}
