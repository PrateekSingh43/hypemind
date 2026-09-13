"use client";

import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

type SectionHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  bordered?: boolean;
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  bordered = true,
}: SectionHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={`section-header${bordered ? "" : " section-header-flush"}${align === "center" ? " section-header-center" : ""}`}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: EASE }}
    >
      <div className="section-eyebrow">
        <span className="section-eyebrow-line" aria-hidden="true" />
        {eyebrow}
      </div>
      <h2 className="section-h2 font-display">{title}</h2>
      {subtitle && <p className="section-subtext">{subtitle}</p>}
    </motion.div>
  );
}
