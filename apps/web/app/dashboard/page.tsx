"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, FolderKanban, Layout, Pin } from "lucide-react";
import { Navigator } from "../../lib/navigator";

const JUMP_BACK_IN = [
	{ id: "jump-1", title: "Product Direction Canvas", subtitle: "Edited 42 minutes ago", icon: Layout },
	{ id: "jump-2", title: "Quick Note: API edge cases", subtitle: "Opened 1 hour ago", icon: FileText },
	{ id: "jump-3", title: "Project: HypeMind Dashboard", subtitle: "Viewed yesterday", icon: FolderKanban },
];

const PINNED_ITEMS = [
	{ id: "pin-1", title: "Q3 OKRs", subtitle: "Strategic planning" },
	{ id: "pin-2", title: "Moving Checklist", subtitle: "Personal operations" },
];

export default function DashboardOverview() {
	const [captureInput, setCaptureInput] = useState("");
	const [unsortedCount, setUnsortedCount] = useState(3);
	const [captureMessage, setCaptureMessage] = useState<string | null>(null);

	const submitCapture = () => {
		const value = captureInput.trim();
		if (!value) {
			return;
		}

		setCaptureInput("");
		setUnsortedCount((current) => current + 1);
		setCaptureMessage(`Captured to Unsorted: "${value}"`);
	};

	return (
		<div className="mx-auto w-full max-w-4xl p-8 md:p-12">
			<div className="space-y-14">
				<section>
					<div className="rounded-lg bg-muted/30 p-4 focus-within:ring-1 focus-within:ring-primary/40">
						<input
							type="text"
							value={captureInput}
							onChange={(event) => setCaptureInput(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									submitCapture();
								}
							}}
							placeholder="Capture a thought..."
							className="w-full bg-transparent text-lg outline-none placeholder:text-muted-foreground/75"
						/>
					</div>
					{captureMessage && <p className="mt-3 text-sm text-muted-foreground">{captureMessage}</p>}
				</section>

				<section>
					<h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jump Back In</h2>
					<div className="space-y-1">
						{JUMP_BACK_IN.map((item) => (
							<button key={item.id} type="button" className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:text-foreground">
								<item.icon className="size-4 text-muted-foreground transition-all duration-200 group-hover:scale-110 group-hover:text-primary" />
								<div className="min-w-0">
									<p className="truncate text-sm font-medium text-foreground">{item.title}</p>
									<p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
								</div>
							</button>
						))}
					</div>
				</section>

				<section>
					<h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Focus</h2>
					<div className="space-y-1">
						{PINNED_ITEMS.map((item) => (
							<button key={item.id} type="button" className="group flex w-full items-center gap-3 rounded-lg bg-muted/20 px-3 py-3 text-left transition-colors hover:bg-muted/30">
								<Pin className="size-4 text-muted-foreground transition-all duration-200 group-hover:scale-110 group-hover:text-primary" />
								<div>
									<p className="text-sm font-medium text-foreground">{item.title}</p>
									<p className="text-xs text-muted-foreground">{item.subtitle}</p>
								</div>
							</button>
						))}
					</div>
				</section>

				<section className="rounded-2xl bg-primary/5 p-6">
					<h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/80">Cognitive Hygiene</h2>
					<p className="text-sm text-foreground/90">You have {unsortedCount} raw notes waiting to be organized.</p>
					<Link
						href={Navigator.unsorted()}
						className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:underline"
					>
						Process Now <ArrowRight className="size-3.5" />
					</Link>
				</section>
			</div>
		</div>
	);
}
