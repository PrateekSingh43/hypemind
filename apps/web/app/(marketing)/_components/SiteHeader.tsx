"use client";

import Link from "next/link";
import { useScroll, motion, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import { cn } from "@repo/ui/lib/utils";
// Note: Assuming reasonable path to utils, if strictly needed I'll adjust import. 
// Standard path in this repo seems to be @repo/ui/lib/utils based on dependencies.
// But wait, the previous `page.tsx` didn't use `cn`. The user's `apps/web/lib/utils` might be better or `cx`. 
// I'll stick to standard tailwind classes or simple conditional logic to avoid import errors if unsure.

export function SiteHeader() {
	const { scrollY } = useScroll();
	const [scrolled, setScrolled] = useState(false);

	useMotionValueEvent(scrollY, "change", (latest) => {
		setScrolled(latest > 50);
	});

	return (
		<header
			className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
					? "bg-background/80 backdrop-blur-md border-b border-border"
					: "bg-transparent"
				}`}
		>
			<div className="container mx-auto px-4 h-16 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
						H
					</div>
					<span className="font-bold text-lg tracking-tight">HypeMind</span>
				</div>

				<nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
					<Link href="#features" className="hover:text-foreground transition-colors">
						Features
					</Link>
					<Link href="#testimonials" className="hover:text-foreground transition-colors">
						Testimonials
					</Link>
					<Link href="#pricing" className="hover:text-foreground transition-colors">
						Pricing
					</Link>
				</nav>

				<div className="flex items-center gap-4">
					<Link
						href="/login"
						className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						Log in
					</Link>
					<Link
						href="/dashboard"
						className="hidden sm:flex h-9 px-4 items-center justify-center rounded-full bg-foreground text-background text-sm font-medium transition active:scale-95 hover:bg-foreground/90"
					>
						Get Started
					</Link>
				</div>
			</div>
		</header>
	);
}
