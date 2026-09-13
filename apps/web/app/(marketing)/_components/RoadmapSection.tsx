"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { SectionHeader } from "./SectionHeader";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const PHASES = [
  {
    status: "Now",
    tone: "now" as const,
    items: [
      "Projects, pages, notes, and tasks in one workspace",
      "Semantic search across your content",
      "Project-aware AI chat with source grounding",
      "Document understanding for attached files",
    ],
  },
  {
    status: "Next",
    tone: "next" as const,
    items: [
      "Richer meeting capture & decision extraction",
      "Deeper graph of automatic connections",
      "Shared team memory with permissions",
      "API access for builders",
    ],
  },
  {
    status: "Later",
    tone: "later" as const,
    items: [
      "Realtime multiplayer on key surfaces",
      "SSO / SAML for teams",
      "Offline-first capture",
      "Custom agents over your memory graph",
    ],
  },
];

export function RoadmapSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="roadmap" className="mkt-section" aria-label="Roadmap">
      <SectionHeader
        eyebrow="Roadmap"
        title={
          <>
            Ship in public.
            <br />
            No vaporware theater.
          </>
        }
        subtitle="Authentic transparency beats fake social proof. Here’s the honest shape of the product."
      />

      <div ref={ref} className="roadmap-grid">
        {PHASES.map((phase, i) => (
          <motion.div
            key={phase.status}
            className={`roadmap-col roadmap-${phase.tone}`}
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.45, ease: EASE }}
          >
            <div className="roadmap-status">{phase.status}</div>
            <ul className="roadmap-list">
              {phase.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
