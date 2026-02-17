"use client";

import { FolderKanban, Layers, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { ProjectCard } from "../../../../components/dashboard/project-card";

export default function AreaDetailView() {
	const { id } = useParams<{ id: string }>();

	const projects = [
		{ id: "p1", title: "System Architecture", category: "Core", description: "Backend specifications and DB schema.", canvasCount: 2, lastUpdated: "1h ago", status: "Active" as const },
		{ id: "p2", title: "API Gateway", category: "Core", description: "Express + Node orchestration layer.", canvasCount: 4, lastUpdated: "2d ago", status: "Active" as const },
	];

	return (
		<div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
			<div className="mb-8 flex items-center justify-between gap-3 border-b border-border pb-6">
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-lg bg-[#23C58A]/10">
						<Layers className="size-5 text-[#23C58A]" />
					</div>
					<div>
						<h1 className="text-2xl font-bold tracking-tight text-foreground">Area Detail (ID: {id})</h1>
						<p className="text-sm text-muted-foreground">Managing bounded context projects.</p>
					</div>
				</div>
				<button type="button" className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted">
					<Plus className="size-4 text-muted-foreground" />
					New Project
				</button>
			</div>

			<h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
				<FolderKanban className="size-4 text-muted-foreground" />
				Contained Projects
			</h2>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				{projects.map((project) => (
					<ProjectCard key={project.id} {...project} />
				))}
			</div>
		</div>
	);
}