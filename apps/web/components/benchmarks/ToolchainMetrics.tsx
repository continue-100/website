import React from 'react';
import { Timer, HardDrive, Zap, Cpu } from 'lucide-react';
import { ToolchainData } from '@/lib/benchmarks';

interface ToolchainMetricsProps {
    toolchain: ToolchainData;
}

export default function ToolchainMetrics({ toolchain }: ToolchainMetricsProps) {
    const { compileTime, binarySize } = toolchain;

    // Relative scales for progress bars
    const maxCompile = Math.max(
        compileTime.prismio.raw,
        compileTime.cpp.raw,
        compileTime.rust.raw,
        1
    );

    const maxBinary = Math.max(
        binarySize.prismio.raw,
        binarySize.cpp.raw,
        binarySize.rust.raw,
        1
    );

    const prismioCompilePct = Math.round((compileTime.prismio.raw / maxCompile) * 100);
    const cppCompilePct = Math.round((compileTime.cpp.raw / maxCompile) * 100);
    const rustCompilePct = Math.round((compileTime.rust.raw / maxCompile) * 100);

    const prismioBinaryPct = Math.round((binarySize.prismio.raw / maxBinary) * 100);
    const cppBinaryPct = Math.round((binarySize.cpp.raw / maxBinary) * 100);
    const rustBinaryPct = Math.round((binarySize.rust.raw / maxBinary) * 100);

    return (
        <section aria-label="Toolchain Compilation Speed and Binary Footprint" className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-[-0.02em] text-white">
                        Toolchain &amp; Binary Footprint
                    </h2>
                    <p className="text-xs text-zinc-400">
                        Wall-clock compilation speed and final stripped binary size across the full 78-workload suite.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Card 1: Compilation Speed */}
                <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-6 space-y-5">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                        <div className="flex items-center gap-2">
                            <Timer size={15} className="text-emerald-400" />
                            <span className="font-medium text-zinc-300">Compilation Speed</span>
                        </div>
                        <span className="font-mono text-zinc-500">Suite Clean Build</span>
                    </div>

                    <div className="flex items-baseline gap-3">
                        <span className="font-mono text-3xl font-bold text-white">
                            {compileTime.prismio.formatted}
                        </span>
                        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400 font-sans">
                            {compileTime.vsCppSpeedupPct >= 0
                                ? `${compileTime.vsCppSpeedupPct.toFixed(1)}% faster than Clang++`
                                : `${Math.abs(compileTime.vsCppSpeedupPct).toFixed(1)}% vs Clang++`}
                        </span>
                    </div>

                    <p className="text-xs leading-5 text-zinc-400">
                        Full compilation through the self-hosted frontend, AIF escape inference, and LLVM backend.
                    </p>

                    {/* Comparative Bars */}
                    <div className="space-y-3 pt-2">
                        {/* Prismio */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-emerald-400 font-medium">Prismio</span>
                                <span className="text-white font-semibold">{compileTime.prismio.formatted}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                <div
                                    style={{ width: `${prismioCompilePct}%` }}
                                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                />
                            </div>
                        </div>

                        {/* C++20 */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-amber-300">C++20 (Clang -O3)</span>
                                <span className="text-zinc-300">{compileTime.cpp.formatted}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                <div
                                    style={{ width: `${cppCompilePct}%` }}
                                    className="h-full bg-amber-400/80 rounded-full transition-all duration-500"
                                />
                            </div>
                        </div>

                        {/* Rust */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-indigo-300">Rust (rustc opt-3)</span>
                                <span className="text-zinc-300">{compileTime.rust.formatted}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                <div
                                    style={{ width: `${rustCompilePct}%` }}
                                    className="h-full bg-indigo-400/80 rounded-full transition-all duration-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Binary Size */}
                <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-6 space-y-5">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                        <div className="flex items-center gap-2">
                            <HardDrive size={15} className="text-indigo-400" />
                            <span className="font-medium text-zinc-300">Binary Footprint</span>
                        </div>
                        <span className="font-mono text-zinc-500">Stripped Executable</span>
                    </div>

                    <div className="flex items-baseline gap-3">
                        <span className="font-mono text-3xl font-bold text-white">
                            {binarySize.prismio.formatted}
                        </span>
                        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400 font-sans">
                            {binarySize.vsRustReductionPct >= 0
                                ? `${binarySize.vsRustReductionPct.toFixed(1)}% smaller than Rust`
                                : `${Math.abs(binarySize.vsRustReductionPct).toFixed(1)}% vs Rust`}
                        </span>
                    </div>

                    <p className="text-xs leading-5 text-zinc-400">
                        Self-contained binary containing embedded AIF memory runtime, allocators, and stdlib routines.
                    </p>

                    {/* Comparative Bars */}
                    <div className="space-y-3 pt-2">
                        {/* C++20 */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-amber-300">C++20 (Clang -O3)</span>
                                <span className="text-zinc-300">{binarySize.cpp.formatted}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                <div
                                    style={{ width: `${cppBinaryPct}%` }}
                                    className="h-full bg-amber-400/80 rounded-full transition-all duration-500"
                                />
                            </div>
                        </div>

                        {/* Prismio */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-emerald-400 font-medium">Prismio</span>
                                <span className="text-white font-semibold">{binarySize.prismio.formatted}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                <div
                                    style={{ width: `${prismioBinaryPct}%` }}
                                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                />
                            </div>
                        </div>

                        {/* Rust */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-indigo-300">Rust (rustc opt-3)</span>
                                <span className="text-zinc-300">{binarySize.rust.formatted}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                <div
                                    style={{ width: `${rustBinaryPct}%` }}
                                    className="h-full bg-indigo-400/80 rounded-full transition-all duration-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
