"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PenLine, Brain, Network, Search, Sparkles } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const STEPS = [
  {
    num: "01",
    title: "Capture",
    icon: PenLine,
    desc: "Jot down notes and decisions effortlessly.",
    detail: "Everything lives in one unified workspace.",
  },
  {
    num: "02",
    title: "Understand",
    icon: Brain,
    desc: "AI indexes your workspace automatically.",
    detail: "Semantic embeddings are generated as you type.",
  },
  {
    num: "03",
    title: "Connect",
    icon: Network,
    desc: "Ideas auto-link to projects.",
    detail: "Your context compounds over time.",
  },
  {
    num: "04",
    title: "Retrieve",
    icon: Search,
    desc: "Search in natural language.",
    detail: "Find what you need by meaning, not filenames.",
  },
  {
    num: "05",
    title: "Create",
    icon: Sparkles,
    desc: "Work with AI that knows your context.",
    detail: "Stop re-explaining things every time.",
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const current = STEPS[activeStep];
  const Icon = current.icon;

  return (
    <section id="how-it-works" className="mkt-section" aria-label="How HypeMind works">
      <div className="section-header">
        <div className="section-eyebrow">
          <span className="section-eyebrow-line" aria-hidden="true" />
          The Core Loop
        </div>
        <h2 className="section-h2 font-display">
          How it works
        </h2>
        <p className="section-subtext">
          Five simple steps to build your workspace memory.
        </p>
      </div>

      <div className="stepper-layout">
        {/* Stepper Navigation */}
        <div className="stepper-nav">
          {STEPS.map((step, idx) => (
            <button
              key={step.num}
              type="button"
              className={`stepper-item${activeStep === idx ? " active" : ""}`}
              onClick={() => setActiveStep(idx)}
              onMouseEnter={() => setActiveStep(idx)}
            >
              <span className="stepper-num">{step.num}</span>
              <div>
                <div className="stepper-title">{step.title}</div>
                <div className="stepper-desc">{step.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Visual Proof Preview Panel */}
        <div className="stepper-preview">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.num}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: EASE }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: "var(--mkt-accent-dim)", border: "1px solid var(--mkt-accent-border)", color: "var(--mkt-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={22} />
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mkt-accent)" }}>
                  Step {current.num}
                </span>
                <h3 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: "var(--mkt-text)", marginTop: 4 }}>
                  {current.title}
                </h3>
              </div>

              <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--mkt-text-dim)" }}>
                {current.detail}
              </p>

              <div style={{ marginTop: 12, padding: "14px 18px", background: "var(--mkt-surface)", border: "1px solid var(--mkt-border)", borderRadius: "var(--r-md)", fontSize: 13, color: "var(--mkt-text-dim)" }}>
                Zero manual tagging required.
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
