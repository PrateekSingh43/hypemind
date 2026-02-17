"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Archive,
	Book,
	Brain,
	ChevronDown,
	ChevronRight,
	FolderKanban,
	Inbox,
	Layers,
	MoreHorizontal,
	Pin,
	Plus,
	Search,
	Settings,
	type LucideIcon,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@repo/ui/components/dropdown-menu";
import { Navigator } from "../../lib/navigator";

const AREAS = [
	{ id: "1", name: "Product Development", projects: [{ id: "p1", name: "HypeMind Dashboard" }, { id: "p2", name: "AI Assistant v2" }, { id: "p4", name: "Mobile App" }] },
	{ id: "2", name: "Marketing", projects: [{ id: "p3", name: "Landing Page Redesign" }] },
];

const PROJECTS = [
	{ id: "p1", name: "HypeMind Dashboard", area: "Product Development" },
	{ id: "p2", name: "AI Assistant v2", area: "Product Development" },
	{ id: "p3", name: "Landing Page Redesign", area: "Marketing" },
];

const isRouteActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

const NavItem = ({ href, icon: Icon, label, pathname }: { href: string; icon: LucideIcon; label: string; pathname: string }) => (
	<Link
		href={href}
		className={cn(
			"flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
			isRouteActive(pathname, href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
		)}
	>
		<Icon className="size-4" />
		<span className="flex-1">{label}</span>
	</Link>
);

const SectionHeader = ({
	id,
	label,
	icon: Icon,
	href,
	expanded,
	toggle,
}: {
	id: string;
	label: string;
	icon: LucideIcon;
	href: string;
	expanded: boolean;
	toggle: (id: string) => void;
}) => (
	<div className="group mt-2 px-2">
		<div className="flex items-center justify-between rounded-lg px-1.5 py-1.5 hover:bg-muted/30">
			<div className="flex min-w-0 items-center gap-1.5">
				<button
					type="button"
					onClick={() => toggle(id)}
					className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
				>
					{expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
				</button>
				<Icon className="size-4 text-muted-foreground" />
				<Link href={href} className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary">
					{label}
				</Link>
			</div>

			<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
				<button type="button" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary">
					<Plus className="size-3.5" />
				</button>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button type="button" id={`section-menu-trigger-${id}`} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary" aria-label={`${label} options`}>
							<MoreHorizontal className="size-3.5" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40">
						<DropdownMenuItem>View all {label}</DropdownMenuItem>
						<DropdownMenuItem>Manage settings</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	</div>
);

export function LeftSidebar() {
	const pathname = usePathname();
	const [expanded, setExpanded] = useState<Record<string, boolean>>({ journal: true, area: true, project: true });

	const toggle = (section: string) => setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));

	return (
		<div className="flex h-full min-h-0 w-full flex-col border-r border-border bg-card">
			<div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
				<div className="flex size-8 items-center justify-center rounded-lg bg-primary shadow-sm">
					<Brain className="size-5 text-primary-foreground" />
				</div>
				<span className="font-semibold tracking-tight text-foreground">HypeMind</span>
			</div>

			<div className="flex-1 overflow-y-auto pb-4">
				<div className="border-b border-border p-3">
					<button type="button" className="flex h-9 w-full items-center gap-2 rounded-md border border-transparent bg-muted/50 px-3 text-muted-foreground transition-colors hover:border-border hover:bg-muted">
						<Search className="size-4" />
						<span className="text-sm font-medium">Search...</span>
						<span className="ml-auto rounded border border-border bg-background px-1.5 py-0.5 text-xs font-medium">Ctrl+K</span>
					</button>
				</div>

				<div className="space-y-0.5 border-b border-border p-2">
					<NavItem href={Navigator.inbox()} icon={Inbox} label="Inbox" pathname={pathname} />
					<NavItem href={Navigator.pinned()} icon={Pin} label="Pinned" pathname={pathname} />
				</div>

				<SectionHeader id="journal" label="Journal" icon={Book} href={Navigator.journal()} expanded={expanded["journal"]} toggle={toggle} />
				{expanded["journal"] && (
					<div className="px-2 pb-2">
						<Link
							href={Navigator.journal()}
							className={cn(
								"block truncate rounded-md px-7 py-1.5 text-sm transition-colors",
								isRouteActive(pathname, Navigator.journal()) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
							)}
						>
							Today&apos;s Log
						</Link>
					</div>
				)}

				<SectionHeader id="area" label="Areas" icon={Layers} href={Navigator.areas()} expanded={expanded["area"]} toggle={toggle} />
				{expanded["area"] && (
					<div className="space-y-1 px-2">
						{AREAS.map((area) => (
							<div key={area.id} className="rounded-md">
								<Link
									href={Navigator.area(area.id)}
									className={cn(
										"flex items-center justify-between rounded-md px-7 py-1.5 text-sm transition-colors",
										isRouteActive(pathname, Navigator.area(area.id)) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
									)}
								>
									<span className="truncate">{area.name}</span>
									<span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{area.projects.length}</span>
								</Link>
								<div className="ml-9 space-y-1 border-l border-border/80 py-1 pl-3">
									{area.projects.slice(0, 2).map((project) => (
										<Link
											key={project.id}
											href={Navigator.project(project.id)}
											className={cn(
												"flex items-center gap-2 truncate rounded-md px-2 py-1 text-xs transition-colors",
												isRouteActive(pathname, Navigator.project(project.id)) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
											)}
										>
											<FolderKanban className="size-3.5 opacity-70" />
											{project.name}
										</Link>
									))}
								</div>
							</div>
						))}
					</div>
				)}

				<SectionHeader id="project" label="Projects" icon={FolderKanban} href={Navigator.projects()} expanded={expanded["project"]} toggle={toggle} />
				{expanded["project"] && (
					<div className="space-y-0.5 px-2">
						{PROJECTS.map((project) => {
							const active = isRouteActive(pathname, Navigator.project(project.id));
							return (
								<Link key={project.id} href={Navigator.project(project.id)} className={cn("flex flex-col rounded-md px-7 py-1.5 transition-colors", active ? "bg-primary/10" : "hover:bg-muted/50")}>
									<span className={cn("truncate text-sm", active ? "text-primary" : "text-muted-foreground")}>{project.name}</span>
									<span className="truncate text-[10px] text-muted-foreground/70">{project.area}</span>
								</Link>
							);
						})}
					</div>
				)}

				<div className="mt-6 space-y-0.5 border-t border-border px-2 pt-4">
					<NavItem href={Navigator.archive()} icon={Archive} label="Archive" pathname={pathname} />
					<NavItem href={Navigator.settings()} icon={Settings} label="Settings" pathname={pathname} />
				</div>
			</div>
		</div>
	);
}