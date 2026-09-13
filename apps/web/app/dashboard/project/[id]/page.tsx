//app\dashboard\project\[id]\page.tsx

"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	Layout,
	FileText,
	FilePenLine,
	Link as LinkIcon,
	Book,
	ChevronRight,
	Plus,
	PanelLeftClose,
	PanelLeft,
	Upload,
	X,
	Paperclip,
	Globe,
	FileUp,
	Video,
	File as FileIcon,
	Search,
	Filter,
	Tag,
	MoreVertical,
	ExternalLink,
	Info,
	CheckCircle,
	Trash,
	MoreHorizontal,
	Pin,
	Copy,
	CopyPlus,
	PenLine,
	Trash2,
	FolderGit2
} from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { formatTimeAgo } from '../../../../lib/format-time';
import { useParams, useSearchParams } from 'next/navigation';
import { ItemContentView } from '../../../../components/dashboard/item-content-view';
import { QuickNoteEditor, EMPTY_DOC } from '../../../../components/dashboard/quick-note-editor';
import { Editor } from '../../../../components/editor/editor';
import { PageAssignmentPopover } from '../../../../components/dashboard/page-assignment-popover';
import { ProjectAssignmentPopover, type ProjectItem as AssignmentProjectItem } from '../../../../components/dashboard/project-assignment-popover';
import { api, resolveWorkspaceId } from '../../../../lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────
type ProjectItem = {
	id: string;
	type: 'note' | 'link' | 'video' | 'doc';
	title: string;
	preview: string;
	content: string;
	time: string;
	tags: string[];
	status: 'USED' | 'UNUSED';
	isPinned?: boolean;
};

type CanvasContent = {
	id: string;
	title: string;
	content: any;
	tags?: string[];
	deletedAt?: string;
	updatedAt?: string;
	isPinned?: boolean;
};

type ProjectData = {
	items: ProjectItem[];
	canvasContent: Record<string, CanvasContent>;
};

// ── Mock project metadata lookup ───────────────────────────────────────────────
const PROJECT_META_MAP: Record<string, { name: string; area: string }> = {};

const FILTERS = ['All Types', 'Notes', 'Links', 'Videos', 'Docs'];

