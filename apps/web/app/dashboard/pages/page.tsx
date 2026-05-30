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
	Trash
} from 'lucide-react';
import { NotionEditor } from '../../../components/editor/notion-editor';

type CanvasContent = {
	title: string;
	content: any;
	tags?: string[];
};

type GlobalPagesData = Record<string, CanvasContent>;

const STORAGE_KEY = 'hm:global_pages:v1';

function loadGlobalPages(): GlobalPagesData {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) return JSON.parse(raw) as GlobalPagesData;
	} catch { /* ignore */ }
	
	// Default starting page
	return {
		primary: {
			title: 'Welcome to Pages',
			content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'This is your global pages workspace.' }] }] },
			tags: []
		}
	};
}

function saveGlobalPages(data: GlobalPagesData) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch { /* ignore */ }
}

export default function PagesPage() {
	const [pagesData, setPagesData] = useState<GlobalPagesData | null>(null);
	const [selectedPageId, setSelectedPageId] = useState<string>('primary');
	const [listCollapsed, setListCollapsed] = useState(false);
	
	const [activePageTagFilter, setActivePageTagFilter] = useState('All');
	const [pageSearchQuery, setPageSearchQuery] = useState('');
	const [showPageFilters, setShowPageFilters] = useState(false);

	const editorContainerRef = useRef<HTMLDivElement>(null);

	// Load from localStorage on mount
	useEffect(() => {
	    const syncState = () => {
            const data = loadGlobalPages();
            setPagesData(data);
            
            const savedPage = localStorage.getItem(`hm_global_selected_page`);
            if (savedPage && data[savedPage]) {
                setSelectedPageId(savedPage);
            } else {
                setSelectedPageId(Object.keys(data)[0] || 'primary');
            }

            const collapsedState = localStorage.getItem('hm_global_pages_sidebar_collapsed');
            if (collapsedState === 'false') {
                setListCollapsed(false);
            } else {
                setListCollapsed(true);
            }
	    };

        syncState();

        window.addEventListener('hm:global-pages-sidebar-toggled', syncState);
        return () => window.removeEventListener('hm:global-pages-sidebar-toggled', syncState);
	}, []);

	const persist = useCallback((data: GlobalPagesData) => {
		setPagesData(data);
		saveGlobalPages(data);
		window.dispatchEvent(new Event('hm:global-pages-updated'));
	}, []);

	if (!pagesData) return null;

	const currentCanvas = pagesData[selectedPageId];

	// ── Handlers ─────────────────────────────────────────────────────────
	const updateCanvasTitle = (newTitle: string) => {
		const updated = {
			...pagesData,
			[selectedPageId]: {
				...(pagesData[selectedPageId] || { title: '', content: { type: 'doc', content: [] } }),
				title: newTitle,
			},
		};
		persist(updated);
	};

	const updateCanvasContent = (newContent: any) => {
		const existing = pagesData[selectedPageId] || { title: '', content: { type: 'doc', content: [] } };
		const updated = {
			...pagesData,
			[selectedPageId]: { ...existing, content: newContent },
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
		const updated = { ...pagesData, [id]: newPage };
		persist(updated);
		setSelectedPageId(id);
		localStorage.setItem(`hm_global_selected_page`, id);
	};
	
	const deletePage = (e: React.MouseEvent, id: string) => {
	    e.stopPropagation();
	    const keys = Object.keys(pagesData);
	    if (keys.length <= 1) return; // don't delete the last page
	    
	    const updated = { ...pagesData };
	    delete updated[id];
	    persist(updated);
	    
	    if (selectedPageId === id) {
	        const nextId = Object.keys(updated)[0];
	        setSelectedPageId(nextId);
	        localStorage.setItem(`hm_global_selected_page`, nextId);
	    }
	};

	const editorTitle = currentCanvas?.title || '';

	return (
		<div className="flex h-full w-full bg-[#0E0F11] text-[#EEEEEE] font-sans antialiased overflow-hidden relative">
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
							    localStorage.setItem('hm_global_pages_sidebar_collapsed', 'true');
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
								{Object.keys(pagesData).length > 1 && (
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

					{Object.keys(pagesData).length === 0 && (
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
								    localStorage.setItem('hm_global_pages_sidebar_collapsed', 'false');
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
						{currentCanvas && (
    						<div className="mt-4">
    							<NotionEditor 
    								key={selectedPageId}
    								initialContent={currentCanvas.content || { type: 'doc', content: [{ type: 'paragraph' }] }}
    								onUpdate={(newContent) => updateCanvasContent(newContent)}
    							/>
    						</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
