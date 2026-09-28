import type {ReactNode} from "react";

// The visual kit every developer-portal diagram shares: one palette, one
// specification frame, and the few SVG and inline primitives the figures draw
// with. Internal to the diagrams; not exported from the package.

// A rectangle path with independent corner radii: [top-left, top-right, bottom-right, bottom-left].
export function roundedRect(x: number, y: number, w: number, h: number, [tl, tr, br, bl]: [number, number, number, number]) {
    return [
        `M ${x + tl} ${y}`,
        `H ${x + w - tr}`,
        tr ? `Q ${x + w} ${y} ${x + w} ${y + tr}` : "",
        `V ${y + h - br}`,
        br ? `Q ${x + w} ${y + h} ${x + w - br} ${y + h}` : "",
        `H ${x + bl}`,
        bl ? `Q ${x} ${y + h} ${x} ${y + h - bl}` : "",
        `V ${y + tl}`,
        tl ? `Q ${x} ${y} ${x + tl} ${y}` : "",
        "Z",
    ].join(" ");
}

// One palette, hues at matched lightness and chroma, so no class of thing reads
// louder than the others. Light and dark values live side by side.
const palette = `
.psm-dg {
  --in-fill: oklch(0.965 0.028 168); --in-line: oklch(0.84 0.075 168); --in-ink: oklch(0.34 0.07 168); --in-acc: oklch(0.64 0.135 168);
  --ow-fill: oklch(0.965 0.022 240); --ow-line: oklch(0.84 0.06 240);  --ow-ink: oklch(0.34 0.08 248); --ow-acc: oklch(0.6 0.14 245);
  --vw-fill: oklch(0.965 0.026 295); --vw-line: oklch(0.84 0.075 295); --vw-ink: oklch(0.36 0.12 295); --vw-acc: oklch(0.57 0.19 295);
  --cp-fill: oklch(0.97 0.03 75);    --cp-line: oklch(0.86 0.08 75);   --cp-ink: oklch(0.42 0.1 58);   --cp-acc: oklch(0.72 0.15 68);
  --rs-fill: oklch(0.965 0.025 15);  --rs-line: oklch(0.85 0.07 15);   --rs-ink: oklch(0.4 0.12 20);   --rs-acc: oklch(0.62 0.18 20);
  --surface: oklch(1 0 0); --well: oklch(0.955 0.003 286); --rule: oklch(0.88 0.005 286);
  --text: oklch(0.24 0.01 286); --muted: oklch(0.52 0.012 286); --faint: oklch(0.7 0.01 286); --on-acc: oklch(1 0 0);
}
.dark .psm-dg {
  --in-fill: oklch(0.27 0.04 168); --in-line: oklch(0.43 0.07 168); --in-ink: oklch(0.93 0.045 168); --in-acc: oklch(0.78 0.13 168);
  --ow-fill: oklch(0.27 0.035 245); --ow-line: oklch(0.43 0.07 245); --ow-ink: oklch(0.93 0.035 240); --ow-acc: oklch(0.75 0.12 240);
  --vw-fill: oklch(0.28 0.05 295); --vw-line: oklch(0.45 0.1 295);  --vw-ink: oklch(0.93 0.045 295); --vw-acc: oklch(0.74 0.15 295);
  --cp-fill: oklch(0.29 0.04 70);  --cp-line: oklch(0.46 0.08 70);  --cp-ink: oklch(0.9 0.07 80);    --cp-acc: oklch(0.8 0.14 75);
  --rs-fill: oklch(0.28 0.045 15); --rs-line: oklch(0.46 0.09 15);  --rs-ink: oklch(0.92 0.05 15);   --rs-acc: oklch(0.75 0.15 18);
  --surface: oklch(0.225 0.005 286); --well: oklch(0.25 0.006 286); --rule: oklch(0.36 0.008 286);
  --text: oklch(0.94 0.004 286); --muted: oklch(0.7 0.01 286); --faint: oklch(0.52 0.01 286); --on-acc: oklch(0.2 0.01 286);
}`;

// in: green, ow: blue, vw: violet, cp: amber, rs: rose.
export type Tone = "in" | "ow" | "vw" | "cp" | "rs";

export const hue = (t: Tone) => ({
    fill: `var(--${t}-fill)`,
    line: `var(--${t}-line)`,
    ink: `var(--${t}-ink)`,
    acc: `var(--${t}-acc)`,
});

export const ink = {
    surface: "var(--surface)",
    well: "var(--well)",
    rule: "var(--rule)",
    text: "var(--text)",
    muted: "var(--muted)",
    faint: "var(--faint)",
    onAcc: "var(--on-acc)",
};

export const sans = "var(--font-ui, Inter, ui-sans-serif, system-ui, sans-serif)";
export const mono = "var(--font-code, ui-monospace, SFMono-Regular, Menlo, monospace)";

