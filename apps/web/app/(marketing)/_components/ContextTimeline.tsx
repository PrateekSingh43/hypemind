"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Brain, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const NODES = [
  {
    id: "today",
    label: "Today",
    title: "Standup: auth is critical path",
    detail: "Captured automatically. Linked to open OAuth task.",
  },
  {
    id: "yesterday",
    label: "Yesterday",
    title: "Task: Implement OAuth flow",
    detail: "Created from meeting action items. Owner assigned.",
  },
  {
    id: "week",
    label: "Last week",
    title: "Architecture review",
    detail: "JWT + refresh rotation locked. Sources still attached.",
  },
  {
    id: "month",
    label: "Last month",
    title: "Auth decision note",
    detail: "Original OAuth-first call. Still the source of truth.",
  },
  {
    id: "memory",
    label: "Always",
    title: "AI remembers everything",
    detail: "Ask in plain language. Get answers with sources — not guesses.",
    climax: true,
  },
];

export function ContextTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);

  return (
    <section id="timeline" className="mkt-section" aria-label="Context timeline">
      <SectionHeader
        eyebrow="Context timeline"
        title={
          <>
            Time passes.
            <br />
            Context doesn&apos;t evaporate.
          </>
        }
        subtitle="HypeMind’s unique promise: what you capture today is still useful next month — with links, sources, and AI that can walk the chain."
      />

      <div ref={ref} className="timeline">
        <div className="timeline-track" aria-hidden="true">
          <div
            className="timeline-progress"
            style={{ width: `${(active / (NODES.length - 1)) * 100}%` }}
          />
        </div>

        <div className="timeline-nodes">
          {NODES.map((node, i) => (
            <motion.button
              key={node.id}
              type="button"
              className={`timeline-node${active === i ? " active" : ""}${node.climax ? " climax" : ""}${i <= active ? " reached" : ""}`}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.45, ease: EASE }}
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
            >
              <span className="timeline-node-dot">
                {node.climax ? <Brain size={12} /> : i <= active ? <CheckCircle2 size={12} /> : null}
              </span>
              <span className="timeline-node-label">{node.label}</span>
              <span className="timeline-node-title">{node.title}</span>
              <span className="timeline-node-detail">{node.detail}</span>
            </motion.button>
          ))}
        </div>

        <motion.div
          className="timeline-callout"
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="timeline-callout-kicker">{NODES[active].label}</span>
          <p className="timeline-callout-text">
            {NODES[active].climax
              ? "Persistence is the product. HypeMind turns a month of work into one answerable memory — not a folder of dead files."
              : `${NODES[active].title} — ${NODES[active].detail}`}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
