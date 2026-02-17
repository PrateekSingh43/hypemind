"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
	Archive,
	BookOpen,
	Brain,
	ChevronsLeft,
	ChevronsRight,
	ChevronDown,
	ChevronRight,
	FolderKanban,
	Inbox,
	Moon,
	Pin,
	Plus,
	Search,
	Settings,
	Sun,
	type LucideIcon,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Navigator } from "../../lib/navigator";
import { api, resolveWorkspaceId } from "../../lib/api";

type BootstrapResponse = {
	success: boolean;
	data?: {
		areas?: Array<{
			id: string;
			title: string;
			projects?: Array<{
				id: string;
				title: string;
			}>;
		}>;
	};
};

type SidebarArea = {
	id: string;
	title: string;
	projects: Array<{ id: string; title: string }>;
};

const WORKSPACE_REFRESH_EVENT = "hm:workspace-data/refresh";

const isRouteActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

const NavItem = ({ href, icon: Icon, label, pathname }: { href: string; icon: LucideIcon; label: string; pathname: string }) => (
	<Link
		href={href}
		className={cn(
			"group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
			isRouteActive(pathname, href) ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
		)}
	>
		<Icon className="size-4 transition-colors group-hover:text-primary" />
		<span className="flex-1">{label}</span>
	</Link>
);

