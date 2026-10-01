import React from "react";
import Image from "next/image";

/** GitHub mark from the local /icons/github-mark-white.svg (already white, for dark surfaces). */
export default function GithubIcon({size = 16, className = ""}: {size?: number; className?: string}) {
    return (
        <Image
            src="/icons/github-mark-white.svg"
            alt=""
            aria-hidden
            width={size}
            height={size}
            className={`object-contain ${className}`.trim()}
        />
    );
}
