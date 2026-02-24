"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Link as LinkIcon,
  Layout,
  Book,
  FolderGit2,
  Tag,
  CheckCircle,
  ChevronRight,
  Search,
  Filter,
  X,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { Navigator } from '../../../lib/navigator';

// ── Types ──────────────────────────────────────────────────────────────────────
type InboxItem = {
  id: string;
  title: string | null;
  type: string;
  updatedAt: string;
  content?: string;
  tags?: string[];
};

// ── Mock Data (UI preview) ─────────────────────────────────────────────────────
const MOCK_ITEMS: InboxItem[] = [
  {
    id: '1',
    title: 'Product Direction Canvas',
    type: 'note',
    updatedAt: new Date(Date.now() - 42 * 60000).toISOString(),
    content: 'Render UI before state sync when minimum required state is present. This prevents the blocking spinner on iOS startup.',
    tags: ['ui', 'performance']
  },
  {
    id: '2',
    title: 'API edge cases',
    type: 'link',
    updatedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    content: 'Need to handle 404s gracefully without showing red banners on the frontend. Ensure the fetch wrapper catches and maps to empty states.',
    tags: ['backend']
  },
  {
    id: '3',
    title: '',
    type: 'journal',
    updatedAt: new Date(Date.now() - 120 * 60000).toISOString(),
    content: 'Thinking about how the placement panel should work. It needs to be instant. No dropdowns if possible, just inline assignments.',
    tags: []
  },
  {
    id: '4',
    title: 'Design token audit',
    type: 'canvas',
    updatedAt: new Date(Date.now() - 180 * 60000).toISOString(),
    content: 'Review all color tokens across the design system. Several components are using hardcoded values instead of tokens.',
    tags: ['design', 'ui']
  },
  {
    id: '5',
    title: 'Auth flow improvements',
    type: 'note',
    updatedAt: new Date(Date.now() - 300 * 60000).toISOString(),
    content: 'The login redirect after signup is broken on Safari. Need to investigate cookie handling with SameSite=None.',
    tags: ['bug', 'backend']
  },
  {
    id: '6',
    title: 'Sprint retro notes',
    type: 'note',
    updatedAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
    content: 'Team velocity is stable. Main concern is tech debt around the inbox module. Consider dedicating a sprint to cleanup.',
    tags: ['planning']
  },
];

const MOCK_PROJECTS = [
  { id: 'p1', name: 'HypeMind Dashboard', recent: true },
  { id: 'p2', name: 'AI Core Features', recent: true },
  { id: 'p3', name: 'Landing Page v2', recent: true },
  { id: 'p4', name: 'Moving Checklist', recent: false },
  { id: 'p5', name: 'Q3 OKRs', recent: false },
];

const INITIAL_TAGS = ['ui', 'performance', 'backend', 'design', 'planning', 'bug', 'urgent'];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'note', label: 'Notes', icon: FileText },
  { value: 'link', label: 'Links', icon: LinkIcon },
  { value: 'canvas', label: 'Canvas', icon: Layout },
  { value: 'journal', label: 'Journal', icon: Book },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const getIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'note': return FileText;
    case 'link': return LinkIcon;
    case 'canvas': return Layout;
    case 'journal': return Book;
    default: return FileText;
  }
};

function formatRelativeTime(dateISO: string) {
  const target = new Date(dateISO).getTime();
  if (Number.isNaN(target)) return "recently";

  const diffMs = target - Date.now();
  const absMs = Math.abs(diffMs);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (absMs < 60 * 1000) return "just now";
  if (absMs < 60 * 60 * 1000) return formatter.format(Math.round(diffMs / (60 * 1000)), "minute");
  if (absMs < 24 * 60 * 60 * 1000) return formatter.format(Math.round(diffMs / (60 * 60 * 1000)), "hour");
  return formatter.format(Math.round(diffMs / (24 * 60 * 60 * 1000)), "day");
}

