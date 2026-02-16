import "./globals.css";

import { Inter } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HypeMind — Your Second Brain",
  description: "Capture ideas, organize with PARA, and let your thoughts evolve.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
        style={{
          fontFamily: "var(--font-sans)",
          backgroundColor: "var(--color-main)",
          color: "var(--color-text)",
        }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
