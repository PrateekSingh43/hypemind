import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppProvider } from "./provider";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "HypeMind - Your Second Brain",
	description: "Capture ideas, organize with PARA, and let your thoughts evolve.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.variable} antialiased bg-background text-foreground`} suppressHydrationWarning>
				<AppProvider>{children}</AppProvider>
			</body>
		</html>
	);
}