// JetBrains Mono turns `==` and `->` into ligatures; code on these pages is read
// character by character.
export const noLigatures = '"calt" 0, "liga" 0';

export const canvas = "color-mix(in oklch, var(--well) 55%, var(--surface))";

export function Label({
                          x,
                          y,
                          children,
                          size = 11,
                          weight = 400,
                          color = ink.muted,
                          anchor = "start",
                          family = sans,
                      }: {
    x: number;
    y: number;
    children: ReactNode;
    size?: number;
    weight?: number;
    color?: string;
    anchor?: "start" | "middle" | "end";
    family?: string;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anchor}
            style={{
                fill: color,
                fontSize: size,
                fontWeight: weight,
                fontFamily: family,
                fontVariantNumeric: "tabular-nums",
                fontFeatureSettings: family === mono ? noLigatures : undefined,
            }}
        >
            {children}
        </text>
    );
}

export function Outline({x, y, w, h, r = 9, color, width = 1, dashed = false}: {
    x: number;
    y: number;
    w: number;
    h: number;
    r?: number;
    color: string;
    width?: number;
    dashed?: boolean;
}) {
    const o = width / 2;
    return (
        <rect x={x + o} y={y + o} width={w - width} height={h - width} rx={r - o} fill="none" style={{stroke: color}}
              strokeWidth={width} strokeDasharray={dashed ? "3 2.5" : undefined}/>
    );
}

// Points down at (x, y).
export function Arrowhead({x, y, color}: { x: number; y: number; color: string }) {
    return <path d={`M ${x - 4.5} ${y - 7.5} L ${x} ${y} L ${x + 4.5} ${y - 7.5} Z`} style={{fill: color}}/>;
}

// Points right at (x, y).
export function ArrowheadRight({x, y, color}: { x: number; y: number; color: string }) {
    return <path d={`M ${x - 7.5} ${y - 4.5} L ${x} ${y} L ${x - 7.5} ${y + 4.5} Z`} style={{fill: color}}/>;
}

export function Dot({t}: { t: Tone }) {
    return <span className="inline-block size-2 shrink-0 rounded-full" style={{background: hue(t).acc}}/>;
}

export function Code({children, wrap = false}: { children: ReactNode; wrap?: boolean }) {
    return (
        <code
            className={`rounded-[5px] px-1 py-px font-mono text-[12px] font-medium [box-decoration-break:clone] ${wrap ? "break-words" : "whitespace-nowrap"}`}
            style={{
                background: ink.well,
                color: ink.text,
                fontFeatureSettings: noLigatures,
            }}
        >
            {children}
        </code>
    );
}

// The frame every diagram shares: specification header, canvas, § caption.
export function SpecFigure({
                               labelledBy,
                               kicker,
                               title,
                               badge,
                               description,
                               caption,
                               children,
                           }: {
    labelledBy: string;
    kicker: string;
    title: string;
    badge: string;
    description: ReactNode;
    caption: ReactNode;
    children: ReactNode;
}) {
    return (
        <figure aria-labelledby={labelledBy} className="psm-dg not-prose my-12">
            <style dangerouslySetInnerHTML={{__html: palette}}/>
            <div className="overflow-hidden rounded-2xl border"
                 style={{borderColor: ink.rule, background: ink.surface}}>
                <header className="px-5 pb-6 pt-5 sm:px-8 sm:pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em]"
                              style={{color: ink.muted}}>
                            {kicker}
                        </span>
                        <span className="font-mono text-[11px]" style={{color: ink.muted}}>
                            {badge}
                        </span>
                    </div>
                    <h3
                        id={labelledBy}
                        className="mt-3 text-balance text-[19px] font-semibold leading-snug tracking-[-0.01em] sm:text-[21px]"
                        style={{color: ink.text}}
                    >
                        {title}
                    </h3>
                    <p className="mt-2 max-w-[68ch] text-[13.5px] leading-relaxed" style={{color: ink.muted}}>
                        {description}
                    </p>
                </header>
                {children}
                <figcaption
                    className="flex gap-3 border-t px-5 py-4 text-[12.5px] leading-relaxed sm:px-8"
                    style={{borderColor: ink.rule, color: ink.muted}}
                >
                    <span className="font-mono font-semibold" style={{color: hue("vw").acc}} aria-hidden="true">
                        §
                    </span>
                    <span>{caption}</span>
                </figcaption>
            </div>
        </figure>
    );
}

export function SectionHead({index, title, aside}: { index?: string; title: string; aside?: ReactNode }) {
    return (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h4 className="text-[13.5px] font-semibold" style={{color: ink.text}}>
                {index && (
                    <span className="mr-2 font-mono text-[12px]" style={{color: ink.faint}}>
                        {index}
                    </span>
                )}
                {title}
            </h4>
            {aside && (
                <span className="font-mono text-[11px]"
                      style={{color: ink.muted, fontFeatureSettings: noLigatures}}>
                    {aside}
                </span>
            )}
        </div>
    );
}
