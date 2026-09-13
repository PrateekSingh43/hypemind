import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";

import { AppProvider } from "./provider";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
});

const syne = Syne({
	variable: "--font-display",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "HypeMind — A workspace that remembers",
	description:
		"Stop rebuilding context. Capture notes, meetings, and decisions once — HypeMind connects them and recalls them with AI that never starts from zero.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${syne.variable} antialiased bg-background text-foreground`}
				suppressHydrationWarning
			>
				<AppProvider>{children}</AppProvider>
			</body>
		</html>
	);
}