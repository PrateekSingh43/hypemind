"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Link as LinkIcon, Layout, Book, FolderGit2, Tag,
  CheckCircle, ChevronRight, Search, Filter, X, PanelLeftClose, PanelLeft, Video,
  ExternalLink, Info, FilePlus, FilePenLine, Copy, CopyPlus, Trash2, List
} from 'lucide-react';
import { Navigator } from '../../../lib/navigator';
import { ItemContentView } from '../../../components/dashboard/item-content-view';
import { ProjectAssignmentPopover } from '../../../components/dashboard/project-assignment-popover';
import { api, resolveWorkspaceId } from '../../../lib/api';

type InboxItem = {
  id: string;
  title: string | null;
  type: string;
  updatedAt: string;
  content?: string;
  tags?: string[];
};

type ProjectItem = {
  id: string;
  title: string;
};

const INITIAL_TAGS = ['ui', 'bug', 'backend', 'ai', 'planning'];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'note', label: 'Notes', icon: FilePenLine },
  { value: 'link', label: 'Links', icon: LinkIcon },
  { value: 'video', label: 'Videos', icon: Video },
  { value: 'doc', label: 'Docs', icon: FileText },
];

const getIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'note': return FilePenLine;
    case 'quick_note': return FilePenLine;
    case 'link': return LinkIcon;
    case 'video': return Video;
    case 'doc': return FileText;
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

// LocalStorage removed per user request.

