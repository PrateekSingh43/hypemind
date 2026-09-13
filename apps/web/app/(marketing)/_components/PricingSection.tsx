"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Check, ArrowRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const TIERS = [
  {
    id: "free",
    label: "Free Developer",
    price: "$0",
    period: "forever",
    description: "Start building workspace memory without a card.",
    cta: "Get started free",
    ctaHref: "/dashboard",
    featured: false,
    features: [
      "Up to 100 pages & quick notes",
      "3 active projects & 1 area",
      "VoyageAI 1024-dim semantic search",
      "Basic AI memory recall & Q&A",
      "Community support",
    ],
  },
  {
    id: "pro",
    label: "Pro Builder",
    price: "$12",
    period: "/month",
    description: "Unlimited knowledge scale for engineers who live in context.",
    cta: "Start free trial",
    ctaHref: "/dashboard",
    featured: true,
    features: [
      "Unlimited pages, notes & projects",
      "Deep AI memory context synthesis",
      "PDF & document deep context ingestion",
      "Command Palette (⌘K) sub-100ms search",
      "Priority support & early features",
    ],
  },
  {
    id: "team",
    label: "Team Shared",
    price: "$28",
    period: "/seat /month",
    description: "Shared memory graph for software teams shipping together.",
    cta: "Contact sales",
    ctaHref: "/signup",
    featured: false,
    features: [
      "Everything in Pro Builder",
      "Multi-tenant team workspaces",
      "Role-based access & admin controls",
      "Cryptographic audit logging",
      "Dedicated onboarding & SLA options",
    ],
  },
];

export function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="pricing" className="mkt-section mkt-section-surface" aria-label="Pricing plans" ref={ref}>
      <div className="section-header section-header-center">
        <div className="section-eyebrow">
          <span className="section-eyebrow-line" aria-hidden="true" />
          Simple Pricing
        </div>
        <h2 className="section-h2 font-display">
          Start free. Scale when memory
          <br />
          becomes mission-critical.
        </h2>
        <p className="section-subtext">
          No credit card required to start. Every plan includes core semantic retrieval and persistent PARA workspace hierarchy.
        </p>
      </div>

      <div className="pricing-grid">
        {TIERS.map((tier, idx) => (
          <motion.div
            key={tier.id}
            className={`pricing-card${tier.featured ? " pricing-card-featured" : ""}`}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: idx * 0.08, duration: 0.5, ease: EASE }}
          >
            {tier.featured && <span className="pricing-featured-badge">Most Popular</span>}

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: tier.featured ? "var(--mkt-accent)" : "var(--mkt-text-mid)" }}>
                {tier.label}
              </div>
              <div className="pricing-price font-display">
                {tier.price}
                <span className="pricing-price-period"> {tier.period}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--mkt-text-dim)", lineHeight: 1.5 }}>
                {tier.description}
              </p>
            </div>

            <div className="pricing-features-list">
              {tier.features.map((feat) => (
                <div key={feat} className="pricing-feature-item">
                  <Check size={14} color="var(--mkt-accent)" style={{ flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <Link
              href={tier.ctaHref}
              className={tier.featured ? "btn-primary-marketing" : "btn-secondary-marketing"}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {tier.cta}
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
