import type {ReactNode} from "react";
import {
    Arrowhead,
    ArrowheadRight,
    canvas,
    Code,
    Dot,
    hue,
    ink,
    Label,
    mono,
    noLigatures,
    Outline,
    sans,
    SectionHead,
    SpecFigure,
    type Tone,
} from "./diagram-kit";

const KICKER = "AIF Compiler Pass Architecture";

// ---------------------------------------------------------------------------
// 1. AIF Pipeline Diagram
// ---------------------------------------------------------------------------

// aifRunProfiled's call order, one row per call, in the lane of the file that
// implements it. The pass alternates between the self-hosted frontend and the
// native solver, and the order is semantic: see the numbered reasons.
// aifRunProfiled, one block per stage: its calls in order, the native table it
// writes, and the tables it reads. The reads are why the order is fixed.
const MAP = {
    width: 760,
    panelX: 16,
    panelTop: 100,
    stageX: 40,
    blockX: 180,
    blockW: 300,
    tableX: 540,
    tableW: 184,
    firstRow: 164,
    rowGap: 40,
    line: 26,
} as const;

type Impl = "psm" | "native";

type Call = { call: string; impl: Impl; note?: string; optional?: boolean; branch?: boolean };

type Stage = {
    index: string;
    name: string;
    about: [string, string];
    calls: Call[];
    reads: string[];
    table: { name: string; rows: [string, string] };
};

const stages: Stage[] = [
    {
        index: "01",
        name: "Declare",
        about: ["Index stable", "identities"],
        calls: [
            {call: "aif_reset()", impl: "native"},
            {call: "aifDeclare(module)", impl: "psm"},
        ],
        reads: [],
        table: {name: "symbols", rows: ["functions · scopes", "types · contracts"]},
    },
    {
        index: "02",
        name: "Build",
        about: ["Formulate", "fact graph"],
        calls: [
            {call: "aifBuild(module)", impl: "psm"},
            {call: "aif_profile_load(path)", impl: "native", note: "if --profile", optional: true},
        ],
        reads: ["symbols"],
        table: {name: "fact graph", rows: ["sites · keys · value sets", "constraints · access profile"]},
    },
    {
        index: "03",
        name: "Lay Out",
        about: ["Order, size,", "then split"],
        calls: [
            {call: "aifLayoutFixStandardLibrary", impl: "psm", note: "budget > 0", optional: true},
            {call: "aif_layout_select()", impl: "native", note: "budget > 0", optional: true},
            {call: "aifComputeSizes(module)", impl: "psm"},
            {call: "aifLayoutVeto*(module)", impl: "psm", note: "budget > 0", optional: true},
            {call: "aif_layout_split_select()", impl: "native", note: "budget > 0", optional: true},
        ],
        reads: ["fact graph"],
        table: {name: "layout", rows: ["field order · unsplit sizes", "hot/cold split"]},
    },
    {
        index: "04",
        name: "Solve & Infer",
        about: ["Lattice", "fixed point"],
        calls: [
            {call: "aif_solve(budget)", impl: "native"},
            {call: "aif_widen()", impl: "native", note: "if not converged", optional: true, branch: true},
            {call: "aif_check_pins", impl: "native", note: "P5002 · P5003"},
        ],
        reads: ["fact graph", "layout"],
        table: {name: "facts", rows: ["E × A × T × C per site", "tier · --why witness"]},
    },
    {
        index: "05",
        name: "Select & Place",
        about: ["Arenas and", "placement pins"],
        calls: [
            {call: "aif_place_arenas()", impl: "native"},
            {call: "aif_check_placement_pins", impl: "native", note: "P5004 · P5005"},
        ],
        reads: ["facts"],
        table: {name: "placement", rows: ["arenas · extents", "bracketed calls"]},
    },
];

const implTone: Record<Impl, Tone> = {psm: "vw", native: "ow"};

function blockHeight(s: Stage) {
    return Math.max(96, 48 + (s.calls.length - 1) * MAP.line + (s.reads.length ? 36 : 0));
}

const stageTops = stages.reduce<number[]>((tops, s, i) => {
    tops.push(i === 0 ? MAP.firstRow : tops[i - 1]! + blockHeight(stages[i - 1]!) + MAP.rowGap);
    return tops;
}, []);

const mapBottom = stageTops[stages.length - 1]! + blockHeight(stages[stages.length - 1]!);

function CompilerStations() {
    // The whole build, so the panel below reads as a zoom into one station.
    const stations: { label: string; w: number; aif?: boolean; optional?: boolean }[] = [
        {label: "parse + merge", w: 104},
        {label: "semantic analysis", w: 132},
        {label: "measure workload", w: 126, optional: true},
        {label: "AIF", w: 64, aif: true},
        {label: "reset", w: 60},
        {label: "IR generation", w: 106},
    ];
    const gap = 24;
    const total = stations.reduce((n, s) => n + s.w, 0) + gap * (stations.length - 1);
    let x = (MAP.width - total) / 2;
    const placed = stations.map((s) => {
        const at = x;
        x += s.w + gap;
        return {...s, x: at};
    });
    const aif = placed.find((s) => s.aif)!;
    const vw = hue("vw");
    const y = 16;
    const h = 32;
    const aifMid = aif.x + aif.w / 2;

    return (
        <g>
            {/* AIF's station expands into the panel below */}
            <line x1={aifMid} x2={aifMid} y1={y + h + 6} y2={MAP.panelTop - 10} strokeWidth={1.5}
                  style={{stroke: vw.acc}}/>
            <Arrowhead x={aifMid} y={MAP.panelTop - 4} color={vw.acc}/>

            {placed.map((s, i) => (
                <g key={s.label}>
                    <rect x={s.x} y={y} width={s.w} height={h} rx={8}
                          style={{fill: s.aif ? vw.acc : ink.surface}}/>
                    {!s.aif && (
                        <Outline x={s.x} y={y} w={s.w} h={h} r={8} color={ink.rule} dashed={s.optional}/>
                    )}
                    <Label x={s.x + s.w / 2} y={y + 20.5} size={12} weight={s.aif ? 700 : 500} anchor="middle"
                           color={s.aif ? ink.onAcc : s.optional ? ink.muted : ink.text}>
                        {s.label}
                    </Label>
                    {i < placed.length - 1 && (
                        <>
                            <line x1={s.x + s.w + 5} x2={s.x + s.w + gap - 8} y1={y + h / 2} y2={y + h / 2}
                                  style={{stroke: ink.faint}}/>
                            <ArrowheadRight x={s.x + s.w + gap - 4} y={y + h / 2} color={ink.faint}/>
                        </>
                    )}
                </g>
            ))}
        </g>
    );
}

