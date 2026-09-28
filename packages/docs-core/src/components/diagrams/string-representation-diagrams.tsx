import {ArrowRight} from "lucide-react";
import type {ReactNode} from "react";
import {
    Arrowhead,
    canvas,
    Code,
    Dot,
    hue,
    ink,
    Label,
    mono,
    Outline,
    roundedRect,
    sans,
    SectionHead,
    SpecFigure,
    type Tone,
} from "./diagram-kit";

// ---------------------------------------------------------------------------
// 1. StringStorageDiagram (16-Byte German String Layout)
// ---------------------------------------------------------------------------

// The pair is drawn in memory order on a 16-slot grid, one slot per byte, with a
// small gap between the two 8-byte fields. Heap blocks reuse the slot width so a
// pointer lands exactly on the byte it addresses.
const X = 26;
const SLOT = 28;
const GAP = 4;
const PAIR_H = 44;
const STRIP_H = 38;
const RIGHT = X + 16 * SLOT + GAP;

function slotX(i: number) {
    return i < 8 ? X + i * SLOT : X + 8 * SLOT + GAP + (i - 8) * SLOT;
}

function slotCx(i: number) {
    return slotX(i) + SLOT / 2;
}

function cellX(i: number) {
    return X + i * SLOT;
}

// Text bytes: set in the UI face, not a code face, so a word still reads as a word.
function Glyphs({chars, at, y, color, size = 16}: {
    chars: string[];
    at: (i: number) => number;
    y: number;
    color: string;
    size?: number
}) {
    return (
        <>
            {chars.map((c, i) =>
                c === " " ? null : (
                    <Label key={i} x={at(i)} y={y} size={size} weight={520} color={color} anchor="middle">
                        {c}
                    </Label>
                ),
            )}
        </>
    );
}

function Dividers({at, y, h, color}: { at: number[]; y: number; h: number; color: string }) {
    return (
        <>
            {at.map((x) => (
                <line key={x} x1={x} x2={x} y1={y + 10} y2={y + h - 10} style={{stroke: color}} strokeWidth={1}/>
            ))}
        </>
    );
}

// A tag is one bit, not one byte: the pill sits against the 11|12 byte boundary,
// where bit 31 (top of byte 11) meets bit 32 (bottom of byte 12).
function TagBit({letter, set, cy, t}: { letter: "I" | "V" | "G"; set: boolean; cy: number; t: Tone }) {
    const cx = letter === "I" ? slotX(12) - 13 : letter === "V" ? slotX(12) + 13 : slotX(12) + 35;
    return (
        <g>
            <rect
                x={cx - 8.5}
                y={cy - 8.5}
                width={17}
                height={17}
                rx={5}
                style={set ? {fill: hue(t).acc} : {fill: "none", stroke: ink.faint}}
                strokeWidth={1}
                strokeDasharray={set ? undefined : "2.5 2"}
            />
            <Label x={cx} y={cy + 3.6} size={10} weight={700} color={set ? ink.onAcc : ink.faint} anchor="middle">
                {letter}
            </Label>
        </g>
    );
}

function Bracket({from, to, y, label, color = ink.rule, labelColor = ink.muted}: {
    from: number;
    to: number;
    y: number;
    label: ReactNode;
    color?: string;
    labelColor?: string
}) {
    return (
        <g>
            <path d={`M ${from} ${y - 4} V ${y} H ${to} V ${y - 4}`} fill="none" style={{stroke: color}} strokeWidth={1}
                  strokeLinejoin="round"/>
            <Label x={(from + to) / 2} y={y + 14} size={10.5} color={labelColor} anchor="middle">
                {label}
            </Label>
        </g>
    );
}