const SectionHeader = ({
	id,
	label,
	icon: Icon,
	expanded,
	toggle,
}: {
	id: string;
	label: string;
	icon: LucideIcon;
	expanded: boolean;
	toggle: (id: string) => void;
}) => (
	<button
		type="button"
		onClick={() => toggle(id)}
		className="mt-4 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
		aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
	>
		{expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
		<Icon className="size-3.5" />
		<span>{label}</span>
	</button>
);

type LeftSidebarProps = {
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
};

export function LeftSidebar({ isCollapsed = false, onToggleCollapse }: LeftSidebarProps) {
	const pathname = usePathname();
	const { resolvedTheme, setTheme } = useTheme();
	const [isThemeMounted, setIsThemeMounted] = useState(false);
	const [expanded, setExpanded] = useState<Record<string, boolean>>({ journal: true, area: true });
	const [areas, setAreas] = useState<SidebarArea[]>([]);
	const [areasLoading, setAreasLoading] = useState(true);
	const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({});

	useEffect(() => {
		setIsThemeMounted(true);
	}, []);

	const loadWorkspaceData = useCallback(async () => {
		setAreasLoading(true);

		try {
			const workspaceId = await resolveWorkspaceId();
			if (!workspaceId) {
				setAreas([]);
				return;
			}

			const res = await api.get<BootstrapResponse>(`/workspaces/${workspaceId}/bootstrap`);
			const fetchedAreas = (res.data?.areas ?? []).map((area) => ({
				id: area.id,
				title: area.title,
				projects: (area.projects ?? []).map((project) => ({
					id: project.id,
					title: project.title,
				})),
			}));

			setAreas(fetchedAreas);
			setOpenAreas((prev) => {
				const next: Record<string, boolean> = {};
				for (const area of fetchedAreas) {
					next[area.id] = prev[area.id] ?? true;
				}
				return next;
			});
		} catch {
			setAreas([]);
		} finally {
			setAreasLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadWorkspaceData();

		const onRefresh = () => {
			void loadWorkspaceData();
		};

		window.addEventListener(WORKSPACE_REFRESH_EVENT, onRefresh);
		return () => {
			window.removeEventListener(WORKSPACE_REFRESH_EVENT, onRefresh);
		};
	}, [loadWorkspaceData]);

	const toggle = (section: string) => setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
	const toggleArea = (id: string) => setOpenAreas((prev) => ({ ...prev, [id]: !prev[id] }));

	const openQuickCreate = () => {
		window.dispatchEvent(new Event("hm:quick-create/open"));
	};

	const darkModeEnabled = isThemeMounted && resolvedTheme === "dark";

	if (isCollapsed) {
		return (
			<div className="flex h-full min-h-0 w-full flex-col border-r border-border/80 bg-card px-2 py-3">
				<div className="mb-4 flex items-center justify-between px-1">
					<div className="flex size-8 items-center justify-center rounded-lg bg-primary shadow-sm">
						<Brain className="size-5 text-primary-foreground" />
					</div>
					<button
						type="button"
						onClick={onToggleCollapse}
						className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
						aria-label="Expand left sidebar"
						title="Expand sidebar"
					>
						<ChevronsRight className="size-4" />
					</button>
				</div>

				<div className="space-y-2">
					<button type="button" onClick={openQuickCreate} className="flex h-10 w-full items-center justify-center rounded-md bg-primary/90 text-primary-foreground transition-colors hover:bg-primary" aria-label="New item" title="New Item">
						<Plus className="size-4" />
					</button>
					<button type="button" className="flex h-10 w-full items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground" aria-label="Search" title="Search">
						<Search className="size-4" />
					</button>
				</div>

				<div className="mt-4 space-y-1">
					<Link
						href={Navigator.unsorted()}
						className={cn(
							"flex h-10 w-full items-center justify-center rounded-md transition-colors",
							isRouteActive(pathname, Navigator.unsorted()) ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-primary"
						)}
						aria-label="Unsorted"
						title="Unsorted"
					>
						<Inbox className="size-4" />
					</Link>
					<Link
						href={Navigator.pinned()}
						className={cn(
							"flex h-10 w-full items-center justify-center rounded-md transition-colors",
							isRouteActive(pathname, Navigator.pinned()) ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-primary"
						)}
						aria-label="Pinned"
						title="Pinned"
					>
						<Pin className="size-4" />
					</Link>
					<Link
						href={Navigator.archive()}
						className={cn(
							"flex h-10 w-full items-center justify-center rounded-md transition-colors",
							isRouteActive(pathname, Navigator.archive()) ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-primary"
						)}
						aria-label="Archive"
						title="Archive"
					>
						<Archive className="size-4" />
					</Link>
				</div>

				<div className="mt-auto space-y-1">
					<Link
						href={Navigator.settings()}
						className={cn(
							"flex h-10 w-full items-center justify-center rounded-md transition-colors",
							isRouteActive(pathname, Navigator.settings()) ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-primary"
						)}
						aria-label="Settings"
						title="Settings"
					>
						<Settings className="size-4" />
					</Link>
					<button
						type="button"
						onClick={() => setTheme(darkModeEnabled ? "light" : "dark")}
						className="flex h-10 w-full items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
						aria-label={darkModeEnabled ? "Switch to light mode" : "Switch to dark mode"}
						title="Toggle Light/Dark Mode"
					>
						{darkModeEnabled ? <Sun className="size-4" /> : <Moon className="size-4" />}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-0 w-full flex-col border-r border-border/80 bg-card px-3 py-3">
			<div className="mb-4 flex items-center justify-between gap-2 px-2">
				<div className="flex items-center gap-3">
					<div className="flex size-8 items-center justify-center rounded-lg bg-primary shadow-sm">
						<Brain className="size-5 text-primary-foreground" />
					</div>
					<span className="font-semibold tracking-tight text-foreground">HypeMind</span>
				</div>
				<button
					type="button"
					onClick={onToggleCollapse}
					className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label="Collapse left sidebar"
				>
					<ChevronsLeft className="size-4" />
				</button>
			</div>

			<div className="space-y-2 px-2">
				<button
					type="button"
					onClick={openQuickCreate}
					className="flex h-10 w-full items-center gap-2 rounded-lg bg-primary/90 px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary"
				>
					<Plus className="size-4" />
					<span className="flex-1 text-left">New Item</span>
				</button>

				<button type="button" className="flex h-10 w-full items-center gap-2 rounded-lg bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted">
					<Search className="size-4" />
					<span className="flex-1 text-left">Search</span>
				</button>
			</div>

			<div className="scrollbar-thin flex-1 overflow-y-auto pb-4 pr-1">
				<div className="mt-3 space-y-0.5 px-2">
					<NavItem href={Navigator.unsorted()} icon={Inbox} label="Unsorted" pathname={pathname} />
					<NavItem href={Navigator.pinned()} icon={Pin} label="Pinned" pathname={pathname} />
				</div>

				<SectionHeader id="journal" label="Journal" icon={BookOpen} expanded={expanded["journal"]} toggle={toggle} />
				{expanded["journal"] && (
					<div className="space-y-0.5 px-2">
						<Link
							href={Navigator.journal()}
							className={cn(
								"block truncate rounded-md px-8 py-1.5 text-sm transition-colors",
								isRouteActive(pathname, Navigator.journal()) ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
							)}
						>
							Today&apos;s Log
						</Link>
					</div>
				)}

				<SectionHeader id="area" label="Areas" icon={FolderKanban} expanded={expanded["area"]} toggle={toggle} />
				{expanded["area"] && (
					<div className="space-y-1 px-2">
						<Link
							href={Navigator.areas()}
							className={cn(
								"block rounded-md px-8 py-1.5 text-xs font-medium transition-colors",
								isRouteActive(pathname, Navigator.areas()) ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
							)}
						>
							All Areas
						</Link>
						<Link
							href={Navigator.projects()}
							className={cn(
								"block rounded-md px-8 py-1.5 text-xs font-medium transition-colors",
								isRouteActive(pathname, Navigator.projects()) ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
							)}
						>
							All Projects
						</Link>
						{areas.map((area) => (
							<div key={area.id} className="rounded-md">
								<div className="flex items-center rounded-md px-1 py-0.5 hover:bg-muted/50">
									<button
										type="button"
										onClick={() => toggleArea(area.id)}
										className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
										aria-label={openAreas[area.id] ? `Collapse ${area.title}` : `Expand ${area.title}`}
									>
										{openAreas[area.id] ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
									</button>
									<Link
										href={Navigator.area(area.id)}
										className={cn(
											"flex flex-1 items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
											isRouteActive(pathname, Navigator.area(area.id)) ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
										)}
									>
										<span className="truncate">{area.title}</span>
										<span className="text-xs text-muted-foreground">{area.projects.length}</span>
									</Link>
								</div>
								{openAreas[area.id] && (
									<div className="ml-8 space-y-0.5">
										{area.projects.slice(0, 3).map((project) => (
											<Link
												key={project.id}
												href={Navigator.project(project.id)}
												className={cn(
													"flex items-center gap-2 truncate rounded-md px-2 py-1.5 text-xs transition-colors",
													isRouteActive(pathname, Navigator.project(project.id)) ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
												)}
											>
												<FolderKanban className="size-3.5" />
												<span className="truncate">{project.title}</span>
											</Link>
										))}
									</div>
								)}
							</div>
						))}
						{areasLoading && <p className="px-8 py-2 text-xs text-muted-foreground">Loading areas...</p>}
						{!areasLoading && areas.length === 0 && (
							<p className="px-8 py-2 text-xs text-muted-foreground">No areas found for this workspace.</p>
						)}
					</div>
				)}

				<div className="mt-6 space-y-0.5 px-2">
					<NavItem href={Navigator.archive()} icon={Archive} label="Archive" pathname={pathname} />
					<NavItem href={Navigator.settings()} icon={Settings} label="Settings" pathname={pathname} />
					<button
						type="button"
						onClick={() => setTheme(darkModeEnabled ? "light" : "dark")}
						className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
						title="Toggle Light/Dark Mode"
					>
						{darkModeEnabled ? <Sun className="size-4" /> : <Moon className="size-4" />}
						<span className="flex-1 text-left">{darkModeEnabled ? "Light Mode" : "Dark Mode"}</span>
					</button>
				</div>
			</div>
		</div>
	);
}
