"use client";

import { ArrowRight, FileText, FolderKanban, Layers } from "lucide-react";
import { MetricCard } from "../../components/dashboard/metric-card";
import { ProjectCard } from "../../components/dashboard/project-card";
import { RecentlyUpdatedCard } from "../../components/dashboard/recently-updated-card";

export default function DashboardOverview() {
	const recentlyUpdated = [
		{ id: "1", title: "HypeMind Architecture", timestamp: "1 hour ago" },
		{ id: "2", title: "Landing Page Redesign", timestamp: "3 hours ago" },
		{ id: "3", title: "Q3 OKRs & Planning", timestamp: "5 hours ago" },
	];

	const activeProjects = [
		{ id: "1", title: "HypeMind Dashboard", category: "Product Development", description: "Core UI application interface implementation.", canvasCount: 5, lastUpdated: "2 hours ago", status: "Active" as const },
		{ id: "2", title: "AI Assistant Core", category: "Product Development", description: "Document parsing and LLM orchestration.", canvasCount: 3, lastUpdated: "1 day ago", status: "Active" as const },
		{ id: "3", title: "Landing Page", category: "Marketing", description: "Conversion optimized landing layout.", canvasCount: 2, lastUpdated: "3 days ago", status: "Active" as const },
		{ id: "4", title: "Brand Assets v2", category: "Design", description: "Updated typography and token scales.", canvasCount: 8, lastUpdated: "1 week ago", status: "Inactive" as const },
	];

	return (
		<div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
			<div className="mb-8">
				<h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">Overview</h1>
				<p className="text-sm text-muted-foreground">System telemetry and active contexts.</p>
			</div>

			<div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
				<MetricCard icon={FolderKanban} label="Total Projects" value={4} iconBgColor="#6F5DF5" />
				<MetricCard icon={Layers} label="Active Areas" value={2} iconBgColor="#23C58A" />
				<MetricCard icon={FileText} label="Stored Items" value={28} iconBgColor="#F59E0B" />
			</div>

			<div className="mb-10">
				<h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Recently Updated</h2>
				<div className="scrollbar-hide flex gap-3 overflow-x-auto pb-4 sm:gap-4">
					{recentlyUpdated.map((item) => (
						<RecentlyUpdatedCard key={item.id} title={item.title} timestamp={item.timestamp} />
					))}
				</div>
			</div>

			<div>
				<div className="mb-4 flex items-center justify-between gap-3">
					<h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Active Projects</h2>
					<button type="button" className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:text-primary/80">
						View all <ArrowRight className="size-3.5" />
					</button>
				</div>
				<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
					{activeProjects.map((project) => (
						<ProjectCard key={project.id} {...project} />
					))}
				</div>
			</div>
		</div>
	);
}
