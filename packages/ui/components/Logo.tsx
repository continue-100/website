import Link from "next/link";
import Image from "next/image";
import React from "react";

export interface LogoProps {
    href?: string;
    label?: string;
    className?: string;
}

export default function Logo({ href = "/", label = "Prismio", className }: LogoProps = {}) {
    return (
        <Link href={href} className={`flex items-center gap-2.5 ${className ?? ""}`}>
            <div className="w-8 h-8 flex items-center justify-center">
                <Image src="/icons/prismio.png" alt="Prismio logo" width={32} height={32}/>
            </div>
            <span className="font-semibold text-xl text-zinc-900 dark:text-white">{label}</span>
        </Link>
    );
}