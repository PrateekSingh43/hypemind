"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { SectionHeader } from "./SectionHeader";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const ROWS = [
  {
    them: "Notes apps",
    themDesc: "Store text. Leave retrieval to you.",
    us: "Memory workspace",
    usDesc: "Store, connect, and recall with AI.",
  },
  {
    them: "Generic chatbots",
    themDesc: "Forget you the moment the tab closes.",
    us: "Project-aware AI",
    usDesc: "Grounded in your notes, docs, and decisions.",
  },
  {
    them: "Task managers",
    themDesc: "Track work without the why.",
    us: "Tasks linked to context",
    usDesc: "Every ticket sits on top of the decision that created it.",
  },
  {
    them: "Wiki + search",
    themDesc: "Keyword hunt through stale pages.",
    us: "Semantic retrieval",
    usDesc: "Ask how you think — get sources, not 40 blue links.",
  },
];

export function Differentiation() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="different" className="mkt-section" aria-label="Why HypeMind is different">
      <SectionHeader
        eyebrow="Why HypeMind"
        title={
          <>
            Not another productivity app.
            <br />
            A workspace that builds context over time.
          </>
        }
        subtitle="If a section doesn’t make that clearer, it doesn’t belong on this page. Here’s the contrast that matters."
      />

      <div ref={ref} className="diff-table">
        <div className="diff-head">
          <span>The old way</span>
          <span>HypeMind</span>
        </div>
        {ROWS.map((row, i) => (
          <motion.div
            key={row.them}
            className="diff-row"
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.07, duration: 0.4, ease: EASE }}
          >
            <div className="diff-cell diff-them">
              <strong>{row.them}</strong>
              <span>{row.themDesc}</span>
            </div>
            <div className="diff-cell diff-us">
              <strong>{row.us}</strong>
              <span>{row.usDesc}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
