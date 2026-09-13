"use client";

import "./marketing.css";

import { SiteHeader } from "./_components/SiteHeader";
import { Hero } from "./_components/Hero";
import { ProblemSection } from "./_components/ProblemSection";
import { FeatureGrid } from "./_components/FeatureGrid";
import { HowItWorks } from "./_components/HowItWorks";
import { PricingSection } from "./_components/PricingSection";
import { CTABanner } from "./_components/CTABanner";
import { SiteFooter } from "./_components/SiteFooter";
import { BrandReveal } from "./_components/BrandReveal";

/**
 * Modern Linear/Vercel Marketing Page Narrative:
 * Hero → Contrast (Problem) → Feature Bento Grid → Core Loop (How it works) → Pricing → CTA
 */
export default function MarketingPage() {
  return (
    <div className="marketing-root">
      <SiteHeader />

      <main>
        <Hero />
        <ProblemSection />
        <FeatureGrid />
        <HowItWorks />
        <PricingSection />
        <CTABanner />
      </main>

      <SiteFooter />
      <BrandReveal />
    </div>
  );
}
