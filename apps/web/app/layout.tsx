import "./globals.css";
import { Providers } from "./provider";

import { Geist, Newsreader } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});




export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${newsreader.variable} antialiased bg-bg-app text-text-primary`}
        suppressHydrationWarning
      >

        <Providers>{children}</Providers>

      </body>
    </html>
  );
}
