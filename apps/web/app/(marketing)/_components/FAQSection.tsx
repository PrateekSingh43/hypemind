"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const FAQS = [
  {
    q: "What is HypeMind in one sentence?",
    a: "A workspace that remembers — you capture work once, and AI can retrieve and reason over it with sources later.",
  },
  {
    q: "How is this different from Notion + ChatGPT?",
    a: "Notion stores pages. ChatGPT forgets. HypeMind connects capture, understanding, and retrieval so you don’t rebuild context every session.",
  },
  {
    q: "Do I have to organize everything perfectly?",
    a: "No. Capture first. Connections and search do the heavy lifting. Structure helps, but perfection isn’t a prerequisite.",
  },
  {
    q: "What happens to my data?",
    a: "Your workspace content belongs to your account. We design retrieval so the AI only uses what you’re allowed to see. See Security for the principles we ship by.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. Start free with core memory features. Upgrade when you need unlimited scale, deeper AI, or team workspaces.",
  },
  {
    q: "Who is HypeMind for?",
    a: "Builders, founders, researchers, and anyone tired of re-explaining their own work to tools that don’t remember.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mkt-section mkt-section-surface" aria-label="FAQ">
      <SectionHeader
        eyebrow="FAQ"
        title="Questions, answered plainly."
        subtitle="If something still feels unclear after the demo above, this should close the gap."
      />

      <div className="faq-list">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className={`faq-item${isOpen ? " open" : ""}`}>
              <button
                type="button"
                className="faq-question"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={16}
                  className={`faq-chevron${isOpen ? " open" : ""}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p>{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
