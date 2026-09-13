"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Calendar,
  CheckSquare,
  Sparkles,
  Link2,
  Brain,
} from "lucide-react";

/**
 * Hero product story (autoplay loop):
 * Headline moment → write note → meeting created → task linked
 * → memory connected → AI recalls with context
 */
type Step =
  | "note"
  | "meeting"
  | "task"
  | "connect"
  | "ai"
  | "hold";

const STEPS: { id: Step; label: string; duration: number }[] = [
  { id: "note", label: "Capture", duration: 2800 },
  { id: "meeting", label: "Meet", duration: 2400 },
  { id: "task", label: "Link", duration: 2200 },
  { id: "connect", label: "Connect", duration: 2400 },
  { id: "ai", label: "Recall", duration: 3600 },
  { id: "hold", label: "Memory", duration: 2200 },
];

const STEP_INDEX: Record<Step, number> = {
  note: 0,
  meeting: 1,
  task: 2,
  connect: 3,
  ai: 4,
  hold: 5,
};

export function HeroWorkspace() {
  const [step, setStep] = useState<Step>("note");
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => {
    setStep((current) => {
      const idx = STEP_INDEX[current];
      return STEPS[(idx + 1) % STEPS.length].id;
    });
  }, []);

  useEffect(() => {
    if (paused) return;
    const duration = STEPS.find((s) => s.id === step)?.duration ?? 2500;
    const t = setTimeout(advance, duration);
    return () => clearTimeout(t);
  }, [step, paused, advance]);

  const activeIdx = STEP_INDEX[step];
  const showMeeting = activeIdx >= 1;
  const showTask = activeIdx >= 2;
  const showLinks = activeIdx >= 3;
  const showAI = activeIdx >= 4;

  return (
    <div
      className="hero-workspace"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Step rail */}
      <div className="hero-workspace-rail" aria-hidden="true">
        {STEPS.filter((s) => s.id !== "hold").map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`hero-rail-step${activeIdx >= i ? " active" : ""}${step === s.id || (step === "hold" && i === 4) ? " current" : ""}`}
            onClick={() => {
              setPaused(true);
              setStep(s.id);
            }}
          >
            <span className="hero-rail-dot" />
            <span className="hero-rail-label">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="hero-workspace-frame">
        {/* Chrome */}
        <div className="mockup-chrome">
          <span className="mockup-dot" style={{ background: "#FF5F57" }} />
          <span className="mockup-dot" style={{ background: "#FEBC2E" }} />
          <span className="mockup-dot" style={{ background: "#28C840" }} />
          <div className="mockup-breadcrumb">
            <span className="breadcrumb-path">HypeMind</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-path">Launch</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Memory in action</span>
          </div>
          <div className="mockup-sync">
            <span
              className="sync-indicator"
              style={{
                background: showAI ? "var(--mkt-accent)" : "#22c55e",
                boxShadow: showAI
                  ? "0 0 8px var(--mkt-accent-glow)"
                  : "0 0 6px rgba(34,197,94,0.4)",
              }}
            />
            {showAI ? "Recalling context…" : "Synced"}
          </div>
        </div>

        <div className="hero-workspace-body">
          {/* Left: canvas of artifacts */}
          <div className="hero-workspace-canvas">
            <ArtifactCard
              icon={<FileText size={14} />}
              kind="Note"
              title="Auth decision"
              body="Ship OAuth first. Magic links in v2. Document risks in Stripe PDF."
              active={step === "note" || activeIdx > 0}
              highlight={step === "note"}
              linked={showLinks}
            />

            <AnimatePresence>
              {showMeeting && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ArtifactCard
                    icon={<Calendar size={14} />}
                    kind="Meeting"
                    title="Arch review · Tue"
                    body="Team agreed: JWT sessions, refresh rotation, audit log on day one."
                    active
                    highlight={step === "meeting"}
                    linked={showLinks}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showTask && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ArtifactCard
                    icon={<CheckSquare size={14} />}
                    kind="Task"
                    title="Implement OAuth flow"
                    body="Linked to Auth decision · Due Friday"
                    active
                    highlight={step === "task"}
                    linked={showLinks}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Connection lines visualization */}
            <AnimatePresence>
              {showLinks && (
                <motion.div
                  className="hero-connections"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Link2 size={12} />
                  <span>3 items connected · context graph updated</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: AI panel */}
          <div className="hero-workspace-ai">
            <div className="chat-header">
              <div className="chat-avatar-ai">
                <Sparkles size={12} />
              </div>
              <div style={{ marginLeft: 10 }}>
                <div className="chat-title">HypeMind AI</div>
                <div className="chat-status">
                  <span
                    className="status-dot"
                    style={{
                      background: showAI ? "var(--mkt-accent)" : "#22c55e",
                    }}
                  />
                  {showAI ? "Using workspace memory" : "Ready"}
                </div>
              </div>
            </div>

            <div className="hero-ai-messages">
              {!showAI && (
                <div className="hero-ai-idle">
                  <Brain size={20} strokeWidth={1.5} />
                  <p>
                    Write, meet, and link work.
                    <br />
                    <span>AI will recall it later.</span>
                  </p>
                </div>
              )}

              <AnimatePresence mode="wait">
                {showAI && (
                  <motion.div
                    key="ai-recall"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="hero-ai-thread"
                  >
                    <div className="message-row user">
                      <div className="message-bubble">
                        What auth approach did we choose?
                      </div>
                    </div>

                    <div className="message-row ai">
                      <div className="chat-avatar-bubble">
                        <Sparkles size={11} />
                      </div>
                      <div className="message-bubble">
                        <p>
                          You decided on <strong>OAuth first</strong>, with magic
                          links in v2 — from your note{" "}
                          <em>Auth decision</em>.
                        </p>
                        <p style={{ marginTop: 10 }}>
                          In <em>Arch review · Tue</em>, the team also locked JWT
                          sessions, refresh rotation, and day-one audit logs.
                        </p>
                        <p style={{ marginTop: 10 }}>
                          Open task: <strong>Implement OAuth flow</strong> · due
                          Friday.
                        </p>

                        <div className="source-pill">
                          <span className="source-tag">Sources</span>
                          <span className="source-link">
                            <FileText size={11} /> Note
                          </span>
                          <span className="source-link">
                            <Calendar size={11} /> Meeting
                          </span>
                          <span className="source-link">
                            <CheckSquare size={11} /> Task
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArtifactCard({
  icon,
  kind,
  title,
  body,
  active,
  highlight,
  linked,
}: {
  icon: ReactNode;
  kind: string;
  title: string;
  body: string;
  active?: boolean;
  highlight?: boolean;
  linked?: boolean;
}) {
  return (
    <div
      className={`hero-artifact${active ? " active" : ""}${highlight ? " highlight" : ""}${linked ? " linked" : ""}`}
    >
      <div className="hero-artifact-meta">
        <span className="hero-artifact-icon">{icon}</span>
        <span className="hero-artifact-kind">{kind}</span>
        {linked && <span className="hero-artifact-linked">linked</span>}
      </div>
      <div className="hero-artifact-title">{title}</div>
      <div className="hero-artifact-body">{body}</div>
    </div>
  );
}
