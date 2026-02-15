'use client'

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg-app text-text-primary">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-text-muted text-sm">
            Effective date: February 5, 2026
          </p>
        </div>

        <section className="space-y-3 text-sm text-text-secondary leading-relaxed">
          <p>
            This Privacy Policy explains how HypeMind collects, uses, and
            protects your data.
          </p>
          <p>
            This page is a placeholder. Add your full privacy policy here
            before shipping.
          </p>
        </section>

        <div className="pt-4">
          <Link href="/" className="text-sm text-accent hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
