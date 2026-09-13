"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Rocket,
  BookOpen,
  Building2,
  GraduationCap,
  CalendarDays,
  BrainCircuit,
} from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const CASES = [
  {
    id: "startup",
    icon: Rocket,
    label: "Building a startup",
    title: "Ship without losing the plot",
    story:
      "Capture product notes, investor meetings, and architecture decisions in one project. When a new hire asks “why OAuth?”, AI answers from last month’s sources — not your memory.",
    steps: [
      "Dump daily notes into the Launch project",
      "Link tasks to decisions automatically",
      "Ask AI: “What did we commit to in the seed deck?”",
    ],
  },
  {
    id: "research",
    icon: BookOpen,
    label: "Research",
    title: "Read less. Remember more.",
    story:
      "Upload papers and sources. Ask comparisons, extract methods, and keep a living bibliography that stays queryable months later.",
    steps: [
      "Drop PDFs into a research area",
      "AI extracts claims and methods",
      "Search: “papers that disagree on X”",
    ],
  },
  {
    id: "project",
    icon: Building2,
    label: "Planning a project",
    title: "Plans that stay attached to reality",
    story:
      "Specs, standups, and blockers live together. Context doesn’t die when the Notion page goes stale — it’s still one retrieval away.",
    steps: [
      "Create the project hub",
      "Log meetings and action items",
      "Retrieve: “open risks for phase 2”",
    ],
  },
  {
    id: "learning",
    icon: GraduationCap,
    label: "Learning",
    title: "A second brain for courses & practice",
    story:
      "Notes from lectures, books, and experiments compound. Ask your past self what you already figured out.",
    steps: [
      "Capture notes as you learn",
      "Connect related concepts",
      "Quiz yourself via natural language",
    ],
  },
  {
    id: "meetings",
    icon: CalendarDays,
    label: "Meeting management",
    title: "Meetings that leave a trail",
    story:
      "Decisions and action items stop vanishing into chat history. Every meeting becomes searchable memory with owners and links.",
    steps: [
      "Log the meeting in the right project",
      "Extract decisions + tasks",
      "Follow up with AI that knows the room",
    ],
  },
  {
    id: "pkm",
    icon: BrainCircuit,
    label: "Personal knowledge",
    title: "One place for how you think",
    story:
      "Not another dump of markdown. A workspace that understands relationships — so ideas resurface when they matter.",
    steps: [
      "Capture without perfect folders",
      "Let connections form over time",
      "Retrieve by meaning, not path",
    ],
  },
];

export function UseCases() {
  const [active, setActive] = useState(0);
  const c = CASES[active];
  const Icon = c.icon;

  return (
    <section id="use-cases" className="mkt-section" aria-label="Use cases">
      <SectionHeader
        eyebrow="Workflows"
        title={
          <>
            Outcomes, not capabilities.
          </>
        }
        subtitle="Visitors care about how they’d actually use HypeMind. Pick a workflow — see the story."
      />

      <div className="usecases">
        <div className="usecases-tabs" role="tablist" aria-label="Workflows">
          {CASES.map((item, i) => {
            const TIcon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active === i}
                className={`usecases-tab${active === i ? " active" : ""}`}
                onClick={() => setActive(i)}
              >
                <TIcon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={c.id}
            className="usecases-panel"
            role="tabpanel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="usecases-panel-icon">
              <Icon size={22} />
            </div>
            <h3 className="usecases-panel-title font-display">{c.title}</h3>
            <p className="usecases-panel-story">{c.story}</p>
            <ol className="usecases-steps">
              {c.steps.map((s, i) => (
                <li key={s}>
                  <span className="usecases-step-num">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
