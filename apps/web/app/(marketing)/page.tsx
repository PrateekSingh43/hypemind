import Link from "next/link";
import { ArrowRight, Layout, Zap, Lock, Layers, Smartphone, Globe } from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-visible">
        <div className="hero-glow top-0" />

        <div className="container px-4 mx-auto text-center relative z-10 max-w-7xl">
          <div className="inline-flex items-center justify-center px-4 py-1 mb-8 text-sm font-medium transition-colors border rounded-full glass text-text-secondary border-border-subtle hover:bg-white/5 animate-fade-in opacity-0" style={{ animationDelay: "0.1s" }}>
            <span className="flex h-2 w-2 rounded-full bg-brand-primary mr-2" />
            v2.0 is now live
          </div>

          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-text-primary mb-6 animate-fade-in-up opacity-0" style={{ animationDelay: "0.2s" }}>
            Your Second Brain, <br />
            <span className="text-gradient">Supercharged.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-text-secondary mb-10 animate-fade-in-up opacity-0" style={{ animationDelay: "0.3s" }}>
            Capture ideas, manage projects, and organize your life with a tool designed for speed and clarity. The all-in-one workspace for high performers.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: "0.4s" }}>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center h-12 px-8 text-sm font-medium text-white transition-all rounded-full bg-brand-primary hover:bg-brand-secondary shadow-[0_0_20px_-5px_rgba(94,106,210,0.5)] hover:shadow-[0_0_25px_-5px_rgba(94,106,210,0.6)]"
            >
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-12 px-8 text-sm font-medium transition-colors rounded-full text-text-primary hover:bg-bg-surface border border-border-subtle"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Dashboard Preview (3D Tilt) */}
        <div className="container mx-auto mt-20 px-4 max-w-7xl perspective-1000 animate-fade-in-up opacity-0" style={{ animationDelay: "0.6s" }}>
          <div className="relative rounded-xl border border-border-subtle bg-bg-panel shadow-2xl overflow-hidden aspect-video transform rotate-x-12 opacity-90 hover:opacity-100 transition-all duration-700 group">
            {/* Mock UI Header */}
            <div className="absolute top-0 w-full h-12 border-b border-border-subtle flex items-center px-4 gap-2 bg-bg-panel/50 backdrop-blur-md z-10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              </div>
              <div className="mx-auto w-64 h-6 rounded-md bg-bg-surface/50" />
            </div>

            {/* Mock UI Body */}
            <div className="absolute inset-0 pt-12 flex">
              {/* Sidebar */}
              <div className="w-64 h-full border-r border-border-subtle bg-bg-panel hidden md:block p-4 space-y-4">
                <div className="h-8 w-full rounded bg-bg-surface/50" />
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded bg-bg-surface/30" />
                  <div className="h-4 w-1/2 rounded bg-bg-surface/30" />
                  <div className="h-4 w-5/6 rounded bg-bg-surface/30" />
                </div>
              </div>
              {/* Main Content */}
              <div className="flex-1 bg-bg-app p-8">
                <div className="h-32 w-full rounded-lg bg-linear-to-br from-brand-primary/10 to-transparent border border-brand-primary/20 mb-8" />
                <div className="grid grid-cols-3 gap-6">
                  <div className="h-40 rounded-lg bg-bg-surface border border-border-subtle" />
                  <div className="h-40 rounded-lg bg-bg-surface border border-border-subtle" />
                  <div className="h-40 rounded-lg bg-bg-surface border border-border-subtle" />
                </div>
              </div>
            </div>

            {/* Hover Glow */}
            <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        </div>
      </section>

      {/* --- TRUSTED BY --- */}
      <section className="py-12 border-y border-border-subtle bg-bg-panel/50">
        <div className="container mx-auto px-4 max-w-7xl">
          <p className="text-center text-sm text-text-muted mb-8 font-medium">TRUSTED BY INNOVATIVE TEAMS</p>
          <div className="flex flex-wrap justify-center gap-12 grayscale opacity-50">
            {["Acme", "Capsule", "Catalog", "Layers", "Quotient"].map((name) => (
              <div key={name} className="text-xl font-bold text-text-secondary">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-semibold mb-6">Designed for flow state.</h2>
            <p className="text-lg text-text-secondary">
              We stripped away the clutter to focus on what matters: your thoughts. Experience the fastest workflow you've ever used.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-brand-primary" />}
              title="Lightning Fast"
              description="Built on a modern stack for instant page loads and real-time syncing across all devices."
            />
            <FeatureCard
              icon={<Layout className="w-6 h-6 text-brand-primary" />}
              title="Keyboard First"
              description="Navigate the entire app without touching your mouse. Command menu for everything."
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6 text-brand-primary" />}
              title="Secure by Design"
              description="End-to-end encryption for your private notes. You own your data, always."
            />
            <FeatureCard
              icon={<Layers className="w-6 h-6 text-brand-primary" />}
              title="Project Views"
              description="Visualize your work with Kanban, List, and Calendar views. Switch instantly."
            />
            <FeatureCard
              icon={<Smartphone className="w-6 h-6 text-brand-primary" />}
              title="Mobile Ready"
              description="A fully native mobile experience using PWA technology. Capture on the go."
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6 text-brand-primary" />}
              title="Offline Support"
              description="Keep working even when the internet goes down. Syncs automatically when you're back."
            />
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-bg-app to-bg-panel z-0" />
        <div className="hero-glow bottom-0" />

        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-semibold mb-8 tracking-tight">
            Ready to organize your <br /> digital life?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-10 text-base font-medium text-white transition-all rounded-full bg-brand-primary hover:bg-brand-secondary shadow-lg hover:shadow-brand-primary/25"
            >
              Start for free
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-10 text-base font-medium transition-colors rounded-full text-text-primary hover:bg-bg-surface border border-border-subtle"
            >
              Contact Sales
            </Link>
          </div>
          <p className="mt-8 text-sm text-text-muted">
            No credit card required. Free plan available.
          </p>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-border-subtle bg-bg-panel/30">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-brand-primary rounded" />
              <span className="font-semibold text-lg">HypeMind</span>
            </div>
            <div className="flex gap-8 text-sm text-text-secondary">
              <Link href="#" className="hover:text-text-primary transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-text-primary transition-colors">GitHub</Link>
              <Link href="#" className="hover:text-text-primary transition-colors">Discord</Link>
            </div>
            <div className="text-sm text-text-muted">
              © 2026 HypeMind Inc.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card p-8 rounded-2xl hover:border-brand-primary/30 transition-colors group">
      <div className="mb-6 h-12 w-12 rounded-lg bg-bg-surface flex items-center justify-center border border-border-subtle group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-text-primary">{title}</h3>
      <p className="text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
}