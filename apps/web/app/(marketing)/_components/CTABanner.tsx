"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { ArrowRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export function CTABanner() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="cta-banner" aria-label="Call to action" ref={ref}>
      <motion.h2
        className="cta-banner-h2 font-display"
        initial={{ opacity: 0, y: 18 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: EASE }}
      >
        Stop rebuilding context.
        <br />
        Start building memory.
      </motion.h2>

      <motion.p
        className="cta-banner-p"
        initial={{ opacity: 0, y: 14 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
      >
        Capture notes once. AI understands them. Nothing gets lost.
        Your next coding session should start where the last one left off.
      </motion.p>

      <motion.div
        style={{ display: "flex", alignItems: "center", gap: 12 }}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
      >
        <Link href="/dashboard" className="btn-primary-marketing">
          Start for free
          <ArrowRight size={14} />
        </Link>
        <Link href="#features" className="btn-secondary-marketing">
          View all features
        </Link>
      </motion.div>
    </section>
  );
}