function StageBlock({s, y}: { s: Stage; y: number }) {
    const h = blockHeight(s);
    const ow = hue("ow");
    return (
        <g>
            {/* stage label */}
            <Label x={MAP.stageX} y={y + 30} size={10.5} weight={600} color={ink.faint} family={mono}>
                {s.index}
            </Label>
            <Label x={MAP.stageX + 24} y={y + 30} size={13.5} weight={600} color={ink.text}>
                {s.name}
            </Label>
            <Label x={MAP.stageX} y={y + 52} size={11} color={ink.muted}>
                {s.about[0]}
            </Label>
            <Label x={MAP.stageX} y={y + 68} size={11} color={ink.muted}>
                {s.about[1]}
            </Label>

            {/* the calls, in order */}
            <rect x={MAP.blockX} y={y} width={MAP.blockW} height={h} rx={12} style={{fill: ink.surface}}/>
            <Outline x={MAP.blockX} y={y} w={MAP.blockW} h={h} r={12} color={ink.rule}/>
            {s.calls.map((c, i) => {
                const by = y + 30 + i * MAP.line;
                const indent = c.branch ? 16 : 0;
                const t = hue(implTone[c.impl]);
                return (
                    <g key={c.call}>
                        {c.branch && (
                            <path d={`M ${MAP.blockX + 20} ${by - 21} V ${by - 4} H ${MAP.blockX + 20 + indent - 5}`}
                                  fill="none" strokeDasharray="2 2" style={{stroke: ink.faint}}/>
                        )}
                        <circle cx={MAP.blockX + 20 + indent} cy={by - 4} r={3.5}
                                style={{fill: c.optional ? ink.surface : t.acc, stroke: t.acc}}
                                strokeWidth={1.5}/>
                        <Label x={MAP.blockX + 33 + indent} y={by} size={11} weight={500}
                               color={c.optional ? ink.muted : ink.text} family={mono}>
                            {c.call}
                        </Label>
                        {c.note && (
                            <Label x={MAP.blockX + MAP.blockW - 18} y={by} size={10.5} color={ink.faint} anchor="end">
                                {c.note}
                            </Label>
                        )}
                    </g>
                );
            })}
            {s.reads.length > 0 && (
                <g>
                    <line x1={MAP.blockX + 16} x2={MAP.blockX + MAP.blockW - 16} y1={y + h - 36} y2={y + h - 36}
                          style={{stroke: ink.rule}}/>
                    <text x={MAP.blockX + 20} y={y + h - 14} style={{fontFamily: sans, fontSize: 11}}>
                        <tspan style={{fill: ink.faint}}>reads</tspan>
                        {s.reads.map((r, i) => (
                            <tspan key={r} dx={i === 0 ? 7 : 0}
                                   style={{fill: ow.ink, fontFamily: mono, fontSize: 11, fontWeight: 500}}>
                                {i > 0 ? ` · ${r}` : r}
                            </tspan>
                        ))}
                    </text>
                </g>
            )}

            {/* writes → the native table */}
            <line x1={MAP.blockX + MAP.blockW + 8} x2={MAP.tableX - 12} y1={y + h / 2} y2={y + h / 2}
                  strokeWidth={1.4} style={{stroke: ow.acc}}/>
            <ArrowheadRight x={MAP.tableX - 6} y={y + h / 2} color={ow.acc}/>
            <Label x={(MAP.blockX + MAP.blockW + MAP.tableX) / 2 - 2} y={y + h / 2 - 8} size={10} color={ink.faint}
                   anchor="middle">
                writes
            </Label>

            <rect x={MAP.tableX} y={y} width={MAP.tableW} height={h} rx={12} style={{fill: ink.surface}}/>
            <rect x={MAP.tableX} y={y} width={MAP.tableW} height={38} rx={12} style={{fill: ow.fill}}/>
            <rect x={MAP.tableX} y={y + 24} width={MAP.tableW} height={14} style={{fill: ow.fill}}/>
            <line x1={MAP.tableX} x2={MAP.tableX + MAP.tableW} y1={y + 38} y2={y + 38} style={{stroke: ow.line}}/>
            <Outline x={MAP.tableX} y={y} w={MAP.tableW} h={h} r={12} color={ow.line}/>
            <Label x={MAP.tableX + 18} y={y + 24} size={12} weight={600} color={ow.ink} family={mono}>
                {s.table.name}
            </Label>
            {s.table.rows.map((r, i) => (
                <Label key={r} x={MAP.tableX + 18} y={y + 62 + i * 20} size={11} color={ink.muted}>
                    {r}
                </Label>
            ))}
        </g>
    );
}

