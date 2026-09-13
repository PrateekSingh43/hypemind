"use client";

import Link from "next/link";

const FOOTER_COLUMNS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ],
  Resources: [
    { label: "Dashboard App", href: "/dashboard" },
    { label: "Log in", href: "/login" },
    { label: "Sign up", href: "/signup" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="marketing-footer" aria-label="Site footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand-title font-display">HypeMind</div>
          <p className="footer-brand-desc">
            A workspace that remembers. Capture everything. AI understands it. Nothing gets lost.
          </p>
        </div>

        {Object.entries(FOOTER_COLUMNS).map(([category, links]) => (
          <div key={category}>
            <div className="footer-col-title">{category}</div>
            <div className="footer-links-list">
              {links.map((item) => (
                <Link key={item.label} href={item.href} className="footer-link">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <div>© {new Date().getFullYear()} HypeMind Inc. All rights reserved.</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80" }} />
          <span>All systems operational</span>
        </div>
      </div>
    </footer>
  );
}
