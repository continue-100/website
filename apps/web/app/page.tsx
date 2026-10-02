import React from "react";
import HeaderMain from "@/components/HeaderMain";
import Hero from "@/components/landing/Hero";
import BenchmarkTeaser from "@/components/landing/BenchmarkTeaser";
import WhyPrismio from "@/components/landing/WhyPrismio";
import Principles from "@/components/landing/Principles";
import AIReady from "@/components/landing/AIReady";
import EditorSupport from "@/components/landing/EditorSupport";
import CommunityNote from "@/components/landing/CommunityNote";
import FAQ from "@/components/landing/FAQ";
import CTA from "@/components/landing/CTA";
import {JsonLd} from "@/components/json-ld";
import {faqStructuredData} from "@/config/structured-data";
import FooterMain from "@prismio/ui/FooterMain";

export default function LandingPage() {
    return (
        <div className="relative min-h-screen bg-[#070709] text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden selection:bg-indigo-500/30 selection:text-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(ellipse_at_70%_10%,rgba(67,56,202,0.16),transparent_52%)]"/>

            <JsonLd data={faqStructuredData} />
            <HeaderMain />

            <main className="relative z-10">
                <Hero />
                <BenchmarkTeaser />
                <WhyPrismio />
                <Principles />
                <AIReady />
                <EditorSupport />
                <CommunityNote />
                <CTA />
                <FAQ />
            </main>

            <FooterMain />
        </div>
    );
}
