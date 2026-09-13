"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Shield, Lock, EyeOff, Server } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const POINTS = [
  {
    icon: Lock,
    title: "Your workspace, your data",
    body: "Content lives in your account. We don’t train public models on your private notes without explicit choice.",
  },
  {
    icon: Shield,
    title: "Secure by default",
    body: "Auth, session hygiene, and least-privilege access patterns baked into how the product is built.",
  },
  {
    icon: EyeOff,
    title: "Privacy-first AI",
    body: "Retrieval is scoped to what you can already see. No mystery data joining the chat.",
  },
  {
    icon: Server,
    title: "Transparent stack",
    body: "We’re early — so we lead with engineering honesty: what’s shipped, what’s next, what we won’t do.",
  },
];

export function SecuritySection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="security" className="mkt-section mkt-section-surface" aria-label="Security and privacy">
      <SectionHeader
        eyebrow="Security & privacy"
        title={
          <>
            Trust is earned with clarity —
            <br />
            not placeholder logos.
          </>
        }
        subtitle="Early products shouldn’t fake enterprise theater. Here’s what we actually optimize for while we grow."
      />

      <div ref={ref} className="security-grid">
        {POINTS.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.article
              key={p.title}
              className="security-card"
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.07, duration: 0.45, ease: EASE }}
            >
              <div className="security-icon">
                <Icon size={18} />
              </div>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
