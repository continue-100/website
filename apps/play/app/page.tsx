'use client';

import React, { useState, useEffect, useCallback } from 'react';
import HeaderPlayground from '../components/HeaderPlayground';
import CompilerToolbar from '../components/CompilerToolbar';
import MonacoIdeEditor from '../components/MonacoIdeEditor';
import CompilerOutput from '../components/CompilerOutput';
import { CompilerOptions, ExecutionResult, Preset } from '../lib/compiler/types';
import { PLAYGROUND_PRESETS } from '../lib/compiler/presets';
import { runCompiler } from '../lib/compiler/engine';
import { formatPrismioCode } from '../lib/monaco/prismioFormatter';
import { Code2, Terminal } from 'lucide-react';
import ComingSoon from "@/components/ComingSoon";

export default function Page() {
    return <ComingSoon />;
}

// export default function PlaygroundPage() {
//     const defaultPreset = PLAYGROUND_PRESETS[1] ?? PLAYGROUND_PRESETS[0]!;
//     const [code, setCode] = useState<string>(defaultPreset.code);
//     const [currentPresetId, setCurrentPresetId] = useState<string>(defaultPreset.id);
//     const [options, setOptions] = useState<CompilerOptions>({
//         command: 'aif',
//         optimization: '-O0',
//         verify: true,
//         debug: false,
//         overflowChecks: true,
//     });
//     const [result, setResult] = useState<ExecutionResult | null>(null);
//     const [isRunning, setIsRunning] = useState<boolean>(false);
//     const [mobilePane, setMobilePane] = useState<'editor' | 'output'>('editor');
//
//     // Execute compilation
//     const handleRun = useCallback(() => {
//         setIsRunning(true);
//         // Slight timeout to give UI a responsive feel
//         setTimeout(() => {
//             const res = runCompiler(code, options);
//             setResult(res);
//             setIsRunning(false);
//         }, 60);
//     }, [code, options]);
//
//     // Handle preset selection
//     const handleSelectPreset = (preset: Preset) => {
//         setCurrentPresetId(preset.id);
//         setCode(preset.code);
//         if (preset.recommendedCommand) {
//             setOptions((prev) => ({
//                 ...prev,
//                 command: preset.recommendedCommand || 'run',
//             }));
//         }
//     };
//
//     // Handle reset
//     const handleReset = () => {
//         const found = PLAYGROUND_PRESETS.find((p) => p.id === currentPresetId) || defaultPreset;
//         setCode(found.code);
//     };
//
//     // Simple code formatter
//     const handleFormat = () => {
//         setCode(formatPrismioCode(code));
//     };
//
//     // Load from URL hash if present
//     useEffect(() => {
//         if (typeof window !== 'undefined' && window.location.hash) {
//             try {
//                 const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
//                 const encodedCode = params.get('code');
//                 if (encodedCode) {
//                     const decoded = decodeURIComponent(atob(encodedCode));
//                     setCode(decoded);
//                 }
//             } catch {
//                 // Ignore decoding error
//             }
//         }
//     }, []);
//
//     // Trigger initial run
//     useEffect(() => {
//         handleRun();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [options.command, options.optimization, options.verify]);
//
//     return (
//         <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070709] text-zinc-200">
//             {/* Top Navigation */}
//             <HeaderPlayground />
//
//             {/* Sub-header Toolbar */}
//             <CompilerToolbar
//                 options={options}
//                 onOptionsChange={setOptions}
//                 currentPresetId={currentPresetId}
//                 onSelectPreset={handleSelectPreset}
//                 onRun={handleRun}
//                 onReset={handleReset}
//                 onFormat={handleFormat}
//                 isRunning={isRunning}
//             />
//
//             {/* Mobile Tab Switcher (Editor vs Output) */}
//             <div className="flex md:hidden items-center border-b border-white/[0.08] bg-[#0c0d12] px-3 py-1.5 gap-2 text-xs">
//                 <button
//                     type="button"
//                     onClick={() => setMobilePane('editor')}
//                     className={`cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors ${
//                         mobilePane === 'editor'
//                             ? 'bg-white/[0.1] text-white'
//                             : 'text-zinc-400 hover:text-white'
//                     }`}
//                 >
//                     <Code2 size={13} className="text-[#47d7b5]" />
//                     <span>Source Code</span>
//                 </button>
//
//                 <button
//                     type="button"
//                     onClick={() => setMobilePane('output')}
//                     className={`cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors ${
//                         mobilePane === 'output'
//                             ? 'bg-white/[0.1] text-white'
//                             : 'text-zinc-400 hover:text-white'
//                     }`}
//                 >
//                     <Terminal size={13} className="text-indigo-400" />
//                     <span>Compiler Output</span>
//                 </button>
//             </div>
//
//             {/* Main Workbench Pane */}
//             <div className="flex-1 flex overflow-hidden">
//                 {/* Left Pane: Code Editor */}
//                 <div
//                     className={`w-full md:w-1/2 h-full border-r border-white/10 ${
//                         mobilePane === 'editor' ? 'flex' : 'hidden md:flex'
//                     }`}
//                 >
//                     <MonacoIdeEditor value={code} onChange={setCode} onRun={handleRun} />
//                 </div>
//
//                 {/* Right Pane: Compiler Output / Inspector */}
//                 <div
//                     className={`w-full md:w-1/2 h-full ${
//                         mobilePane === 'output' ? 'flex' : 'hidden md:flex'
//                     }`}
//                 >
//                     <CompilerOutput result={result} isRunning={isRunning} options={options} />
//                 </div>
//             </div>
//         </div>
//     );
// }
