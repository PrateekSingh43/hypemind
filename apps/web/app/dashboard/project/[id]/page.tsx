"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
	Layout,
	FileText,
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
	FileUp
} from 'lucide-react';
import { useParams } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────────
type ProjectItem = {
	id: string;
	type: 'canvas' | 'note' | 'link' | 'journal';
	title: string;
	time: string;
};

type CanvasContent = {
	title: string;
	blocks: string[];
};

type ProjectData = {
	items: ProjectItem[];
	canvasContent: Record<string, CanvasContent>;
};

// ── Mock project metadata lookup ───────────────────────────────────────────────
const PROJECT_META_MAP: Record<string, { name: string; area: string }> = {
	p1: { name: "HypeMind Dashboard", area: "Product Development" },
	p2: { name: "AI Assistant Core", area: "Product Development" },
	p3: { name: "Landing Page", area: "Product Development" },
	p4: { name: "Q3 Campaign", area: "Marketing" },
	p5: { name: "Social Media Strategy", area: "Marketing" },
	p6: { name: "Brand Assets v2", area: "Design Operations" },
	p7: { name: "Icon Library", area: "Design Operations" },
	p8: { name: "Design Tokens", area: "Design Operations" },
	p9: { name: "Figma Plugin", area: "Design Operations" },
	p10: { name: "Component Library", area: "Design Operations" },
	p11: { name: "Style Guide", area: "Design Operations" },
	p12: { name: "Motion Design", area: "Design Operations" },
};

const FILTERS = ['All', 'Canvas', 'Notes', 'Links'];