function PipelineMap() {
    const ow = hue("ow");
    const tablesMid = MAP.tableX + MAP.tableW / 2;
    const panelBottom = mapBottom + 32;
    const irY = panelBottom + 40;
    const irX = MAP.blockX;
    const irW = MAP.tableX + MAP.tableW - MAP.blockX;
    return (
        <svg
            viewBox={`0 0 ${MAP.width} ${irY + 52}`}
            role="img"
            aria-label="AIF inside the build: five stages run in a fixed order, each writing a native table that later stages and IR generation read"
            className="mx-auto block h-auto w-full min-w-[640px] max-w-[780px] select-none"
        >
            <CompilerStations/>

            <rect x={MAP.panelX} y={MAP.panelTop} width={MAP.width - 2 * MAP.panelX} height={panelBottom - MAP.panelTop}
                  rx={20} style={{fill: hue("vw").fill, opacity: 0.45}}/>
            <Outline x={MAP.panelX} y={MAP.panelTop} w={MAP.width - 2 * MAP.panelX} h={panelBottom - MAP.panelTop}
                     r={20} color={hue("vw").line}/>

            {/* column heads and implementation key */}
            <Label x={MAP.stageX} y={MAP.panelTop + 38} size={10} weight={600} color={ink.faint} family={mono}>
                STAGE
            </Label>
            <Label x={MAP.blockX} y={MAP.panelTop + 38} size={10} weight={600} color={ink.faint} family={mono}>
                CALLS, IN ORDER
            </Label>
            <g>
                <circle cx={MAP.blockX + 150} cy={MAP.panelTop + 34.5} r={3.5} style={{fill: hue("vw").acc}}/>
                <Label x={MAP.blockX + 158} y={MAP.panelTop + 38} size={10} color={ink.muted} family={mono}>
                    .psm
                </Label>
                <circle cx={MAP.blockX + 204} cy={MAP.panelTop + 34.5} r={3.5} style={{fill: ow.acc}}/>
                <Label x={MAP.blockX + 212} y={MAP.panelTop + 38} size={10} color={ink.muted} family={mono}>
                    native C
                </Label>
            </g>
            <Label x={MAP.tableX} y={MAP.panelTop + 38} size={10} weight={600} color={ink.faint} family={mono}>
                NATIVE TABLES
            </Label>

            {stages.map((s, i) => {
                const y = stageTops[i]!;
                const next = stageTops[i + 1];
                const bottom = y + blockHeight(s);
                const cx = MAP.blockX + MAP.blockW / 2;
                return (
                    <g key={s.index}>
                        {next !== undefined && (
                            <>
                                <line x1={cx} x2={cx} y1={bottom + 6} y2={next - 10} strokeWidth={1.4}
                                      style={{stroke: ink.faint}}/>
                                <Arrowhead x={cx} y={next - 4} color={ink.faint}/>
                            </>
                        )}
                        <StageBlock s={s} y={y}/>
                    </g>
                );
            })}

            {/* the tables leave AIF; IR generation queries them */}
            <line x1={tablesMid} x2={tablesMid} y1={mapBottom + 6} y2={irY - 10} strokeWidth={1.4}
                  style={{stroke: ow.acc}}/>
            <Arrowhead x={tablesMid} y={irY - 4} color={ow.acc}/>
            <rect x={irX} y={irY} width={irW} height={44} rx={12} style={{fill: ink.surface}}/>
            <Outline x={irX} y={irY} w={irW} h={44} r={12} color={ink.rule}/>
            <text x={irX + irW / 2} y={irY + 27} textAnchor="middle" style={{fontFamily: sans, fontSize: 12}}>
                <tspan style={{fill: ink.text, fontWeight: 600}}>IR generation</tspan>
                <tspan dx={6} style={{fill: ink.muted}}>queries these tables by AST node · type · field · function · scope</tspan>
            </text>
        </svg>
    );
}

const orderRules: ReactNode[] = [
    <><Code>aifComputeSizes</Code> reads the chosen field order: padding, and with it the T0 byte threshold,
        depends on it.</>,
    <>The split comes after sizing, and sizes stay unsplit, so layout never feeds back into the solve.</>,
    <>The split comes before the solve, which reads its release half through <Code>elem_disposition_of</Code>; a
        later split is a cold block nothing frees.</>,
    <>Tier pins settle before <Code>aif_place_arenas</Code>, because the cost model ranks scopes by tiers;
        placement pins need the arena table, so they run last.</>,
];

const allocationPaths: { when: ReactNode; path: string; runtime: string; t: Tone }[] = [
    {when: "an arena serves the node", path: "ir_alloc_region", runtime: "arena_alloc", t: "ow"},
    {when: <>tier <Code>T0</Code>, entry block</>, path: "ir_alloc_stack", runtime: "alloca", t: "in"},
    {when: <>countable <Code>T3</Code> / <Code>T4a</Code></>, path: "ir_alloc_rc", runtime: "rc_alloc", t: "cp"},
    {when: <>collectable <Code>T4b</Code> / cyclic <Code>T4a</Code></>, path: "ir_alloc_cycle", runtime: "cyc_alloc", t: "rs"},
    {when: "no specialized mechanism", path: "ir_alloc_object", runtime: "heap", t: "vw"},
];