// ── Storage ────────────────────────────────────────────────────────────────────
const LIST_COLLAPSED_KEY = "hm:unsorted:list-collapsed:v1";

function readListCollapsed(): boolean {
  try {
    return window.localStorage.getItem(LIST_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeListCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(LIST_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    // ignore
  }
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function UnsortedPage() {
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[]>(MOCK_ITEMS);
  const [loading] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(MOCK_ITEMS[0].id);

  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  const [availableTags, setAvailableTags] = useState(INITIAL_TAGS);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  const [toast, setToast] = useState<{ visible: boolean; message: string; projectName: string; projectId?: string } | null>(null);
  const [listCollapsed, setListCollapsed] = useState(false);

  // ── Filter state ───────────────────────────────────────────────────────
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set());
  const [filterTags, setFilterTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const selectedItem = items.find(i => i.id === selectedId);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);



  const toggleListPanel = () => {
    setListCollapsed(prev => {
      const next = !prev;
      writeListCollapsed(next);
      return next;
    });
  };

  // ── Filter logic ──────────────────────────────────────────────────────
  const filteredItems = items.filter(item => {
    if (filterTypes.size > 0 && !filterTypes.has(item.type.toLowerCase())) return false;
    if (filterTags.size > 0 && !(item.tags || []).some(t => filterTags.has(t))) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchContent = (item.content || '').toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }
    return true;
  });

  const activeFilterCount = filterTypes.size + filterTags.size;

  const clearAllFilters = () => {
    setFilterTypes(new Set());
    setFilterTags(new Set());
    setSearchQuery('');
  };

  const toggleFilterType = (value: string) => {
    setFilterTypes(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const toggleFilterTag = (tag: string) => {
    setFilterTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  // ── Keyboard navigation ───────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredItems.length === 0 || projectPopoverOpen || tagPopoverOpen) return;

      const currentIndex = filteredItems.findIndex(i => i.id === selectedId);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < filteredItems.length - 1 ? currentIndex + 1 : currentIndex;
        setSelectedId(filteredItems[nextIndex].id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        setSelectedId(filteredItems[prevIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, selectedId, projectPopoverOpen, tagPopoverOpen]);

  useEffect(() => {
    if (projectPopoverOpen && projectInputRef.current) projectInputRef.current.focus();
  }, [projectPopoverOpen]);

  useEffect(() => {
    if (tagPopoverOpen && tagInputRef.current) tagInputRef.current.focus();
  }, [tagPopoverOpen]);

  // ── Actions ───────────────────────────────────────────────────────────
  const handleAssignToProject = async (projectName: string, projectId?: string) => {
    if (!selectedId) return;

    setProjectPopoverOpen(false);
    setProjectSearch('');

    const idToProcess = selectedId;

    const currentIndex = items.findIndex(i => i.id === selectedId);
    const nextItem = items[currentIndex + 1] || items[currentIndex - 1];
    setSelectedId(nextItem ? nextItem.id : null);
    setItems(prev => prev.filter(i => i.id !== idToProcess));

    setToast({ visible: true, message: 'Added to', projectName, projectId });
    setTimeout(() => setToast(null), 6000);
  };

  const handleToggleTag = (tag: string) => {
    if (!selectedId) return;
    setItems(items.map(i => {
      if (i.id === selectedId) {
        const newTags = i.tags?.includes(tag)
          ? i.tags.filter(t => t !== tag)
          : [...(i.tags || []), tag];
        return { ...i, tags: newTags };
      }
      return i;
    }));
  };

  const handleCreateTag = (newTagRaw: string) => {
    if (!selectedId) return;
    const newTag = newTagRaw.trim().toLowerCase();
    if (!availableTags.includes(newTag)) {
      setAvailableTags([...availableTags, newTag]);
    }
    setItems(items.map(i => {
      if (i.id === selectedId && !i.tags?.includes(newTag)) {
        return { ...i, tags: [...(i.tags || []), newTag] };
      }
      return i;
    }));
    setTagSearch('');
  };

  const filteredProjects = MOCK_PROJECTS.filter(p =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase())
  );
  const recentProjects = filteredProjects.filter(p => p.recent);
  const otherProjects = filteredProjects.filter(p => !p.recent);

  const filteredTagsList = availableTags.filter(t =>
    t.toLowerCase().includes(tagSearch.toLowerCase())
  );

  // Collect all unique tags from items for the filter dropdown
  const allItemTags = Array.from(new Set(items.flatMap(i => i.tags || [])));

  return (
    <div className="flex h-full w-full text-[#EEEEEE] font-sans antialiased overflow-hidden relative">

      {/* Toast notification */}
      {toast?.visible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1C1D21] border border-[#27282B] text-[#EEEEEE] px-5 py-3.5 rounded-lg shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 overflow-hidden">
          <CheckCircle className="w-4 h-4 text-[#5E6AD2] shrink-0" />
          <span className="text-[13px]">
            {toast.message} <span className="font-semibold">&quot;{toast.projectName}&quot;</span>
          </span>
          <div className="w-[1px] h-4 bg-[#34353A] mx-1" />
          <button
            onClick={() => {
              if (toast.projectId) {
                router.push(Navigator.project(toast.projectId));
              }
              setToast(null);
            }}
            className="text-[13px] font-medium text-[#5E6AD2] hover:text-[#7B83EB] transition-colors whitespace-nowrap"
          >
            Open Project →
          </button>
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#27282B]">
            <div className="h-full bg-[#5E6AD2]/60 animate-[shrink_6s_linear_forwards]" />
          </div>
        </div>
      )}

      {/* ── List Panel (collapsible) ─────────────────────────────────────── */}
      <div
        className="flex flex-col border-r border-[#27282B] bg-[#151618] shrink-0 z-10 transition-[width] duration-200 ease-out overflow-hidden"
        style={{ width: listCollapsed ? 0 : 340 }}
      >
        {/* List panel header with title, filter toggle, and collapse button */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#27282B]/50 shrink-0 gap-2">
          <span className="text-[13px] font-semibold text-[#EEEEEE] truncate">
            Unsorted
            <span className="ml-1.5 text-[11px] font-normal text-[#5A5D66]">{filteredItems.length}</span>
          </span>
          <div className="flex items-center gap-1">
            {/* Filter button */}
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`p-1.5 rounded-md transition-colors relative ${filterOpen || activeFilterCount > 0
                ? 'text-[#5E6AD2] bg-[#5E6AD2]/10'
                : 'text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B]'
                }`}
              title="Filter items"
            >
              <Filter className="w-3.5 h-3.5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#5E6AD2] rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {/* Collapse button */}
            <button
              onClick={toggleListPanel}
              className="p-1.5 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
              title="Collapse list panel"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Filter Panel (expandable) ──────────────────────────────────── */}
        {filterOpen && (
          <div className="border-b border-[#27282B]/50 bg-[#131416] shrink-0">
            {/* Search within items */}
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-center gap-2 bg-[#0E0F11] border border-[#27282B] rounded-md px-2.5 py-1.5">
                <Search className="w-3.5 h-3.5 text-[#5A5D66] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="w-full bg-transparent text-[12px] text-[#EEEEEE] placeholder:text-[#5A5D66] border-none focus:outline-none focus:ring-0"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-[#5A5D66] hover:text-[#EEEEEE]">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Type filter */}
            <div className="px-3 pb-2">
              <span className="text-[10px] font-semibold text-[#5A5D66] uppercase tracking-wider">Type</span>
              <div className="flex flex-wrap gap-1 mt-1.5">
                <button
                  onClick={() => setFilterTypes(new Set())}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${filterTypes.size === 0
                    ? 'bg-[#5E6AD2]/15 text-[#5E6AD2] border border-[#5E6AD2]/30'
                    : 'bg-[#1C1D21] border border-[#27282B] text-[#8A8F98] hover:text-[#EEEEEE] hover:border-[#34353A]'
                    }`}
                >
                  All Types
                </button>
                {TYPE_OPTIONS.filter(opt => opt.value !== 'all').map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => toggleFilterType(opt.value)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${filterTypes.has(opt.value)
                      ? 'bg-[#5E6AD2]/15 text-[#5E6AD2] border border-[#5E6AD2]/30'
                      : 'bg-[#1C1D21] border border-[#27282B] text-[#8A8F98] hover:text-[#EEEEEE] hover:border-[#34353A]'
                      }`}
                  >
                    {opt.icon && <opt.icon className="w-3 h-3" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag filter */}
            <div className="px-3 pb-3">
              <span className="text-[10px] font-semibold text-[#5A5D66] uppercase tracking-wider">Tag</span>
              <div className="flex flex-wrap gap-1 mt-1.5">
                <button
                  onClick={() => setFilterTags(new Set())}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${filterTags.size === 0
                    ? 'bg-[#5E6AD2]/15 text-[#5E6AD2] border border-[#5E6AD2]/30'
                    : 'bg-[#1C1D21] border border-[#27282B] text-[#8A8F98] hover:text-[#EEEEEE] hover:border-[#34353A]'
                    }`}
                >
                  All
                </button>
                {allItemTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleFilterTag(tag)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${filterTags.has(tag)
                      ? 'bg-[#5E6AD2]/15 text-[#5E6AD2] border border-[#5E6AD2]/30'
                      : 'bg-[#1C1D21] border border-[#27282B] text-[#8A8F98] hover:text-[#EEEEEE] hover:border-[#34353A]'
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear all filters */}
            {activeFilterCount > 0 && (
              <div className="px-3 pb-2.5">
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] text-[#5E6AD2] hover:text-[#7B83EB] transition-colors font-medium flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Items list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center opacity-50">
              <span className="text-[13px] text-[#8A8F98]">Loading queue...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              {activeFilterCount > 0 ? (
                <>
                  <Filter className="w-5 h-5 text-[#5A5D66] mb-2" />
                  <span className="text-[13px] text-[#8A8F98] mb-1">No items match your filters.</span>
                  <button
                    onClick={clearAllFilters}
                    className="text-[12px] text-[#5E6AD2] hover:text-[#7B83EB] transition-colors font-medium"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <span className="text-[14px] font-medium text-[#EEEEEE] mb-1">Your capture queue is clear.</span>
                  <span className="text-[13px] text-[#8A8F98]">All thoughts have been processed.</span>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-[2px] px-2">
              {filteredItems.map((item) => {
                const Icon = getIcon(item.type);
                const isActive = selectedId === item.id;
                const displayTitle = item.title?.trim() || `Untitled ${item.type.toLowerCase()}`;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`flex flex-col gap-1.5 p-3 rounded-md cursor-pointer transition-colors duration-75 ${isActive ? 'bg-[#26272B]' : 'hover:bg-[#26272B]/50'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#EEEEEE]' : 'text-[#8A8F98]'}`} />
                        <span className={`text-[13px] font-medium truncate ${isActive ? 'text-[#EEEEEE]' : 'text-[#A0A5B0]'}`}>
                          {displayTitle}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#5A5D66] shrink-0 mt-0.5">{formatRelativeTime(item.updatedAt)}</span>
                    </div>

                    {item.content && (
                      <p className="text-[12px] text-[#8A8F98] line-clamp-2 leading-relaxed pl-[22px]">
                        {item.content}
                      </p>
                    )}

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 pl-[22px] flex-wrap">
                        {item.tags.map(tag => (
                          <span key={tag} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#1C1D21] border border-[#27282B] text-[#8A8F98]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0E0F11]">


        {!selectedItem ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border border-[#27282B] flex items-center justify-center text-[#27282B]">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <>
            {/* Breadcrumb bar */}
            <div className="h-12 border-b border-[#27282B] flex items-center px-6 shrink-0">
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#8A8F98]">
                {listCollapsed && (
                  <button
                    onClick={toggleListPanel}
                    className="p-1.5 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors mr-1"
                    title="Expand list panel"
                  >
                    <PanelLeft className="w-4 h-4" />
                  </button>
                )}
                <span>Unsorted</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#EEEEEE]">Processing</span>
              </div>
            </div>

            {/* Detail content */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-8 py-8">

                {/* Tags + Add to Project row */}
                <div className="flex items-center justify-between gap-2 mb-8 pb-6 border-b border-[#27282B]/50 overflow-visible">
                  <div className="relative">
                    <button
                      onClick={() => setTagPopoverOpen(!tagPopoverOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-[#27282B] rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors shrink-0"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>Tags</span>
                      {selectedItem.tags && selectedItem.tags.length > 0 && (
                        <span className="ml-1 bg-[#34353A] text-[#EEEEEE] px-1.5 rounded-sm text-[10px]">
                          {selectedItem.tags.length}
                        </span>
                      )}
                    </button>

                    {tagPopoverOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setTagPopoverOpen(false)}
                        />
                        <div className="absolute top-full left-0 mt-2 w-64 bg-[#1C1D21] border border-[#27282B] rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
                          <div className="p-2 border-b border-[#27282B] flex items-center gap-2">
                            <Search className="w-3.5 h-3.5 text-[#5A5D66]" />
                            <input
                              ref={tagInputRef}
                              type="text"
                              value={tagSearch}
                              onChange={(e) => setTagSearch(e.target.value)}
                              placeholder="Search or create tag..."
                              className="w-full bg-transparent text-[13px] text-[#EEEEEE] placeholder:text-[#5A5D66] border-none focus:outline-none focus:ring-0"
                            />
                          </div>

                          <div className="max-h-64 overflow-y-auto py-1">
                            {filteredTagsList.map(tag => {
                              const isSelected = selectedItem.tags?.includes(tag) ?? false;
                              return (
                                <div
                                  key={tag}
                                  onClick={() => handleToggleTag(tag)}
                                  className="px-3 py-2 mt-1 mx-1 rounded-md text-[13px] text-[#EEEEEE] hover:bg-[#26272B] cursor-pointer flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <Tag className="w-3.5 h-3.5 text-[#8A8F98]" />
                                    <span className="truncate">{tag}</span>
                                  </div>
                                  {isSelected && <CheckCircle className="w-3.5 h-3.5 text-[#5E6AD2]" />}
                                </div>
                              );
                            })}

                            {tagSearch.trim() && !filteredTagsList.includes(tagSearch.trim().toLowerCase()) && (
                              <div
                                onClick={() => handleCreateTag(tagSearch)}
                                className="px-3 py-2 mt-1 mx-1 rounded-md text-[13px] text-[#EEEEEE] hover:bg-[#26272B] cursor-pointer flex items-center gap-2 border-t border-[#27282B]/50"
                              >
                                <span className="text-[#8A8F98]">Create</span>
                                <span className="font-semibold px-1.5 py-0.5 bg-[#26272B] rounded text-[11px] text-[#EEEEEE]">&quot;{tagSearch.trim().toLowerCase()}&quot;</span>
                              </div>
                            )}

                            {filteredTagsList.length === 0 && !tagSearch.trim() && (
                              <div className="px-3 py-4 text-center text-[12px] text-[#8A8F98]">
                                No tags found.
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setProjectPopoverOpen(!projectPopoverOpen)}
                    className="px-4 py-1.5 bg-[#EEEEEE] hover:bg-white text-[#0E0F11] text-[13px] font-medium rounded-md transition-colors flex items-center gap-2 shrink-0"
                  >
                    <FolderGit2 className="w-3.5 h-3.5" />
                    Add to Project
                  </button>
                </div>

                {/* Title & content */}
                <div className="space-y-4">
                  <input
                    type="text"
                    value={selectedItem.title || ''}
                    onChange={(e) => {
                      setItems(items.map(i => i.id === selectedId ? { ...i, title: e.target.value } : i));
                    }}
                    placeholder={`Untitled ${selectedItem.type.toLowerCase()}`}
                    className="w-full bg-transparent text-[24px] font-semibold text-[#EEEEEE] placeholder:text-[#5A5D66] border-none focus:outline-none focus:ring-0"
                  />
                  <textarea
                    value={selectedItem.content || ''}
                    onChange={(e) => {
                      setItems(items.map(i => i.id === selectedId ? { ...i, content: e.target.value } : i));
                    }}
                    placeholder="Capture your thoughts..."
                    className="w-full min-h-[300px] bg-transparent text-[15px] text-[#A0A5B0] placeholder:text-[#5A5D66] border-none focus:outline-none focus:ring-0 resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>


            {/* Centered Project Picker Modal */}
            {projectPopoverOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                  onClick={() => setProjectPopoverOpen(false)}
                />
                <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                  <div className="pointer-events-auto w-[420px] max-h-[480px] bg-[#1C1D21] border border-[#27282B] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Modal header */}
                    <div className="px-5 py-4 border-b border-[#27282B] flex items-center justify-between shrink-0">
                      <h3 className="text-[14px] font-semibold text-[#EEEEEE]">Add to Project</h3>
                      <button
                        onClick={() => setProjectPopoverOpen(false)}
                        className="p-1 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Search */}
                    <div className="px-5 py-3 border-b border-[#27282B]/50 shrink-0">
                      <div className="flex items-center gap-2.5 bg-[#0E0F11] border border-[#27282B] rounded-lg px-3 py-2">
                        <Search className="w-4 h-4 text-[#5A5D66] shrink-0" />
                        <input
                          ref={projectInputRef}
                          type="text"
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          placeholder="Search projects..."
                          className="w-full bg-transparent text-[13px] text-[#EEEEEE] placeholder:text-[#5A5D66] border-none focus:outline-none focus:ring-0"
                        />
                        {projectSearch && (
                          <button onClick={() => setProjectSearch('')} className="text-[#5A5D66] hover:text-[#EEEEEE]">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Project list */}
                    <div className="min-h-0 max-h-[340px] overflow-y-auto py-2 px-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#55565C transparent' }}>
                      {recentProjects.length > 0 && (
                        <div className="mb-3">
                          <span className="text-[10px] font-semibold text-[#5A5D66] uppercase tracking-wider px-2">Recent</span>
                          <div className="mt-1.5 space-y-[2px]">
                            {recentProjects.map(p => (
                              <div
                                key={p.id}
                                onClick={() => void handleAssignToProject(p.name, p.id)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#EEEEEE] hover:bg-[#26272B] cursor-pointer transition-colors"
                              >
                                <FolderGit2 className="w-4 h-4 text-[#8A8F98] shrink-0" />
                                <span className="truncate">{p.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {otherProjects.length > 0 && (
                        <div>
                          <span className="text-[10px] font-semibold text-[#5A5D66] uppercase tracking-wider px-2">All Projects</span>
                          <div className="mt-1.5 space-y-[2px]">
                            {otherProjects.map(p => (
                              <div
                                key={p.id}
                                onClick={() => void handleAssignToProject(p.name, p.id)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#EEEEEE] hover:bg-[#26272B] cursor-pointer transition-colors"
                              >
                                <FolderGit2 className="w-4 h-4 text-[#8A8F98] shrink-0" />
                                <span className="truncate">{p.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {filteredProjects.length === 0 && (
                        <div className="px-3 py-8 text-center">
                          <p className="text-[13px] text-[#8A8F98]">No projects found.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

    </div>
  );
}