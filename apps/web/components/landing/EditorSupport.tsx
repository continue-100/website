import React from 'react';
import IntelliJPluginCard from '@/components/IntelliJPluginCard';

export default function EditorSupport() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
            <div className="mb-8 max-w-2xl">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                    Editor support
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                    Official language support for IntelliJ IDEA and JetBrains IDEs.
                </p>
            </div>

            <IntelliJPluginCard />
        </section>
    );
}
