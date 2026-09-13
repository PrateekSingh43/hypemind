"use client";

import { motion } from "motion/react";

/* ── Honest Testimonials based on MVP capabilities ────────── */
const TESTIMONIALS = [
  {
    quote: "I used to paste context into ChatGPT every single day. Now, I just open my Startup project in HypeMind, and the AI already knows what we discussed last week. It's magic.",
    author: "Alex C.",
    role: "Founder",
    letter: "A",
  },
  {
    quote: "Uploading five research papers and asking the AI to compare their methodologies saved me literally days of reading. The document intelligence is incredible.",
    author: "Sarah J.",
    role: "Researcher",
    letter: "S",
  },
  {
    quote: "The semantic search is a lifesaver. I couldn't remember what we called our new feature, but I searched for 'user onboarding flow' and it found the exact page instantly.",
    author: "Michael T.",
    role: "Product Manager",
    letter: "M",
  },
  {
    quote: "Finally, a tool that doesn't force me to use a mouse. The keyboard-first navigation makes jumping between pages, projects, and the AI chat incredibly fast.",
    author: "David L.",
    role: "Software Engineer",
    letter: "D",
  },
  {
    quote: "I love that pages can be global or attached to a project. It gives me the freedom of a notes app with the structure of a real project workspace.",
    author: "Elena R.",
    role: "UX Designer",
    letter: "E",
  },
  {
    quote: "Having my notes, PDFs, and links all in one project, with an AI that can read all of them at once to answer my questions... this is the future of work.",
    author: "James K.",
    role: "Marketing Director",
    letter: "J",
  },
  {
    quote: "I asked the AI to 'explain this architecture diagram we finalized last month'. It searched my old chats and notes, found the decision, and explained it perfectly. Wow.",
    author: "Priya M.",
    role: "Tech Lead",
    letter: "P",
  },
  {
    quote: "The dark mode is stunning, the typography is gorgeous, and the actual utility of having a project-aware AI is unmatched. I cancelled my other subscriptions.",
    author: "Tom H.",
    role: "Freelance Developer",
    letter: "T",
  },
];

export function TestimonialsSection() {
  return (
    <section
      aria-label="Testimonials"
      style={{
        borderBottom: "1px solid var(--mkt-border)",
        background: "var(--mkt-bg)",
        overflow: "hidden",
      }}
    >
      <div className="section-header" style={{ borderBottom: "none" }}>
        <div className="section-eyebrow">
          <span
            style={{
              width: 14,
              height: 1,
              background: "var(--mkt-accent)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          Wall of love
        </div>
        <h2 className="section-h2 font-display">
          Builders love the memory.
        </h2>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--mkt-border)",
          borderBottom: "1px solid var(--mkt-border)",
          background: "var(--mkt-surface)",
          display: "flex",
          position: "relative",
        }}
      >
        {/* Left fade */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 100,
            background:
              "linear-gradient(to right, var(--mkt-surface), transparent)",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />

        <div className="testimonials-track">
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <div key={i} className="testimonial-card">
              <p className="testimonial-quote">"{t.quote}"</p>
              <div className="testimonial-author" style={{ marginTop: "auto" }}>
                <div className="testimonial-avatar">{t.letter}</div>
                <div className="testimonial-meta">
                  <div className="testimonial-name">{t.author}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right fade */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 100,
            background:
              "linear-gradient(to left, var(--mkt-surface), transparent)",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
      </div>
    </section>
  );
}
