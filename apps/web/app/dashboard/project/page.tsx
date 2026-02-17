"use client";

import { FolderKanban, Plus } from "lucide-react";
import { ProjectCard } from "../../../components/dashboard/project-card";

export default function ProjectsPage() {
	const projects = [
		{ id: "p1", title: "HypeMind Dashboard", category: "Product Development", description: "Core UI application interface implementation.", canvasCount: 5, lastUpdated: "2 hours ago", status: "Active" as const },
		{ id: "p2", title: "AI Assistant Core", category: "Product Development", description: "Document parsing and LLM orchestration.", canvasCount: 3, lastUpdated: "1 day ago", status: "Active" as const },
		{ id: "p3", title: "Landing Page", category: "Marketing", description: "Conversion optimized landing layout.", canvasCount: 2, lastUpdated: "3 days ago", status: "Active" as const },
		{ id: "p4", title: "Brand Assets v2", category: "Design", description: "Updated typography and token scales.", canvasCount: 8, lastUpdated: "1 week ago", status: "Inactive" as const },
	];

	return (
		<div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
			<div className="mb-8 flex items-center justify-between gap-3 border-b border-border pb-6">
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
						<FolderKanban className="size-5 text-primary" />
					</div>
					<div>
						<h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
						<p className="text-sm text-muted-foreground">All active and inactive projects across areas.</p>
					</div>
				</div>
				<button type="button" className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
					<Plus className="size-4" />
					New Project
				</button>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				{projects.map((project) => (
					<ProjectCard key={project.id} {...project} />
				))}
			</div>
		</div>
	);
}