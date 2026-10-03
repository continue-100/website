import React from 'react';
import IntelliJPluginCard from '@/components/IntelliJPluginCard';

export default function EditorSupport() {
    return (
        <section aria-labelledby="editor-heading" className="mx-auto max-w-7xl px-6 py-24">
            <div className="mb-12 max-w-2xl">
                <h2 id="editor-heading" className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                    Editor support
                </h2>
                <p className="mt-6 text-base leading-7 text-zinc-400">
                    Official Prismio support for IntelliJ IDEA, CLion, and other JetBrains IDEs.
                </p>
            </div>

            <IntelliJPluginCard />
        </section>
    );
}