export function AifPipelineDiagram() {
    return (
        <SpecFigure
            labelledBy="aif-pipeline-diagram-title"
            kicker={KICKER}
            title="AIF Execution Pipeline & Intermediate Representations"
            badge="IR Pipeline Seam"
            description="AIF operates between semantic ownership verification and LLVM IR generation. It computes allocation, lifetime, and placement tables that code generation queries by AST node."
            caption={
                <>
                    Deterministic node and constraint ordering means the same source and settings produce the same
                    manifest, never a result chosen by hash order or thread timing. Truncated budgets widen safely
                    upward: <Code>aif_widen</Code> runs whenever <Code>aif_solve</Code> does not converge.
                </>
            }
        >
            <div className="border-t px-5 pb-8 pt-7 sm:px-8" style={{borderColor: ink.rule, background: canvas}}>
                <SectionHead index="I." title="Phase I · Abstract Interpretation"
                             aside={<>aifRunProfiled · src/aif/report.psm</>}/>
                <div className="-mx-2 overflow-x-auto px-2">
                    <PipelineMap/>
                </div>
                <div className="mx-auto mt-6 max-w-[720px]">
                    <h5 className="text-[12.5px] font-semibold" style={{color: ink.text}}>Why the order is fixed</h5>
                    <ul className="mt-2 grid gap-x-8 gap-y-2 text-[12.5px] leading-relaxed sm:grid-cols-2"
                        style={{color: ink.muted}}>
                        {orderRules.map((r, i) => (
                            <li key={i} className="grid grid-cols-[0.875rem_1fr] items-baseline">
                                <span className="inline-block h-px w-2 translate-y-[-3px]"
                                      style={{background: hue("ow").acc}}/>
                                <span>{r}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="border-t px-5 py-7 text-[13px] leading-relaxed sm:px-8"
                 style={{borderColor: ink.rule, color: ink.text}}>
                <SectionHead index="II." title="Phase II · Physical Lowering & Verification"
                             aside="src/ir/* + runtime/llvm-api-backend.c"/>
                <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
                    <div>
                        <h5 className="text-[12.5px] font-semibold">
                            <span className="mr-2 font-mono text-[11.5px]" style={{color: ink.faint}}>06</span>
                            Lower
                        </h5>
                        <p className="mt-1 text-[12.5px]" style={{color: ink.muted}}>
                            Struct construction picks one of five backend paths from the tables:
                        </p>
                        <ul className="mt-3">
                            {allocationPaths.map((a, i) => (
                                <li key={a.path}
                                    className="grid grid-cols-1 items-baseline gap-x-4 gap-y-0.5 py-2 text-[12.5px] sm:grid-cols-[12.5rem_1fr]"
                                    style={i > 0 ? {borderTop: `1px solid ${ink.rule}`} : undefined}>
                                    <span className="flex items-center gap-2" style={{color: ink.muted}}>
                                        <Dot t={a.t}/>
                                        <span>{a.when}</span>
                                    </span>
                                    <span className="break-words font-mono text-[12px] sm:whitespace-nowrap" style={{fontFeatureSettings: noLigatures}}>
                                        {a.path}
                                        <span style={{color: ink.faint}}> → </span>
                                        <span style={{color: hue(a.t).ink}}>{a.runtime}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-3 text-[12px]" style={{color: ink.muted}}>
                            The same tables drive scope drop lists, <Code>aif_releases_on_overwrite_node</Code>, container
                            element dispositions, generated <Code>__aif_release_&lt;Type&gt;</Code> functions,{" "}
                            <Code>arena_push</Code> / <Code>arena_pop</Code>, and <Code>rt_arena_hint_push</Code> /{" "}
                            <Code>rt_arena_hint_pop</Code> around runtime producers.
                        </p>
                    </div>
                    <div>
                        <h5 className="text-[12.5px] font-semibold">
                            <span className="mr-2 font-mono text-[11.5px]" style={{color: ink.faint}}>07</span>
                            Audit & Verify
                        </h5>
                        <dl className="mt-3 space-y-3 text-[12.5px]">
                            <div>
                                <dt><Code>prismio aif --manifest</Code></dt>
                                <dd className="mt-1" style={{color: ink.muted}}>
                                    Stable CI artifact, sorted by function symbol and site ordinal so moved lines do
                                    not rewrite identities.
                                </dd>
                            </div>
                            <div>
                                <dt><Code>prismio aif --why=&lt;id&gt;</Code></dt>
                                <dd className="mt-1" style={{color: ink.muted}}>
                                    One maximal predecessor per fact: a stable causal witness, not always the shortest.
                                </dd>
                            </div>
                            <div>
                                <dt><Code>prismio build --verify</Code></dt>
                                <dd className="mt-1" style={{color: ink.muted}}>
                                    Ledger-backed allocator: every block released exactly once, poisoned on release.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </SpecFigure>
    );
}

// ---------------------------------------------------------------------------
// 2. AIF Tier Decision Diagram
// ---------------------------------------------------------------------------

// Four lattices drawn as Hasse chains, ⊥ at the bottom. Arrows point the only
// way transfer moves a fact, labelled with the rules that raise it.
const LAT = {
    width: 644,
    col: 138,
    gap: 16,
    nodeH: 30,
    rise: 42,
    base: 238,
} as const;

type Lattice = {
    symbol: string;
    name: string;
    about: [string, string];
    t: Tone;
    levels: string[];
    // Rules on each rise, bottom-up; one entry per arrow.
    rules: string[][];
    footnote: string;
};

const lattices: Lattice[] = [
    {
        symbol: "E",
        name: "Escape Scope",
        about: ["Latest region known to", "contain the value"],
        t: "ow",
        levels: ["Region(scope)", "Caller", "Global"],
        rules: [["E-RETURN", "E-OPAQUE"], ["E-STATIC", "E-SPAWN"]],
        footnote: "regions join at lexical LCA",
    },
    {
        symbol: "A",
        name: "Aliasing",
        about: ["Strength of simultaneous", "references"],
        t: "vw",
        levels: ["Unique", "Borrowed", "Shared"],
        rules: [["A-CALL"], ["A-COPY", "A-CONTAIN"]],
        footnote: "unique cuts propagation",
    },
    {
        symbol: "T",
        name: "Thread Affinity",
        about: ["Local, moved, or reached", "by two tasks"],
        t: "cp",
        levels: ["Isolated", "Transferred", "CrossThread"],
        rules: [["T-SPAWN-MOVE"], ["T-SPAWN-SHARE"]],
        footnote: "joined spawns stay bounded",
    },
    {
        symbol: "C",
        name: "Cyclicity",
        about: ["SCC membership in the", "type reference graph"],
        t: "rs",
        levels: ["Acyclic", "MaybeCyclic"],
        rules: [["non-trivial SCC"]],
        footnote: "C-UNIQUE proves Acyclic",
    },
];

function LatticeChains() {
    return (
        <svg
            viewBox={`0 0 ${LAT.width} ${LAT.base + 52}`}
            role="img"
            aria-label="The four fact lattices, each rising from its cheapest value to its conservative top"
            className="mx-auto block h-auto w-full min-w-[540px] max-w-[720px] select-none"
        >
            {lattices.map((l, c) => {
                const x = 26 + c * (LAT.col + LAT.gap);
                const h = hue(l.t);
                const nodeY = (lvl: number) => LAT.base - lvl * (LAT.nodeH + LAT.rise);
                const top = l.levels.length - 1;
                return (
                    <g key={l.symbol}>
                        <Label x={x} y={18} size={17} weight={700} color={h.ink} family={mono}>
                            {l.symbol}
                        </Label>
                        <Label x={x + 18} y={17} size={12.5} weight={600} color={ink.text}>
                            {l.name}
                        </Label>
                        <Label x={x} y={36} size={10.5}>
                            {l.about[0]}
                        </Label>
                        <Label x={x} y={50} size={10.5}>
                            {l.about[1]}
                        </Label>

                        {l.levels.map((v, lvl) => {
                            const y = nodeY(lvl);
                            const isTop = lvl === top;
                            return (
                                <g key={v}>
                                    <rect x={x} y={y} width={LAT.col} height={LAT.nodeH} rx={8}
                                          style={{fill: lvl === 0 ? h.fill : ink.surface}}/>
                                    <Outline x={x} y={y} w={LAT.col} h={LAT.nodeH} r={8}
                                             color={isTop ? h.acc : h.line} width={isTop ? 1.5 : 1}/>
                                    <Label x={x + 12} y={y + 19.5} size={11.5} weight={isTop ? 600 : 500}
                                           color={h.ink} family={mono}>
                                        {v}
                                    </Label>
                                    <Label x={x + LAT.col - 10} y={y + 19.5} size={11} color={ink.faint}
                                           anchor="end">
                                        {lvl === 0 ? "⊥" : isTop ? "⊤" : ""}
                                    </Label>
                                </g>
                            );
                        })}

                        {l.rules.map((rules, k) => {
                            const yFrom = nodeY(k);
                            const yTo = nodeY(k + 1) + LAT.nodeH;
                            const ax = x + 20;
                            return (
                                <g key={k}>
                                    <line x1={ax} x2={ax} y1={yFrom} y2={yTo + 7} strokeWidth={1.5}
                                          style={{stroke: h.acc}}/>
                                    <path d={`M ${ax - 4.5} ${yTo + 7.5} L ${ax} ${yTo} L ${ax + 4.5} ${yTo + 7.5} Z`}
                                          style={{fill: h.acc}}/>
                                    {rules.map((r, j) => (
                                        <Label key={r} x={ax + 12} y={yTo + 17 + j * 13} size={9.5} weight={500}
                                               color={ink.muted} family={r.includes(" ") ? sans : mono}>
                                            {r}
                                        </Label>
                                    ))}
                                </g>
                            );
                        })}

                        <Label x={x} y={LAT.base + LAT.nodeH + 20} size={10.5} color={ink.muted}>
                            {l.footnote}
                        </Label>
                    </g>
                );
            })}
        </svg>
    );
}

type Rung = {
    tier: string;
    ordinal: number;
    t: Tone;
    clause: ReactNode;
    placement: string;
    mechanism: ReactNode;
    fallback?: ReactNode;
};

const ladder: Rung[] = [
    {
        tier: "T0",
        ordinal: 0,
        t: "in",
        clause: <>E = own scope ∧ A ≤ Borrowed ∧ struct ∧ 0 &lt; bytes ≤ 256 ∧ ¬foreign ∧ ¬in_container ∧
            ¬no_stack</>,
        placement: "stack",
        mechanism: <>entry-block <Code>alloca</Code>, one slot per site; no release call</>,
    },
    {
        tier: "T1",
        ordinal: 1,
        t: "ow",
        clause: <>E ∉ {"{"}Caller, Global{"}"} ∧ ¬(in_container ∧ A = Shared)</>,
        placement: "region:<name>",
        mechanism: <><Code>arena_alloc</Code> bump; bulk reset at <Code>arena_pop</Code></>,
        fallback: <><Code>region:none</Code>: scoped heap, freed one at a time</>,
    },
    {
        tier: "T2",
        ordinal: 2,
        t: "vw",
        clause: <>A ≤ Borrowed ∧ T ≤ Transferred</>,
        placement: "owned",
        mechanism: <>unique heap owner, deterministic release</>,
        fallback: <><Code>region:&lt;name&gt;</Code> when a bracketed call places it</>,
    },
    {
        tier: "T3",
        ordinal: 3,
        t: "cp",
        clause: <>T ≤ Transferred ∧ C = Acyclic</>,
        placement: "rc",
        mechanism: <>non-atomic count via <Code>rc_alloc</Code></>,
        fallback: <><Code>rc:none</Code>: no compiler-owned header or container edge</>,
    },
    {
        tier: "T4a",
        ordinal: 5,
        t: "rs",
        clause: <>T = CrossThread</>,
        placement: "rc-atomic",
        mechanism: <>atomic count, <Code>__atomic_add_fetch</Code>; cyclic types add the collector</>,
        fallback: <><Code>rc-atomic+cycle</Code> · <Code>rc:none</Code></>,
    },
    {
        tier: "T4b",
        ordinal: 4,
        t: "rs",
        clause: <>otherwise</>,
        placement: "rc+cycle",
        mechanism: <>count plus trial deletion via <Code>cyc_alloc</Code></>,
        fallback: <><Code>cycle:none</Code>: opaque, unowned, or uncollectable</>,
    },
];

export function AifTierDecisionDiagram() {
    return (
        <SpecFigure
            labelledBy="aif-tier-decision-diagram-title"
            kicker={KICKER}
            title="Monotone Fact Transfer to First-Match Strategy Ladder"
            badge="Formal Abstract Lattice"
            description="Four independent fact domains are solved to one fixed point. As analysis proceeds, facts can only rise monotonically toward conservative upper bounds. The first matching tier in the priority ladder states the obligation; placement and representability then decide the emitted mechanism."
            caption={
                <>
                    T4a and T4b handle orthogonal dimensions: T4a charges atomic operations for data two tasks reach,
                    while T4b activates trial-deletion cycle collection for potentially cyclic types. A T4a site whose
                    type is cyclic pays both. T4a carries the higher internal ordinal (5), so raising T never lowers
                    a tier; reports still print T4b first.
                </>
            }
        >
            <div className="border-t px-5 pb-8 pt-7 sm:px-8" style={{borderColor: ink.rule, background: canvas}}>
                <SectionHead index="1." title="Four Monotonic Fact Domains (Transfer Only Rises: ⊥ → ⊤)"
                             aside="aif_solve"/>
                <div className="-mx-2 overflow-x-auto px-2">
                    <LatticeChains/>
                </div>
                <p className="mx-auto mt-5 max-w-[720px] text-[12.5px] leading-relaxed" style={{color: ink.muted}}>
                    <span className="font-semibold" style={{color: ink.text}}>Widening</span> after an exhausted
                    budget jumps the last changed frontier straight to ⊤: <Code>E := Global</Code>,{" "}
                    <Code>A := Shared</Code>, <Code>C := MaybeCyclic</Code>, and <Code>T := CrossThread</Code> only
                    when the program has tasks.
                </p>
            </div>

            <div className="border-t px-5 py-7 text-[13px] leading-relaxed sm:px-8"
                 style={{borderColor: ink.rule, color: ink.text}}>
                <SectionHead index="2." title="First-Match Physical Strategy Ladder"
                             aside="derived_tier · Evaluated Top to Bottom"/>
                <div
                    className="hidden grid-cols-[4.5rem_1.25fr_1fr] gap-x-6 border-b pb-2 font-mono text-[10.5px] uppercase tracking-[0.08em] md:grid"
                    style={{borderColor: ink.rule, color: ink.faint}}
                >
                    <span>Tier</span>
                    <span>Clause (first match wins)</span>
                    <span>Manifest · mechanism</span>
                </div>
                <ol className="relative">
                    {ladder.map((r, i) => (
                        <li key={r.tier}
                            className="relative grid gap-x-6 gap-y-1.5 py-3.5 md:grid-cols-[4.5rem_1.25fr_1fr]"
                            style={i > 0 ? {borderTop: `1px solid ${ink.rule}`} : undefined}>
                            <div className="flex items-baseline gap-2">
                                <Dot t={r.t}/>
                                <span className="font-mono text-[14px] font-bold" style={{color: hue(r.t).ink}}>
                                    {r.tier}
                                </span>
                                <span className="font-mono text-[10.5px]" style={{color: ink.faint}}>
                                    #{r.ordinal}
                                </span>
                            </div>
                            <p className="font-mono text-[12px] leading-relaxed"
                               style={{color: ink.text, fontFeatureSettings: noLigatures}}>
                                {r.clause}
                            </p>
                            <div className="text-[12.5px]">
                                <span className="font-mono text-[12px] font-semibold"
                                      style={{color: hue(r.t).ink, fontFeatureSettings: noLigatures}}>
                                    {r.placement}
                                </span>
                                <span style={{color: ink.muted}}> · {r.mechanism}</span>
                                {r.fallback && (
                                    <div className="mt-1 text-[12px]" style={{color: ink.muted}}>
                                        <span style={{color: ink.faint}}>else </span>
                                        {r.fallback}
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </SpecFigure>
    );
}

// ---------------------------------------------------------------------------
// 3. AIF Region Placement Diagram
// ---------------------------------------------------------------------------

// Three executions on one time axis: an automatic arena narrowed to its served
// extent, a callee served by its caller's arena, and the individual fallback.
const REG = {
    width: 620,
    left: 26,
    right: 594,
    row: 190,
} as const;

function tx(f: number) {
    // Fraction of the time axis to x.
    return REG.left + 186 + f * (REG.right - REG.left - 186);
}

function RowTitle({y, index, name, verdict, result, t}: {
    y: number;
    index: string;
    name: string;
    verdict: string;
    result: string;
    t: Tone;
}) {
    return (
        <g>
            <Label x={REG.left} y={y} size={10.5} weight={600} color={ink.faint} family={mono}>
                {index}
            </Label>
            <Label x={REG.left} y={y + 17} size={12.5} weight={600} color={ink.text}>
                {name}
            </Label>
            <Label x={REG.left} y={y + 33} size={10.5} color={hue(t).ink}>
                {verdict}
            </Label>
            <Label x={REG.left} y={y + 52} size={10.5} weight={600} color={hue(t).ink} family={mono}>
                {result}
            </Label>
        </g>
    );
}

function Alloc({x, y, t, hollow = false}: { x: number; y: number; t: Tone; hollow?: boolean }) {
    return <circle cx={x} cy={y} r={4.5} strokeWidth={1.75}
                   style={{fill: hollow ? ink.surface : hue(t).acc, stroke: hue(t).acc}}/>;
}

function Bar({x0, x1, y, h, t, label, labelRight}: {
    x0: number;
    x1: number;
    y: number;
    h: number;
    t: Tone | null;
    label?: string;
    labelRight?: string;
}) {
    return (
        <g>
            <rect x={x0} y={y} width={x1 - x0} height={h} rx={7}
                  style={{fill: t ? hue(t).fill : ink.well}}/>
            <Outline x={x0} y={y} w={x1 - x0} h={h} r={7} color={t ? hue(t).line : ink.rule}/>
            {label && (
                <Label x={x0 + 9} y={y + h / 2 + 4} size={10.5} weight={500} color={t ? hue(t).ink : ink.muted}
                       family={mono}>
                    {label}
                </Label>
            )}
            {labelRight && (
                <Label x={x1 - 9} y={y + h / 2 + 4} size={10.5} color={ink.muted} anchor="end">
                    {labelRight}
                </Label>
            )}
        </g>
    );
}

function Bracket({x, y, h, name, side}: { x: number; y: number; h: number; name: string; side: "open" | "close" }) {
    const d = side === "open"
        ? `M ${x + 5} ${y} H ${x} V ${y + h} H ${x + 5}`
        : `M ${x - 5} ${y} H ${x} V ${y + h} H ${x - 5}`;
    return (
        <g>
            <path d={d} fill="none" strokeWidth={2} strokeLinejoin="round" style={{stroke: hue("ow").acc}}/>
            <Label x={x} y={y - 6} size={10} weight={500} color={hue("ow").ink} anchor="middle" family={mono}>
                {name}
            </Label>
        </g>
    );
}

function RegionTimelines() {
    const r1 = 30;
    const r2 = r1 + REG.row;
    const r3 = r2 + REG.row + 30;
    const ow = hue("ow");

    return (
        <svg
            viewBox={`0 0 ${REG.width} ${r3 + 118}`}
            role="img"
            aria-label="Three arena outcomes on a time axis: a narrowed automatic arena, a callee served by its caller's arena, and individual heap release"
            className="mx-auto block h-auto w-full min-w-[540px] max-w-[720px] select-none"
        >
            {/* 01 · lexical: an automatic arena narrowed to first served allocation → last use */}
            <RowTitle y={r1} index="01 · LEXICAL" name="Local Region Containment" verdict="Proven Scope-Local"
                      result="region:auto" t="ow"/>
            <Bar x0={tx(0)} x1={tx(1)} y={r1 + 6} h={112} t={null}/>
            <Label x={tx(0) + 10} y={r1 + 24} size={10.5} color={ink.muted}>
                lexical scope {"{ … }"}
            </Label>
            <Bar x0={tx(0.2)} x1={tx(0.78)} y={r1 + 52} h={40} t="ow"/>
            <Bracket x={tx(0.2)} y={r1 + 52} h={40} name="arena_push" side="open"/>
            <Bracket x={tx(0.78)} y={r1 + 52} h={40} name="arena_pop" side="close"/>
            {[0.28, 0.38, 0.52].map((f) => (
                <g key={f}>
                    <Alloc x={tx(f)} y={r1 + 72} t="ow"/>
                </g>
            ))}
            <Label x={tx(0.33)} y={r1 + 108} size={10} color={ow.ink} anchor="middle" family={mono}>
                arena_alloc × n
            </Label>
            <line x1={tx(0.7)} x2={tx(0.7)} y1={r1 + 58} y2={r1 + 86} strokeDasharray="2 2"
                  style={{stroke: ow.acc}}/>
            <Label x={tx(0.7)} y={r1 + 108} size={10} color={ink.muted} anchor="middle">
                last use
            </Label>
            <Label x={tx(0.9)} y={r1 + 76} size={10} color={ink.muted} anchor="middle">
                bulk reset
            </Label>

            {/* 02 · bracketed: the callee allocates from its caller's active arena */}
            <RowTitle y={r2} index="02 · BRACKETED" name="Call-Site Arena Extent" verdict="Proven Callee Extent"
                      result="region:<name>" t="vw"/>
            <Bar x0={tx(0)} x1={tx(1)} y={r2 + 20} h={34} t="ow" label="region req { … }"/>
            <Bracket x={tx(0)} y={r2 + 20} h={34} name="arena_push" side="open"/>
            <Bracket x={tx(1)} y={r2 + 20} h={34} name="arena_pop" side="close"/>
            <Bar x0={tx(0.3)} x1={tx(0.92)} y={r2 + 96} h={34} t="vw" label="parse_payload(data)"/>
            <path d={`M ${tx(0.3)} ${r2 + 54} V ${r2 + 89}`} fill="none" strokeWidth={1.4}
                  style={{stroke: ink.faint}}/>
            <Arrowhead x={tx(0.3)} y={r2 + 95} color={ink.faint}/>
            <Label x={tx(0.3) - 8} y={r2 + 78} size={10} color={ink.muted} anchor="end">
                call
            </Label>
            {[0.72, 0.82].map((f) => (
                <g key={f}>
                    <path d={`M ${tx(f)} ${r2 + 104} V ${r2 + 62}`} fill="none" strokeWidth={1.4}
                          style={{stroke: ow.acc}}/>
                    <path d={`M ${tx(f) - 4.5} ${r2 + 62} L ${tx(f)} ${r2 + 55} L ${tx(f) + 4.5} ${r2 + 62} Z`}
                          style={{fill: ow.acc}}/>
                    <Alloc x={tx(f)} y={r2 + 113} t="vw"/>
                </g>
            ))}
            <Label x={tx(0.72) - 12} y={r2 + 78} size={10} color={ow.ink} anchor="end">
                served by the active arena
            </Label>
            <Label x={tx(0.3)} y={r2 + 148} size={10} color={ink.muted}>
                sites keep tier T2; the callee signature is unchanged
            </Label>

            {/* 03 · fallback: no arena, every value freed on its own */}
            <RowTitle y={r3} index="03 · FALLBACK" name="Individual Scoped Heap" verdict="Safety Guarantee"
                      result="region:none" t="rs"/>
            <Bar x0={tx(0)} x1={tx(1)} y={r3 + 10} h={80} t={null}/>
            <Label x={tx(0) + 10} y={r3 + 28} size={10.5} color={ink.muted}>
                unproven lifetime, benefit ≤ 0, or escape
            </Label>
            {([
                [0.14, 0.44],
                [0.3, 0.62],
                [0.5, 0.86],
            ] as const).map(([a, f], i) => (
                <g key={i}>
                    <line x1={tx(a)} x2={tx(f)} y1={r3 + 44 + i * 14} y2={r3 + 44 + i * 14} strokeWidth={1.5}
                          style={{stroke: hue("rs").line}}/>
                    <Alloc x={tx(a)} y={r3 + 44 + i * 14} t="rs"/>
                    <path
                        d={`M ${tx(f) - 3.5} ${r3 + 40.5 + i * 14} L ${tx(f) + 3.5} ${r3 + 47.5 + i * 14} M ${tx(f) + 3.5} ${r3 + 40.5 + i * 14} L ${tx(f) - 3.5} ${r3 + 47.5 + i * 14}`}
                        strokeWidth={1.75} strokeLinecap="round" style={{stroke: hue("rs").acc}}/>
                </g>
            ))}
            <Label x={tx(1) - 10} y={r3 + 28} size={10.5} color={ink.muted} anchor="end">
                free() per value
            </Label>

            {/* legend */}
            <g>
                <Alloc x={REG.left + 4} y={r3 + 112} t="ow"/>
                <Label x={REG.left + 14} y={r3 + 115.5} size={10.5}>allocation</Label>
                <path
                    d={`M ${REG.left + 90} ${r3 + 108.5} L ${REG.left + 97} ${r3 + 115.5} M ${REG.left + 97} ${r3 + 108.5} L ${REG.left + 90} ${r3 + 115.5}`}
                    strokeWidth={1.75} strokeLinecap="round" style={{stroke: hue("rs").acc}}/>
                <Label x={REG.left + 104} y={r3 + 115.5} size={10.5}>individual free</Label>
                <path d={`M ${REG.left + 205} ${r3 + 107} H ${REG.left + 200} V ${r3 + 117} H ${REG.left + 205}`}
                      fill="none" strokeWidth={2} style={{stroke: ow.acc}}/>
                <Label x={REG.left + 212} y={r3 + 115.5} size={10.5}>arena extent, emitted by IR generation</Label>
            </g>
        </svg>
    );
}

const bracketBlockers: { flag: string; when: ReactNode }[] = [
    {flag: "AIF_BR_B_GLOBAL", when: "an allocation reaches static or global state"},
    {flag: "AIF_BR_B_PARAM_STORE", when: "the extent stores into an owner allocated outside it"},
    {flag: "AIF_BR_B_OPAQUE", when: "a sealed or opaque body lacks a complete ownership summary"},
    {flag: "AIF_BR_B_DROP", when: <>an explicit <Code>drop</Code> needs an individual deallocator</>},
    {flag: "AIF_BR_B_SHARED_BODY", when: "an allocating body is also reachable outside the regime"},
    {flag: "AIF_BR_B_MULTI_CALL", when: "call sites disagree on their innermost arena (soft)"},
];

export function AifRegionPlacementDiagram() {
    return (
        <SpecFigure
            labelledBy="aif-region-placement-diagram-title"
            kicker={KICKER}
            title="Arena Region Placement & Call-Site Bracketing"
            badge="Memory Model"
            description="Arenas are dynamically scoped at runtime, but admission is governed by static lifetime proofs. Memory allocated in a region is bulk-reclaimed upon region exit without individual deallocation passes."
            caption={
                <>
                    Call-site bracketing proves a callee extent runs strictly under a single caller region. The callee
                    allocates directly from the caller&rsquo;s active arena without modifying the callee signature;
                    runtime-produced strings and lists reach it through <Code>rt_arena_hint_push</Code> and{" "}
                    <Code>rt_arena_hint_pop</Code>, enabled only after the call&rsquo;s arguments are evaluated.
                </>
            }
        >
            <div className="border-t px-5 pb-8 pt-7 sm:px-8" style={{borderColor: ink.rule, background: canvas}}>
                <div className="-mx-2 overflow-x-auto px-2">
                    <RegionTimelines/>
                </div>
            </div>

            <div className="grid gap-x-10 gap-y-8 border-t px-5 py-7 text-[13px] leading-relaxed sm:px-8 lg:grid-cols-2"
                 style={{borderColor: ink.rule, color: ink.text}}>
                <div>
                    <SectionHead title="Placement Cost Model" aside="aif_place_arenas"/>
                    <pre
                        className="overflow-x-auto rounded-lg px-3.5 py-3 font-mono text-[12px] leading-relaxed"
                        style={{background: ink.well, color: ink.text, fontFeatureSettings: noLigatures}}
                    >
                        {"benefit = served × (α_T2 − α_T1)\n        − ARENA_SETUP\n        − λ × (held − live)"}
                    </pre>
                    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[12px]">
                        <dt className="font-mono" style={{color: ink.text}}>α_T2 − α_T1</dt>
                        <dd style={{color: ink.muted}}>90 − 3 cycles saved per served allocation</dd>
                        <dt className="font-mono" style={{color: ink.text}}>ARENA_SETUP</dt>
                        <dd style={{color: ink.muted}}>40, once per candidate scope</dd>
                        <dt className="font-mono" style={{color: ink.text}}>λ</dt>
                        <dd style={{color: ink.muted}}>2/100 per byte held until reset but not live</dd>
                        <dt className="font-mono" style={{color: ink.text}}>served</dt>
                        <dd style={{color: ink.muted}}>weighted 16× per enclosing loop, capped at 6 loops</dd>
                    </dl>
                    <p className="mt-3 text-[12px]" style={{color: ink.muted}}>
                        Threshold: <span className="font-semibold" style={{color: hue("in").ink}}>benefit &gt; 0</span> to
                        admit. Greedy and innermost-first; never nested inside a written <Code>region</Code>.
                    </p>
                </div>
                <div>
                    <SectionHead title="Bracketing Blockers" aside="aif_fn_bracket_blockers"/>
                    <ul>
                        {bracketBlockers.map((b, i) => (
                            <li key={b.flag} className="py-2"
                                style={i > 0 ? {borderTop: `1px solid ${ink.rule}`} : undefined}>
                                <span className="font-mono text-[11.5px] font-semibold"
                                      style={{color: hue("rs").ink}}>
                                    {b.flag}
                                </span>
                                <div className="text-[12px]" style={{color: ink.muted}}>{b.when}</div>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-2 text-[12px]" style={{color: ink.muted}}>
                        The inverse obligation is checked too: an arena-served container must not own a heap element
                        from outside the extent, or reset would leak its decrement.
                    </p>
                </div>
            </div>
        </SpecFigure>
    );
}
