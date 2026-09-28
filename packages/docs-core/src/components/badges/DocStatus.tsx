import type { DocStatus } from "../../types";

interface StatusConfig {
    label: string;
    summary: string;
    colors: {
        eyebrowText: string;
        cardBg: string;
        borderLeft: string;
    };
}

const statusConfig: Record<DocStatus, StatusConfig> = {
    stable: {
        label: "Stable",
        summary: "Available in the audited Prismio v0.1.0 compiler.",
        colors: {
            eyebrowText: "text-emerald-700 dark:text-emerald-500",
            cardBg: "bg-emerald-50 dark:bg-emerald-500/10",
            borderLeft: "border-emerald-500 dark:border-emerald-400",
        },
    },
    experimental: {
        label: "Experimental",
        summary: "Present in Prismio v0.1.0, but its interface, syntax, or semantics may change substantially before v1.0.0 stabilization.",
        colors: {
            eyebrowText: "text-amber-700 dark:text-amber-500",
            cardBg: "bg-amber-50 dark:bg-amber-500/10",
            borderLeft: "border-amber-500 dark:border-amber-400",
        },
    },
    planned: {
        label: "Planned",
        summary: "Planned for a future release; not implemented in Prismio v0.1.0. Illustrative syntax on this page does not compile.",
        colors: {
            eyebrowText: "text-fuchsia-700 dark:text-fuchsia-500",
            cardBg: "bg-fuchsia-50 dark:bg-fuchsia-500/10",
            borderLeft: "border-fuchsia-500 dark:border-fuchsia-400",
        },
    },
};

const draftConfig: StatusConfig = {
    label: "Draft",
    summary: "Compiler-derived draft documentation that is not yet a frozen compatibility contract.",
    colors: {
        eyebrowText: "text-sky-700 dark:text-sky-500",
        cardBg: "bg-sky-50 dark:bg-sky-500/10",
        borderLeft: "border-sky-500 dark:border-sky-400",
    },
};

export function statusLabel(status: DocStatus) {
    return statusConfig[status]?.label ?? status;
}

export function DocStatusBadge({ status, draft }: { status: DocStatus; draft?: boolean }) {
    const config = draft ? draftConfig : statusConfig[status];
    if (!config) return null;

    if (status === "stable" && !draft) {
        return null;
    }

    return (
        <span className={`text-xs font-semibold uppercase tracking-wide ${config.colors.eyebrowText}`}>
            {config.label.toUpperCase()}
        </span>
    );
}

export function DocStatusNotice({ status, draft }: { status: DocStatus; draft?: boolean }) {
    const config = draft ? draftConfig : statusConfig[status];
    if (!config) return null;

    if (status === "stable" && !draft) {
        return null;
    }

    const { colors, label, summary } = config;

    return (
        <aside
            aria-label={`${label} notice`}
            className={`mt-6 rounded-r-lg border-l-[3px] py-4 px-5 text-sm leading-relaxed text-zinc-900 dark:text-zinc-200 ${colors.borderLeft} ${colors.cardBg}`}
        >
            <p>
                <strong className={`font-semibold ${colors.eyebrowText}`}>{label}:</strong> {summary}
            </p>
        </aside>
    );
}
