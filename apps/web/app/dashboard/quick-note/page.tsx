"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText, PanelLeftClose, PanelLeft, Plus, ChevronRight, FolderGit2, FileOutput, CheckCircle,
  Share2, Link2, MoreVertical
} from 'lucide-react';
import { api, getWorkspaceId, resolveWorkspaceId } from '../../../lib/api';

type QuickNote = {
  id: string;
  title: string;
  contentString: string;
  updatedAt: string;
};

const MAX_CHARS = 2500;

function formatShortDate(dateISO: string) {
  const date = new Date(dateISO);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

export default function QuickNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("id"));
  const [listCollapsed, setListCollapsed] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync selectedId with URL params
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setSelectedId(id);
    }
  }, [searchParams]);

  const selectedNote = notes.find(n => n.id === selectedId);

  // Fetch Notes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const workspaceId = await resolveWorkspaceId();
        if (!workspaceId) return;
        const res = await api.get<{ data: any[] }>(`/workspaces/${workspaceId}/item/quick-note`);
        setNotes(res.data.map(n => ({
          id: n.id,
          title: n.title || "",
          contentString: n.contentString || "",
          updatedAt: n.updatedAt
        })));
      } catch (err) {
        console.error("Failed to fetch notes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  const toggleListPanel = () => {
    setListCollapsed(prev => !prev);
  };

  const handleCreateNote = async () => {
    try {
      const workspaceId = await resolveWorkspaceId();
      if (!workspaceId) return;

      const res = await api.post<{ data: any }>(`/workspaces/${workspaceId}/item/quick-note`, {
        title: "",
        content: ""
      });

      const newNote: QuickNote = {
        id: res.data.id,
        title: res.data.title || "",
        contentString: res.data.contentString || "",
        updatedAt: res.data.updatedAt
      };

      setNotes(prev => [newNote, ...prev]);
      setSelectedId(newNote.id);
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  };

  const handleUpdateNote = async (updates: Partial<QuickNote>) => {
    if (!selectedId) return;

    // Optimistic Update
    setNotes(prev => prev.map(n => n.id === selectedId ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));

    // Block saving if limit exceeded
    const currentContent = updates.contentString ?? selectedNote?.contentString ?? "";
    if (currentContent.length > MAX_CHARS) {
      console.warn("Auto-save blocked: Note too long");
      return;
    }

    try {
      const workspaceId = await resolveWorkspaceId();
      if (!workspaceId) return;

      await api.patch(`/workspaces/${workspaceId}/item/quick-note/${selectedId}`, {
        title: updates.title,
        content: updates.contentString
      });
    } catch (err) {
      console.error("Failed to update note:", err);
    }
  };

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToProject = () => {
    if (!selectedId) return;
    // Logic to move to project would go here
    showToast("Added to project");
  };

  const handleConvertToPage = () => {
    if (!selectedId) return;
    // Logic to convert to full page would go here
    showToast("Converted to page");
  };

  // Shortcut handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl instanceof HTMLInputElement || 
                      activeEl instanceof HTMLTextAreaElement || 
                      (activeEl as HTMLElement).isContentEditable;
      
      if (isInput) return;

      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleCreateNote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-full w-full text-foreground font-sans antialiased overflow-hidden relative bg-background">
      {toast?.visible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-border text-foreground px-5 py-3.5 rounded-lg shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 overflow-hidden">
          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[13px] font-medium">{toast.message}</span>
        </div>
      )}

      {/* LEFT LIST PANEL */}
      <div
        className="shrink-0 z-10 transition-[width] duration-200 ease-out overflow-hidden border-r border-border bg-surface"
        style={{ width: listCollapsed ? 0 : 340 }}
      >
        <div className="flex flex-col h-full w-[340px]">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50 shrink-0 gap-2">
            <span className="text-[13px] font-semibold text-foreground truncate">
              Quick Notes
              <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">{notes.length}</span>
            </span>
            <div className="flex items-center gap-1">
              <div className="relative group/tooltip flex items-center">
                <button
                  onClick={handleCreateNote}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="New Quick Note"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <div className="absolute top-full right-0 mt-1.5 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity duration-200 z-50 flex items-center gap-2 whitespace-nowrap bg-foreground text-background px-2.5 py-1.5 rounded-md shadow-lg border border-border/10">
                  <span className="text-[12px] font-medium">New Quick Note</span>
                  <kbd className="text-[10px] font-sans bg-background/20 text-background px-1.5 py-0.5 rounded border border-background/20">N</kbd>
                </div>
              </div>
              <button
                onClick={toggleListPanel}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Collapse Panel"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <span className="text-[14px] font-medium text-foreground mb-1">No quick notes.</span>
                <span className="text-[13px] text-muted-foreground mb-4">Capture a thought instantly.</span>
                <button
                  onClick={handleCreateNote}
                  className="px-4 py-1.5 bg-primary text-primary-foreground text-[12px] font-medium rounded-md hover:bg-primary/90 transition-colors"
                >
                  New Note
                </button>
              </div>
            ) : (
              <div className="space-y-[2px] px-2">
                {notes.map((note) => {
                  const isActive = selectedId === note.id;
                  const displayTitle = note.title?.trim() || "Untitled Note";

                  return (
                    <div
                      key={note.id}
                      onClick={() => setSelectedId(note.id)}
                      className={`flex flex-col gap-1 p-2.5 rounded-md cursor-pointer transition-colors duration-75 ${
                        isActive ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
                          <span className={`text-[13px] font-medium truncate ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {displayTitle}
                          </span>
                        </div>
                      </div>
                      <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed pl-[22px]">
                        {note.contentString || <span className="italic opacity-50">Empty note...</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT CONTENT PANEL */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative overflow-y-auto overflow-x-hidden scrollbar-nano">
        <div className="h-12 border-b border-border flex items-center justify-between px-6 shrink-0 sticky top-0 bg-background/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            {listCollapsed && (
              <button
                onClick={toggleListPanel}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-1"
                title="Expand Panel"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
            <span>Quick Notes</span>
            {selectedNote && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground truncate max-w-[200px]">
                  {selectedNote.title || "Untitled"}
                </span>
              </>
            )}
          </div>

          {selectedNote && (
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-muted-foreground/60 font-medium hidden sm:inline-block">
                Edited {formatShortDate(selectedNote.updatedAt)}
              </span>
              
              <div className="flex items-center gap-1">
                <button className="flex items-center gap-1.5 px-2.5 py-1.25 rounded-md hover:bg-muted text-[12px] font-medium text-muted-foreground hover:text-foreground transition-all">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
                <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Copy Link">
                  <Link2 className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {!selectedNote ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border border-border bg-surface flex items-center justify-center text-muted-foreground mb-4 shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                Select a note or press <kbd className="text-[11px] font-sans bg-muted text-foreground px-1.5 py-0.5 rounded border border-border shadow-sm">N</kbd> to create a new one.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-8 md:px-12 py-10 overflow-y-auto scrollbar-hide">
            <div className="relative flex-1 flex flex-col min-h-0">
              {/* Subtle Character Count (Top Right) */}
              <div className={`absolute -top-10 right-0 text-[10px] font-medium tracking-tight transition-colors duration-200 ${selectedNote.contentString.length >= MAX_CHARS ? "text-red-500" : "text-muted-foreground/30"}`}>
                {selectedNote.contentString.length} / {MAX_CHARS}
              </div>

              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => handleUpdateNote({ title: e.target.value })}
                placeholder="Note Title"
                className="w-full bg-transparent text-[24px] font-semibold text-foreground placeholder:text-muted-foreground/20 focus:outline-none border-none mb-6"
              />
              
              <textarea
                value={selectedNote.contentString}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length <= MAX_CHARS) {
                    handleUpdateNote({ contentString: val });
                  }
                }}
                placeholder="Start typing..."
                className="flex-1 w-full bg-transparent text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none border-none resize-none pb-20"
                autoFocus
              />
            </div>

            <div className="mt-auto pt-6 border-t border-border/30 flex items-center gap-3 shrink-0">
              <button
                onClick={handleAddToProject}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border/50 rounded-md text-[12px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-muted-foreground" />
                Add to Project
              </button>
              <button
                onClick={handleConvertToPage}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border/50 rounded-md text-[12px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <FileOutput className="w-3.5 h-3.5 text-muted-foreground" />
                Convert to Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
