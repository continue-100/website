import React from 'react';

export type TerminalLine = {text: string; kind?: 'cmd' | 'out' | 'key'};

/** First word bright, flags in sky, the rest quiet: enough to scan a command at a glance. */
function Command({text}: {text: string}) {
    return (
        <>
            {text.split(' ').map((word, i) => (
                <React.Fragment key={i}>
                    {i > 0 && ' '}
                    <span className={i === 0 ? 'font-semibold text-white' : word.startsWith('-') ? 'text-sky-300' : 'text-zinc-300'}>
                        {word}
                    </span>
                </React.Fragment>
            ))}
        </>
    );
}

/** One flat terminal block: no window chrome, no glow. Output is real compiler output, shortened. */
export default function Terminal({lines, label}: {lines: TerminalLine[]; label?: string}) {
    return (
        <pre
            aria-label={label}
            className="overflow-x-auto rounded-xl bg-[#06070a] p-4 font-mono text-[13px] leading-6 ring-1 ring-white/[0.08] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
            {lines.map((line, i) =>
                line.kind === 'cmd' ? (
                    <div key={i} className={i > 0 ? 'mt-3' : undefined}>
                        <span className="mr-3 select-none text-indigo-400">$</span>
                        <Command text={line.text} />
                    </div>
                ) : (
                    <div key={i} className={line.kind === 'key' ? 'text-zinc-100' : 'text-zinc-400'}>
                        {line.text || ' '}
                    </div>
                ),
            )}
        </pre>
    );
}
