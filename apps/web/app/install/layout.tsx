import type {Metadata} from "next";
import type {ReactNode} from "react";

export const metadata: Metadata = {
    title: "Install Prismio — Native Systems Language Toolchain",
    description:
        "Install the Prismio native systems programming language toolchain on macOS, Linux, or Windows, or build the compiler from source.",
    alternates: {canonical: "/install"},
};

export default function InstallLayout({children}: Readonly<{children: ReactNode}>) {
    return children;
}
