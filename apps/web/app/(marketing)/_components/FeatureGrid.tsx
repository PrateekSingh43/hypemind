"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Search, Sparkles, Network, Command } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export function FeatureGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" className="mkt-section mkt-section-surface" aria-label="Features">
      <div className="section-header section-header-center">
        <h2 className="section-h2 font-display">
          Built for memory.
        </h2>
        <p className="section-subtext">
          Everything you need to capture, connect, and recall knowledge effortlessly.
        </p>
      </div>

      <div ref={ref} className="bento-grid">
        <motion.div
          className="bento-card bento-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
             <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--mkt-accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mkt-accent)" }}>
               <Network size={20} />
             </div>
             <h3 className="bento-card-title" style={{ margin: 0 }}>Auto-linking</h3>
          </div>
          <p className="bento-card-desc">
            Stop tagging. HypeMind automatically connects related notes, tasks, and decisions in the background.
          </p>
        </motion.div>

        <motion.div
          className="bento-card"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
             <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--mkt-inset)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mkt-text)" }}>
               <Command size={20} />
             </div>
             <h3 className="bento-card-title" style={{ margin: 0 }}>Instant Capture</h3>
          </div>
          <p className="bento-card-desc">
            Press ⌘K anywhere to jot down a thought without losing focus.
          </p>
        </motion.div>

        <motion.div
          className="bento-card"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
             <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--mkt-inset)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mkt-text)" }}>
               <Search size={20} />
             </div>
             <h3 className="bento-card-title" style={{ margin: 0 }}>Semantic Search</h3>
          </div>
          <p className="bento-card-desc">
            Search by meaning, not just keywords. Find decisions in seconds.
          </p>
        </motion.div>

        <motion.div
          className="bento-card bento-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
             <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--mkt-accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mkt-accent)" }}>
               <Sparkles size={20} />
             </div>
             <h3 className="bento-card-title" style={{ margin: 0 }}>Grounded AI</h3>
          </div>
          <p className="bento-card-desc">
            Your AI assistant knows your entire workspace. No more explaining context before asking a question.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
