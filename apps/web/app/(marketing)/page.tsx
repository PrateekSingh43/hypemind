"use client";

import { SiteHeader } from "./_components/SiteHeader";
import { Hero } from "./_components/Hero";
import { DashboardPreview } from "./_components/DashboardPreview";
import { FeatureGrid } from "./_components/FeatureGrid";
import { SiteFooter } from "./_components/SiteFooter";
import Link from "next/link";
import { motion } from "motion/react";

export default function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />

      <main className="flex-1">
        <Hero />
        <DashboardPreview />

        {/* Trusted By Section */}
        <section className="py-12 border-y border-border bg-muted/20">
          <div className="container mx-auto px-4 max-w-7xl">
            <p className="text-center text-sm font-medium text-muted-foreground mb-8">
              TRUSTED BY INNOVATIVE TEAMS WORLDWIDE
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 grayscale opacity-40">
              {["ACME", "VERTEX", "CLARITY", "ECHO", "NEXUS", "PULSE"].map((name) => (
                <span key={name} className="text-xl font-bold font-mono tracking-widest">{name}</span>
              ))}
            </div>
          </div>
        </section>

        <FeatureGrid />

        {/* Call to Action */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 -z-10" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

          <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl md:text-7xl font-bold mb-8 tracking-tight"
            >
              Ready to organize your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                digital life?
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground mb-12"
            >
              Join thousands of users who have transformed how they work. <br className="hidden md:block" />
              No credit card required. Free forever for individuals.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center h-16 px-10 text-lg font-semibold text-white transition-all rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/30"
              >
                Start for free
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center h-16 px-10 text-lg font-medium transition-all rounded-full text-foreground hover:bg-secondary border border-border"
              >
                Contact Sales
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}