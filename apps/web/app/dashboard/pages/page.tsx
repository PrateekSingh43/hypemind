"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	FileText,
	ChevronRight,
	Plus,
	PanelLeftClose,
	PanelLeft,
	Search,
	Filter,
	Trash,
	Pin,
	Copy,
	ExternalLink,
	CopyPlus,
	PenLine,
	Trash2,
	MoreHorizontal,
	FolderGit2,
	CheckCircle,
	AlertTriangle
} from 'lucide-react';
import { ProjectAssignmentPopover, type ProjectItem } from '../../../components/dashboard/project-assignment-popover';
import { formatTimeAgo } from '../../../lib/format-time';
import { useSearchParams } from 'next/navigation';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";

import { api, resolveWorkspaceId } from '../../../lib/api';
import { fetchPage, parseRawDocument, type Page as PageDoc } from '../../../features/pages';
import { PageWorkspace } from '../../../features/pages/components/page-shell/page-workspace';

type CanvasContent = {
	id: string;
	title: string;
	content: any;
	tags?: string[];
	isPinned?: boolean;
	deletedAt?: string;
	updatedAt?: string;
};

type GlobalPagesData = Record<string, CanvasContent>;

export default function PagesPage() {
	const searchParams = useSearchParams();
	const pinnedId = searchParams.get('pinned_id');

	const [pagesData, setPagesData] = useState<GlobalPagesData | null>(null);
	const [selectedPageId, setSelectedPageId] = useState<string>('primary');
	const [listCollapsed, setListCollapsed] = useState(false);

	// Fully-loaded document for the selected page (metadata + Tiptap JSON).
	const [activePage, setActivePage] = useState<PageDoc | null>(null);
	const [pageLoading, setPageLoading] = useState(false);
	const [pageLoadError, setPageLoadError] = useState<string | null>(null);

	// Batch-load failure for the pages LIST itself.
	const [listLoadError, setListLoadError] = useState<string | null>(null);

	const [activePageTagFilter, setActivePageTagFilter] = useState('All');
	const [pageSearchQuery, setPageSearchQuery] = useState('');
	const [showPageFilters, setShowPageFilters] = useState(false);
	const [isRenamingTopBar, setIsRenamingTopBar] = useState(false);

	const [projects, setProjects] = useState<ProjectItem[]>([]);
	const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
	const [toast, setToast] = useState<{ visible: boolean; message: string; projectName?: string; projectId?: string; } | null>(null);

	const editorContainerRef = useRef<HTMLDivElement>(null);

	const showToast = (message: string, projectName?: string, projectId?: string) => {
		setToast({ visible: true, message, projectName, projectId });
		setTimeout(() => setToast(null), 6000);
	};

	useEffect(() => {
		if (pinnedId) {
			setListCollapsed(true);
		} else {
			const collapsedState = localStorage.getItem('hm_global_pages_sidebar_hidden');
			if (collapsedState === 'false') {
				setListCollapsed(false);
			} else {
				setListCollapsed(true);
			}
		}
	}, [pinnedId]);

	useEffect(() => {
		const handleForceCollapse = () => setListCollapsed(true);
		window.addEventListener('hm:force-sidebar-collapse', handleForceCollapse);
		return () => window.removeEventListener('hm:force-sidebar-collapse', handleForceCollapse);
	}, []);

	// Load from API on mount
	useEffect(() => {
		const syncState = async (e?: any) => {
			if (e?.detail?.source === 'pages/page') return;
			try {
				const workspaceId = await resolveWorkspaceId();
				if (!workspaceId) return;

				const [projectsRes, res] = await Promise.all([
					api.get<{ data: ProjectItem[] }>(`/workspaces/${workspaceId}/project?all=true`),
					api.get<{ data: any[] }>(`/workspaces/${workspaceId}/item/page`)
				]);

				setProjects(projectsRes.data || []);
				const data: GlobalPagesData = {};

				res.data.forEach((page) => {
					// Per-row isolation: one malformed page must never abort
					// the whole batch (list `content` may be legacy plain text).
					try {
						data[page.id] = {
							id: page.id,
							title: page.title ?? '',
							content: parseRawDocument(page.content),
							tags: page.tags || [],
							isPinned: !!page.isPinned,
							deletedAt: page.deletedAt,
							updatedAt: page.updatedAt
						};
					} catch (rowErr) {
						console.error("Skipping malformed page row:", page.id, rowErr);
					}
				});

				setPagesData(data);

				const savedPage = localStorage.getItem(`hm_global_selected_page`);
				if (savedPage && data[savedPage] && !data[savedPage].deletedAt) {
					setSelectedPageId(savedPage);
				} else {
					const firstActive = Object.values(data).find(p => !p.deletedAt);
					if (firstActive) {
						setSelectedPageId(firstActive.id);
					}
				}
			} catch (err) {
				console.error("Failed to load pages:", err);
				setListLoadError(err instanceof Error ? err.message : 'Failed to load pages');
			}
		};

		syncState();

		window.addEventListener('hm:global-pages-sidebar-toggled', syncState);
		window.addEventListener('hm:global-page-selected', syncState);
		window.addEventListener('hm:global-pages-updated', syncState);
		return () => {
			window.removeEventListener('hm:global-pages-sidebar-toggled', syncState);
			window.removeEventListener('hm:global-page-selected', syncState);
			window.removeEventListener('hm:global-pages-updated', syncState);
		};
	}, []);

	const persist = useCallback(async (id: string, updates: Partial<CanvasContent>) => {
		try {
			const workspaceId = await resolveWorkspaceId();
			if (!workspaceId) return;

			const payload: any = {};
			if (updates.title !== undefined) payload.title = updates.title;
			if (updates.content !== undefined) payload.contentJson = updates.content;
			if (updates.deletedAt !== undefined) payload.deletedAt = updates.deletedAt;
			if (updates.isPinned !== undefined) payload.isPinned = updates.isPinned;

			await api.patch(`/workspaces/${workspaceId}/item/${id}`, payload);
			window.dispatchEvent(new CustomEvent('hm:global-pages-updated', { detail: { source: 'pages/page' } }));
		} catch (err) {
			console.error("Failed to persist page:", err);
		}
	}, []);

	// ── Active page document loading ───────────────────────────────────
	useEffect(() => {
		let cancelled = false;

		async function loadActivePage() {
			if (!selectedPageId || selectedPageId === 'primary') {
				setActivePage(null);
				return;
			}
			const workspaceId = await resolveWorkspaceId();
			if (!workspaceId || cancelled) return;

			setPageLoading(true);
			setPageLoadError(null);
			try {
				const page = await fetchPage(workspaceId, selectedPageId);
				if (!cancelled) setActivePage(page);
			} catch (err) {
				if (!cancelled) {
					setActivePage(null);
					setPageLoadError(err instanceof Error ? err.message : 'Failed to load page');
				}
			} finally {
				if (!cancelled) setPageLoading(false);
			}
		}

		void loadActivePage();
		return () => {
			cancelled = true;
		};
	}, [selectedPageId]);

	// Batch-load failure: never leave the user on a silent black screen.
	if (!pagesData) {
		if (listLoadError) {
			return (
				<div className="flex h-full w-full bg-[#0E0F11] text-[#EEEEEE] font-sans antialiased">
					<div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
						<div className="w-12 h-12 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-400">
							<AlertTriangle className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-[15px] font-semibold text-[#EEEEEE] mb-1">Pages couldn&rsquo;t be loaded</h3>
							<p className="text-[13px] text-[#8A8F98]">{listLoadError}</p>
						</div>
						<button
							onClick={() => {
								setListLoadError(null);
								window.dispatchEvent(new Event('hm:global-pages-updated'));
							}}
							className="px-4 py-2 border border-border rounded-md text-[13px] font-medium text-[#EEEEEE] hover:bg-muted transition-colors"
						>
							Retry
						</button>
					</div>
				</div>
			);
		}
		return null;
	}

	const currentCanvas = pagesData[selectedPageId] || null;

	// ── Handlers ─────────────────────────────────────────────────────────
	const updateCanvasTitle = (newTitle: string) => {
		setPagesData(prev => prev ? { ...prev, [selectedPageId]: { ...prev[selectedPageId], title: newTitle } } : prev);
		// Keep the loaded document in sync (top-bar rename flows through
		// here as well as live edits from the editor header).
		setActivePage(prev => prev && prev.id === selectedPageId ? { ...prev, title: newTitle } : prev);
	};

	const handleAssignToProject = async (projectId: string, projectName: string) => {
		if (!selectedPageId) return;
		try {
			const workspaceId = await resolveWorkspaceId();
			if (!workspaceId) return;

			await api.patch(`/workspaces/${workspaceId}/item/${selectedPageId}`, { projectId });

			setProjectPopoverOpen(false);
			showToast(`Added to`, projectName, projectId);
		} catch (err) {
			console.error("Failed to assign to project:", err);
		}
	};

	const handleCreateAndAssignProject = async (title: string, desc: string, tags: string[]) => {
		if (!selectedPageId || !title.trim()) return;
		try {
			const workspaceId = await resolveWorkspaceId();
			if (!workspaceId) return;

			const res = await api.post<{ data: { id: string, title: string } }>(`/workspaces/${workspaceId}/project`, {
				title,
				description: desc,
				tags
			});
			const newProject = res.data;

			await handleAssignToProject(newProject.id, newProject.title);
		} catch (err) {
			console.error("Failed to create and assign project:", err);
		}
	};

	const createNewPage = async () => {
		try {
			const workspaceId = await resolveWorkspaceId();
			if (!workspaceId) return;

			const res = await api.post<{ data: any }>(`/workspaces/${workspaceId}/item/page`, {
				title: 'Untitled Page',
				contentJson: { type: 'doc', content: [{ type: 'paragraph' }] }
			});

			const newPage = res.data;
			setPagesData(prev => prev ? {
				...prev,
				[newPage.id]: {
					id: newPage.id,
					title: newPage.title,
					content: newPage.content || { type: 'doc', content: [{ type: 'paragraph' }] },
					tags: []
				}
			} : prev);

			setSelectedPageId(newPage.id);
			localStorage.setItem(`hm_global_selected_page`, newPage.id);
			window.dispatchEvent(new Event('hm:global-page-selected'));
			window.dispatchEvent(new Event('hm:global-pages-updated'));
		} catch (err) {
			console.error("Failed to create page:", err);
		}
	};

	const deletePage = async (e: React.MouseEvent, id: string) => {
		e.stopPropagation();

		setPagesData(prev => prev ? { ...prev, [id]: { ...prev[id], deletedAt: new Date().toISOString() } } : prev);
		persist(id, { deletedAt: new Date().toISOString() });

		if (selectedPageId === id) {
			const activeKeys = Object.keys(pagesData).filter(k => k !== id && !pagesData[k].deletedAt);
			const nextId = activeKeys[0];
			if (nextId) {
				setSelectedPageId(nextId);
				localStorage.setItem(`hm_global_selected_page`, nextId);
				window.dispatchEvent(new Event('hm:global-page-selected'));
			}
		}
	};

	// Batch-load failure: never leave the user on a silent black screen.
	if (!pagesData) {
		if (listLoadError) {
			return (
				<div className="flex h-full w-full bg-[#0E0F11] text-[#EEEEEE] font-sans antialiased">
					<div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
						<div className="w-12 h-12 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-400">
							<AlertTriangle className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-[15px] font-semibold text-[#EEEEEE] mb-1">Pages couldn&rsquo;t be loaded</h3>
							<p className="text-[13px] text-[#8A8F98]">{listLoadError}</p>
						</div>
						<button
							onClick={() => {
								setListLoadError(null);
								window.dispatchEvent(new Event('hm:global-pages-updated'));
							}}
							className="px-4 py-2 border border-border rounded-md text-[13px] font-medium text-[#EEEEEE] hover:bg-muted transition-colors"
						>
							Retry
						</button>
					</div>
				</div>
			);
		}
		return null;
	}

	return (
		<div className="flex h-full w-full bg-[#0E0F11] text-[#EEEEEE] font-sans antialiased overflow-hidden relative">
			{/* Toast */}
			{toast?.visible && (
				<div className="fixed top-6 left-1/2 -translate-x-1/2 bg-surface border border-border text-foreground px-5 py-3.5 rounded-lg shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-top-5 overflow-hidden">
					<CheckCircle className="w-4 h-4 text-primary shrink-0" />
					<span className="text-[13px]">
						{toast.message} {toast.projectName && <span className="font-semibold">&quot;{toast.projectName}&quot;</span>}
					</span>
					<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-border">
						<div className="h-full bg-primary/60 animate-[shrink_6s_linear_forwards]" />
					</div>
				</div>
			)}

			{/* Left Rail: Pages List (collapsible) */}
			<div
				className="flex flex-col border-r border-[#27282B] bg-[#151618] shrink-0 transition-[width] duration-200 ease-out overflow-hidden"
				style={{ width: listCollapsed ? 0 : 320 }}
			>
				{/* 1. Top Header Section */}
				<div className="flex items-center justify-between px-4 py-3 shrink-0">
					<span className="text-[13px] font-semibold text-[#EEEEEE]">Pages</span>
					<div className="flex items-center gap-1">
						<button
							onClick={createNewPage}
							className="p-1 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
							title="New Page"
						>
							<Plus className="w-3.5 h-3.5" />
						</button>
						<button
							onClick={() => {
								setListCollapsed(true);
								localStorage.setItem('hm_global_pages_sidebar_hidden', 'true');
							}}
							className="p-1 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
							title="Collapse panel"
						>
							<PanelLeftClose className="w-3.5 h-3.5" />
						</button>
					</div>
				</div>

				{/* Pages Filter / Search Area */}
				<div className="px-4 py-3 shrink-0 border-b border-[#27282B]/50 flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[12px] font-medium text-[#8A8F98]">All Pages {Object.keys(pagesData).length}</span>
						<button
							onClick={() => setShowPageFilters(!showPageFilters)}
							className={`p-1 rounded-md transition-colors border ${showPageFilters ? 'text-primary bg-primary/10 border-primary/20' : 'text-[#8A8F98] bg-transparent border-transparent hover:text-[#EEEEEE] hover:bg-[#26272B]/50'}`}
							title="Toggle Filters"
						>
							<Filter className="w-3.5 h-3.5" />
						</button>
					</div>

					<div className="relative">
						<Search className="w-3.5 h-3.5 text-[#5A5D66] absolute left-2.5 top-1/2 -translate-y-1/2" />
						<input
							type="text"
							placeholder="Search pages"
							value={pageSearchQuery}
							onChange={(e) => setPageSearchQuery(e.target.value)}
							className="w-full bg-[#0E0F11] border border-[#27282B] rounded-md py-1.5 pl-8 pr-3 text-[12px] text-[#EEEEEE] placeholder:text-[#5A5D66] focus:outline-none focus:border-[#42444A] transition-colors"
						/>
					</div>

					<div
						className={`flex flex-col gap-3 overflow-hidden transition-all duration-200 ease-in-out ${showPageFilters ? 'max-h-[100px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
					>
						{/* Tag Filter */}
						<div>
							<div className="text-[10px] font-semibold text-[#5A5D66] uppercase tracking-wider mb-2">Tag</div>
							<div className="flex flex-wrap gap-1.5">
								{['All', 'UI', 'Performance', 'backend', 'design'].map(tag => (
									<button
										key={tag}
										onClick={() => setActivePageTagFilter(tag)}
										className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors border ${activePageTagFilter === tag
											? 'bg-primary/10 text-primary border-primary/20'
											: 'bg-transparent text-[#8A8F98] border-[#27282B] hover:text-[#EEEEEE] hover:border-[#383A40]'
											}`}
									>
										{tag}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Content List Section */}
				<div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
					{Object.entries(pagesData).filter(([key, page]) => {
						if (page.deletedAt) return false;
						if (activePageTagFilter !== 'All' && !(page.tags || []).some(t => t.toLowerCase() === activePageTagFilter.toLowerCase())) return false;
						if (pageSearchQuery && !page.title.toLowerCase().includes(pageSearchQuery.toLowerCase())) return false;
						return true;
					}).map(([key, page]) => {
						const isActive = selectedPageId === key;
						const preview = '';

						return (
							<div
								key={key}
								onClick={() => {
									setSelectedPageId(key);
									localStorage.setItem(`hm_global_selected_page`, key);
									window.dispatchEvent(new Event('hm:global-page-selected'));
								}}
								className={`group flex items-center px-3 py-2.5 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-[#26272B] border border-[#383A40]' : 'hover:bg-[#26272B]/50 border border-transparent'
									}`}
							>
								<div className="flex items-start gap-2.5 flex-1 min-w-0">
									<FileText className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-[#EEEEEE]' : 'text-[#8A8F98]'}`} />
									<div className="min-w-0 flex-1">
										<div className="relative">
											<div className={`text-[13px] font-medium truncate ${isActive ? 'text-[#EEEEEE]' : 'text-[#A0A5B0] group-hover:text-[#EEEEEE]'}`}>
												{page.title || 'Untitled'}
											</div>
										</div>
										{preview && (
											<div className="text-[11px] text-[#5A5D66] mt-0.5 line-clamp-2 leading-relaxed">
												{preview}
											</div>
										)}
										{/* Tags Container */}
										{page.tags && page.tags.length > 0 && (
											<div className="flex flex-wrap gap-1.5 mt-1">
												{page.tags.map(tag => (
													<span key={tag} className="px-1.5 py-0.5 text-[10px] font-medium text-[#8A8F98] bg-[#0E0F11] border border-[#27282B] rounded-[4px]">
														{tag}
													</span>
												))}
											</div>
										)}
									</div>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button
											className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#383A40] text-[#5A5D66] hover:text-[#EEEEEE] transition-all"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
											}}
										>
											<MoreHorizontal className="w-3.5 h-3.5" />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										side="right"
										align="start"
										className="w-56 border-[#27282B] bg-[#151618] shadow-xl rounded-[8px] p-1.5 overflow-hidden z-[100]"
										onClick={(e) => e.stopPropagation()}
									>
										<DropdownMenuItem
											className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#A0A5B0] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
											onClick={async (e) => {
												e.stopPropagation();
												try {
													const workspaceId = await resolveWorkspaceId();
													if (!workspaceId) return;
													await api.patch(`/workspaces/${workspaceId}/item/${key}`, { isPinned: !page.isPinned });
													setPagesData(prev => prev ? { ...prev, [key]: { ...page, isPinned: !page.isPinned } } : prev);
													window.dispatchEvent(new Event('hm:pinned-items-updated'));
												} catch (err) {
													console.error("Failed to pin page:", err);
												}
											}}
										>
											<Pin className="w-4 h-4" />
											{page.isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
										</DropdownMenuItem>
										<DropdownMenuSeparator className="bg-[#27282B] my-1.5" />
										<DropdownMenuItem
											className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#A0A5B0] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
											onClick={(e) => {
												e.stopPropagation();
												navigator.clipboard.writeText(`${window.location.origin}/dashboard/pages`);
											}}
										>
											<Copy className="w-4 h-4" />
											Copy link
										</DropdownMenuItem>
										<DropdownMenuItem
											className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#A0A5B0] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
											onClick={(e) => {
												e.stopPropagation();
												window.open('/dashboard/pages', '_blank');
											}}
										>
											<ExternalLink className="w-4 h-4" />
											Open in a new tab
										</DropdownMenuItem>
										<DropdownMenuItem
											className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#A0A5B0] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
											onClick={async (e) => {
												e.stopPropagation();
												try {
													const workspaceId = await resolveWorkspaceId();
													if (!workspaceId) return;
													await api.post(`/workspaces/${workspaceId}/item/${key}/duplicate`);
													window.dispatchEvent(new Event('hm:global-pages-updated'));
												} catch (err) {
													console.error("Failed to duplicate:", err);
												}
											}}
										>
											<CopyPlus className="w-4 h-4" />
											Duplicate
										</DropdownMenuItem>
										<DropdownMenuItem
											className="cursor-pointer py-2 px-3 text-[13px] font-medium text-red-500/80 focus:text-red-500 focus:bg-red-500/10 rounded-[6px] flex items-center gap-2"
											onClick={(e) => deletePage(e, key)}
										>
											<Trash2 className="w-4 h-4" />
											Move to trash
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						);
					})}

					{Object.keys(pagesData).filter(k => !pagesData[k].deletedAt).length === 0 && (
						<div className="px-4 py-6 text-center">
							<p className="text-[12px] text-[#5A5D66]">No pages found.</p>
						</div>
					)}
				</div>
			</div>

			{/* Right Panel: Working Surface */}
			<div className="flex-1 flex flex-col bg-[#0E0F11] min-w-0 h-full overflow-hidden">
				{/* Header */}
				<div className="h-14 border-b border-[#27282B] flex items-center justify-between px-6 shrink-0 bg-[#0E0F11]">
					<div className="flex items-center gap-3 min-w-0">
						{/* Expand button when list is collapsed */}
						{listCollapsed && (
							<button
								onClick={() => {
									setListCollapsed(false);
									localStorage.setItem('hm_global_pages_sidebar_hidden', 'false');
								}}
								className="p-1.5 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors mr-1"
								title="Expand panel"
							>
								<PanelLeft className="w-4 h-4" />
							</button>
						)}
						<span className="text-[13px] text-[#8A8F98] truncate">Global</span>
						<ChevronRight className="w-3.5 h-3.5 text-[#5A5D66] shrink-0" />
						<span className="text-[13px] font-medium text-[#EEEEEE] truncate">Pages</span>
						{currentCanvas && (
							<>
								<ChevronRight className="w-3.5 h-3.5 text-[#5A5D66] shrink-0" />
								<span className="text-[13px] text-[#8A8F98] truncate">{currentCanvas.title || 'Untitled'}</span>
							</>
						)}
					</div>

					{currentCanvas && (
						<div className="flex items-center gap-1.5 shrink-0 ml-4 relative">
							<span className="text-[12px] text-[#5A5D66] mr-2">Edited {formatTimeAgo(currentCanvas.updatedAt)}</span>

							<button
								onClick={async () => {
									try {
										const workspaceId = await resolveWorkspaceId();
										if (!workspaceId) return;
										await api.patch(`/workspaces/${workspaceId}/item/${selectedPageId}`, { isPinned: !currentCanvas.isPinned });
										setPagesData(prev => prev ? { ...prev, [selectedPageId]: { ...prev[selectedPageId], isPinned: !currentCanvas.isPinned } } : prev);
										window.dispatchEvent(new Event('hm:pinned-items-updated'));
									} catch (e) {
										console.error("Failed to pin page", e);
									}
								}}
								className="p-1.5 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
								title={currentCanvas.isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
							>
								<Pin className={`w-4 h-4 ${currentCanvas.isPinned ? "fill-current text-[#EEEEEE]" : ""}`} />
							</button>

							<button
								onClick={() => {
									navigator.clipboard.writeText(`${window.location.origin}/dashboard/pages`);
									showToast("Link copied to clipboard");
								}}
								className="p-1.5 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
								title="Copy link"
							>
								<Copy className="w-4 h-4" />
							</button>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button className="p-1.5 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors">
										<MoreHorizontal className="w-4 h-4" />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									onCloseAutoFocus={(e) => e.preventDefault()}
									className="w-56 border-[#27282B] bg-[#121315] text-[#EEEEEE] shadow-xl rounded-[8px] p-1.5"
								>
									<DropdownMenuItem
										className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#8A8F98] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
										onClick={() => setProjectPopoverOpen(true)}
									>
										<FolderGit2 className="w-4 h-4" />
										Add to project
									</DropdownMenuItem>
									<DropdownMenuSeparator className="bg-[#27282B] my-1.5" />
									<DropdownMenuItem
										className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#8A8F98] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
										onClick={() => {
											navigator.clipboard.writeText(`${window.location.origin}/dashboard/pages`);
											showToast("Link copied to clipboard");
										}}
									>
										<Copy className="w-4 h-4" />
										Copy link
									</DropdownMenuItem>
									<DropdownMenuItem
										className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#8A8F98] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
										onClick={async () => {
											try {
												const workspaceId = await resolveWorkspaceId();
												if (!workspaceId) return;
												await api.post(`/workspaces/${workspaceId}/item/${selectedPageId}/duplicate`);
												showToast("Page duplicated");
												window.dispatchEvent(new Event('hm:global-pages-updated'));
											} catch (err) {
												console.error("Failed to duplicate:", err);
											}
										}}
									>
										<CopyPlus className="w-4 h-4" />
										Duplicate
									</DropdownMenuItem>
									<DropdownMenuItem
										className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#8A8F98] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
										onClick={() => setIsRenamingTopBar(true)}
									>
										<PenLine className="w-4 h-4" />
										Rename
									</DropdownMenuItem>
									<DropdownMenuSeparator className="bg-[#27282B] my-1.5" />
									<DropdownMenuItem
										className="cursor-pointer py-2 px-3 text-[13px] font-medium text-red-500/80 focus:text-red-500 focus:bg-red-500/10 rounded-[6px] flex items-center gap-2"
										onClick={async () => {
											try {
												const workspaceId = await resolveWorkspaceId();
												if (!workspaceId) return;
												await api.patch(`/workspaces/${workspaceId}/item/${selectedPageId}`, { deletedAt: new Date().toISOString() });
												setPagesData(prev => {
													if (!prev) return prev;
													const newData = { ...prev };
													delete newData[selectedPageId];
													return newData;
												});
												window.dispatchEvent(new Event('hm:global-pages-updated'));
											} catch (err) {
												console.error("Failed to move page to trash:", err);
											}
										}}
									>
										<Trash2 className="w-4 h-4" />
										Move to trash
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							{isRenamingTopBar && (
								<>
									<div
										className="fixed inset-0 z-40"
										onClick={(e) => {
											e.stopPropagation();
											setIsRenamingTopBar(false);
										}}
									/>
									<div className="absolute top-[38px] right-0 z-50 bg-[#151618] border border-[#27282B] rounded-[6px] shadow-2xl p-1 flex items-center gap-1.5 w-[360px]">
										<div className="flex items-center justify-center w-7 h-7 rounded-[4px] border border-[#27282B] bg-[#0E0F11] shrink-0 text-[#8A8F98]">
											<FileText className="w-4 h-4" />
										</div>
										<input
											autoFocus
											value={currentCanvas?.title ?? ''}
											onChange={(e) => updateCanvasTitle(e.target.value)}
											onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setIsRenamingTopBar(false); }}
											className="flex-1 bg-[#0E0F11] text-[13px] font-medium text-[#EEEEEE] px-2.5 py-1.5 border border-[#27282B] rounded-[4px] outline-none focus:border-[#8A8F98] transition-colors min-w-0 relative z-50"
										/>
									</div>
								</>
							)}
						</div>
					)}
				</div>

				{/* Editor Area or Empty State */}
				{Object.keys(pagesData).filter(k => !pagesData[k].deletedAt).length === 0 ? (
					<div className="flex-1 flex flex-col items-center justify-center text-center px-6">
						<div className="w-16 h-16 rounded-full border border-[#27282B] bg-[#151618] flex items-center justify-center text-[#5A5D66] mb-5 shadow-sm">
							<FileText className="w-7 h-7" />
						</div>
						<h3 className="text-lg font-medium text-[#EEEEEE] mb-2">No Pages Found</h3>
						<p className="text-base text-[#8A8F98] max-w-[360px] mb-8 leading-relaxed">
							You don't have any pages yet.<br />Create your first page to start writing, researching, and organizing knowledge.
						</p>
						<button
							onClick={createNewPage}
							className="px-6 py-2.5 bg-[#EEEEEE] text-[#0E0F11] text-[14px] font-semibold rounded-md hover:bg-white transition-colors"
						>
							Create Page
						</button>
					</div>
				) : (
					<div ref={editorContainerRef} className="flex-1 overflow-y-auto scrollbar-hide">
						{pageLoading && (
							<div className="max-w-[760px] mx-auto py-16 px-8 md:px-12" aria-busy="true" aria-label="Loading page">
								<div className="hym-editor-loading">
									<div className="hym-skeleton-line w-2/5 !h-7" />
									<div className="mt-4 hym-skeleton-line w-full" />
									<div className="hym-skeleton-line w-5/6" />
									<div className="hym-skeleton-line w-3/5" />
								</div>
							</div>
						)}

						{!pageLoading && pageLoadError && (
							<div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
								<div className="w-12 h-12 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-400">
									<AlertTriangle className="w-5 h-5" />
								</div>
								<div>
									<h3 className="text-[15px] font-semibold text-[#EEEEEE] mb-1">This page couldn&rsquo;t be loaded</h3>
									<p className="text-[13px] text-[#8A8F98]">{pageLoadError}</p>
								</div>
								<button
									onClick={() => {
										const id = selectedPageId;
										setSelectedPageId('');
										requestAnimationFrame(() => setSelectedPageId(id));
									}}
									className="px-4 py-2 border border-border rounded-md text-[13px] font-medium text-[#EEEEEE] hover:bg-muted transition-colors"
								>
									Retry
								</button>
							</div>
						)}

						{!pageLoading && activePage && (
							<PageWorkspace
								key={activePage.id}
								page={activePage}
								onTitleChange={updateCanvasTitle}
							/>
						)}
					</div>
				)}
			</div>

			<ProjectAssignmentPopover
				isOpen={projectPopoverOpen}
				onClose={() => setProjectPopoverOpen(false)}
				projects={projects}
				onAssign={handleAssignToProject}
				onCreateAndAssign={handleCreateAndAssignProject}
			/>
		</div>
	);
}
