"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

export function BrandReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  const opacity = useTransform(scrollYProgress, [0.1, 0.75], [0.3, 1]);
  const y = useTransform(scrollYProgress, [0.1, 0.75], [20, 0]);
  const scale = useTransform(scrollYProgress, [0.1, 0.75], [0.97, 1]);

  return (
    <section
      ref={containerRef}
      className="brand-reveal-container"
      style={{
        position: "relative",
        padding: "60px 24px 80px",
        width: "100%",
        background: "var(--mkt-bg)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
        borderTop: "1px solid var(--mkt-border)",
      }}
    >
      {/* Ambient background glow */}
      <motion.div
        style={{
          position: "absolute",
          width: "85vw",
          height: "40vw",
          maxWidth: "950px",
          maxHeight: "420px",
          background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.04) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 2,
          opacity,
          scale,
        }}
      />

      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 3,
        }}
      >
        <motion.h2
          className="font-display"
          style={{
            margin: 0,
            fontSize: "clamp(40px, 15vw, 250px)",
            fontWeight: 700,
            lineHeight: 0.9,
            letterSpacing: "-0.035em",
            background: "linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.08) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textAlign: "center",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            userSelect: "none",
            opacity,
            y,
            scale,
          }}
        >
          HypeMind
        </motion.h2>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, var(--mkt-border), transparent)",
          zIndex: 4,
        }}
      />
    </section>
  );
}
