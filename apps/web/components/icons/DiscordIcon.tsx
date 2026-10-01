import React from "react";
import Image from "next/image";

/** Discord logo from the local /icons/discord.svg (black source, inverted to white for dark buttons). */
export default function DiscordIcon({size = 16, className = ""}: {size?: number; className?: string}) {
    return (
        <Image
            src="/icons/discord.svg"
            alt=""
            aria-hidden
            width={size}
            height={size}
            className={`invert ${className}`.trim()}
        />
    );
}
