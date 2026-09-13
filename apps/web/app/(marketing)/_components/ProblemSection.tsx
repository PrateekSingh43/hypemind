"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { X, Check, FileText, Bot, MessageSquare, StickyNote } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const OLD_WAY_ITEMS = [
  "Scattered across apps",
  "AI starts from zero",
  "Disconnected tasks",
  "Manual tagging",
];

const NEW_WAY_ITEMS = [
  "Unified workspace",
  "Auto-linked context",
  "Connected actions",
  "Semantic search",
];

export function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="problem" className="mkt-section" aria-label="The problem contrast">
      <div className="section-header">
        <div className="section-eyebrow">
          <span className="section-eyebrow-line" aria-hidden="true" />
          The Contrast
        </div>
        <h2 className="section-h2 font-display">
          Your tools forget everything.
          <br />
          HypeMind builds persistent memory.
        </h2>
        <p className="section-subtext">
          Traditional tools forget. HypeMind builds a living graph of your work.
        </p>
      </div>

      <div ref={ref} className="problem-strip">
        {/* The Old Way */}
        <motion.div
          className="problem-column problem-column-old"
          initial={{ opacity: 0, x: -16 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="problem-col-header">
            <span className="problem-badge problem-badge-old">The Scattered Way</span>
          </div>
          <div className="problem-list">
            {OLD_WAY_ITEMS.map((text) => (
              <div key={text} className="problem-item">
                <X size={16} color="#F87171" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* The HypeMind Way */}
        <motion.div
          className="problem-column problem-column-new"
          initial={{ opacity: 0, x: 16 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        >
          <div className="problem-col-header">
            <span className="problem-badge problem-badge-new">The HypeMind Memory Way</span>
          </div>
          <div className="problem-list">
            {NEW_WAY_ITEMS.map((text) => (
              <div key={text} className="problem-item">
                <Check size={16} color="#818CF8" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ color: "var(--mkt-text)" }}>{text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
