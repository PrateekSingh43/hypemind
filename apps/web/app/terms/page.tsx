import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-foreground-muted text-sm">
            Effective date: February 5, 2026
          </p>
        </div>

        <section className="space-y-3 text-sm text-foreground-muted leading-relaxed">
          <p>
            These Terms of Service govern your use of HypeMind. By using the
            product, you agree to these terms.
          </p>
          <p>
            This page is a placeholder. Add your full legal terms here before
            shipping.
          </p>
        </section>

        <div className="pt-4">
          <Link href="/" className="text-sm text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