export default function InboxPage() {
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchInboxData = async () => {
    setLoading(true);
    try {
      const workspaceId = await resolveWorkspaceId();
      if (!workspaceId) return;

      const [itemsRes, projectsRes] = await Promise.all([
        api.get<{ data: InboxItem[] }>(`/workspaces/${workspaceId}/item/inbox`),
        api.get<{ data: ProjectItem[] }>(`/workspaces/${workspaceId}/project?all=true`)
      ]);

      const fetchedItems = itemsRes.data || [];
      setItems(fetchedItems);
      setProjects(projectsRes.data || []);

      const saved = localStorage.getItem('hypemind_inbox_selected');
      if (saved && fetchedItems.some(i => i.id === saved)) {
        setSelectedId(saved);
      } else if (fetchedItems.length > 0) {
        setSelectedId(fetchedItems[0].id);
      } else {
        setSelectedId(null);
      }
    } catch (error) {
      console.error("Failed to fetch inbox data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInboxData();
  }, []);

  useEffect(() => {
    const handleWorkspaceChange = () => {
      void fetchInboxData();
    };
    window.addEventListener('hm:workspace-changed', handleWorkspaceChange);
    return () => window.removeEventListener('hm:workspace-changed', handleWorkspaceChange);
  }, []);

  useEffect(() => {
    if (selectedId) {
      localStorage.setItem('hypemind_inbox_selected', selectedId);
    }
  }, [selectedId]);

  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState(INITIAL_TAGS);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  const [toast, setToast] = useState<{ visible: boolean; message: string; projectName: string; projectId?: string } | null>(null);
  const [listCollapsed, setListCollapsed] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set());
  const [filterTags, setFilterTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [infoPopoverOpen, setInfoPopoverOpen] = useState(false);
  const [morePopoverOpen, setMorePopoverOpen] = useState(false);

  const selectedItem = items.find(i => i.id === selectedId);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const toggleListPanel = () => {
    setListCollapsed(prev => !prev);
  };

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
    if (tagPopoverOpen && tagInputRef.current) tagInputRef.current.focus();
  }, [tagPopoverOpen]);

  const handleAssignToProject = async (projectId: string, projectName: string) => {
    if (!selectedId) return;
    try {
      const workspaceId = await resolveWorkspaceId();
      if (!workspaceId) return;

      await api.patch(`/workspaces/${workspaceId}/item/${selectedId}`, {
        projectId
      });

      setProjectPopoverOpen(false);
      
      const idToProcess = selectedId;
      const currentIndex = items.findIndex(i => i.id === selectedId);
      const nextItem = items[currentIndex + 1] || items[currentIndex - 1];
      setSelectedId(nextItem ? nextItem.id : null);
      setItems(prev => prev.filter(i => i.id !== idToProcess));
      
      setToast({ visible: true, message: 'Added to', projectName, projectId });
      setTimeout(() => setToast(null), 6000);
    } catch (err) {
      console.error("Failed to assign to project:", err);
    }
  };

  const handleCreateAndAssignProject = async (title: string, desc: string, tags: string[]) => {
    if (!selectedId || !title.trim()) return;
    try {
      const workspaceId = await resolveWorkspaceId();
      if (!workspaceId) return;

      // Create project
      const res = await api.post<{ data: { id: string, title: string } }>(`/workspaces/${workspaceId}/project`, {
        title,
        description: desc,
        tags
      });
      const newProject = res.data;

      // Assign to newly created project
      await handleAssignToProject(newProject.id, newProject.title);
    } catch (err) {
      console.error("Failed to create and assign project:", err);
    }
  };

  const handleToggleTag = (tag: string) => {
    if (!selectedId) return;
    setItems(items.map(i => {
      if (i.id === selectedId) {
        const newTags = i.tags?.includes(tag) ? i.tags.filter(t => t !== tag) : [...(i.tags || []), tag];
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

  const filteredTagsList = availableTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()));
  const allItemTags = Array.from(new Set(items.flatMap(i => i.tags || [])));

  return (
    <div className="flex h-full w-full text-foreground font-sans antialiased overflow-hidden relative bg-background">
      {toast?.visible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-surface border border-border text-foreground px-5 py-3.5 rounded-lg shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-top-5 overflow-hidden">
          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[13px]">
            {toast.message} <span className="font-semibold">&quot;{toast.projectName}&quot;</span>
          </span>
          <div className="w-[1px] h-4 bg-border mx-1" />
          <button
            onClick={() => {
              if (toast.projectId) {
                router.push(Navigator.project(toast.projectId));
              }
              setToast(null);
            }}
            className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
          >
            Open Project →
          </button>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-border">
            <div className="h-full bg-primary/60 animate-[shrink_6s_linear_forwards]" />
          </div>
        </div>
      )}

      <div
        className="shrink-0 z-10 transition-[width] duration-200 ease-out overflow-hidden border-r border-border bg-surface"
        style={{ width: listCollapsed ? 0 : 340 }}
      >
        <div className="flex flex-col h-full w-[340px]">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50 shrink-0 gap-2">
          <span className="text-[14px] font-medium text-foreground truncate capitalize">
            inbox
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`p-1.5 rounded-md transition-colors relative ${filterOpen || activeFilterCount > 0
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full text-[8px] font-bold text-primary-foreground flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={toggleListPanel}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="border-b border-border/50 bg-background shrink-0 flex flex-col relative z-20">
            <div className="px-3 pt-3 pb-2 z-30 bg-background">
              <div className="flex items-center gap-2 bg-surface border border-border rounded-md px-2.5 py-1.5 shadow-sm">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground border-none focus:outline-none focus:ring-0"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filterOpen && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-200 z-10 bg-background">
                <div className="px-3 pb-2">
                  <span className="text-[12px] font-medium text-muted-foreground">Type</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <button
                      onClick={() => setFilterTypes(new Set())}
                      className={`px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${filterTypes.size === 0
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-surface border border-border text-foreground hover:bg-muted'
                        }`}
                    >
                      All Types
                    </button>
                    {TYPE_OPTIONS.filter(opt => opt.value !== 'all').map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => toggleFilterType(opt.value)}
                        className={`px-2.5 py-1 rounded text-[12px] font-medium transition-colors flex items-center gap-1.5 ${filterTypes.has(opt.value)
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'bg-surface border border-border text-foreground hover:bg-muted'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-3 pb-3">
                  <span className="text-[12px] font-medium text-muted-foreground">Tag</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <button
                      onClick={() => setFilterTags(new Set())}
                      className={`px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${filterTags.size === 0
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-surface border border-border text-foreground hover:bg-muted'
                        }`}
                    >
                      All
                    </button>
                    {INITIAL_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleFilterTag(tag)}
                        className={`px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${filterTags.has(tag)
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'bg-surface border border-border text-foreground hover:bg-muted'
                          }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <div className="px-3 pb-2.5">
                    <button
                      onClick={clearAllFilters}
                      className="text-[11px] text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center opacity-50">
              <span className="text-[13px] text-muted-foreground">Loading queue...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              {activeFilterCount > 0 ? (
                <>
                  <Filter className="w-5 h-5 text-muted-foreground mb-2" />
                  <span className="text-[13px] text-muted-foreground mb-1">No items match your filters.</span>
                  <button
                    onClick={clearAllFilters}
                    className="text-[12px] text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <span className="text-[14px] font-medium text-foreground mb-1">Your inbox is clear.</span>
                  <span className="text-[13px] text-muted-foreground">All items have been processed.</span>
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
                    className={`flex flex-col gap-1.5 p-2.5 rounded-md cursor-pointer transition-colors duration-75 ${isActive ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
                        <span className={`text-[13px] font-medium truncate ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {displayTitle}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">{formatRelativeTime(item.updatedAt)}</span>
                    </div>
                    {item.content && (
                      <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed pl-[22px]">
                        {item.content}
                      </p>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 pl-[22px] flex-wrap">
                        {item.tags.map(tag => (
                          <span key={tag} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface border border-border text-muted-foreground">
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
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="h-12 border-b border-border flex items-center px-6 shrink-0">
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            {listCollapsed && (
              <button
                onClick={toggleListPanel}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-1"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
            <span>Inbox</span>
            {selectedItem && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground">Processing</span>
              </>
            )}
          </div>
        </div>

        {!selectedItem ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-muted-foreground">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <>
            <ItemContentView
              title={selectedItem.title || ''}
              content={selectedItem.content || ''}
              onUpdateTitle={(val: string) => setItems(items.map(i => i.id === selectedId ? { ...i, title: val } : i))}
              onUpdateContent={(val: string) => setItems(items.map(i => i.id === selectedId ? { ...i, content: val } : i))}
              tagsCount={selectedItem.tags?.length || 0}
              onTagsClick={() => setTagPopoverOpen(!tagPopoverOpen)}
              tagsPopover={tagPopoverOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setTagPopoverOpen(false)} />
                  <div className="absolute top-full left-0 mt-2 w-64 bg-surface border border-border rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col text-foreground">
                    <div className="p-2 border-b border-border flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        ref={tagInputRef}
                        type="text"
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        placeholder="Search or create tag..."
                        className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground border-none focus:outline-none focus:ring-0"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {filteredTagsList.map(tag => {
                        const isSelected = selectedItem.tags?.includes(tag) ?? false;
                        return (
                          <div
                            key={tag}
                            onClick={() => handleToggleTag(tag)}
                            className="px-3 py-2 mt-1 mx-1 rounded-md text-[13px] hover:bg-muted cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="truncate">{tag}</span>
                            </div>
                            {isSelected && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                          </div>
                        );
                      })}
                      {tagSearch.trim() && !filteredTagsList.includes(tagSearch.trim().toLowerCase()) && (
                        <div
                          onClick={() => handleCreateTag(tagSearch)}
                          className="px-3 py-2 mt-1 mx-1 rounded-md text-[13px] hover:bg-muted cursor-pointer flex items-center gap-2 border-t border-border/50"
                        >
                          <span className="text-muted-foreground">Create</span>
                          <span className="font-semibold px-1.5 py-0.5 bg-muted rounded text-[11px]">&quot;{tagSearch.trim().toLowerCase()}&quot;</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              onMoreClick={() => setMorePopoverOpen(!morePopoverOpen)}
              morePopover={
                <>
                  {morePopoverOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMorePopoverOpen(false)} />
                      <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col p-1 text-left text-[13px]">
                        <div 
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground transition-colors rounded-[6px]"
                          onClick={() => {
                            setMorePopoverOpen(false);
                            setInfoPopoverOpen(true);
                          }}
                        >
                          <List className="w-4 h-4" />
                          Details
                        </div>
                        <div 
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground transition-colors rounded-[6px]"
                          onClick={() => {
                            setMorePopoverOpen(false);
                            navigator.clipboard.writeText(`${window.location.origin}/dashboard/inbox?id=${selectedId}`);
                          }}
                        >
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </div>
                        <div 
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground transition-colors rounded-[6px]"
                          onClick={async () => {
                            setMorePopoverOpen(false);
                            try {
                              const workspaceId = await resolveWorkspaceId();
                              if (!workspaceId) return;
                              const res = await api.post<{ data: InboxItem }>(`/workspaces/${workspaceId}/item/${selectedId}/duplicate`);
                              setItems([res.data, ...items]);
                              setSelectedId(res.data.id);
                            } catch (err) {
                              console.error("Failed to duplicate item", err);
                            }
                          }}
                        >
                          <CopyPlus className="w-4 h-4" />
                          Duplicate
                        </div>
                        <div className="h-[1px] bg-border my-1" />
                        <div 
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-red-500/10 text-red-500/80 hover:text-red-500 transition-colors rounded-[6px]"
                          onClick={async () => {
                            setMorePopoverOpen(false);
                            try {
                              const workspaceId = await resolveWorkspaceId();
                              if (!workspaceId) return;
                              await api.patch(`/workspaces/${workspaceId}/item/${selectedId}`, { deletedAt: new Date().toISOString() });
                              setItems(items.filter(i => i.id !== selectedId));
                              setSelectedId(null);
                            } catch (err) {
                              console.error("Failed to move to trash", err);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Move to Trash
                        </div>
                      </div>
                    </>
                  )}
                  {infoPopoverOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setInfoPopoverOpen(false)} />
                      <div className="absolute top-full left-0 mt-2 w-64 bg-surface border border-border rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col p-4 space-y-4 text-left">
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Source</span>
                          <p className="text-[13px] text-foreground mt-1 truncate">https://example.com/source</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Author</span>
                          <p className="text-[13px] text-foreground mt-1">Jane Doe</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Type</span>
                          <p className="text-[13px] text-foreground mt-1 capitalize">{selectedItem.type}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Saved</span>
                          <p className="text-[13px] text-foreground mt-1">{new Date(selectedItem.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </>
                  )}
                </>
              }
              bottomStatusText={selectedItem.updatedAt ? `Saved to Inbox` : ''}
              placeholderTitle={`Untitled ${selectedItem.type.toLowerCase()}`}
              placeholderContent="Capture your thoughts..."
              bottomActions={
                <div className="flex gap-3">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-[#27282B] rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>Add to Page</span>
                  </button>
                  <button
                    onClick={() => setProjectPopoverOpen(!projectPopoverOpen)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#EEEEEE] text-[#0E0F11] text-[12px] font-semibold hover:bg-white transition-colors shadow-sm"
                  >
                    <FolderGit2 className="w-3.5 h-3.5" />
                    <span>Add to Project</span>
                  </button>
                </div>
              }
            />

            <ProjectAssignmentPopover
              isOpen={projectPopoverOpen}
              onClose={() => setProjectPopoverOpen(false)}
              projects={projects}
              onAssign={handleAssignToProject}
              onCreateAndAssign={handleCreateAndAssignProject}
            />
          </>
        )}
      </div>
    </div>
  );
}