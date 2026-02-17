import { Clock, Layers, MoreVertical, Pin, Share2 } from "lucide-react";

type ProjectStatus = "Active" | "Inactive";

type ProjectCardProps = {
	title: string;
	category: string;
	description: string;
	canvasCount: number;
	lastUpdated: string;
	status: ProjectStatus;
};

export function ProjectCard({ title, category, description, canvasCount, lastUpdated, status }: ProjectCardProps) {
	return (
		<div className="group relative cursor-pointer rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
			<div className="pointer-events-none absolute right-4 top-4 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
				<button type="button" className="flex size-7 items-center justify-center rounded-md border border-border bg-card transition-colors hover:bg-muted">
					<Pin className="size-3.5 text-muted-foreground transition-colors hover:text-primary" />
				</button>
				<button type="button" className="flex size-7 items-center justify-center rounded-md border border-border bg-card transition-colors hover:bg-muted">
					<Share2 className="size-3.5 text-muted-foreground transition-colors hover:text-primary" />
				</button>
				<button type="button" className="flex size-7 items-center justify-center rounded-md border border-border bg-card transition-colors hover:bg-muted">
					<MoreVertical className="size-3.5 text-muted-foreground transition-colors hover:text-primary" />
				</button>
			</div>
			<div className="mb-2.5 flex items-start justify-between gap-3">
				<h3 className="line-clamp-1 pr-24 text-sm font-semibold text-foreground">{title}</h3>
				<span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status === "Active" ? "bg-[#23C58A]/10 text-[#23C58A]" : "bg-muted text-muted-foreground"}`}>
					{status}
				</span>
			</div>
			<div className="mb-3">
				<span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{category}</span>
			</div>
			<p className="mb-4 min-h-[32px] line-clamp-2 text-xs text-muted-foreground">{description}</p>
			<div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
				<div className="flex items-center gap-1.5">
					<Layers className="size-3.5 transition-colors group-hover:text-primary" />
					<span>{canvasCount} elements</span>
				</div>
				<div className="flex items-center gap-1.5">
					<Clock className="size-3.5 transition-colors group-hover:text-primary" />
					<span>{lastUpdated}</span>
				</div>
			</div>
		</div>
	);
}
