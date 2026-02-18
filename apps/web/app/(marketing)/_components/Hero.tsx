"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export function Hero() {
	return (
		<section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
			{/* Background Gradients */}
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />
			<div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

			<div className="container px-4 mx-auto text-center relative z-10 max-w-5xl">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="inline-flex items-center justify-center px-4 py-1.5 mb-8 text-sm font-medium transition-colors border rounded-full bg-secondary/50 border-border hover:bg-secondary/80 backdrop-blur-sm"
				>
					<span className="flex h-2 w-2 rounded-full bg-primary mr-2 shadow-[0_0_10px] shadow-primary/50" />
					<span className="text-secondary-foreground">v2.0 is now live</span>
					<ArrowRight className="ml-2 w-3 h-3 text-muted-foreground" />
				</motion.div>

				<motion.h1
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.1 }}
					className="text-6xl md:text-8xl font-bold tracking-tight text-foreground mb-8 leading-[1.1]"
				>
					Your Second Brain, <br />
					<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-blue-500 animate-gradient-x">
						Supercharged.
					</span>
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
					className="max-w-2xl mx-auto text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed"
				>
					Capture ideas, manage projects, and organize your life with a tool designed for speed and clarity. The all-in-one workspace for high performers.
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
					className="flex flex-col sm:flex-row items-center justify-center gap-4"
				>
					<Link
						href="/dashboard"
						className="inline-flex items-center justify-center h-14 px-8 text-base font-semibold text-white transition-all rounded-full bg-primary hover:bg-primary/90 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.6)] hover:-translate-y-0.5"
					>
						Get Started <ArrowRight className="ml-2 h-4 w-4" />
					</Link>
					<Link
						href="/login"
						className="inline-flex items-center justify-center h-14 px-8 text-base font-medium transition-all rounded-full text-foreground hover:bg-secondary border border-border hover:border-border/80"
					>
						View Demo
					</Link>
				</motion.div>

				{/* Abstract shapes/decorations */}
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 1, delay: 0.5 }}
					className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-20 hidden md:block"
				>
					<Sparkles className="w-24 h-24 text-primary" />
				</motion.div>
			</div>
		</section>
	);
}