function RowHeader({y, t, label, title, range}: { y: number; t: Tone; label: string; title: string; range: string }) {
    return (
        <g>
            <circle cx={X + 4} cy={y - 4.5} r={4} style={{fill: hue(t).acc}}/>
            <text x={X + 15} y={y} style={{fontFamily: sans}}>
                <tspan
                    style={{fill: hue(t).ink, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em"}}>{label}</tspan>
                <tspan dx={9} style={{fill: ink.text, fontSize: 13.5, fontWeight: 600}}>
                    {title}
                </tspan>
            </text>
            <Label x={RIGHT} y={y} size={11} weight={500} color={ink.muted} anchor="end" family={mono}>
                {range}
            </Label>
        </g>
    );
}

// The two machine words of this example value, as a debugger would print them.
function WordValues({y, field0, field1}: { y: number; field0: string; field1: string }) {
    return (
        <>
            <Label x={(slotX(0) + slotX(8) - GAP) / 2} y={y} size={10.5} color={ink.muted} anchor="middle"
                   family={mono}>
                {field0}
            </Label>
            <Label x={(slotX(8) + RIGHT) / 2} y={y} size={10.5} color={ink.muted} anchor="middle" family={mono}>
                {field1}
            </Label>
        </>
    );
}

// Who makes this class, and what it costs to make and to drop.
function RowFacts({y, via, create, drop}: { y: number; via: string[]; create: string; drop: string }) {
    return (
        <>
            <text x={X} y={y} style={{fontFamily: sans, fontSize: 11}}>
                <tspan style={{fill: ink.faint}}>via</tspan>
                {via.map((v, i) => (
                    <tspan key={v}>
                        {i > 0 && <tspan style={{fill: ink.faint}}>,</tspan>}
                        <tspan dx={i > 0 ? 5 : 6} style={{
                            fill: ink.text,
                            fontFamily: mono,
                            fontSize: 10.5,
                            fontFeatureSettings: '"calt" 0, "liga" 0'
                        }}>
                            {v}
                        </tspan>
                    </tspan>
                ))}
            </text>
            <text x={RIGHT} y={y} textAnchor="end" style={{fontFamily: sans, fontSize: 11}}>
                <tspan style={{fill: ink.faint}}>create</tspan>
                <tspan dx={4} style={{fill: ink.text, fontWeight: 500}}>
                    {create}
                </tspan>
                <tspan dx={10} style={{fill: ink.faint}}>
                    drop
                </tspan>
                <tspan dx={4} style={{fill: ink.text, fontWeight: 500}}>
                    {drop}
                </tspan>
            </text>
        </>
    );
}

// Bytes 8..11: the 31-bit length, with INLINE in the top bit of byte 11.
function LengthField({y, value, t, inline}: { y: number; value: number; t: Tone; inline: boolean }) {
    const cy = y + PAIR_H / 2;
    return (
        <>
            <path d={roundedRect(slotX(8), y, 4 * SLOT, PAIR_H, [9, 0, 0, 9])} style={{fill: ink.surface}}/>
            <text x={slotX(8) + 11} y={cy + 4.5} style={{fontFamily: sans}}>
                <tspan style={{fill: ink.muted, fontSize: 11}}>len</tspan>
                <tspan dx={5}
                       style={{fill: hue(t).ink, fontSize: 16, fontWeight: 600, fontVariantNumeric: "tabular-nums"}}>
                    {value}
                </tspan>
            </text>
            <TagBit letter="I" set={inline} cy={cy} t={t}/>
        </>
    );
}

const ANATOMY_TOP = 20;

function Anatomy() {
    const f0 = {from: slotX(0), to: slotX(7) + SLOT};
    const f1 = {from: slotX(8), to: slotX(15) + SLOT};
    const lenMid = (slotX(8) + slotX(12)) / 2;
    const hiMid = (slotX(12) + f1.to) / 2;
    const y = ANATOMY_TOP;
    return (
        <g>
            <Label x={X} y={y} size={12.5} weight={600} color={ink.text}>
                16-Byte Physical Memory Layout
            </Label>
            <Label x={RIGHT} y={y} size={11} anchor="end">
                Target: 64-bit little-endian
            </Label>
            <Label x={X} y={y + 18} size={11.5} weight={500} color={ink.muted} family={mono}>
                %prismio.str = {"{ ptr, i64 }"}
            </Label>

            {[
                {...f0, label: "field 0 · ptr"},
                {...f1, label: "field 1 · i64"},
            ].map((f) => (
                <g key={f.label}>
                    <Label x={(f.from + f.to) / 2} y={y + 52} size={11.5} weight={600} color={ink.text} anchor="middle">
                        {f.label}
                    </Label>
                    <path
                        d={`M ${f.from + 1} ${y + 64} V ${y + 59} H ${f.to - 1} V ${y + 64}`}
                        fill="none"
                        style={{stroke: ink.rule}}
                        strokeWidth={1}
                        strokeLinejoin="round"
                    />
                </g>
            ))}

            <line x1={slotX(12)} x2={slotX(12)} y1={y + 72} y2={y + 102} style={{stroke: ink.rule}} strokeWidth={1}/>
            <Label x={(f0.from + f0.to) / 2} y={y + 82} size={10.5} color={ink.text} anchor="middle">
                data pointer
            </Label>
            <Label x={(f0.from + f0.to) / 2} y={y + 97} size={10.5} anchor="middle">
                INLINE ? data[0..7]
            </Label>
            <Label x={lenMid} y={y + 82} size={10.5} color={ink.text} anchor="middle">
                bits 0–30: length
            </Label>
            <Label x={lenMid} y={y + 97} size={10.5} anchor="middle">
                bit 31: INLINE
            </Label>
            <Label x={hiMid + 2} y={y + 82} size={9.5} color={ink.text} anchor="middle">
                bit 32 VIEW · 33 GEOM
            </Label>
            <Label x={hiMid} y={y + 97} size={10.5} anchor="middle">
                INLINE ? data[8..11]
            </Label>

            {Array.from({length: 16}, (_, i) => (
                <Label
                    key={i}
                    x={slotCx(i)}
                    y={y + 126}
                    size={10}
                    weight={i === 11 || i === 12 ? 650 : 400}
                    color={i === 11 || i === 12 ? ink.text : ink.faint}
                    anchor="middle"
                >
                    {i}
                </Label>
            ))}
        </g>
    );
}

function InlineRow({y}: { y: number }) {
    const t: Tone = "in";
    const h = hue(t);
    const top = y + 16;
    const cy = top + PAIR_H / 2;
    return (
        <g>
            <RowHeader y={y} t={t} label="INLINE SSO" title="Small String Optimization" range="0 .. 12 B"/>

            {/* field 0: data[0..7] */}
            <rect x={slotX(0)} y={top} width={8 * SLOT} height={PAIR_H} rx={9} style={{fill: h.fill}}/>
            <Dividers at={[1, 2, 3, 4, 5, 6, 7].map(slotX)} y={top} h={PAIR_H} color={h.line}/>
            <Outline x={slotX(0)} y={top} w={8 * SLOT} h={PAIR_H} color={h.line}/>
            <Glyphs chars={"Prismio.".split("")} at={slotCx} y={cy + 5.5} color={h.ink}/>

            {/* field 1: length + INLINE, then data[8..10] and the zeroed tail byte */}
            <LengthField y={top} value={11} t={t} inline/>
            <rect x={slotX(12)} y={top} width={3 * SLOT} height={PAIR_H} style={{fill: h.fill}}/>
            <path d={roundedRect(slotX(15), top, SLOT, PAIR_H, [0, 9, 9, 0])} style={{fill: ink.surface}}/>
            <Dividers at={[12, 13, 14, 15].map(slotX)} y={top} h={PAIR_H} color={h.line}/>
            <Outline x={slotX(8)} y={top} w={8 * SLOT} h={PAIR_H} color={h.line}/>
            <Glyphs chars={"psm".split("")} at={(i) => slotCx(12 + i)} y={cy + 5.5} color={h.ink}/>
            <Label x={slotCx(15)} y={cy + 4.5} size={13} color={ink.faint} anchor="middle">
                0
            </Label>

            <Bracket from={slotX(0) + 2} to={slotX(8) - 2} y={top + PAIR_H + 12} label="data[0..7]"/>
            <Bracket from={slotX(8) + 2} to={slotX(12) - 2} y={top + PAIR_H + 12} label="len 11 | INLINE"/>
            <Bracket from={slotX(12) + 2} to={slotX(15) - 2} y={top + PAIR_H + 12} label="data[8..10]"/>
            <Bracket from={slotX(15) + 2} to={slotX(15) + SLOT - 2} y={top + PAIR_H + 12} label="zero"/>

            <WordValues y={top + PAIR_H + 50} field0="0x2E6F_696D_7369_7250" field1="0x006D_7370_8000_000B"/>
            <RowFacts y={top + PAIR_H + 74} via={["__builtin_string_inline"]} create="copy ≤ 12 B" drop="nothing"/>
        </g>
    );
}

// Field 1 of a long string: length with INLINE = 0, then VIEW (bit 32), GEOMETRIC
// (bit 33, the consuming-append capacity mark), and the reserved bits 34..63.
function LongField({y, t, length, view}: { y: number; t: Tone; length: number; view: boolean }) {
    const cy = y + PAIR_H / 2;
    return (
        <>
            <LengthField y={y} value={length} t={t} inline={false}/>
            <path d={roundedRect(slotX(12), y, 4 * SLOT, PAIR_H, [0, 9, 9, 0])} style={{fill: ink.well}}/>
            <line x1={slotX(12)} x2={slotX(12)} y1={y + 10} y2={y + PAIR_H - 10} style={{stroke: ink.rule}}
                  strokeWidth={1}/>
            <Outline x={slotX(8)} y={y} w={8 * SLOT} h={PAIR_H} color={ink.rule}/>
            <TagBit letter="V" set={view} cy={cy} t={t}/>
            <TagBit letter="G" set={false} cy={cy} t={t}/>
            <Label x={slotX(12) + 50} y={cy + 3.8} size={10} color={ink.muted}>
                reserved
            </Label>
        </>
    );
}

function PointerField({y, t, label}: { y: number; t: Tone; label: string }) {
    const h = hue(t);
    const cy = y + PAIR_H / 2;
    return (
        <>
            <rect x={slotX(0)} y={y} width={8 * SLOT} height={PAIR_H} rx={9} style={{fill: h.fill}}/>
            <Outline x={slotX(0)} y={y} w={8 * SLOT} h={PAIR_H} color={h.line}/>
            <Label x={slotX(0) + 4 * SLOT + 8} y={cy + 4.5} size={13} weight={550} color={h.ink} anchor="middle">
                {label}
            </Label>
        </>
    );
}

function OwnedRow({y}: { y: number }) {
    const t: Tone = "ow";
    const h = hue(t);
    const top = y + 16;
    const stripY = top + PAIR_H + 58;
    const x0 = slotCx(0);
    return (
        <g>
            <RowHeader y={y} t={t} label="OWNED HEAP" title="Unique Heap Buffer" range="0 B .. 2 GiB"/>

            <PointerField y={top} t={t} label="heap data pointer"/>
            <LongField y={top} t={t} length={14} view={false}/>
            <WordValues y={top + PAIR_H + 17} field0="0x0000_6000_0240_1020" field1="0x0000_0000_0000_000E"/>

            <path d={`M ${x0} ${top + PAIR_H / 2 + 6} V ${stripY - 8}`} fill="none" strokeWidth={1.75}
                  strokeLinecap="round" style={{stroke: h.acc}}/>
            <Arrowhead x={x0} y={stripY - 1} color={h.acc}/>
            <circle cx={x0} cy={top + PAIR_H / 2} r={4.5} strokeWidth={2.5} style={{fill: h.acc, stroke: ink.surface}}/>
            <text x={x0 + 14} y={top + PAIR_H + 40} style={{fontFamily: sans, fontSize: 12}}>
                <tspan style={{fill: h.ink, fontWeight: 620}}>owns</tspan>
                <tspan dx={6} style={{fill: ink.muted}}>
                    a NUL-terminated block; C takes its pointer as is
                </tspan>
            </text>

            <rect x={cellX(0)} y={stripY} width={15 * SLOT} height={STRIP_H} rx={9} style={{fill: h.fill}}/>
            <path d={roundedRect(cellX(14), stripY, SLOT, STRIP_H, [0, 9, 9, 0])} style={{fill: h.acc}}/>
            <Dividers at={Array.from({length: 13}, (_, i) => cellX(i + 1))} y={stripY} h={STRIP_H} color={h.line}/>
            <Outline x={cellX(0)} y={stripY} w={15 * SLOT} h={STRIP_H} color={h.line}/>
            <Glyphs chars={"representation".split("")} at={(i) => cellX(i) + SLOT / 2} y={stripY + STRIP_H / 2 + 5.5}
                    color={h.ink}/>
            <Label x={cellX(14) + SLOT / 2} y={stripY + STRIP_H / 2 + 4.5} size={12} weight={650} color={ink.onAcc}
                   anchor="middle" family={mono}>
                \0
            </Label>

            <Bracket from={cellX(0) + 2} to={cellX(14) - 2} y={stripY + STRIP_H + 12} label="14 bytes"/>
            <Bracket from={cellX(14) + 2} to={cellX(15) - 2} y={stripY + STRIP_H + 12} label="NUL"/>

            <RowFacts y={stripY + STRIP_H + 50} via={["str_with_capacity", "fatFromPtr"]} create="alloc + copy"
                      drop="free(ptr)"/>
        </g>
    );
}

function ViewRow({y}: { y: number }) {
    const t: Tone = "vw";
    const h = hue(t);
    const top = y + 16;
    const stripY = top + PAIR_H + 62;
    const start = 3;
    const x0 = slotCx(0);
    const x1 = cellX(start) + SLOT / 2;
    const bendY = top + PAIR_H + 30;
    const baseEnd = cellX(16) + 16;
    return (
        <g>
            <RowHeader y={y} t={t} label="STRING VIEW" title="Borrowed Interior Slice" range="13 B .. 2 GiB"/>

            <PointerField y={top} t={t} label={`base_ptr + ${start}`}/>
            <LongField y={top} t={t} length={13} view/>
            <WordValues y={top + PAIR_H + 17} field0="0x0000_6000_0240_2043" field1="0x0000_0001_0000_000D"/>

            <path
                d={`M ${x0} ${top + PAIR_H / 2 + 6} V ${bendY - 9} Q ${x0} ${bendY} ${x0 + 9} ${bendY} H ${x1 - 9} Q ${x1} ${bendY} ${x1} ${bendY + 9} V ${stripY - 8}`}
                fill="none"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{stroke: h.acc}}
            />
            <Arrowhead x={x1} y={stripY - 1} color={h.acc}/>
            <circle cx={x0} cy={top + PAIR_H / 2} r={4.5} strokeWidth={2.5} style={{fill: h.acc, stroke: ink.surface}}/>
            <text x={x1 + 14} y={bendY + 18} style={{fontFamily: sans, fontSize: 12}}>
                <tspan style={{fill: h.ink, fontWeight: 620}}>borrows</tspan>
                <tspan dx={6} style={{fill: ink.muted}}>
                    lifetime proven by AIF alias provenance
                </tspan>
            </text>

            {/* The base string's block continues past the view, so its right edge fades out. */}
            <defs>
                <linearGradient id="psm-str-base-fade" gradientUnits="userSpaceOnUse" x1={cellX(15)} x2={baseEnd} y1={0}
                                y2={0}>
                    <stop offset="0" stopColor="white"/>
                    <stop offset="1" stopColor="white" stopOpacity="0"/>
                </linearGradient>
                <mask id="psm-str-base-mask" maskUnits="userSpaceOnUse" x={0} y={stripY - 4} width={RIGHT + 30}
                      height={STRIP_H + 8}>
                    <rect x={0} y={stripY - 4} width={cellX(15)} height={STRIP_H + 8} fill="white"/>
                    <rect x={cellX(15)} y={stripY - 4} width={baseEnd - cellX(15)} height={STRIP_H + 8}
                          fill="url(#psm-str-base-fade)"/>
                </mask>
            </defs>
            <g mask="url(#psm-str-base-mask)">
                <path d={roundedRect(cellX(0), stripY, baseEnd - cellX(0), STRIP_H, [9, 0, 0, 9])}
                      style={{fill: ink.well}}/>
                <path
                    d={`M ${baseEnd} ${stripY + 0.5} H ${cellX(0) + 9} Q ${cellX(0) + 0.5} ${stripY + 0.5} ${cellX(0) + 0.5} ${stripY + 9} V ${stripY + STRIP_H - 9} Q ${cellX(0) + 0.5} ${stripY + STRIP_H - 0.5} ${cellX(0) + 9} ${stripY + STRIP_H - 0.5} H ${baseEnd}`}
                    fill="none"
                    style={{stroke: ink.rule}}
                />
            </g>
            <rect x={cellX(start)} y={stripY} width={(16 - start) * SLOT} height={STRIP_H} rx={7}
                  style={{fill: h.fill}}/>
            <Dividers at={[1, 2].map(cellX)} y={stripY} h={STRIP_H} color={ink.rule}/>
            <Dividers at={Array.from({length: 12}, (_, i) => cellX(start + 1 + i))} y={stripY} h={STRIP_H}
                      color={h.line}/>
            <Outline x={cellX(start)} y={stripY} w={(16 - start) * SLOT} h={STRIP_H} r={7} color={h.acc} width={1.5}/>
            <Glyphs chars={"fn ".split("")} at={(i) => cellX(i) + SLOT / 2} y={stripY + STRIP_H / 2 + 5.5}
                    color={ink.muted}/>
            <Glyphs chars={"tokenize(src)".split("")} at={(i) => cellX(start + i) + SLOT / 2}
                    y={stripY + STRIP_H / 2 + 5.5} color={h.ink}/>

            <Bracket from={cellX(0) + 2} to={cellX(start) - 2} y={stripY + STRIP_H + 12} label="base"/>
            <Bracket
                from={cellX(start) + 2}
                to={cellX(16) - 2}
                y={stripY + STRIP_H + 12}
                label="13 bytes · no NUL of its own"
                color={h.acc}
                labelColor={h.ink}
            />

            <RowFacts y={stripY + STRIP_H + 50} via={["__builtin_string_view"]} create="no alloc, no copy"
                      drop="nothing"/>
        </g>
    );
}

export function StringStorageDiagram() {
    const order: { mask: string; name: string; t: Tone; note: ReactNode }[] = [
        {mask: "word & 0x8000_0000", name: "INLINE", t: "in", note: <>tested first; bit 32 may be text</>},
        {mask: "word & 0x1_0000_0000", name: "VIEW", t: "vw", note: <>read only when INLINE = 0</>},
        {mask: "neither bit", name: "OWNED", t: "ow", note: <>the untagged long form</>},
    ];

    return (
        <SpecFigure
            kicker="Prismio Runtime · String Memory Specification"
            labelledBy="string-storage-diagram-title"
            title="16-Byte Tagged String Pair: Inline, Owned & View Layouts"
            badge="Umbra / German String"
            description={
                <>
                    Every String value in Prismio occupies exactly two 64-bit machine words (<Code>%prismio.str
                    = {"{ ptr, i64 }"}</Code>). Discriminant tag bits in field 1 govern whether bytes
                    live inline, on the heap, or inside a borrowed base buffer.
                </>
            }
            caption={
                <>
                    All three variants occupy identical 16-byte stack/register footprints. Consumers check the INLINE
                    tag
                    (bit 31) first; only a long-form string with VIEW = 0 hands a real pointer to the deallocator.
                    Zero-tail invariant: <Code>ir_str_inline</Code> zeroes the pair before writing <Code>[0, n)</Code>,
                    so
                    equal short strings are equal as two words.
                </>
            }
        >
            <div className="overflow-x-auto border-t px-3 pb-9 pt-8 sm:px-8"
                 style={{borderColor: ink.rule, background: canvas}}>
                <svg
                    viewBox={`0 0 ${RIGHT + X} 886`}
                    role="img"
                    aria-label="Byte layout of the inline, owned, and view forms of the 16-byte string pair"
                    className="mx-auto block h-auto w-full min-w-[440px] max-w-[620px] select-none">
                    <Anatomy/>
                    <InlineRow y={198}/>
                    <OwnedRow y={388}/>
                    <ViewRow y={646}/>
                </svg>
            </div>

            <div
                className="grid gap-y-8 border-t px-5 py-7 text-[13px] leading-relaxed sm:px-8"
                style={{borderColor: ink.rule, color: ink.text}}
            >
                <div>
                    <SectionHead title="Discriminant Evaluation" aside="length = word & 0x7FFF_FFFF"/>
                    <ol className="space-y-2.5">
                        {order.map((r) => (
                            <li key={r.name}
                                className="grid grid-cols-[10.5rem_1fr] items-baseline gap-x-4 sm:grid-cols-[11.5rem_1fr]">
                                <span className="font-mono text-[12px]"
                                      style={{color: r.mask === "neither bit" ? ink.muted : ink.text}}>
                                    {r.mask}
                                </span>
                                <span className="flex flex-wrap items-center gap-x-2">
                                    <Dot t={r.t}/>
                                    <span className="font-mono text-[12px] font-semibold" style={{color: hue(r.t).ink}}>
                                        {r.name}
                                    </span>
                                    <span className="text-[12px]" style={{color: ink.muted}}>
                                        {r.note}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>

                <div>
                    <SectionHead title="Release Path" aside="ir_release_call"/>
                    <pre
                        className="overflow-x-auto rounded-lg px-3.5 py-3 font-mono text-[12px] leading-relaxed"
                        style={{background: ink.well, color: ink.text, fontFeatureSettings: '"calt" 0, "liga" 0'}}
                    >
                        <span style={{color: ink.muted}}>{"// PRISMIO_STR_UNOWNED = 0x1_8000_0000\n"}</span>
                        {"free(word & PRISMIO_STR_UNOWNED\n         ? NULL : ptr)"}
                    </pre>
                    <p className="mt-2.5 text-[12px]" style={{color: ink.muted}}>
                        A <Code>select</Code>, not a branch. INLINE dominates, so testing both bits at once is correct
                        even
                        when bit 32 holds text.
                    </p>
                </div>
            </div>
        </SpecFigure>
    );
}

// ---------------------------------------------------------------------------
// 2. StringViewLifetimeDiagram (AIF Provenance & ABI Gates)
// ---------------------------------------------------------------------------

// One lifetime bar per variable in a left gutter, program rows beside it, so the
// bars stay in view when a narrow screen scrolls the figure.
const LT = {
    top: 52,
    row: 58,
    code: 152,
    textBar: 60,
    tokBar: 116,
    bar: 16,
    width: 480,
} as const;

function rowTop(i: number) {
    return LT.top + i * LT.row;
}

function codeY(i: number) {
    return rowTop(i) + 22;
}

function Mono({children}: { children: ReactNode }) {
    return <tspan style={{
        fontFamily: mono,
        fontSize: 10.5,
        fill: ink.text,
        fontFeatureSettings: '"calt" 0, "liga" 0'
    }}>{children}</tspan>;
}

const lifetimeRows: { code: ReactNode; note: ReactNode; band?: Tone }[] = [
    {code: <>let text = …</>, note: <>owned heap block: the site tok will alias</>},
    {
        code: <>let tok = text.substring(3, 13)</>,
        note: (
            <>
                <Mono>strSubstring</Mono>, count 13 {">"} 12: <Mono>__builtin_string_view</Mono>
            </>
        ),
        band: "vw",
    },
    {code: <>… text …</>, note: <>last direct use of text</>},
    {code: <>… tok …</>, note: <>last use of tok: provenance keeps text alive to here</>},
    {
        code: <>{"}"}</>,
        note: (
            <>
                drop text: <Mono>free(ptr)</Mono>; tok has no site to release
            </>
        ),
    },
];

function LifetimeBar({x, from, to, t}: { x: number; from: number; to: number; t: Tone }) {
    const h = hue(t);
    return (
        <>
            <rect x={x - LT.bar / 2} y={from} width={LT.bar} height={to - from} rx={LT.bar / 2} style={{fill: h.fill}}/>
            <rect
                x={x - LT.bar / 2 + 0.5}
                y={from + 0.5}
                width={LT.bar - 1}
                height={to - from - 1}
                rx={LT.bar / 2 - 0.5}
                fill="none"
                style={{stroke: h.line}}
            />
        </>
    );
}

function LifetimeTimeline() {
    const textFrom = codeY(0) - 10;
    const textTo = codeY(4) - 4;
    const tokFrom = codeY(1) - 10;
    const tokTo = codeY(3) + 6;
    const lastDirect = codeY(2) - 4;
    const vw = hue("vw");
    const ow = hue("ow");

    return (
        <svg
            viewBox={`0 0 ${LT.width} ${rowTop(5) + 24}`}
            role="img"
            aria-label="Lifetime of a base string and a view cut from it: the view's last use extends the base's lifetime"
            className="mx-auto block h-auto w-full min-w-[400px] max-w-[640px] select-none"
        >
            <defs>
                <pattern id="psm-view-extension" width="6" height="6" patternUnits="userSpaceOnUse"
                         patternTransform="rotate(45)">
                    <rect width="6" height="6" style={{fill: vw.fill}}/>
                    <line x1="0" y1="0" x2="0" y2="6" strokeWidth={2.5} style={{stroke: vw.line}}/>
                </pattern>
            </defs>

            {/* column heads */}
            <Label x={LT.code} y={20} size={11.5} weight={600} color={ink.text}>
                program
            </Label>
            <Label x={LT.code} y={35} size={10.5}>
                one function body, top to bottom
            </Label>
            {[
                {x: LT.textBar, name: "text", kind: "owned", t: "ow" as Tone},
                {x: LT.tokBar, name: "tok", kind: "view", t: "vw" as Tone},
            ].map((c) => (
                <g key={c.name}>
                    <Label x={c.x} y={20} size={12} weight={600} color={hue(c.t).ink} anchor="middle" family={mono}>
                        {c.name}
                    </Label>
                    <Label x={c.x} y={35} size={10.5} anchor="middle">
                        {c.kind}
                    </Label>
                </g>
            ))}

            {/* rows */}
            {lifetimeRows.map((r, i) => (
                <g key={i}>
                    {r.band && (
                        <rect
                            x={LT.code - 30}
                            y={rowTop(i) + 3}
                            width={LT.width - 6 - (LT.code - 30)}
                            height={LT.row - 6}
                            rx={9}
                            style={{fill: hue(r.band).fill}}
                        />
                    )}
                    {i > 0 && (
                        <line
                            x1={X - 10}
                            x2={LT.width - 6}
                            y1={rowTop(i)}
                            y2={rowTop(i)}
                            strokeDasharray="2 3"
                            style={{stroke: ink.rule}}
                            strokeWidth={1}
                        />
                    )}
                    <Label x={LT.code - 12} y={codeY(i)} size={11} color={ink.faint} family={mono} anchor="end">
                        {i + 1}
                    </Label>
                    <Label x={LT.code} y={codeY(i)} size={12.5} weight={500} color={ink.text} family={mono}>
                        {r.code}
                    </Label>
                    <Label x={LT.code} y={codeY(i) + 18} size={11} color={ink.muted}>
                        {r.note}
                    </Label>
                </g>
            ))}

            {/* text: its own lifetime, then the stretch the view's provenance adds */}
            <LifetimeBar x={LT.textBar} from={textFrom} to={textTo} t="ow"/>
            <rect
                x={LT.textBar - LT.bar / 2 + 1}
                y={lastDirect}
                width={LT.bar - 2}
                height={tokTo - lastDirect}
                style={{fill: "url(#psm-view-extension)"}}
            />
            <line
                x1={LT.textBar - LT.bar / 2 - 6}
                x2={LT.textBar + LT.bar / 2 + 6}
                y1={lastDirect}
                y2={lastDirect}
                strokeDasharray="3 2"
                strokeWidth={1.25}
                style={{stroke: ow.acc}}
            />
            <circle cx={LT.textBar} cy={textTo} r={6} strokeWidth={2.5} style={{fill: ow.acc, stroke: ink.surface}}/>

            {/* tok: borrows, so its bar ends in an empty ring */}
            <LifetimeBar x={LT.tokBar} from={tokFrom} to={tokTo} t="vw"/>
            <circle cx={LT.tokBar} cy={tokTo} r={5} strokeWidth={1.75} style={{fill: ink.surface, stroke: vw.acc}}/>

            {/* provenance: the view aliases argument 0 */}
            <path
                d={`M ${LT.tokBar - LT.bar / 2 - 2} ${tokFrom + 12} H ${LT.textBar + LT.bar / 2 + 8}`}
                fill="none"
                strokeWidth={1.5}
                strokeLinecap="round"
                style={{stroke: vw.acc}}
            />
            <path
                d={`M ${LT.textBar + LT.bar / 2 + 9} ${tokFrom + 7.5} L ${LT.textBar + LT.bar / 2 + 2} ${tokFrom + 12} L ${LT.textBar + LT.bar / 2 + 9} ${tokFrom + 16.5} Z`}
                style={{fill: vw.acc}}
            />
            <Label x={(LT.textBar + LT.tokBar) / 2} y={tokFrom + 2} size={9.5} weight={600} color={vw.ink}
                   anchor="middle">
                aliases
            </Label>

            {/* key for the hatched stretch */}
            <rect x={X} y={rowTop(5) + 2} width={12} height={12} rx={3}
                  style={{fill: "url(#psm-view-extension)", stroke: vw.line}}/>
            <Label x={X + 18} y={rowTop(5) + 11.5} size={10.5} color={ink.muted}>
                Lifetime Extension: base deallocation deferred until the last view use
            </Label>
        </svg>
    );
}

const gates: { name: ReactNode; site: ReactNode; lowering: ReactNode; copied: ReactNode; copies: boolean }[] = [
    {
        name: "Equality Comparison",
        site: <Code>a == b</Code>,
        lowering: (
            <>
                Both INLINE: two word compares. Otherwise equal lengths reach <Code>str_equals_n(pa, pb, n)</Code>,
                bounded
                by length because <Code>strcmp</Code> would read past a view.
            </>
        ),
        copied: "0",
        copies: false,
    },
    {
        name: "Container Storage Boundary",
        site: <Code>list.push(view)</Code>,
        lowering: (
            <>
                <Code>list_push_str</Code> stores inline and owned pairs as they are; a view takes the slow path and is
                copied
                with <Code>str_clone_n</Code> into an owned pair. Boxed one-word lists use <Code>str_own</Code>.
            </>
        ),
        copied: "len + 1",
        copies: true,
    },
    {
        name: "Foreign C FFI Boundary",
        site: <Code>c_function(view)</Code>,
        lowering: (
            <>
                <Code>str_cstr_for_call</Code> branches on VIEW. Under 64 bytes the NUL-terminated copy lives in
                the{" "}
                <Code>str.cstrbuf</Code> stack slot; otherwise <Code>str_clone_n</Code>, freed after the call. Inline
                and
                owned pass the pointer they have.
            </>
        ),
        copied: "len + 1",
        copies: true,
    },
    {
        name: (
            <>
                <Code>bytes</Code> FFI Parameter
            </>
        ),
        site: <Code>s: String bytes</Code>,
        lowering: (
            <>
                <Code>ir_call_arg_borrow</Code> instead of <Code>ir_call_arg_cstr</Code>: the callee gets the count
                separately, so the view&rsquo;s own pointer crosses.
            </>
        ),
        copied: "0",
        copies: false,
    },
];

export function StringViewLifetimeDiagram() {
    const cp = hue("cp");
    return (
        <SpecFigure
            kicker="Prismio Runtime · String Memory Specification"
            labelledBy="string-view-lifetime-diagram-title"
            title="Zero-Copy StringView Lifetime Extension & ABI Boundaries"
            badge="Ownership Provenance"
            description="String views borrow internal buffer slices without copying bytes. The AIF compiler pass tracks allocation provenance, ensuring the backing storage is kept alive across the full duration of every view."
            caption={
                <>
                    Application code never manages lifetime bounds or NUL terminators manually. If a view enters a
                    container
                    or crosses an external C boundary, the compiler synthesizes an owned or NUL-terminated copy, unless
                    the
                    parameter is declared <Code>bytes</Code>.
                </>
            }
        >
            <div className="border-t px-5 pb-8 pt-7 sm:px-8" style={{borderColor: ink.rule, background: canvas}}>
                <SectionHead
                    index="1."
                    title="Zero-Copy View Provenance Graph"
                    aside={<>aifFfiAliasOf(__builtin_string_view) = arg 0</>}
                />
                <div className="-mx-2 overflow-x-auto px-2">
                    <LifetimeTimeline/>
                </div>
            </div>

            <div className="border-t px-5 py-7 text-[13px] leading-relaxed sm:px-8"
                 style={{borderColor: ink.rule, color: ink.text}}>
                <SectionHead index="2." title="Boundary Interoperability Gates" aside="Automatic ABI Lowering"/>

                <div
                    className="hidden grid-cols-[12rem_1fr_6.5rem] gap-x-6 border-b pb-2 font-mono text-[10.5px] uppercase tracking-[0.08em] md:grid"
                    style={{borderColor: ink.rule, color: ink.faint}}
                >
                    <span>Gate</span>
                    <span>Lowering</span>
                    <span className="text-right">Copied</span>
                </div>
                <ul>
                    {gates.map((g, i) => (
                        <li
                            key={i}
                            className="grid gap-x-6 gap-y-1.5 py-4 md:grid-cols-[12rem_1fr_6.5rem]"
                            style={i > 0 ? {borderTop: `1px solid ${ink.rule}`} : undefined}
                        >
                            <div className="flex flex-col items-start gap-1.5">
                                <span className="font-semibold">{g.name}</span>
                                {g.site}
                            </div>
                            <p className="text-[12.5px]" style={{color: ink.muted}}>
                                {g.lowering}
                            </p>
                            <div className="flex items-baseline gap-2 md:flex-col md:items-end md:gap-0.5">
                                <span
                                    className="font-mono text-[15px] font-semibold tabular-nums"
                                    style={{color: g.copies ? cp.ink : hue("in").ink}}
                                >
                                    {g.copied}
                                </span>
                                <span className="text-[11px]" style={{color: ink.faint}}>
                                    {g.copies ? "bytes copied" : "no copy"}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="mt-3 rounded-xl px-4 py-3.5 text-[12.5px]" style={{background: cp.fill}}>
                    <span className="font-semibold" style={{color: cp.ink}}>
                        A view bound to a local escapes.
                    </span>{" "}
                    <span style={{color: ink.muted}}>
                        <Code wrap>let rest = __builtin_string_view(text, …)</Code> raises <Code>text</Code>&rsquo;s escape to
                        Caller, and every caller&rsquo;s drop of it is declined. Build the view directly into the call
                        argument to keep it Local. The symptom is a <Code>--verify</Code> ledger imbalance;{" "}
                        <Code>aif --why</Code> names the binding as <Code>E-BIND</Code>.
                    </span>
                </div>
            </div>
        </SpecFigure>
    );
}
