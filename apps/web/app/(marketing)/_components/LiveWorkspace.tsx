"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  FileText,
  Calendar,
  CheckSquare,
  StickyNote,
  Sparkles,
  ArrowUpRight,
  Link2,
} from "lucide-react";
import { SectionHeader } from "./SectionHeader";

type MemoryItem = {
  id: string;
  kind: "note" | "meeting" | "task" | "page";
  title: string;
  snippet: string;
  when: string;
  tags: string[];
  links: string[];
};

const WORKSPACE: MemoryItem[] = [
  {
    id: "auth-note",
    kind: "note",
    title: "Auth decision",
    snippet: "Ship OAuth first. Magic links in v2. Document risks from Stripe PDF.",
    when: "3 weeks ago",
    tags: ["auth", "oauth", "security"],
    links: ["arch-meeting", "oauth-task"],
  },
  {
    id: "arch-meeting",
    kind: "meeting",
    title: "Architecture review",
    snippet: "JWT sessions, refresh rotation, audit log on day one. Team aligned.",
    when: "2 weeks ago",
    tags: ["auth", "architecture", "jwt"],
    links: ["auth-note", "oauth-task"],
  },
  {
    id: "oauth-task",
    kind: "task",
    title: "Implement OAuth flow",
    snippet: "Due Friday · Owner: you · Blocked on provider keys",
    when: "Yesterday",
    tags: ["auth", "oauth", "shipping"],
    links: ["auth-note", "arch-meeting"],
  },
  {
    id: "pricing-page",
    kind: "page",
    title: "Pricing narrative",
    snippet: "Free forever tier. Pro for infinite memory. Team for shared context.",
    when: "Last week",
    tags: ["pricing", "gtm", "product"],
    links: [],
  },
  {
    id: "research-note",
    kind: "note",
    title: "Competitor memory tools",
    snippet: "Most tools store notes. Almost none retrieve decisions with sources.",
    when: "Last month",
    tags: ["research", "competitors", "memory"],
    links: ["pricing-page"],
  },
  {
    id: "standup",
    kind: "meeting",
    title: "Monday standup",
    snippet: "Launch checklist at 70%. Auth is the critical path this week.",
    when: "Today",
    tags: ["standup", "launch", "auth"],
    links: ["oauth-task"],
  },
];

const KIND_META = {
  note: { icon: StickyNote, label: "Note" },
  meeting: { icon: Calendar, label: "Meeting" },
  task: { icon: CheckSquare, label: "Task" },
  page: { icon: FileText, label: "Page" },
} as const;

const DEMO_QUERIES = [
  "authentication approach",
  "what did we decide about oauth",
  "pricing",
  "launch critical path",
];

function scoreItem(item: MemoryItem, q: string) {
  if (!q.trim()) return 1;
  const hay = `${item.title} ${item.snippet} ${item.tags.join(" ")}`.toLowerCase();
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  return terms.reduce((acc, t) => acc + (hay.includes(t) ? 2 : 0), 0);
}

export function LiveWorkspace() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("auth-note");
  const [aiOpen, setAiOpen] = useState(false);

  const results = useMemo(() => {
    const scored = WORKSPACE.map((item) => ({
      item,
      score: scoreItem(item, query),
    }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.map((r) => r.item);
  }, [query]);

  const selected = WORKSPACE.find((w) => w.id === selectedId) ?? WORKSPACE[0];
  const linked = selected.links
    .map((id) => WORKSPACE.find((w) => w.id === id))
    .filter(Boolean) as MemoryItem[];

  return (
    <section id="demo" className="mkt-section mkt-section-surface" aria-label="Interactive product demo">
      <SectionHeader
        eyebrow="Live workspace"
        title={
          <>
            Don&apos;t read about memory.
            <br />
            Search a real one.
          </>
        }
        subtitle="This is a lightweight HypeMind workspace. Search it. Open memories. Follow links. Watch AI pull sources — the same loop you get in the product."
      />

      <div className="live-workspace">
        {/* Search bar */}
        <div className="live-search">
          <Search size={16} className="live-search-icon" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setAiOpen(false);
            }}
            placeholder="Search your memory… try “authentication” or “pricing”"
            aria-label="Search fake workspace"
            className="live-search-input"
          />
          <div className="live-search-chips">
            {DEMO_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                className={`live-chip${query === q ? " active" : ""}`}
                onClick={() => {
                  setQuery(q);
                  setAiOpen(false);
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="live-workspace-grid">
          {/* Results */}
          <div className="live-results">
            <div className="live-panel-label">
              {query ? `${results.length} memories` : "All memories"}
            </div>
            <div className="live-results-list">
              {results.map((item) => {
                const meta = KIND_META[item.kind];
                const Icon = meta.icon;
                const active = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`live-result${active ? " active" : ""}`}
                    onClick={() => {
                      setSelectedId(item.id);
                      setAiOpen(false);
                    }}
                  >
                    <span className="live-result-kind">
                      <Icon size={13} />
                      {meta.label}
                    </span>
                    <span className="live-result-title">{item.title}</span>
                    <span className="live-result-when">{item.when}</span>
                  </button>
                );
              })}
              {results.length === 0 && (
                <div className="live-empty">No memories match. Try another phrase.</div>
              )}
            </div>
          </div>

          {/* Detail + graph */}
          <div className="live-detail">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <div className="live-detail-kind">
                  {(() => {
                    const Icon = KIND_META[selected.kind].icon;
                    return (
                      <>
                        <Icon size={14} />
                        {KIND_META[selected.kind].label} · {selected.when}
                      </>
                    );
                  })()}
                </div>
                <h3 className="live-detail-title font-display">{selected.title}</h3>
                <p className="live-detail-body">{selected.snippet}</p>

                <div className="live-tags">
                  {selected.tags.map((t) => (
                    <span key={t} className="live-tag">
                      {t}
                    </span>
                  ))}
                </div>

                {linked.length > 0 && (
                  <div className="live-links">
                    <div className="live-panel-label">
                      <Link2 size={12} /> Connected
                    </div>
                    <div className="live-link-list">
                      {linked.map((item) => {
                        const Icon = KIND_META[item.kind].icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className="live-link-item"
                            onClick={() => setSelectedId(item.id)}
                          >
                            <Icon size={13} />
                            <span>{item.title}</span>
                            <ArrowUpRight size={12} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn-primary-marketing live-ai-btn"
                  onClick={() => setAiOpen((v) => !v)}
                >
                  <Sparkles size={14} />
                  {aiOpen ? "Hide AI recall" : "Ask AI about this"}
                </button>

                <AnimatePresence>
                  {aiOpen && (
                    <motion.div
                      className="live-ai-panel"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="live-ai-question">
                        Summarize what we know about “{selected.title}”.
                      </div>
                      <div className="live-ai-answer">
                        <p>
                          From your workspace: <strong>{selected.snippet}</strong>
                        </p>
                        {linked.length > 0 && (
                          <p style={{ marginTop: 10 }}>
                            Related context:{" "}
                            {linked.map((l) => l.title).join(" · ")}. HypeMind
                            keeps these linked so you never re-explain the chain.
                          </p>
                        )}
                        <div className="source-pill" style={{ marginTop: 12 }}>
                          <span className="source-tag">Grounded in</span>
                          <span className="source-link">{selected.title}</span>
                          {linked.slice(0, 2).map((l) => (
                            <span key={l.id} className="source-link">
                              {l.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
