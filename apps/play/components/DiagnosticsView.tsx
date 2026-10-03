'use client';

import React from 'react';
import { Diagnostic } from '../lib/compiler/types';
import { AlertCircle, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';

interface DiagnosticsViewProps {
    diagnostics: Diagnostic[];
}

export default function DiagnosticsView({ diagnostics }: DiagnosticsViewProps) {
    if (diagnostics.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center select-none" role="status" aria-live="polite">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <CheckCircle2 size={24} className="text-emerald-400" />
                </div>
                <h4 className="text-sm font-semibold text-white">Zero Diagnostics Emitted</h4>
                <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                    The source code passed all syntax verification, symbol resolution, and type checking stages without errors or warnings.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-5 space-y-4 font-mono text-xs" role="alert" aria-live="assertive">
            {diagnostics.map((diag, index) => {
                const isError = diag.level === 'error';
                const borderColor = isError ? 'border-rose-500/30' : 'border-amber-500/30';
                const bgColor = isError ? 'bg-rose-500/[0.04]' : 'bg-amber-500/[0.04]';
                const badgeColor = isError
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30';

                const caret = ' '.repeat(Math.max(0, diag.col - 1)) + '^'.repeat(diag.length || 1);

                return (
                    <div
                        key={index}
                        className={`rounded-xl border ${borderColor} ${bgColor} p-4 space-y-3 transition-all`}
                    >
                        {/* Title & Badge */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                {isError ? (
                                    <AlertCircle size={15} className="text-rose-400 shrink-0" />
                                ) : (
                                    <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                                )}
                                <span className="font-semibold text-zinc-100">
                                    {diag.level.toUpperCase()}[{diag.code}]: {diag.message}
                                </span>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[10px] border ${badgeColor}`}>
                                {diag.phase}
                            </span>
                        </div>

                        {/* Source Location */}
                        <div className="text-[11px] text-zinc-400 pl-6">
                            &rarr; main.psm:{diag.line}:{diag.col}
                        </div>

                        {/* Code Frame */}
                        {diag.sourceLineContent && (
                            <div className="rounded-lg bg-[#090a0f] border border-white/[0.06] p-3 text-[12px] leading-5 overflow-x-auto">
                                <div className="text-zinc-600 select-none">
                                    {String(diag.line).padStart(2)} | <span className="text-zinc-200">{diag.sourceLineContent}</span>
                                </div>
                                <div className="text-rose-400 font-bold select-none whitespace-pre">
                                    {'   | ' + caret}
                                </div>
                            </div>
                        )}

                        {/* Suggestion */}
                        {diag.suggestion && (
                            <div className="flex items-start gap-2 pt-1 text-[11px] text-emerald-400">
                                <Lightbulb size={14} className="shrink-0 mt-0.5" />
                                <span>help: {diag.suggestion}</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
