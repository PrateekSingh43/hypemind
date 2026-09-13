"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { ArrowRight, Sparkles, FileText, Search, FolderGit2, CheckCircle2, ShieldAlert } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
const STAGGER = 0.07;

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section className="marketing-hero grain-overlay" aria-label="Hero">
      <div className="dot-grid" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />

      <div ref={ref} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <motion.div
          className="hero-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <span className="hero-eyebrow-dot" />
          A workspace that remembers
        </motion.div>

        <motion.h1
          className="hero-h1 font-display"
          initial={{ opacity: 0, y: 22 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE, delay: STAGGER }}
        >
          Stop rebuilding context.
          <br />
          <span className="hero-h1-gradient">Start building memory.</span>
        </motion.h1>

        <motion.p
          className="hero-subtext"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE, delay: STAGGER * 2 }}
        >
          Capture your work. We connect the dots. Your AI stays in context.
        </motion.p>

        <motion.div
          className="hero-cta-group"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE, delay: STAGGER * 3 }}
        >
          <Link href="/dashboard" className="btn-primary-marketing">
            Start for free
            <ArrowRight size={14} />
          </Link>
          <Link href="#features" className="btn-secondary-marketing">
            Explore live features
          </Link>
        </motion.div>

        <motion.p
          className="hero-trust-line"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, ease: EASE, delay: STAGGER * 4 }}
        >
          No credit card required · Free tier included · Built for software teams
        </motion.p>
      </div>

      {/* Hero Product Frame (Linear-style UI Screenshot) */}
      <motion.div
        className="hero-showcase-wrap"
        initial={{ opacity: 0, y: 36 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
      >
        <div className="hero-app-frame">
          {/* Mac-style Window Chrome */}
          <div className="app-header">
            <span className="app-header-dot" />
            <span className="app-header-dot" />
            <span className="app-header-dot" />
            <span className="app-header-title">HypeMind — Workspace Memory Engine</span>
          </div>

          <div className="app-body">
            {/* Sidebar */}
            <div className="app-sidebar">
              <div className="app-sidebar-section">
                <span className="app-sidebar-label">PARA Workspace</span>
                <div className="app-sidebar-item active">
                  <FolderGit2 size={13} color="var(--mkt-accent)" />
                  <span>HypeMind MVP</span>
                </div>
                <div className="app-sidebar-item">
                  <FileText size={13} />
                  <span>Auth Architecture</span>
                </div>
                <div className="app-sidebar-item">
                  <FileText size={13} />
                  <span>Stripe API Notes</span>
                </div>
              </div>
              <div className="app-sidebar-section">
                <span className="app-sidebar-label">Quick Capture</span>
                <div className="app-sidebar-item">
                  <CheckCircle2 size={13} />
                  <span>Action Items (4)</span>
                </div>
              </div>
            </div>

            {/* Main Workspace Frame */}
            <div className="app-content">
              <div className="app-topbar">
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--mkt-text-dim)" }}>
                  <Search size={14} color="var(--mkt-text-mid)" />
                  <span>Search or ask AI: &quot;What authentication strategy did we choose?&quot;</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--mkt-text-mid)", fontFamily: "monospace" }}>⌘K</span>
              </div>

              <div className="app-main">
                {/* Editor Pane */}
                <div className="app-editor-pane">
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--mkt-text)" }}>
                    Authentication & Session Architecture
                  </div>
                  <div style={{ fontSize: 13, color: "var(--mkt-text-dim)", lineHeight: 1.6 }}>
                    We locked JWT access tokens (15m expiry) + HTTP-only refresh tokens (7d expiry) stored in secure cookies. Dual-token rotation ensures instant invalidation on logout.
                  </div>
                  <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: "var(--r-sm)", background: "rgba(94, 106, 210, 0.08)", border: "1px solid var(--mkt-accent-border)", fontSize: 12, color: "#A5B4FC", display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle2 size={14} />
                    <span>Decision logged on May 29 · Referenced in 3 meeting notes</span>
                  </div>
                </div>

                {/* AI Context Recall Pane */}
                <div className="app-ai-pane">
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--mkt-text)" }}>
                    <Sparkles size={13} color="var(--mkt-accent)" />
                    <span>AI Memory Recall</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mkt-text-dim)", lineHeight: 1.5 }}>
                    Synthesized from 4 workspace files:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ padding: 8, background: "rgba(255,255,255,0.03)", borderRadius: "var(--r-xs)", fontSize: 11, color: "var(--mkt-text)" }}>
                      📄 <strong>auth-strategy.md</strong> (Primary)
                    </div>
                    <div style={{ padding: 8, background: "rgba(255,255,255,0.03)", borderRadius: "var(--r-xs)", fontSize: 11, color: "var(--mkt-text)" }}>
                      📄 <strong>stripe-api.md</strong> (Security review)
                    </div>
                  </div>
                  <div style={{ marginTop: "auto", fontSize: 11, color: "var(--mkt-text-mid)" }}>
                    100% grounded in workspace sources.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