const getIcon = (type: string) => {
	switch (type) {
		case 'canvas': return Layout;
		case 'note': return FileText;
		case 'link': return LinkIcon;
		case 'journal': return Book;
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
	return {
		items: [
			{ id: '1', type: 'canvas', title: 'Architecture Diagram', time: '1d ago' },
			{ id: '2', type: 'note', title: 'API edge cases', time: '1h ago' },
			{ id: '3', type: 'note', title: 'State sync requirements', time: '4h ago' },
			{ id: '4', type: 'link', title: 'Linear UI Reference', time: '2d ago' },
			{ id: '5', type: 'journal', title: 'Meeting notes: Data flow', time: '3d ago' },
		],
		canvasContent: {
			primary: {
				title: "Project Canvas",
				blocks: [
					"Render UI before state sync when minimum required state is present. This prevents the blocking spinner on iOS startup.",
					"We need to handle 404s gracefully without showing red banners on the frontend. Ensure the fetch wrapper catches and maps to empty states.",
				],
			},
			'1': {
				title: "Architecture Diagram",
				blocks: [
					"System uses a three-layer architecture: API Gateway → Service Layer → Data Layer. Each service communicates via typed event bus.",
					"Key constraint: all reads must resolve within 50ms at p99. This means aggressive caching at the gateway level.",
				],
			},
			'2': {
				title: "API edge cases",
				blocks: [
					"Rate limiting returns 429 with Retry-After header. The client SDK should respect this and queue retries automatically.",
					"Pagination cursors expire after 15 minutes. If a cursor is stale, the API returns 410 Gone — the client should restart from page 1.",
				],
			},
			'3': {
				title: "State sync requirements",
				blocks: [
					"Optimistic updates must be reversible. Every mutation should carry a rollback payload that can restore the previous state.",
					"WebSocket reconnection should replay missed events from the last known sequence number, not re-fetch the entire state.",
				],
			},
			'4': {
				title: "Linear UI Reference",
				blocks: [
					"Reference: https://linear.app — Notice how they handle keyboard navigation across lists. Every item is selectable via arrow keys without focus traps.",
					"Their command palette (Cmd+K) is instant because they index everything client-side. We should consider a similar approach for project search.",
				],
			},
			'5': {
				title: "Meeting notes: Data flow",
				blocks: [
					"Decision: We'll use event sourcing for the inbox pipeline. Every capture creates an immutable event, projections build the current state.",
					"Action item: Prateek to draft the event schema by Friday. Need to support at minimum: ItemCreated, ItemMoved, ItemArchived, ItemTagged.",
				],
			},
		},
	};
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ProjectDetailView() {
	const { id } = useParams<{ id: string }>();
	const projectId = id;

	const meta = PROJECT_META_MAP[projectId] || { name: `Project ${projectId}`, area: "Unknown Area" };

	const [activeFilter, setActiveFilter] = useState('All');
	const [selectedId, setSelectedId] = useState('primary');
	const [projectData, setProjectData] = useState<ProjectData | null>(null);
	const [listCollapsed, setListCollapsed] = useState(false);
	const [attachPopoverOpen, setAttachPopoverOpen] = useState(false);

	// Load from localStorage on mount
	useEffect(() => {
		const saved = loadProjectData(projectId);
		if (saved) {
			setProjectData(saved);
		} else {
			setProjectData(createDefaultProjectData(meta.name));
		}
	}, [projectId, meta.name]);

	// Persist to localStorage on every change
	const persist = useCallback((data: ProjectData) => {
		setProjectData(data);
		saveProjectData(projectId, data);
	}, [projectId]);

	if (!projectData) return null;

	const items = projectData.items;
	const canvasContent = projectData.canvasContent;

	const currentCanvas = canvasContent[selectedId] || canvasContent['primary'];
	const currentItem = items.find(i => i.id === selectedId);

	const itemCount = items.length + 1; // +1 for primary canvas

	// ── Handlers ─────────────────────────────────────────────────────────
	const updateCanvasTitle = (newTitle: string) => {
		const key = selectedId;
		const updated = {
			...projectData,
			canvasContent: {
				...canvasContent,
				[key]: {
					...(canvasContent[key] || { title: '', blocks: [] }),
					title: newTitle,
				},
			},
		};
		persist(updated);
	};

	const updateCanvasBlock = (blockIndex: number, text: string) => {
		const key = selectedId;
		const existing = canvasContent[key] || { title: '', blocks: [] };
		const newBlocks = [...existing.blocks];
		newBlocks[blockIndex] = text;
		const updated = {
			...projectData,
			canvasContent: {
				...canvasContent,
				[key]: { ...existing, blocks: newBlocks },
			},
		};
		persist(updated);
	};

	const addBlock = () => {
		const key = selectedId;
		const existing = canvasContent[key] || { title: '', blocks: [] };
		const updated = {
			...projectData,
			canvasContent: {
				...canvasContent,
				[key]: { ...existing, blocks: [...existing.blocks, ''] },
			},
		};
		persist(updated);
	};

	// ── Display title for editor ─────────────────────────────────────────
	const editorTitle = selectedId === 'primary'
		? (currentCanvas?.title || 'Project Canvas')
		: (currentItem?.title || currentCanvas?.title || 'Untitled');

	const editorBlocks = currentCanvas?.blocks || [];

	return (
		<div className="flex h-full w-full bg-[#0E0F11] text-[#EEEEEE] font-sans antialiased overflow-hidden">

			{/* Left Rail: Project Items (collapsible) */}
			<div
				className="flex flex-col border-r border-[#27282B] bg-[#151618] shrink-0 transition-[width] duration-200 ease-out overflow-hidden"
				style={{ width: listCollapsed ? 0 : 300 }}
			>

				{/* Rail Header / Filters */}
				<div className="px-4 py-3 border-b border-[#27282B]/50 shrink-0">
					<div className="flex items-center justify-between mb-3">
						<span className="text-[13px] font-semibold text-[#EEEEEE]">Project Items</span>
						<button
							onClick={() => setListCollapsed(true)}
							className="p-1 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
							title="Collapse panel"
						>
							<PanelLeftClose className="w-3.5 h-3.5" />
						</button>
					</div>
					<div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
						{FILTERS.map(f => (
							<button
								key={f}
								onClick={() => setActiveFilter(f)}
								className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${activeFilter === f
									? 'bg-[#26272B] text-[#EEEEEE]'
									: 'text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B]/50'
									}`}
							>
								{f}
							</button>
						))}
					</div>
				</div>

				{/* Item List */}
				<div className="flex-1 overflow-y-auto py-2">

					{/* Primary Canvas (always present) */}
					<div className="mb-4">
						<div className="px-4 py-1.5 text-[10px] font-semibold text-[#5A5D66] uppercase tracking-wider">
							Primary
						</div>
						<div className="px-2">
							<div
								onClick={() => setSelectedId('primary')}
								className={`flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer transition-colors ${selectedId === 'primary' ? 'bg-[#26272B] border border-[#27282B]' : 'hover:bg-[#26272B]/50 border border-transparent'
									}`}
							>
								<Layout className={`w-4 h-4 shrink-0 ${selectedId === 'primary' ? 'text-[#EEEEEE]' : 'text-[#8A8F98]'}`} />
								<span className={`text-[13px] font-medium truncate ${selectedId === 'primary' ? 'text-[#EEEEEE]' : 'text-[#A0A5B0]'}`}>
									{canvasContent['primary']?.title || 'Project Canvas'}
								</span>
							</div>
						</div>
					</div>

					{/* Attached Items */}
					{items.length > 0 && (
						<div>
							<div className="group/attached flex items-center justify-between px-4 py-1.5">
								<span className="text-[10px] font-semibold text-[#5A5D66] uppercase tracking-wider">
									Attached
								</span>
								<button
									onClick={() => setAttachPopoverOpen(!attachPopoverOpen)}
									className="opacity-0 group-hover/attached:opacity-100 p-0.5 rounded text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-all"
									title="Add attachment"
								>
									<Plus className="w-3.5 h-3.5" />
								</button>
							</div>

							{/* Attachment type popup */}
							{attachPopoverOpen && (
								<>
									<div className="fixed inset-0 z-40" onClick={() => setAttachPopoverOpen(false)} />
									<div className="absolute right-2 mt-1 w-52 bg-[#1C1D21] border border-[#27282B] rounded-lg shadow-2xl z-50 overflow-hidden py-1">
										<div className="px-3 py-1.5 text-[10px] font-semibold text-[#5A5D66] uppercase tracking-wider">Add Attachment</div>
										{[
											{ icon: FileUp, label: 'Upload File', desc: 'PDF, Doc, Image' },
											{ icon: Globe, label: 'Add Link', desc: 'Paste a URL' },
											{ icon: Paperclip, label: 'Attach Note', desc: 'From your workspace' },
										].map((opt) => (
											<div
												key={opt.label}
												className="flex items-center gap-3 px-3 py-2 mx-1 rounded-md hover:bg-[#26272B] cursor-pointer transition-colors"
												onClick={() => setAttachPopoverOpen(false)}
											>
												<opt.icon className="w-4 h-4 text-[#8A8F98] shrink-0" />
												<div>
													<div className="text-[13px] text-[#EEEEEE]">{opt.label}</div>
													<div className="text-[11px] text-[#5A5D66]">{opt.desc}</div>
												</div>
											</div>
										))}
									</div>
								</>
							)}

							<div className="px-2 space-y-[2px]">
								{items.map(item => {
									if (activeFilter !== 'All') {
										const filterType = activeFilter.toLowerCase().replace(/s$/, '');
										if (item.type !== filterType) return null;
									}
									const Icon = getIcon(item.type);
									const isActive = selectedId === item.id;

									return (
										<div
											key={item.id}
											onClick={() => setSelectedId(item.id)}
											className={`group flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-[#26272B]' : 'hover:bg-[#26272B]/50'
												}`}
										>
											<div className="flex items-center gap-2.5 min-w-0">
												<Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#EEEEEE]' : 'text-[#8A8F98]'}`} />
												<span className={`text-[13px] font-medium truncate ${isActive ? 'text-[#EEEEEE]' : 'text-[#A0A5B0]'}`}>
													{item.title}
												</span>
											</div>
											<span className="text-[11px] text-[#5A5D66] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
												{item.time}
											</span>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* Empty state for first-time user */}
					{items.length === 0 && (
						<div className="px-4 py-6 text-center">
							<p className="text-[12px] text-[#5A5D66]">No attached items yet.</p>
							<p className="text-[11px] text-[#5A5D66] mt-1">Start by writing in the canvas.</p>
						</div>
					)}
				</div>
			</div>

			{/* Right Panel: Working Surface */}
			<div className="flex-1 flex flex-col bg-[#0E0F11] min-w-0">

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
				<div className="flex-1 overflow-y-auto scrollbar-hide">
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

						{/* Content Blocks */}
						<div className="space-y-4">
							{editorBlocks.map((block, idx) => (
								<textarea
									key={idx}
									value={block}
									onChange={(e) => updateCanvasBlock(idx, e.target.value)}
									className="w-full bg-transparent text-[15px] leading-relaxed text-[#A0A5B0] placeholder:text-[#5A5D66] outline-none border-none focus:ring-0 resize-none min-h-[28px] p-0 m-0"
									placeholder="Write something..."
									rows={1}
									onInput={(e) => {
										const target = e.target as HTMLTextAreaElement;
										target.style.height = 'auto';
										target.style.height = target.scrollHeight + 'px';
									}}
								/>
							))}

							{/* Add block / slash command hint */}
							<div className="flex items-center gap-2 py-1 mt-2 group">
								<button
									onClick={addBlock}
									className="w-5 h-5 rounded flex items-center justify-center hover:bg-[#26272B] cursor-pointer shrink-0 text-[#5A5D66] group-hover:text-[#EEEEEE] transition-colors"
								>
									<Plus className="w-4 h-4" />
								</button>
								<span
									className="text-[15px] text-[#5A5D66] cursor-pointer"
									onClick={addBlock}
								>
									{editorBlocks.length === 0 ? "Start writing..." : "Type '/' for commands"}
								</span>
							</div>
						</div>

					</div>
				</div>
			</div>

		</div>
	);
}