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
	Trash
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { ItemContentView } from '../../../../components/dashboard/item-content-view';
import { QuickNoteEditor, EMPTY_DOC } from '../../../../components/dashboard/quick-note-editor';
import { NotionEditor } from '../../../../components/editor/notion-editor';
import { PageAssignmentPopover } from '../../../../components/dashboard/page-assignment-popover';
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
};

type CanvasContent = {
	title: string;
	content: any;
	tags?: string[];
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

// ── localStorage helpers ───────────────────────────────────────────────────────
function getStorageKey(projectId: string) {
	return `hm:project:${projectId}:v1`;
}

function loadProjectData(projectId: string): ProjectData | null {
	try {
		const raw = localStorage.getItem(getStorageKey(projectId));
		if (raw) return JSON.parse(raw) as ProjectData;
	} catch { /* ignore */ }
	return null;
}

function saveProjectData(projectId: string, data: ProjectData) {
	try {
		localStorage.setItem(getStorageKey(projectId), JSON.stringify(data));
	} catch { /* ignore */ }
}

// ── Default data for first-time users ──────────────────────────────────────────
function createDefaultProjectData(projectName: string): ProjectData {
	const toTipTap = (blocks: string[]) => ({
		type: 'doc',
		content: blocks.map(text => ({
			type: 'paragraph',
			content: text ? [{ type: 'text', text }] : undefined
		}))
	});

	return {
		items: [
			{ id: '1', type: 'doc', title: 'Product Direction', preview: 'Render UI Before state sync when...', content: 'Render UI before state sync when minimum required state is present. This prevents the blocking spinner on iOS startup.\n\nWe need to handle 404s gracefully without showing red banners on the frontend. Ensure the fetch wrapper catches and maps to empty states.', time: '1d ago', tags: ['UI', 'Performance'], status: 'USED' },
			{ id: '2', type: 'link', title: 'API edge case', preview: 'Need to handle 404s gracefully', content: 'Need to handle 404s gracefully without showing red banners on the frontend. Ensure the fetch wrapper catches and maps to empty states.', time: '1h ago', tags: ['backend'], status: 'UNUSED' },
			{ id: '3', type: 'video', title: 'Design token audit', preview: 'review all colour token across the...', content: 'The concept of the video is to review all colour tokens across the design system.', time: '4h ago', tags: ['design', 'UI'], status: 'USED' },
		],
		canvasContent: {
			primary: {
				title: "Project Canvas",
				content: toTipTap([
					"Render UI before state sync when minimum required state is present. This prevents the blocking spinner on iOS startup.",
					"We need to handle 404s gracefully without showing red banners on the frontend. Ensure the fetch wrapper catches and maps to empty states.",
				]),
				tags: ['UI', 'Performance'],
			},
			'1': {
				title: "Architecture Diagram",
				content: toTipTap([
					"System uses a three-layer architecture: API Gateway → Service Layer → Data Layer. Each service communicates via typed event bus.",
					"Key constraint: all reads must resolve within 50ms at p99. This means aggressive caching at the gateway level.",
				]),
				tags: ['backend', 'design'],
			},
			'2': {
				title: "API edge cases",
				content: toTipTap([
					"Rate limiting returns 429 with Retry-After header. The client SDK should respect this and queue retries automatically.",
					"Pagination cursors expire after 15 minutes. If a cursor is stale, the API returns 410 Gone — the client should restart from page 1.",
				]),
				tags: ['backend'],
			},
			'3': {
				title: "State sync requirements",
				content: toTipTap([
					"Optimistic updates must be reversible. Every mutation should carry a rollback payload that can restore the previous state.",
					"WebSocket reconnection should replay missed events from the last known sequence number, not re-fetch the entire state.",
				]),
				tags: ['Performance'],
			},
			'4': {
				title: "Linear UI Reference",
				content: toTipTap([
					"Reference: https://linear.app — Notice how they handle keyboard navigation across lists. Every item is selectable via arrow keys without focus traps.",
					"Their command palette (Cmd+K) is instant because they index everything client-side. We should consider a similar approach for project search.",
				]),
				tags: ['UI', 'design'],
			},
			'5': {
				title: "Meeting notes: Data flow",
				content: toTipTap([
					"Decision: We'll use event sourcing for the inbox pipeline. Every capture creates an immutable event, projections build the current state.",
					"Action item: Prateek to draft the event schema by Friday. Need to support at minimum: ItemCreated, ItemMoved, ItemArchived, ItemTagged.",
				]),
				tags: ['backend'],
			},
		},
	};
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ProjectDetailView() {
	const { id } = useParams<{ id: string }>();
	const projectId = id;

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

	const [toast, setToast] = useState<{ visible: boolean; message: string; pageName: string; pageId?: string } | null>(null);
	const editorContainerRef = useRef<HTMLDivElement>(null);

	// Load from backend on mount
	useEffect(() => {
		let isMounted = true;
		const fetchData = async () => {
			const workspaceId = await resolveWorkspaceId();
			if (!workspaceId) return;
			try {
				const res = await api.get<{ data: any }>(`/workspaces/${workspaceId}/project/${projectId}`);
				if (!isMounted) return;
				const project = res.data;
				
				setMeta({ name: project.title, area: project.area?.title || 'Unknown Area' });

				const formattedItems = project.items.map((i: any) => ({
					id: i.id,
					type: i.type.toLowerCase() === 'quick_note' ? 'note' : i.type.toLowerCase(),
					title: i.title || '',
					preview: i.contentString?.substring(0, 100) || '',
					content: i.contentString || '',
					time: i.updatedAt,
					tags: i.tags || [],
					status: i.status === 'UNUSED' ? 'UNUSED' : 'USED',
				}));

				// Load canvas from localStorage or use default
				let savedCanvas = loadProjectData(projectId)?.canvasContent;
				if (!savedCanvas) {
					savedCanvas = createDefaultProjectData(project.title).canvasContent;
				}
				
				setProjectData({
					items: formattedItems,
					canvasContent: savedCanvas,
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
				if (savedPage && savedCanvas[savedPage]) {
					setSelectedPageId(savedPage);
				} else {
					setSelectedPageId('primary');
				}
			} catch (err) {
				console.error(err);
			}
		};
		void fetchData();
		return () => { isMounted = false; };
	}, [projectId]);

	// Persist to localStorage on every change
	const persist = useCallback((data: ProjectData) => {
		setProjectData(data);
		saveProjectData(projectId, data);
	}, [projectId]);

	if (!projectData) return null;

	const items = projectData.items;
	const canvasContent = projectData.canvasContent;

	const currentCanvas = canvasContent[selectedPageId] || canvasContent['primary'];
	const currentItem = items.find(i => i.id === selectedResourceId);

	const itemCount = items.length + 1; // +1 for primary canvas

	// ── Handlers ─────────────────────────────────────────────────────────
	const updateCanvasTitle = (newTitle: string) => {
		const key = selectedPageId;
		const updated = {
			...projectData,
			canvasContent: {
				...canvasContent,
				[key]: {
					...(canvasContent[key] || { title: '', content: { type: 'doc', content: [] } }),
					title: newTitle,
				},
			},
		};
		persist(updated);
	};

	const updateCanvasContent = (newContent: any) => {
		const key = selectedPageId;
		const existing = canvasContent[key] || { title: '', content: { type: 'doc', content: [] } };
		const updated = {
			...projectData,
			canvasContent: {
				...canvasContent,
				[key]: { ...existing, content: newContent },
			},
		};
		persist(updated);
	};

	const createNewPage = () => {
		const id = Math.random().toString(36).substr(2, 9);
		const newPage = {
			title: 'Untitled Page',
			content: { type: 'doc', content: [{ type: 'paragraph' }] },
			tags: []
		};
		const updated = {
			...projectData,
			canvasContent: {
				...canvasContent,
				[id]: newPage
			}
		};
		persist(updated);
		setSelectedPageId(id);
		localStorage.setItem(`hm_project_${projectId}_page`, id);
	};

	const deletePage = (e: React.MouseEvent, id: string) => {
	    e.stopPropagation();
	    const keys = Object.keys(canvasContent);
	    if (keys.length <= 1) return; // don't delete the last page
	    
	    const updatedCanvas = { ...canvasContent };
	    delete updatedCanvas[id];
	    const updated = {
			...projectData,
			canvasContent: updatedCanvas
		};
	    persist(updated);
	    
	    if (selectedPageId === id) {
	        const nextId = Object.keys(updatedCanvas)[0];
	        setSelectedPageId(nextId);
	        localStorage.setItem(`hm_project_${projectId}_page`, nextId);
	    }
	};

	const updateResourceTitle = (newTitle: string) => {
		const updatedItems = items.map(i => i.id === selectedResourceId ? { ...i, title: newTitle } : i);
		persist({ ...projectData, items: updatedItems });
	};

	const updateResourceContent = (newContent: string) => {
		const updatedItems = items.map(i => i.id === selectedResourceId ? { ...i, content: newContent } : i);
		persist({ ...projectData, items: updatedItems });
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

		const updatedProjectData = {
			...projectData,
			items: updatedItems,
			canvasContent: {
				...canvasContent,
				[targetPageId]: {
					...targetPage,
					content: updatedContent
				}
			}
		};
		persist(updatedProjectData);

		const currentIndex = items.findIndex(i => i.id === selectedResourceForPageAssign);
		const nextItem = updatedItems[currentIndex] || updatedItems[0];
		const nextId = nextItem ? nextItem.id : null;
		setSelectedResourceId(nextId);
		if (nextId) localStorage.setItem(`hm_project_${projectId}_resource`, nextId);
		else localStorage.removeItem(`hm_project_${projectId}_resource`);

		setPagePopoverOpen(false);
		setSelectedResourceForPageAssign(null);
		
		setToast({ visible: true, message: 'Added to', pageName: pageTitle, pageId: targetPageId });
		setTimeout(() => setToast(null), 6000);
	};

	// ── Display title for editor ─────────────────────────────────────────
	const editorTitle = selectedPageId === 'primary'
		? (currentCanvas?.title || 'Project Canvas')
		: (currentCanvas?.title || 'Untitled');

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
						onClick={() => setListCollapsed(true)}
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
					<div className="h-14 flex items-center px-6 shrink-0 border-b border-[#27282B] bg-[#0E0F11]">
						<div className="flex items-center gap-2 text-[12px] text-[#5A5D66] font-medium">
							<span className="hover:text-[#8A8F98] cursor-pointer transition-colors">{meta.area}</span>
							<ChevronRight className="w-3 h-3" />
							<span className="hover:text-[#8A8F98] cursor-pointer transition-colors">Resources</span>
							{currentItem && (
								<>
									<ChevronRight className="w-3 h-3" />
									<span className="text-[#8A8F98] truncate max-w-[200px]">{currentItem.title || 'Untitled'}</span>
								</>
							)}
						</div>
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
										persist({ ...projectData, items: updatedItems });
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
						<div className="flex items-center gap-3 min-w-0">
							{/* Expand button when list is collapsed */}
							{listCollapsed && (
								<button
									onClick={() => setListCollapsed(false)}
									className="p-1.5 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors mr-1"
									title="Expand panel"
								>
									<PanelLeft className="w-4 h-4" />
								</button>
							)}
							<span className="text-[13px] text-[#8A8F98] truncate">{meta.area}</span>
							<ChevronRight className="w-3.5 h-3.5 text-[#5A5D66] shrink-0" />
							<span className="text-[13px] font-medium text-[#EEEEEE] truncate">{meta.name}</span>

							<span className="text-[11px] text-[#5A5D66] shrink-0 hidden md:block">· {itemCount} items</span>
						</div>
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
								<NotionEditor 
									key={selectedPageId}
									initialContent={currentCanvas?.content || { type: 'doc', content: [{ type: 'paragraph' }] }}
									onUpdate={(newContent) => updateCanvasContent(newContent)}
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

		</div>
	);
}