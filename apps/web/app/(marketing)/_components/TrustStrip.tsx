"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Shield, Lock, EyeOff, CheckCircle2, CircleDashed } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const SECURITY_POINTS = [
  {
    icon: Lock,
    title: "Your workspace, your data",
    body: "Content lives strictly in your workspace. We never train public AI models on private team notes.",
  },
  {
    icon: Shield,
    title: "Zero-trust session security",
    body: "Short-lived JWT access tokens + HTTP-only refresh tokens with cryptographic rotation.",
  },
  {
    icon: EyeOff,
    title: "Scoped retrieval context",
    body: "RAG and semantic search are scoped exclusively to documents you have permission to view.",
  },
];

const ROADMAP_PHASES = [
  {
    status: "Shipped",
    icon: CheckCircle2,
    badge: "now",
    items: [
      "PARA workspace hierarchy (Areas → Projects → Items)",
      "Instant quick notes & TipTap rich-text pages",
      "Semantic search & VoyageAI 1024-dim embeddings",
      "Soft-delete lifecycle with Trash recovery",
    ],
  },
  {
    status: "Building",
    icon: CircleDashed,
    badge: "next",
    items: [
      "Auto-linking memory graph across notes & meetings",
      "PDF & document deep context ingestion",
      "Shared team workspaces with role-based access",
      "CLI & browser capture extension",
    ],
  },
];

export function TrustStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="trust" className="mkt-section mkt-section-surface" aria-label="Trust & Transparency">
      <div className="section-header">
        <div className="section-eyebrow">
          <span className="section-eyebrow-line" aria-hidden="true" />
          Engineering Truth
        </div>
        <h2 className="section-h2 font-display">
          Built on security clarity.
          <br />
          Shipped with open roadmap transparency.
        </h2>
      </div>

      <div ref={ref} className="trust-grid">
        {/* Left Column: Security Guarantees */}
        <motion.div
          className="trust-col trust-security"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="trust-col-header">
            <span className="trust-col-tag">Security & Privacy</span>
            <h3 className="trust-col-title font-display">No enterprise theater. Just engineering rigor.</h3>
          </div>
          <div className="trust-security-list">
            {SECURITY_POINTS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="trust-security-card">
                  <div className="trust-security-icon">
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 className="trust-security-card-title">{item.title}</h4>
                    <p className="trust-security-card-body">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right Column: Public Roadmap */}
        <motion.div
          className="trust-col trust-roadmap"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        >
          <div className="trust-col-header">
            <span className="trust-col-tag">Public Changelog & Roadmap</span>
            <h3 className="trust-col-title font-display">What&apos;s live today vs what ships next.</h3>
          </div>
          <div className="trust-roadmap-phases">
            {ROADMAP_PHASES.map((phase) => {
              const StatusIcon = phase.icon;
              return (
                <div key={phase.status} className={`trust-roadmap-phase phase-${phase.badge}`}>
                  <div className="trust-phase-header">
                    <span className="trust-phase-badge">
                      <StatusIcon size={12} />
                      {phase.status}
                    </span>
                  </div>
                  <ul className="trust-phase-list">
                    {phase.items.map((item) => (
                      <li key={item} className="trust-phase-item">
                        <span className="trust-phase-dot" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
