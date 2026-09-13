"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  Network,
  MessageSquareText,
  Search,
  FolderKanban,
  Layers,
  Keyboard,
} from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const CAPS = [
  {
    icon: Network,
    title: "Connected knowledge",
    body: "Notes, tasks, meetings, and docs link into a living graph — not a pile of files.",
  },
  {
    icon: MessageSquareText,
    title: "AI with context",
    body: "Chat that already knows the project. Answers cite sources you can open.",
  },
  {
    icon: Search,
    title: "Natural language search",
    body: "Find by meaning: “auth decision from last month” works even if the title was terrible.",
  },
  {
    icon: FolderKanban,
    title: "Projects that stay organized",
    body: "Areas and projects give structure without forcing a second brain taxonomy ritual.",
  },
  {
    icon: Layers,
    title: "One place for your work",
    body: "Capture everywhere you’d normally scatter — keep one retrieval surface.",
  },
  {
    icon: Keyboard,
    title: "Keyboard-first speed",
    body: "Jump, search, and command without fighting the mouse. Built for people who ship.",
  },
];

export function Capabilities() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="capabilities" className="mkt-section mkt-section-surface" aria-label="Key capabilities">
      <SectionHeader
        eyebrow="Capabilities"
        title={
          <>
            Supporting the core message —
            <br />
            not competing with it.
          </>
        }
        subtitle="Primary: a workspace that remembers. Everything below exists to make that true."
      />

      <div ref={ref} className="caps-grid">
        {CAPS.map((cap, i) => {
          const Icon = cap.icon;
          return (
            <motion.article
              key={cap.title}
              className="caps-card"
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.06, duration: 0.45, ease: EASE }}
            >
              <div className="caps-icon">
                <Icon size={18} />
              </div>
              <h3 className="caps-title">{cap.title}</h3>
              <p className="caps-body">{cap.body}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
