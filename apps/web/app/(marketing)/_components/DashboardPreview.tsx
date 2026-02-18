"use client";
import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";

export function DashboardPreview() {
	const containerRef = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start end", "end start"],
	});

	const rotateX = useTransform(scrollYProgress, [0, 0.3], [15, 0]);
	const scale = useTransform(scrollYProgress, [0, 0.3], [0.9, 1]);
	const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

	return (
		<section
			ref={containerRef}
			className="py-20 perspective-1000 overflow-hidden relative z-20"
		>
			<div className="container mx-auto px-4 max-w-7xl">
				<motion.div
					style={{ rotateX, scale, opacity }}
					className="relative mx-auto max-w-6xl rounded-2xl border border-white/10 shadow-2xl bg-background/50 backdrop-blur-sm overflow-hidden"
				>
					{/* Ambient Glow Behind */}
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/20 blur-[120px] rounded-full -z-10" />

					{/* Image Container - Using w-full h-auto to respect image aspect ratio */}
					<div className="relative w-full">
						{/* Light Mode Image */}
						<div className="block dark:hidden">
							<Image
								src="/light-logo.png"
								alt="HypeMind Dashboard Light"
								width={2880}
								height={1800}
								className="w-full h-auto"
								priority
							/>
						</div>

						{/* Dark Mode Image */}
						<div className="hidden dark:block">
							<Image
								src="/dark-logo.png"
								alt="HypeMind Dashboard Dark"
								width={2880}
								height={1800}
								className="w-full h-auto"
								priority
							/>
						</div>

						{/* Bottom Fade Gradient - Hides the bottom edge cleanly */}
						<div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />

						{/* Subtle Top Reflection/Sheen */}
						<div className="absolute inset-x-0 top-0 h-px bg-white/20" />
					</div>
				</motion.div>
			</div>
		</section>
	);
}
