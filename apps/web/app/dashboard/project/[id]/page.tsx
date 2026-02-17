"use client";

import { FolderKanban, LayoutDashboard } from "lucide-react";
import { useParams } from "next/navigation";

export default function ProjectDetailView() {
	const { id } = useParams<{ id: string }>();

	return (
		<div className="mx-auto flex h-full w-full max-w-6xl flex-col p-4 sm:p-6 lg:p-8">
			<div className="mb-8 flex shrink-0 items-center justify-between gap-3 border-b border-border pb-6">
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
						<FolderKanban className="size-5 text-primary" />
					</div>
					<div>
						<h1 className="text-2xl font-bold tracking-tight text-foreground">Project Context (ID: {id})</h1>
						<p className="text-sm text-muted-foreground">Execution environment and attached canvases.</p>
					</div>
				</div>
			</div>

			<div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center shadow-sm">
				<LayoutDashboard className="mb-4 size-12 text-muted-foreground/30" />
				<h3 className="mb-1 text-lg font-semibold text-foreground">Canvas Environment</h3>
				<p className="max-w-sm text-sm text-muted-foreground">No spatial canvases attached to this project. Create a canvas to begin spatial mapping.</p>
			</div>
		</div>
	);
}