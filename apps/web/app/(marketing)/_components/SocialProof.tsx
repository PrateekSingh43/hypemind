"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";

const SPRING_EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const METRICS = [
  { value: "2,400+", label: "Teams using HypeMind", suffix: "" },
  { value: "4.9", label: "Average rating on Product Hunt", suffix: "★" },
  { value: "99.9%", label: "Uptime SLA guaranteed", suffix: "" },
];

export function SocialProof() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section aria-label="Social proof metrics">
      <div ref={ref} className="social-proof-strip">
        {METRICS.map((metric, i) => (
          <motion.div
            key={metric.label}
            className="social-proof-cell"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              delay: i * 0.1,
              duration: 0.5,
              ease: SPRING_EASE,
            }}
          >
            <span className="social-proof-number font-display">
              {metric.value}
              {metric.suffix && (
                <span style={{ color: "var(--accent)", fontSize: "0.65em", marginLeft: 2 }}>
                  {metric.suffix}
                </span>
              )}
            </span>
            <span className="social-proof-label">{metric.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
