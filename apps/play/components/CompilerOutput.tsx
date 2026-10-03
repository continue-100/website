'use client';

import React, { useState } from 'react';
import { ExecutionResult, CompilerOptions } from '../lib/compiler/types';
import {
    Terminal,
    Layers,
    Cpu,
    Network,
    AlertCircle,
    CheckCircle2,
    Copy,
    Check,
    Trash2,
    Clock,
    Sparkles
} from 'lucide-react';
import AifVisualizer from './AifVisualizer';
import LlvmIrViewer from './LlvmIrViewer';
import AstViewer from './AstViewer';
import DiagnosticsView from './DiagnosticsView';

interface CompilerOutputProps {
    result: ExecutionResult | null;
    isRunning: boolean;
    options: CompilerOptions;
}

type TabType = 'terminal' | 'aif' | 'llvm' | 'ast' | 'diagnostics';

export default function CompilerOutput({ result, isRunning, options }: CompilerOutputProps) {
    const [activeTab, setActiveTab] = useState<TabType>('terminal');
    const [copied, setCopied] = useState(false);

    const handleCopyStdout = async () => {
        if (!result) return;
        const textToCopy = result.stderr || result.stdout;
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const hasErrors = result ? !result.success : false;
    const errorCount = result ? result.diagnostics.filter((d) => d.level === 'error').length : 0;

    return (
        <div className="flex flex-col h-full bg-[#070709] overflow-hidden">
            {/* Tab Header Bar */}
            <div className="flex items-center justify-between px-2 sm:px-3 bg-[#0a0a0c] border-b border-white/10 text-xs select-none">
                <div className="flex items-center overflow-x-auto no-scrollbar pt-1.5 gap-0.5">
                    {/* Terminal Tab */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('terminal')}
                        className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-t-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'terminal'
                                ? 'bg-white/[0.04] text-white border-[#47d7b5]'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border-transparent'
                        }`}
                    >
                        <Terminal size={13} className={activeTab === 'terminal' ? 'text-[#47d7b5]' : 'text-zinc-600'} />
                        <span>Terminal Output</span>
                    </button>

                    {/* AIF Tab */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('aif')}
                        className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-t-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'aif'
                                ? 'bg-white/[0.04] text-white border-[#47d7b5]'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border-transparent'
                        }`}
                    >
                        <Layers size={13} className={activeTab === 'aif' ? 'text-[#47d7b5]' : 'text-zinc-600'} />
                        <span>AIF Storage</span>
                        {result && (
                            <span className="text-[10px] font-mono px-1 py-0.5 rounded-sm bg-white/[0.04] text-zinc-400">
                                {result.aif.allocations.length}
                            </span>
                        )}
                    </button>

                    {/* LLVM IR Tab */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('llvm')}
                        className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-t-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'llvm'
                                ? 'bg-white/[0.04] text-white border-indigo-400'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border-transparent'
                        }`}
                    >
                        <Cpu size={13} className={activeTab === 'llvm' ? 'text-indigo-400' : 'text-zinc-600'} />
                        <span>LLVM IR</span>
                    </button>

                    {/* AST Tab */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('ast')}
                        className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-t-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'ast'
                                ? 'bg-white/[0.04] text-white border-sky-400'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border-transparent'
                        }`}
                    >
                        <Network size={13} className={activeTab === 'ast' ? 'text-sky-400' : 'text-zinc-600'} />
                        <span>AST Tree</span>
                    </button>

                    {/* Diagnostics Tab */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('diagnostics')}
                        className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-t-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'diagnostics'
                                ? 'bg-white/[0.04] text-white border-rose-400'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border-transparent'
                        }`}
                    >
                        <AlertCircle size={13} className={hasErrors ? 'text-rose-400' : 'text-zinc-600'} />
                        <span>Diagnostics</span>
                        {errorCount > 0 && (
                            <span className="text-[10px] font-mono px-1 py-0.5 rounded-sm bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20">
                                {errorCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Right Tab Actions */}
                {activeTab === 'terminal' && result && (
                    <button
                        type="button"
                        onClick={handleCopyStdout}
                        className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] font-mono text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors shrink-0 mb-1"
                    >
                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                )}
            </div>

            {/* Tab Body */}
            <div className="flex-1 relative overflow-hidden bg-[#06070a]" aria-live="polite" aria-atomic="false">
                {isRunning ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-3">
                        <div className="h-6 w-6 border-2 border-zinc-700 border-t-[#47d7b5] rounded-full animate-spin" />
                        <span className="text-xs font-mono">Compiling...</span>
                    </div>
                ) : !result ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-3 p-6 text-center">
                        <Terminal size={28} className="text-zinc-800" />
                        <span className="text-sm font-medium text-zinc-400">Ready</span>
                        <p className="text-xs text-zinc-500 max-w-sm">
                            Click Run or press{' '}
                            <kbd className="px-1.5 py-0.5 rounded-sm bg-white/[0.03] border border-white/5 font-mono text-[10px]">
                                ⌘⏎
                            </kbd>
                        </p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'terminal' && (
                            <div className="flex flex-col h-full p-4 sm:p-5 font-mono text-xs leading-6 overflow-auto">
                                {/* Command Prompt Banner */}
                                <div className="text-zinc-600 select-none pb-2 border-b border-white/[0.04]">
                                    <span className="text-[#47d7b5]">~</span> prismio {options.command} main.psm {options.optimization} {options.verify ? '--verify' : ''}
                                </div>

                                {/* Stdout / Stderr output */}
                                <div className="py-3 flex-1 whitespace-pre font-mono">
                                    {result.stderr ? (
                                        <div className="text-rose-400">{result.stderr}</div>
                                    ) : (
                                        <div className="text-zinc-300">{result.stdout}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'aif' && (
                            <AifVisualizer report={result.aif} optionsVerify={options.verify} />
                        )}

                        {activeTab === 'llvm' && (
                            <LlvmIrViewer llvmIr={result.llvmIr} />
                        )}

                        {activeTab === 'ast' && (
                            <AstViewer ast={result.ast} />
                        )}

                        {activeTab === 'diagnostics' && (
                            <DiagnosticsView diagnostics={result.diagnostics} />
                        )}
                    </>
                )}
            </div>

            {/* Bottom Status Bar */}
            <div className="flex items-center justify-between px-3 py-1 bg-[#090a0f] border-t border-white/10 text-[11px] font-mono text-zinc-500 select-none" role="status" aria-live="polite">
                <div className="flex items-center gap-3">
                    {result ? (
                        result.success ? (
                            <div className="flex items-center gap-1.5 text-emerald-500">
                                <CheckCircle2 size={12} />
                                <span>Compiled successfully</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-rose-500">
                                <AlertCircle size={12} />
                                <span>Compile error (exit {result.exitCode})</span>
                            </div>
                        )
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                            <span>Idle</span>
                        </div>
                    )}

                    {result && (
                        <>
                            <span className="text-zinc-700">|</span>
                            <div className="flex items-center gap-1">
                                <Clock size={11} className="opacity-70" />
                                <span>{result.durationMs}ms</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline">{result?.toolchainVersion || 'prismio 0.1.0'}</span>
                    <span className="hidden sm:inline text-zinc-700">|</span>
                    <span>{result?.llvmVersion || 'LLVM 23'}</span>
                </div>
            </div>
        </div>
    );
}
