"use client";

import Link from "next/link";
import { useScroll, motion, useMotionValueEvent, AnimatePresence } from "motion/react";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#features", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

export function SiteHeader() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 30);
  });

  return (
    <header className={`marketing-header${scrolled ? " scrolled" : ""}`}>
      <div className="marketing-header-inner">
        <Link href="/" className="header-wordmark" aria-label="HypeMind home">
          <div className="header-wordmark-mark" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 2h4v4H2V2zM8 2h4v4H8V2zM2 8h4v4H2V8zM8 8l4 4M8 12l4-4"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          HypeMind
        </Link>

        <nav className="header-nav header-nav-desktop" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="header-nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link href="/login" className="header-nav-link header-login">
            Log in
          </Link>
          <Link href="/dashboard" className="btn-primary-marketing">
            Get started
            <ArrowRight size={14} />
          </Link>
          <button
            type="button"
            className="header-menu-btn"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            className="header-mobile-drawer"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            aria-label="Mobile navigation"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="header-mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/login" className="header-mobile-link" onClick={() => setMobileOpen(false)}>
              Log in
            </Link>
            <Link
              href="/dashboard"
              className="btn-primary-marketing"
              style={{ marginTop: 8, justifyContent: "center" }}
              onClick={() => setMobileOpen(false)}
            >
              Get started
              <ArrowRight size={14} />
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
