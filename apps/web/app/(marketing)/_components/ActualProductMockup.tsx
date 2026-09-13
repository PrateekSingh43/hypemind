"use client";

import { motion, useInView } from "motion/react";
import { useRef, useEffect, useState } from "react";
import { FileText, FolderGit2, Sparkles} from "lucide-react";

const SPRING_EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ── Pages Sidebar Items ──────────────────────────────────── */
const PAGES = [
  { label: "Startup Ideas", active: true },
  { label: "Product Roadmap", active: false },
  { label: "Competitor Research", active: false },
  { label: "Pricing Notes", active: false },
];

const PROJECTS = [
  { label: "HypeMind", active: false },
  { label: "Marketing", active: false },
];

/* ── Animated text that types itself ─────────────────────── */
function TypedTitle({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const t = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, 40);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay]);

  return (
    <span>
      {displayed}
      {!done && (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: "1em",
            background: "var(--mkt-accent)",
            marginLeft: 2,
            verticalAlign: "middle",
            animation: "blink-cursor 1s step-end infinite",
          }}
        />
      )}
    </span>
  );
}

/* ── Text placeholder lines ───────────────────────────────── */
function TextLines({ lines }: { lines: ("full" | "med" | "short" | "dim")[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
      {lines.map((size, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.8 + i * 0.12, duration: 0.4, ease: SPRING_EASE }}
          style={{
            transformOrigin: "left center",
            height: 9,
            borderRadius: 3,
            background: size === "dim" ? "rgba(255,255,255,0.04)" : "var(--mkt-border)",
            width: size === "full" ? "100%" : size === "med" ? "80%" : "55%",
          }}
        />
      ))}
    </div>
  );
}

export function ActualProductMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      className="product-mockup"
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: SPRING_EASE }}
      style={{ width: "100%", maxWidth: 440 }}
    >
      {/* Window chrome */}
      <div className="mockup-chrome">
        <div className="mockup-dot" style={{ background: "#FF5F57" }} />
        <div className="mockup-dot" style={{ background: "#FEBC2E" }} />
        <div className="mockup-dot" style={{ background: "#28C840" }} />
        <span className="mockup-title">hypemind — Startup Ideas</span>
      </div>

      {/* Body: sidebar + editor */}
      <div className="mockup-body">
        {/* Sidebar */}
        <div className="mockup-sidebar">
          {/* Pages */}
          <div className="mockup-sidebar-header">Pages</div>
          {PAGES.map((page, i) => (
            <motion.div
              key={page.label}
              className={`mockup-sidebar-item${page.active ? " active" : ""}`}
              initial={{ opacity: 0, x: -8 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.35, ease: SPRING_EASE }}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <FileText size={11} />
              <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {page.label}
              </span>
            </motion.div>
          ))}

          {/* Projects */}
          <div
            className="mockup-sidebar-header"
            style={{ marginTop: 8 }}
          >
            Projects
          </div>
          {PROJECTS.map((proj, i) => (
            <motion.div
              key={proj.label}
              className="mockup-sidebar-item"
              initial={{ opacity: 0, x: -8 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.45 + i * 0.08, duration: 0.35, ease: SPRING_EASE }}
            >
              <FolderGit2 size={11} />
              <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {proj.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Editor */}
        <div className="mockup-editor">
          {/* Breadcrumb */}
          <div
            style={{
              fontSize: 11,
              color: "var(--mkt-text-low)",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>Global</span>
            <span style={{ opacity: 0.4 }}>›</span>
            <span>Pages</span>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: "var(--mkt-text-mid)" }}>Startup Ideas</span>
          </div>

          {/* Page title — types itself */}
          <div
            className="mockup-page-title"
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--mkt-text)",
              marginBottom: 4,
              letterSpacing: "-0.02em",
            }}
          >
            {isInView && <TypedTitle text="Startup Ideas" delay={300} />}
          </div>

          {/* Animated text lines */}
          <TextLines lines={["full", "med", "full", "short", "dim", "full", "med"]} />

          {/* AI pill at bottom */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.4, duration: 0.4, ease: SPRING_EASE }}
            style={{
              marginTop: 20,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              background: "var(--mkt-accent-dim)",
              border: "1px solid var(--mkt-accent-border)",
              borderRadius: 4,
              fontSize: 11,
              color: "var(--mkt-accent)",
              fontWeight: 500,
            }}
          >
            <Sparkles size={11} />
            Ask AI about this page...
          </motion.div>
        </div>
      </div>

      {/* Footer status bar */}
      <div
        style={{
          height: 32,
          borderTop: "1px solid var(--mkt-border)",
          background: "var(--mkt-elevated)",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--mkt-text-low)" }}>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#22c55e",
            }}
          />
          Synced
        </div>
        <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--mkt-text-low)" }}>
          3 pages · 1 project
        </div>
      </div>
    </motion.div>
  );
}