const getIcon = (type: string) => {
	switch (type) {
		case 'doc': return FileIcon;
		case 'note': return FilePenLine;
		case 'quick_note': return FilePenLine;
		case 'link': return LinkIcon;
		case 'video': return Video;
		default: return FileText;
	}
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function ProjectDetailView() {
	const { id } = useParams<{ id: string }>();
	const projectId = id;
	const searchParams = useSearchParams();
	const pinnedId = searchParams.get('pinned_id');

	const [meta, setMeta] = useState({ name: `Project ${projectId}`, area: "Loading..." });

	const [activeFilter, setActiveFilter] = useState('All Types');
	const [activeTagFilter, setActiveTagFilter] = useState('All');
	const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');
	const [searchQuery, setSearchQuery] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [sidebarMode, setSidebarMode] = useState<'pages' | 'resources'>('resources');

	const [activePageTagFilter, setActivePageTagFilter] = useState('All');
	const [pageSearchQuery, setPageSearchQuery] = useState('');
	const [showPageFilters, setShowPageFilters] = useState(false);

	const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
	const [selectedPageId, setSelectedPageId] = useState<string>('primary');
	const [projectData, setProjectData] = useState<ProjectData | null>(null);
	const [listCollapsed, setListCollapsed] = useState(false);

	const [pagePopoverOpen, setPagePopoverOpen] = useState(false);
	const [selectedResourceForPageAssign, setSelectedResourceForPageAssign] = useState<string | null>(null);

	const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
	const [projects, setProjects] = useState<AssignmentProjectItem[]>([]);
	const [isRenamingTopBar, setIsRenamingTopBar] = useState(false);

	const [toast, setToast] = useState<{ visible: boolean; message: string; pageName?: string; pageId?: string; projectName?: string; projectId?: string; } | null>(null);
	const editorContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (pinnedId) {
			setListCollapsed(true);
		} else {
			const sidebarCollapsed = localStorage.getItem(`hm_project_${projectId}_sidebar_hidden`);
			if (sidebarCollapsed) {
				setListCollapsed(sidebarCollapsed === 'true');
			} else {
				setListCollapsed(false);
			}
		}
	}, [pinnedId, projectId]);

	useEffect(() => {
		const handleForceCollapse = () => setListCollapsed(true);
		window.addEventListener('hm:force-sidebar-collapse', handleForceCollapse);
		return () => window.removeEventListener('hm:force-sidebar-collapse', handleForceCollapse);
	}, []);

	// Load from backend on mount
	useEffect(() => {
		let isMounted = true;
		const fetchData = async () => {
			const workspaceId = await resolveWorkspaceId();
			if (!workspaceId) return;
			try {
				const [res, projectsRes] = await Promise.all([
					api.get<{ data: any }>(`/workspaces/${workspaceId}/project/${projectId}`),
					api.get<{ data: AssignmentProjectItem[] }>(`/workspaces/${workspaceId}/project?all=true`)
				]);
				if (!isMounted) return;
				const project = res.data;
				setProjects(projectsRes.data || []);

				setMeta({ name: project.title, area: project.area?.title || 'Unknown Area' });

				const allItems = project.items || [];
				const pages = allItems.filter((i: any) => i.type === 'PAGE' && !i.deletedAt);
				const resources = allItems.filter((i: any) => i.type !== 'PAGE' && !i.deletedAt);

				const formattedItems = resources.map((i: any) => ({
					id: i.id,
					type: i.type.toLowerCase() === 'quick_note' ? 'note' : i.type.toLowerCase(),
					title: i.title || '',
					preview: i.contentString?.substring(0, 100) || '',
					content: i.contentString || '',
					time: i.updatedAt,
					tags: i.tags || [],
					status: i.status === 'UNUSED' ? 'UNUSED' : 'USED',
					isPinned: !!i.isPinned,
				}));

				let loadedCanvas: Record<string, CanvasContent> = {};
				pages.forEach((p: any) => {
					loadedCanvas[p.id] = {
						id: p.id,
						title: p.title ?? '',
						content: typeof p.contentJson === 'string' ? JSON.parse(p.contentJson || '{"type":"doc","content":[]}') : (p.contentJson || { type: 'doc', content: [{ type: 'paragraph' }] }),
						tags: p.tags || [],
						deletedAt: p.deletedAt,
						updatedAt: p.updatedAt,
						isPinned: !!p.isPinned,
					};
				});

				// Create primary page if no pages exist
				if (Object.keys(loadedCanvas).length === 0) {
					try {
						const res = await api.post<{ data: any }>(`/workspaces/${workspaceId}/item/page`, {
							title: 'Project Canvas',
							contentJson: { type: 'doc', content: [{ type: 'paragraph' }] },
							projectId: projectId
						});
						const newPage = res.data;
						loadedCanvas[newPage.id] = {
							id: newPage.id,
							title: newPage.title,
							content: newPage.contentJson || { type: 'doc', content: [{ type: 'paragraph' }] },
							tags: [],
						};
					} catch (err) {
						console.error("Failed to create default page", err);
					}
				}

				setProjectData({
					items: formattedItems,
					canvasContent: loadedCanvas,
				});

				if (formattedItems.length > 0) {
					const savedResource = localStorage.getItem(`hm_project_${projectId}_resource`);
					if (savedResource && formattedItems.some((i: any) => i.id === savedResource)) {
						setSelectedResourceId(savedResource);
					} else {
						setSelectedResourceId(formattedItems[0].id);
					}
				}

				const savedPage = localStorage.getItem(`hm_project_${projectId}_page`);
				if (savedPage && loadedCanvas[savedPage]) {
					setSelectedPageId(savedPage);
				} else {
					const firstPage = Object.values(loadedCanvas)[0];
					if (firstPage) setSelectedPageId(firstPage.id);
				}
			} catch (err) {
				console.error(err);
			}
		};
		void fetchData();

		const syncState = () => {
			const savedResource = localStorage.getItem(`hm_project_${projectId}_resource`);
			if (savedResource) setSelectedResourceId(savedResource);

			const savedPage = localStorage.getItem(`hm_project_${projectId}_page`);
			if (savedPage) setSelectedPageId(savedPage);

			const mode = localStorage.getItem(`hm_project_${projectId}_sidebar_mode`);
			if (mode === 'pages' || mode === 'resources') setSidebarMode(mode);
		};
		syncState();

		window.addEventListener('hm:project-item-selected', syncState);

		return () => {
			isMounted = false;
			window.removeEventListener('hm:project-item-selected', syncState);
		};
	}, [projectId]);

	const persistResource = useCallback(async (id: string, updates: { title?: string, content?: string, isPinned?: boolean }) => {
		try {
			const workspaceId = await resolveWorkspaceId();
			if (!workspaceId) return;
			const payload: any = {};
			if (updates.title !== undefined) payload.title = updates.title;
			if (updates.content !== undefined) payload.contentString = updates.content;
			if (updates.isPinned !== undefined) payload.isPinned = updates.isPinned;

			await api.patch(`/workspaces/${workspaceId}/item/${id}`, payload);
		} catch (err) {
			console.error("Failed to update item", err);
		}
	}, []);

	const persistCanvas = useCallback(async (id: string, updates: { title?: string, content?: any, isPinned?: boolean }) => {
		try {
			const workspaceId = await resolveWorkspaceId();
			if (!workspaceId) return;
			const payload: any = {};
			if (updates.title !== undefined) payload.title = updates.title;
			if (updates.content !== undefined) payload.contentJson = updates.content;
			if (updates.isPinned !== undefined) payload.isPinned = updates.isPinned;

			await api.patch(`/workspaces/${workspaceId}/item/${id}`, payload);
		} catch (err) {
			console.error("Failed to update item", err);
		}
	}, []);

	const saveCanvasTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const pendingCanvasUpdatesRef = useRef<any>({});
	const debouncedPersistCanvas = useCallback((id: string, updates: any) => {
		pendingCanvasUpdatesRef.current = { ...pendingCanvasUpdatesRef.current, ...updates };
		if (saveCanvasTimeoutRef.current) clearTimeout(saveCanvasTimeoutRef.current);
		saveCanvasTimeoutRef.current = setTimeout(() => {
			const payload = { ...pendingCanvasUpdatesRef.current };
			pendingCanvasUpdatesRef.current = {};
			void persistCanvas(id, payload);
		}, 800);
	}, [persistCanvas]);

	const saveResourceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const pendingResourceUpdatesRef = useRef<any>({});
	const debouncedPersistResource = useCallback((id: string, updates: any) => {
		pendingResourceUpdatesRef.current = { ...pendingResourceUpdatesRef.current, ...updates };
		if (saveResourceTimeoutRef.current) clearTimeout(saveResourceTimeoutRef.current);
		saveResourceTimeoutRef.current = setTimeout(() => {
			const payload = { ...pendingResourceUpdatesRef.current };
			pendingResourceUpdatesRef.current = {};
			void persistResource(id, payload);
		}, 800);
	}, [persistResource]);

	if (!projectData) return null;

	const items = projectData.items;
	const canvasContent = projectData.canvasContent;

	const currentCanvas = canvasContent[selectedPageId] || canvasContent['primary'];
	const currentItem = items.find(i => i.id === selectedResourceId);

	const itemCount = items.length + 1; // +1 for primary canvas



	// ── Handlers ─────────────────────────────────────────────────────────
	const updateCanvasTitle = (newTitle: string) => {
		setProjectData(prev => prev ? {
			...prev,
			canvasContent: {
				...prev.canvasContent,
				[selectedPageId]: { ...prev.canvasContent[selectedPageId], title: newTitle, updatedAt: new Date().toISOString() }
			}
		} : prev);
		debouncedPersistCanvas(selectedPageId, { title: newTitle });
	};

	const updateCanvasContent = (newContent: any) => {
		setProjectData(prev => prev ? {
			...prev,
			canvasContent: {
				...prev.canvasContent,
				[selectedPageId]: { ...prev.canvasContent[selectedPageId], content: newContent, updatedAt: new Date().toISOString() }
			}
		} : prev);
		debouncedPersistCanvas(selectedPageId, { content: newContent });
	};

	const createNewPage = async () => {
		try {
			const workspaceId = await resolveWorkspaceId();
			if (!workspaceId) return;
			const res = await api.post<{ data: any }>(`/workspaces/${workspaceId}/item/page`, {
				title: 'Untitled Page',
				contentJson: { type: 'doc', content: [{ type: 'paragraph' }] },
				projectId: projectId
			});
			const newPage = res.data;
			setProjectData(prev => prev ? {
				...prev,
				canvasContent: {
					...prev.canvasContent,
					[newPage.id]: {
						id: newPage.id,
						title: newPage.title,
						content: newPage.contentJson || { type: 'doc', content: [{ type: 'paragraph' }] },
						tags: [],
						updatedAt: new Date().toISOString()
					}
				}
			} : prev);
			setSelectedPageId(newPage.id);
			localStorage.setItem(`hm_project_${projectId}_page`, newPage.id);
		} catch (err) {
			console.error("Failed to create page", err);
		}
	};

	const deletePage = (e: React.MouseEvent, id: string) => {
		e.stopPropagation();
		const keys = Object.keys(canvasContent);
		if (keys.length <= 1) return; // don't delete the last page

		setProjectData((prev) => {
			if (!prev) return prev;
			const newCanvas = { ...prev.canvasContent };
			delete newCanvas[id];
			return { ...prev, canvasContent: newCanvas };
		});
		persistCanvas(id, { content: { type: 'doc', content: [] } }); // soft delete or similar

		if (selectedPageId === id) {
			const activeKeys = Object.keys(canvasContent).filter(k => k !== id);
			const nextId = activeKeys[0];
			setSelectedPageId(nextId);
			localStorage.setItem(`hm_project_${projectId}_page`, nextId);
		}
	};

	const updateResourceTitle = (newTitle: string) => {
		if (!selectedResourceId) return;
		setProjectData((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				items: prev.items.map(i => i.id === selectedResourceId ? { ...i, title: newTitle } : i)
			};
		});
		persistResource(selectedResourceId, { title: newTitle });
	};

	const updateResourceContent = (contentString: string) => {
		setProjectData(prev => prev ? {
			...prev,
			items: prev.items.map(i => i.id === selectedResourceId ? { ...i, content: contentString, time: new Date().toISOString() } : i)
		} : prev);
		persistResource(selectedResourceId!, { content: contentString });
	};

	const openPageAssignment = (resourceId: string) => {
		setSelectedResourceForPageAssign(resourceId);
		setPagePopoverOpen(true);
	};

	const handleAssignToPage = (targetPageId: string, pageTitle: string) => {
		if (!selectedResourceForPageAssign) return;

		const resource = items.find(i => i.id === selectedResourceForPageAssign);
		if (!resource) return;

		const targetPage = canvasContent[targetPageId];
		if (!targetPage) return;

		const newNodes: any[] = [];

		if (resource.type === 'note') {
			if (resource.title) {
				newNodes.push({
					type: 'heading',
					attrs: { level: 3 },
					content: [{ type: 'text', text: resource.title }]
				});
			}
			const lines = (resource.content || '').split('\n');
			lines.forEach(line => {
				newNodes.push(line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' });
			});
		} else {
			newNodes.push({
				type: 'mediaPlaceholder',
				attrs: {
					mediaType: resource.type,
					resolvedData: {
						source: 'project',
						id: resource.id,
						title: resource.title
					}
				}
			});

			if (resource.content) {
				const lines = (resource.content || '').split('\n');
				lines.forEach(line => {
					newNodes.push(line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' });
				});
			}
		}

		const existingContent = targetPage.content?.content || [];
		let finalExistingContent = [...existingContent];
		if (finalExistingContent.length > 0) {
			const lastNode = finalExistingContent[finalExistingContent.length - 1];
			if (lastNode.type === 'paragraph' && (!lastNode.content || lastNode.content.length === 0)) {
				finalExistingContent.pop();
			}
		}

		const updatedContent = {
			type: 'doc',
			content: [
				...finalExistingContent,
				{ type: 'paragraph' },
				...newNodes,
				{ type: 'paragraph' }
			]
		};

		const updatedItems = items.filter(i => i.id !== selectedResourceForPageAssign);

		setProjectData((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				items: updatedItems,
				canvasContent: {
					...prev.canvasContent,
					[targetPageId]: {
						...targetPage,
						content: updatedContent
					}
				}
			};
		});

		persistCanvas(targetPageId, { content: updatedContent });
		// Delete resource logic here...

		const currentIndex = items.findIndex(i => i.id === selectedResourceForPageAssign);
		const nextItem = updatedItems[currentIndex] || updatedItems[0];
		const nextId = nextItem ? nextItem.id : null;
		setSelectedResourceId(nextId);
		if (nextId) localStorage.setItem(`hm_project_${projectId}_resource`, nextId);
		else localStorage.removeItem(`hm_project_${projectId}_resource`);

		setPagePopoverOpen(false);
		setSelectedResourceForPageAssign(null);

		showToast('Added to', pageTitle, targetPageId);
	};

	const showToast = (message: string, pageName?: string, pageId?: string, projectName?: string, projectId?: string) => {
		setToast({ visible: true, message, pageName: pageName || '', pageId, projectName, projectId });
		setTimeout(() => setToast(null), 6000);
	};

	const handleAssignToProject = async (assignProjectId: string, projectName: string) => {
		const targetId = sidebarMode === 'pages' ? selectedPageId : selectedResourceId;
		if (!targetId) return;
		try {
			const workspaceId = await resolveWorkspaceId();
			if (!workspaceId) return;

			await api.patch(`/workspaces/${workspaceId}/item/${targetId}`, {
				projectId: assignProjectId
			});

			setProjectPopoverOpen(false);
			showToast(`Added to`, undefined, undefined, projectName, assignProjectId);
		} catch (err) {
			console.error("Failed to assign to project:", err);
		}
	};

	const handleCreateAndAssignProject = async (title: string, desc: string, tags: string[]) => {
		const targetId = sidebarMode === 'pages' ? selectedPageId : selectedResourceId;
		if (!targetId || !title.trim()) return;
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

	// ── Display title for editor ─────────────────────────────────────────
	const editorTitle = selectedPageId === 'primary'
		? (currentCanvas?.title ?? '')
		: (currentCanvas?.title ?? '');

	return (
		<div className="flex h-full w-full bg-[#0E0F11] text-[#EEEEEE] font-sans antialiased overflow-hidden relative">
			{toast?.visible && (
				<div className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#151618] border border-[#27282B] text-[#EEEEEE] px-5 py-3.5 rounded-lg shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-top-5 overflow-hidden">
					<CheckCircle className="w-4 h-4 text-primary shrink-0" />
					<span className="text-[13px]">
						{toast.message} <span className="font-semibold">&quot;{toast.pageName}&quot;</span>
					</span>
					<div className="w-[1px] h-4 bg-[#27282B] mx-1" />
					<button
						onClick={() => {
							if (toast.pageId) {
								setSidebarMode('pages');
								setSelectedPageId(toast.pageId);
								localStorage.setItem(`hm_project_${projectId}_page`, toast.pageId);
								setTimeout(() => {
									if (editorContainerRef.current) {
										editorContainerRef.current.scrollTo({ top: editorContainerRef.current.scrollHeight, behavior: 'smooth' });
									}
								}, 100);
							}
							setToast(null);
						}}
						className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
					>
						Open Page →
					</button>
					<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#27282B]">
						<div className="h-full bg-primary/60 animate-[shrink_6s_linear_forwards]" />
					</div>
				</div>
			)}

			{/* Left Rail: Project Items (collapsible) */}
			<div
				className="flex flex-col border-r border-[#27282B] bg-[#151618] shrink-0 transition-[width] duration-200 ease-out overflow-hidden"
				style={{ width: listCollapsed ? 0 : 320 }}
			>
				{/* 1. Top Header Section */}
				<div className="flex items-center justify-between px-4 py-3 shrink-0">
					<span className="text-[13px] font-semibold text-[#EEEEEE]">Project Items</span>
					<button
						onClick={() => {
							setListCollapsed(true);
							localStorage.setItem(`hm_project_${projectId}_sidebar_hidden`, 'true');
						}}
						className="p-1 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
						title="Collapse panel"
					>
						<PanelLeftClose className="w-3.5 h-3.5" />
					</button>
				</div>

				{/* 2. Mode Switcher Section */}
				<div className="px-4 pb-3 shrink-0 border-b border-[#27282B]/50">
					<div className="flex items-center bg-[#0E0F11] rounded-md p-1 border border-[#27282B]">
						<button
							onClick={() => setSidebarMode('pages')}
							className={`flex-1 py-1 text-[12px] font-medium rounded-sm transition-colors ${sidebarMode === 'pages' ? 'bg-primary/10 text-primary shadow-sm' : 'text-[#8A8F98] hover:text-[#EEEEEE]'}`}
						>
							Pages
						</button>
						<button
							onClick={() => setSidebarMode('resources')}
							className={`flex-1 py-1 text-[12px] font-medium rounded-sm transition-colors ${sidebarMode === 'resources' ? 'bg-primary/10 text-primary shadow-sm' : 'text-[#8A8F98] hover:text-[#EEEEEE]'}`}
						>
							Resources
						</button>
					</div>
				</div>

				{/* Dynamic Content based on Mode Switcher */}
				{sidebarMode === 'resources' ? (
					<>
						{/* 3. Resources Filter / Search Area */}
						<div className="px-4 py-3 shrink-0 border-b border-[#27282B]/50 flex flex-col gap-3">
							{/* Count Row & Filter Button */}
							<div className="flex items-center justify-between">
								<span className="text-[12px] font-medium text-[#8A8F98]">Resources {items.length}</span>
								<button
									onClick={() => setShowFilters(!showFilters)}
									className={`p-1 rounded-md transition-colors border ${showFilters ? 'text-primary bg-primary/10 border-primary/20' : 'text-[#8A8F98] bg-transparent border-transparent hover:text-[#EEEEEE] hover:bg-[#26272B]/50'}`}
									title="Toggle Filters"
								>
									<Filter className="w-3.5 h-3.5" />
								</button>
							</div>

							{/* Search Field */}
							<div className="relative">
								<Search className="w-3.5 h-3.5 text-[#5A5D66] absolute left-2.5 top-1/2 -translate-y-1/2" />
								<input
									type="text"
									placeholder="Search"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full bg-[#0E0F11] border border-[#27282B] rounded-md py-1.5 pl-8 pr-3 text-[12px] text-[#EEEEEE] placeholder:text-[#5A5D66] focus:outline-none focus:border-[#42444A] transition-colors"
								/>
							</div>

							{/* Collapsible Filters */}
							<div
								className={`flex flex-col gap-3 overflow-hidden transition-all duration-200 ease-in-out ${showFilters ? 'max-h-[300px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
							>
								{/* Type Filter */}
								<div>
									<div className="text-[10px] font-semibold text-[#5A5D66] uppercase tracking-wider mb-2">Type</div>
									<div className="flex flex-wrap gap-1.5">
										{FILTERS.map(f => (
											<button
												key={f}
												onClick={() => setActiveFilter(f)}
												className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors border ${activeFilter === f
													? 'bg-primary/10 text-primary border-primary/20'
													: 'bg-transparent text-[#8A8F98] border-[#27282B] hover:text-[#EEEEEE] hover:border-[#383A40]'
													}`}
											>
												{f}
											</button>
										))}
									</div>
								</div>

								{/* Tag Filter */}
								<div>
									<div className="text-[10px] font-semibold text-[#5A5D66] uppercase tracking-wider mb-2">Tag</div>
									<div className="flex flex-wrap gap-1.5">
										{['All', 'UI', 'Performance', 'backend', 'design'].map(tag => (
											<button
												key={tag}
												onClick={() => setActiveTagFilter(tag)}
												className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors border ${activeTagFilter === tag
													? 'bg-primary/10 text-primary border-primary/20'
													: 'bg-transparent text-[#8A8F98] border-[#27282B] hover:text-[#EEEEEE] hover:border-[#383A40]'
													}`}
											>
												{tag}
											</button>
										))}
									</div>
								</div>

								{/* Status Filter */}
								<div>
									<div className="text-[10px] font-semibold text-[#5A5D66] uppercase tracking-wider mb-2">Status</div>
									<div className="flex flex-wrap gap-1.5">
										{['ALL', 'USED', 'UNUSED'].map(status => (
											<button
												key={status}
												onClick={() => setActiveStatusFilter(status)}
												className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors border ${activeStatusFilter === status
													? 'bg-primary/10 text-primary border-primary/20'
													: 'bg-transparent text-[#8A8F98] border-[#27282B] hover:text-[#EEEEEE] hover:border-[#383A40]'
													}`}
											>
												{status}
											</button>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* 4. Content List Section */}
						<div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
							{items.filter(item => {
								if (activeFilter !== 'All Types') {
									const filterMap: Record<string, string> = {
										'Notes': 'note',
										'Links': 'link',
										'Videos': 'video',
										'Docs': 'doc'
									};
									if (item.type !== filterMap[activeFilter]) return false;
								}
								if (activeTagFilter !== 'All' && !item.tags.some(t => t.toLowerCase() === activeTagFilter.toLowerCase())) return false;
								if (activeStatusFilter !== 'ALL' && item.status !== activeStatusFilter) return false;
								if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && !item.preview?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
								return true;
							}).map(item => {
								const Icon = getIcon(item.type);
								const isActive = selectedResourceId === item.id;

								return (
									<div
										key={item.id}
										onClick={() => {
											setSelectedResourceId(item.id);
											localStorage.setItem(`hm_project_${projectId}_resource`, item.id);
										}}
										className={`group flex flex-col px-3 py-2.5 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-[#26272B] border border-[#383A40]' : 'hover:bg-[#26272B]/50 border border-transparent'
											}`}
									>
										<div className="flex items-start gap-2.5 mb-1">
											<Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-[#EEEEEE]' : 'text-[#8A8F98]'}`} />
											<div className="min-w-0 flex-1">
												<div className={`text-[13px] font-medium truncate ${isActive ? 'text-[#EEEEEE]' : 'text-[#A0A5B0] group-hover:text-[#EEEEEE]'}`}>
													{item.title}
												</div>
												{item.preview && (
													<div className="text-[11px] text-[#5A5D66] mt-0.5 line-clamp-2 leading-relaxed">
														{item.preview}
													</div>
												)}
											</div>
										</div>
										{/* Tags Container */}
										{item.tags && item.tags.length > 0 && (
											<div className="flex flex-wrap gap-1.5 mt-1 pl-[26px]">
												{item.tags.map(tag => (
													<span key={tag} className="px-1.5 py-0.5 text-[10px] font-medium text-[#8A8F98] bg-[#0E0F11] border border-[#27282B] rounded-[4px]">
														{tag}
													</span>
												))}
											</div>
										)}
									</div>
								);
							})}

							{items.length === 0 && (
								<div className="px-4 py-6 text-center">
									<p className="text-[12px] text-[#5A5D66]">No resources found.</p>
								</div>
							)}
						</div>
					</>
				) : (
					<>
						{/* Pages Filter / Search Area */}
						<div className="px-4 py-3 shrink-0 border-b border-[#27282B]/50 flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<span className="text-[12px] font-medium text-[#8A8F98]">Pages {Object.keys(canvasContent).length}</span>
								<div className="flex items-center gap-1">
									<button
										onClick={createNewPage}
										className="p-1 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
										title="New Page"
									>
										<Plus className="w-3.5 h-3.5" />
									</button>
									<button
										onClick={() => setShowPageFilters(!showPageFilters)}
										className={`p-1 rounded-md transition-colors border ${showPageFilters ? 'text-primary bg-primary/10 border-primary/20' : 'text-[#8A8F98] bg-transparent border-transparent hover:text-[#EEEEEE] hover:bg-[#26272B]/50'}`}
										title="Toggle Filters"
									>
										<Filter className="w-3.5 h-3.5" />
									</button>
								</div>
							</div>

							<div className="relative">
								<Search className="w-3.5 h-3.5 text-[#5A5D66] absolute left-2.5 top-1/2 -translate-y-1/2" />
								<input
									type="text"
									placeholder="Search"
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
							{Object.entries(canvasContent).filter(([key, page]) => {
								if (activePageTagFilter !== 'All' && !(page.tags || []).some(t => t.toLowerCase() === activePageTagFilter.toLowerCase())) return false;
								if (pageSearchQuery && !page.title.toLowerCase().includes(pageSearchQuery.toLowerCase())) return false;
								return true;
							}).map(([key, page]) => {
								const isActive = selectedPageId === key;
								// We don't have a simple preview string anymore since it's JSONContent
								// A simple hack is to extract the first text node, but we'll leave preview empty for now
								const preview = '';

								return (
									<div
										key={key}
										onClick={() => {
											setSelectedPageId(key);
											localStorage.setItem(`hm_project_${projectId}_page`, key);
										}}
										className={`group flex items-center px-3 py-2.5 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-[#26272B] border border-[#383A40]' : 'hover:bg-[#26272B]/50 border border-transparent'
											}`}
									>
										<div className="flex items-start gap-2.5 flex-1 min-w-0">
											<FileText className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-[#EEEEEE]' : 'text-[#8A8F98]'}`} />
											<div className="min-w-0 flex-1">
												<div className={`text-[13px] font-medium truncate ${isActive ? 'text-[#EEEEEE]' : 'text-[#A0A5B0] group-hover:text-[#EEEEEE]'}`}>
													{page.title || 'Untitled'}
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
										{Object.keys(canvasContent).length > 1 && (
											<button
												onClick={(e) => deletePage(e, key)}
												className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#383A40] text-[#5A5D66] hover:text-red-400 transition-all"
											>
												<Trash className="w-3.5 h-3.5" />
											</button>
										)}
									</div>
								);
							})}

							{Object.keys(canvasContent).length === 0 && (
								<div className="px-4 py-6 text-center">
									<p className="text-[12px] text-[#5A5D66]">No pages found.</p>
								</div>
							)}
						</div>
					</>
				)}
			</div>

			{/* Right Panel: Working Surface */}
			{sidebarMode === 'resources' ? (
				<div className="flex-1 flex flex-col bg-[#0E0F11] min-w-0 h-full overflow-hidden">
					{/* 1. Top Breadcrumb Bar */}
					<div className="h-14 flex items-center justify-between px-6 shrink-0 border-b border-[#27282B] bg-[#0E0F11]">
						<div className="flex items-center gap-2 text-[12px] text-[#5A5D66] font-medium min-w-0">
							<span className="hover:text-[#8A8F98] cursor-pointer transition-colors shrink-0">Projects</span>
							<ChevronRight className="w-3 h-3 shrink-0" />
							<span className="hover:text-[#8A8F98] cursor-pointer transition-colors max-w-[150px] truncate">{meta.name}</span>
							<ChevronRight className="w-3 h-3 shrink-0" />
							<span className="hover:text-[#8A8F98] cursor-pointer transition-colors shrink-0">Resources</span>
							{currentItem && (
								<>
									<ChevronRight className="w-3 h-3 shrink-0" />
									<span className="text-[#8A8F98] truncate max-w-[200px]">{currentItem.title || 'Untitled'}</span>
								</>
							)}
						</div>

						{currentItem && (
							<div className="flex items-center gap-1.5 shrink-0 ml-4 relative">
								<span className="text-[12px] text-[#5A5D66] mr-2">Edited {formatTimeAgo(currentItem.time)}</span>

								<button
									onClick={async () => {
										try {
											await persistResource(currentItem.id, { isPinned: !currentItem.isPinned });
											setProjectData(prev => prev ? {
												...prev,
												items: prev.items.map(i => i.id === currentItem.id ? { ...i, isPinned: !currentItem.isPinned } : i)
											} : prev);
											window.dispatchEvent(new Event('hm:pinned-items-updated'));
										} catch (e) {
											console.error("Failed to pin item", e);
										}
									}}
									className="p-1.5 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
									title={currentItem.isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
								>
									<Pin className={`w-4 h-4 ${currentItem.isPinned ? "fill-current text-[#EEEEEE]" : ""}`} />
								</button>

								<button
									onClick={() => {
										navigator.clipboard.writeText(window.location.href);
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
											onClick={() => {
												setProjectPopoverOpen(true);
											}}
										>
											<FolderGit2 className="w-4 h-4" />
											Add to another project
										</DropdownMenuItem>
										<DropdownMenuSeparator className="bg-[#27282B] my-1.5" />
										<DropdownMenuItem
											className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#8A8F98] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
											onClick={() => {
												navigator.clipboard.writeText(window.location.href);
												showToast("Link copied to clipboard");
											}}
										>
											<Copy className="w-4 h-4" />
											Copy link
										</DropdownMenuItem>
										<DropdownMenuItem
											className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#8A8F98] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
											onClick={() => {
												window.open(window.location.href, '_blank');
											}}
										>
											<ExternalLink className="w-4 h-4" />
											Open in a new tab
										</DropdownMenuItem>
										<DropdownMenuItem
											className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#8A8F98] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
											onClick={async () => {
												try {
													const workspaceId = await resolveWorkspaceId();
													if (!workspaceId) return;
													await api.post(`/workspaces/${workspaceId}/item/${currentItem.id}/duplicate`);
													window.location.reload(); // naive reload
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
													await api.patch(`/workspaces/${workspaceId}/item/${currentItem.id}`, { deletedAt: new Date().toISOString() });
													setProjectData(prev => prev ? {
														...prev,
														items: prev.items.filter(i => i.id !== currentItem.id)
													} : prev);
													setSelectedResourceId(null);
												} catch (err) {
													console.error("Failed to trash:", err);
												}
											}}
										>
											<Trash2 className="w-4 h-4" />
											Move to trash
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>

								{isRenamingTopBar && (() => {
									const CurrentIcon = getIcon(currentItem.type);
									return (
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
													<CurrentIcon className="w-4 h-4" />
												</div>
												<input
													autoFocus
													value={currentItem.title || ''}
													onChange={(e) => updateResourceTitle(e.target.value)}
													onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setIsRenamingTopBar(false); }}
													className="flex-1 bg-[#0E0F11] text-[13px] font-medium text-[#EEEEEE] px-2.5 py-1.5 border border-[#27282B] rounded-[4px] outline-none focus:border-[#8A8F98] transition-colors min-w-0 relative z-50"
												/>
											</div>
										</>
									);
								})()}
							</div>
						)}
					</div>

					{currentItem ? (
						currentItem.type === 'note' ? (
							<div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-background text-foreground">
								<div className="max-w-[760px] w-full mx-auto flex-1 flex flex-col min-h-0 px-8 md:px-12">
									<QuickNoteEditor
										key={selectedResourceId || 'none'}
										title={currentItem.title || ''}
										tags={currentItem.tags || []}
										initialContentString={currentItem.content || ''}
										onUpdateTitle={updateResourceTitle}
										onUpdateTags={(tags) => {
											const updatedItems = items.map(i => i.id === selectedResourceId ? { ...i, tags } : i);
											setProjectData((prev) => {
												if (!prev) return prev;
												return { ...prev, items: updatedItems };
											});
											// Note: tags update isn't fully implemented in persistItem payload in API, but if it is, we'd do it here.
											// Actually we could do persistItem(selectedResourceId, { tags });
										}}
										onUpdateContent={(contentString) => {
											updateResourceContent(contentString);
										}}
										onAddPage={() => openPageAssignment(currentItem.id)}
									/>
								</div>
							</div>
						) : (
							<ItemContentView
								title={currentItem.title || ''}
								content={currentItem.content || ''}
								onUpdateTitle={updateResourceTitle}
								onUpdateContent={updateResourceContent}
								tagsCount={currentItem.tags?.length || 0}
								bottomStatusText={currentItem.status === 'UNUSED' ? 'Not in use currently' : 'Currently in use'}
								bottomActions={
									<button
										onClick={() => openPageAssignment(currentItem.id)}
										className="flex items-center px-4 py-1.5 rounded-md bg-[#EEEEEE] text-[#0E0F11] text-[12px] font-semibold hover:bg-white transition-colors shadow-sm"
									>
										Add to page
									</button>
								}
							/>
						)
					) : (
						<div className="flex-1 flex items-center justify-center text-[#5A5D66] text-[13px]">
							Select a resource to view details
						</div>
					)}
				</div>
			) : (
				<div className="flex-1 flex flex-col bg-[#0E0F11] min-w-0 h-full overflow-hidden">
					{/* Project Header */}
					<div className="h-14 border-b border-[#27282B] flex items-center justify-between px-6 shrink-0 bg-[#0E0F11]">
						<div className="flex items-center gap-2 text-[12px] text-[#5A5D66] font-medium min-w-0">
							{/* Expand button when list is collapsed */}
							{listCollapsed && (
								<button
									onClick={() => {
										setListCollapsed(false);
										localStorage.setItem(`hm_project_${projectId}_sidebar_hidden`, 'false');
									}}
									className="p-1.5 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors mr-1"
									title="Expand panel"
								>
									<PanelLeft className="w-4 h-4" />
								</button>
							)}
							<span className="hover:text-[#8A8F98] cursor-pointer transition-colors shrink-0">Projects</span>
							<ChevronRight className="w-3 h-3 shrink-0" />
							<span className="hover:text-[#8A8F98] cursor-pointer transition-colors truncate max-w-[150px]">{meta.name}</span>
							<ChevronRight className="w-3 h-3 shrink-0" />
							<span className="hover:text-[#8A8F98] cursor-pointer transition-colors shrink-0">Pages</span>
							{currentCanvas && (
								<>
									<ChevronRight className="w-3 h-3 shrink-0" />
									<span className="text-[#8A8F98] truncate max-w-[200px]">{currentCanvas.title || 'Untitled'}</span>
								</>
							)}

							<span className="text-[11px] text-[#5A5D66] shrink-0 hidden md:block ml-2">· {itemCount} items</span>
						</div>

						{currentCanvas && (
							<div className="flex items-center gap-1.5 shrink-0 ml-4 relative">
								<span className="text-[12px] text-[#5A5D66] mr-2">Edited {formatTimeAgo(currentCanvas.updatedAt)}</span>

								<button
									onClick={async () => {
										try {
											await persistCanvas(selectedPageId, { isPinned: !currentCanvas.isPinned });
											setProjectData(prev => prev ? {
												...prev,
												canvasContent: {
													...prev.canvasContent,
													[selectedPageId]: { ...prev.canvasContent[selectedPageId], isPinned: !currentCanvas.isPinned }
												}
											} : prev);
											window.dispatchEvent(new Event('hm:pinned-items-updated'));
										} catch (e) {
											console.error("Failed to pin item", e);
										}
									}}
									className="p-1.5 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
									title={currentCanvas.isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
								>
									<Pin className={`w-4 h-4 ${currentCanvas.isPinned ? "fill-current text-[#EEEEEE]" : ""}`} />
								</button>

								<button
									onClick={() => {
										navigator.clipboard.writeText(window.location.href);
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
											onClick={() => {
												setProjectPopoverOpen(true);
											}}
										>
											<FolderGit2 className="w-4 h-4" />
											Add to another project
										</DropdownMenuItem>
										<DropdownMenuSeparator className="bg-[#27282B] my-1.5" />
										<DropdownMenuItem
											className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#8A8F98] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
											onClick={() => {
												navigator.clipboard.writeText(window.location.href);
												showToast("Link copied to clipboard");
											}}
										>
											<Copy className="w-4 h-4" />
											Copy link
										</DropdownMenuItem>
										<DropdownMenuItem
											className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#8A8F98] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
											onClick={() => {
												window.open(window.location.href, '_blank');
											}}
										>
											<ExternalLink className="w-4 h-4" />
											Open in a new tab
										</DropdownMenuItem>
										<DropdownMenuItem
											className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#8A8F98] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
											onClick={async () => {
												try {
													const workspaceId = await resolveWorkspaceId();
													if (!workspaceId) return;
													await api.post(`/workspaces/${workspaceId}/item/${selectedPageId}/duplicate`);
													window.location.reload(); // naive reload
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
													setProjectData(prev => {
														if (!prev) return prev;
														const newCanvas = { ...prev.canvasContent };
														delete newCanvas[selectedPageId];
														return { ...prev, canvasContent: newCanvas };
													});

													const activeKeys = Object.keys(canvasContent).filter(k => k !== selectedPageId);
													const firstKey = activeKeys[0] || 'primary';
													setSelectedPageId(firstKey);
												} catch (err) {
													console.error("Failed to trash:", err);
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
												value={currentCanvas.title ?? ''}
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

					{/* Editor Area */}
					<div ref={editorContainerRef} className="flex-1 overflow-y-auto scrollbar-hide">
						<div className="max-w-[760px] mx-auto py-16 px-8 md:px-12">

							{/* Title Block */}
							<div className="mb-8">
								<input
									type="text"
									value={editorTitle}
									onChange={(e) => updateCanvasTitle(e.target.value)}
									className="w-full bg-transparent text-[32px] font-semibold text-[#EEEEEE] placeholder:text-[#5A5D66] outline-none border-none focus:ring-0 p-0 m-0"
									placeholder="Untitled"
								/>
							</div>

							{/* Editor Component */}
							<div className="mt-4">
								<Editor
									key={selectedPageId}
									initialContent={currentCanvas?.content || { type: 'doc', content: [{ type: 'paragraph' }] }}
									onUpdate={(newContent: any) => updateCanvasContent(newContent)}
								/>
							</div>

						</div>
					</div>
				</div>
			)}

			<PageAssignmentPopover
				isOpen={pagePopoverOpen}
				onClose={() => {
					setPagePopoverOpen(false);
					setSelectedResourceForPageAssign(null);
				}}
				pages={Object.entries(canvasContent).map(([id, page]) => ({ id, title: page.title || 'Untitled' }))}
				onAssign={handleAssignToPage}
			/>

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
