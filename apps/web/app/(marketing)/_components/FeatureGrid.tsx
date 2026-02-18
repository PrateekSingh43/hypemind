"use client";

import { Zap, Layout, Lock, Layers, Smartphone, Globe, Command, Users } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

const features = [
	{
		icon: <Zap className="w-6 h-6 text-yellow-500" />,
		title: "Lightning Fast",
		description: "Built on a modern stack for instant page loads and real-time syncing across all devices.",
		colSpan: "md:col-span-2",
		bg: "bg-gradient-to-br from-yellow-500/5 to-transparent"
	},
	{
		icon: <Layout className="w-6 h-6 text-blue-500" />,
		title: "Keyboard First",
		description: "Navigate the entire app without touching your mouse. Command menu for everything.",
		colSpan: "md:col-span-1",
		bg: "bg-gradient-to-br from-blue-500/5 to-transparent"
	},
	{
		icon: <Lock className="w-6 h-6 text-green-500" />,
		title: "Secure by Design",
		description: "End-to-end encryption for your private notes. You own your data, always.",
		colSpan: "md:col-span-1",
		bg: "bg-gradient-to-br from-green-500/5 to-transparent"
	},
	{
		icon: <Layers className="w-6 h-6 text-purple-500" />,
		title: "Project Views",
		description: "Visualize your work with Kanban, List, and Calendar views. Switch instantly.",
		colSpan: "md:col-span-2",
		bg: "bg-gradient-to-br from-purple-500/5 to-transparent"
	},
	{
		icon: <Smartphone className="w-6 h-6 text-pink-500" />,
		title: "Mobile Ready",
		description: "A fully native mobile experience using PWA technology. Capture on the go.",
		colSpan: "md:col-span-1",
		bg: "bg-gradient-to-br from-pink-500/5 to-transparent"
	},
	{
		icon: <Globe className="w-6 h-6 text-cyan-500" />,
		title: "Offline Support",
		description: "Keep working even when the internet goes down. Syncs automatically when you're back.",
		colSpan: "md:col-span-1",
		bg: "bg-gradient-to-br from-cyan-500/5 to-transparent"
	},
	{
		icon: <Users className="w-6 h-6 text-orange-500" />,
		title: "Real-time Collab",
		description: "Work with your team in real-time. See cursors and typing indicators.",
		colSpan: "md:col-span-1",
		bg: "bg-gradient-to-br from-orange-500/5 to-transparent"
	},
];

export function FeatureGrid() {
	return (
		<section className="py-24 md:py-32 relative">
			<div className="container mx-auto px-4 max-w-7xl">
				<div className="text-center max-w-3xl mx-auto mb-20">
					<motion.h2
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
					>
						Designed for flow state.
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.1 }}
						className="text-xl text-muted-foreground"
					>
						We stripped away the clutter to focus on what matters: your thoughts. Experience the fastest workflow you've ever used.
					</motion.p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{features.map((feature, index) => (
						<FeatureCard key={index} feature={feature} index={index} />
					))}
				</div>
			</div>
		</section>
	);
}

function FeatureCard({ feature, index }: { feature: any, index: number }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ delay: index * 0.1 }}
			className={`group relative overflow-hidden rounded-3xl border border-border/50 bg-card/50 p-8 hover:border-border transition-colors ${feature.colSpan}`}
		>
			<div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${feature.bg}`} />

			<div className="relative z-10">
				<div className="mb-6 h-12 w-12 rounded-2xl bg-secondary/50 flex items-center justify-center border border-border/50 group-hover:scale-110 transition-transform duration-300">
					{feature.icon}
				</div>
				<h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
				<p className="text-muted-foreground leading-relaxed">
					{feature.description}
				</p>
			</div>
		</motion.div>
	);
}
