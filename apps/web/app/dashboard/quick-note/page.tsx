"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Tag,
  FolderGit2,
  FileOutput,
  FileText,
  FilePenLine,
  CheckCircle,
  Loader2,
  Highlighter,
  Search,
  ChevronRight,
  Pin,
  Copy,
  CopyPlus,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { formatTimeAgo } from "../../../lib/format-time";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import HighlightExtension from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { api, resolveWorkspaceId } from "../../../lib/api";
import { Navigator } from "../../../lib/navigator";
import { QuickNoteEditor, EMPTY_DOC, textToDocument, isTiptapDoc } from "../../../components/dashboard/quick-note-editor";
import { ProjectAssignmentPopover, type ProjectItem } from "../../../components/dashboard/project-assignment-popover";

type QuickNoteRecord = {
  id: string;
  title?: string | null;
  contentString?: string | null;
  contentJson?: unknown;
  tags?: string[];
  updatedAt?: string;
  isPinned?: boolean;
};

function QuickNoteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const noteId = searchParams.get("id");

  const [title, setTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; projectName?: string; projectId?: string; } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef = useRef<string | null>(noteId);
  const initialLoadDone = useRef(false);
  const latestTitleRef = useRef(title);
  const latestTagsRef = useRef(tags);
  const currentContentRef = useRef<{
    content?: string;
    contentJson?: JSONContent;
  }>({
    content: "",
    contentJson: EMPTY_DOC,
  });

  latestTitleRef.current = title;
  latestTagsRef.current = tags;

  useEffect(() => {
    noteIdRef.current = noteId;
  }, [noteId]);

  // Load existing note
  useEffect(() => {
    if (!noteId) {
      initialLoadDone.current = false;
      setNotFound(false);
      setLoading(false);
      currentContentRef.current = { content: "", contentJson: EMPTY_DOC };
      return;
    }

    const loadNote = async () => {
      initialLoadDone.current = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setLoading(true);
      setNotFound(false);
      try {
        const workspaceId = await resolveWorkspaceId();
        if (!workspaceId) return;

        const [notesRes, projectsRes] = await Promise.all([
          api.get<{ data: QuickNoteRecord[] }>(`/workspaces/${workspaceId}/item/quick-note`),
          api.get<{ data: ProjectItem[] }>(`/workspaces/${workspaceId}/project?all=true`)
        ]);

        setProjects(projectsRes.data || []);

        const note = notesRes.data.find((n) => n.id === noteId);
        if (!note) {
          setNotFound(true);
          return;
        }

        const noteTags = note.tags || [];
        const documentContent = isTiptapDoc(note.contentJson)
          ? note.contentJson
          : textToDocument(note.contentString);

        setTitle(note.title || "");
        setTags(noteTags);
        setUpdatedAt(note.updatedAt || null);
        setIsPinned(!!note.isPinned);
        currentContentRef.current = {
          content: note.contentString || "",
          contentJson: documentContent,
        };
        initialLoadDone.current = true;
      } catch (err) {
        console.error("Failed to load note:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadNote();
  }, [noteId]);

  const saveNote = useCallback(
    async (
      changes: {
        content?: string;
        contentJson?: JSONContent;
        title?: string;
        tags?: string[];
      } = {},
    ) => {
      const currentNoteId = noteIdRef.current;
      if (!currentNoteId) return;

      setIsSaving(true);
      try {
        const workspaceId = await resolveWorkspaceId();
        if (!workspaceId) return;

        const payload: {
          title: string;
          tags: string[];
          content?: string;
          contentJson?: JSONContent;
        } = {
          title: changes.title ?? latestTitleRef.current,
          tags: changes.tags ?? latestTagsRef.current,
        };

        if (changes.content !== undefined) {
          payload.content = changes.content;
          currentContentRef.current.content = changes.content;
        }
        if (changes.contentJson !== undefined) {
          payload.contentJson = changes.contentJson;
          currentContentRef.current.contentJson = changes.contentJson;
        }

        await api.patch(
          `/workspaces/${workspaceId}/item/quick-note/${currentNoteId}`,
          payload,
        );

        const newDate = new Date();
        setLastSaved(newDate);
        setUpdatedAt(newDate.toISOString());
        window.dispatchEvent(
          new CustomEvent("hm:quick-note-updated", {
            detail: {
              id: currentNoteId,
              title: payload.title,
              contentString:
                payload.content ?? currentContentRef.current.content,
              tags: payload.tags,
              updatedAt: new Date().toISOString(),
            },
          }),
        );
      } catch (err) {
        console.error("Failed to save note:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const debouncedSave = useCallback(
    (contentJson: JSONContent, text: string) => {
      if (!initialLoadDone.current) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        void saveNote({ content: text, contentJson });
      }, 800);
    },
    [saveNote],
  );

  // Save title on change (debounced)
  useEffect(() => {
    if (!noteId || !initialLoadDone.current) return;
    const timeout = setTimeout(() => {
      void saveNote();
    }, 800);
    return () => clearTimeout(timeout);
  }, [noteId, saveNote, title]);

  useEffect(() => {
    if (!noteId || !initialLoadDone.current) return;
    const timeout = setTimeout(() => {
      void saveNote();
    }, 250);
    return () => clearTimeout(timeout);
  }, [noteId, saveNote, tags]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const showToast = (message: string, projectName?: string, projectId?: string) => {
    setToast({ visible: true, message, projectName, projectId });
    setTimeout(() => setToast(null), 6000);
  };

  const handleAssignToProject = async (projectId: string, projectName: string) => {
    if (!noteId) return;
    try {
      const workspaceId = await resolveWorkspaceId();
      if (!workspaceId) return;

      await api.patch(`/workspaces/${workspaceId}/item/${noteId}`, {
        projectId
      });

      setProjectPopoverOpen(false);
      showToast(`Added to`, projectName, projectId);
    } catch (err) {
      console.error("Failed to assign to project:", err);
    }
  };

  const handleCreateAndAssignProject = async (title: string, desc: string, tags: string[]) => {
    if (!noteId || !title.trim()) return;
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

  // No note ID - show empty state
  if (!noteId) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border border-border bg-surface flex items-center justify-center text-muted-foreground mb-4 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-[13px] text-muted-foreground flex items-center gap-1.5">
            Select a note from the sidebar or press{" "}
            <kbd className="text-[11px] font-sans bg-muted text-foreground px-1.5 py-0.5 rounded border border-border shadow-sm">
              N
            </kbd>{" "}
            to create a new one.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-[13px] text-muted-foreground">
            Loading note...
          </span>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border border-border bg-surface flex items-center justify-center text-muted-foreground mb-4 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-[14px] font-medium text-foreground mb-1">
            Note not found
          </p>
          <p className="text-[13px] text-muted-foreground">
            This note may have been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground font-sans antialiased overflow-hidden relative">
      {/* Toast */}
      {toast?.visible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-surface border border-border text-foreground px-5 py-3.5 rounded-lg shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-top-5 overflow-hidden">
          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[13px]">
            {toast.message} {toast.projectName && <span className="font-semibold">&quot;{toast.projectName}&quot;</span>}
          </span>
          {toast.projectId && (
            <>
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
            </>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-border">
            <div className="h-full bg-primary/60 animate-[shrink_6s_linear_forwards]" />
          </div>
        </div>
      )}

      {/* Top Breadcrumb Bar */}
      <div className="h-14 flex items-center justify-between px-6 shrink-0 border-b border-[#27282B] bg-[#0E0F11]">
        <div className="flex items-center gap-2 text-[12px] text-[#5A5D66] font-medium min-w-0">
          <span className="hover:text-[#8A8F98] cursor-pointer transition-colors shrink-0">Quick Notes</span>
          {title && (
            <>
              <ChevronRight className="w-3 h-3 shrink-0" />
              <span className="text-[#8A8F98] truncate max-w-[200px]">{title}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-4 relative">
          <span className="text-[12px] text-[#5A5D66] mr-2">Edited {formatTimeAgo(updatedAt)}</span>
          
          <button 
            onClick={async () => {
              if (!noteId) return;
              try {
                const workspaceId = await resolveWorkspaceId();
                if (!workspaceId) return;
                await api.patch(`/workspaces/${workspaceId}/item/${noteId}`, { isPinned: !isPinned });
                setIsPinned(!isPinned);
                window.dispatchEvent(new Event('hm:pinned-items-updated'));
              } catch (e) {
                console.error("Failed to pin quick note", e);
              }
            }}
            className="p-1.5 rounded-md text-[#8A8F98] hover:text-[#EEEEEE] hover:bg-[#26272B] transition-colors"
            title={isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
          >
            <Pin className={`w-4 h-4 ${isPinned ? "fill-current text-[#EEEEEE]" : ""}`} />
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
                onClick={() => showToast("Added to page")}
              >
                <FileText className="w-4 h-4" />
                Add to pages
              </DropdownMenuItem>
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
                  navigator.clipboard.writeText(window.location.href);
                  showToast("Link copied to clipboard");
                }}
              >
                <Copy className="w-4 h-4" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#8A8F98] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
                onClick={async () => {
                  if (!noteId) return;
                  try {
                    const workspaceId = await resolveWorkspaceId();
                    if (!workspaceId) return;
                    await api.post(`/workspaces/${workspaceId}/item/quick-note/${noteId}/duplicate`);
                    showToast("Note duplicated");
                    window.dispatchEvent(new Event('hm:quick-notes-updated'));
                  } catch (err) {
                    console.error("Failed to duplicate quick note", err);
                  }
                }}
              >
                <CopyPlus className="w-4 h-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer py-2 px-3 text-[13px] font-medium text-[#8A8F98] focus:text-[#EEEEEE] focus:bg-[#26272B] rounded-[6px] flex items-center gap-2"
                onClick={() => {
                  setRenameValue(title);
                  setIsRenaming(true);
                }}
              >
                <FileOutput className="w-4 h-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#27282B] my-1.5" />
              <DropdownMenuItem
                className="cursor-pointer py-2 px-3 text-[13px] font-medium text-red-500/80 focus:text-red-500 focus:bg-red-500/10 rounded-[6px] flex items-center gap-2"
                onClick={async () => {
                  if (!noteId) return;
                  try {
                    const workspaceId = await resolveWorkspaceId();
                    if (!workspaceId) return;
                    await api.patch(`/workspaces/${workspaceId}/item/quick-note/${noteId}`, { deletedAt: new Date().toISOString() });
                    router.push('/dashboard');
                    window.dispatchEvent(new Event('hm:quick-notes-updated'));
                  } catch (err) {
                    console.error("Failed to move to trash", err);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
                Move to trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isRenaming && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={(e) => {
                  e.stopPropagation();
                  setTitle(renameValue);
                  setIsRenaming(false);
                  void saveNote({ title: renameValue });
                }} 
              />
              <div className="absolute top-[38px] right-0 z-50 bg-[#151618] border border-[#27282B] rounded-[6px] shadow-2xl p-1 flex items-center gap-1.5 w-[360px]">
                <div className="flex items-center justify-center w-7 h-7 rounded-[4px] border border-[#27282B] bg-[#0E0F11] shrink-0 text-[#8A8F98]">
                  <FilePenLine className="w-4 h-4" />
                </div>
                <input
                  autoFocus
                  className="flex-1 bg-[#0E0F11] text-[13px] font-medium text-[#EEEEEE] px-2.5 py-1.5 border border-[#27282B] rounded-[4px] outline-none focus:border-[#8A8F98] transition-colors min-w-0 relative z-50"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setTitle(renameValue);
                      setIsRenaming(false);
                      void saveNote({ title: renameValue });
                    } else if (e.key === 'Escape') {
                      setIsRenaming(false);
                    }
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0 max-w-[720px] w-full mx-auto px-6 md:px-0">
        <QuickNoteEditor
          title={title}
          tags={tags}
          initialContentString={currentContentRef.current.content}
          initialContentJson={currentContentRef.current.contentJson}
          onUpdateTitle={setTitle}
          onUpdateTags={setTags}
          onUpdateContent={(contentString, contentJson) => {
            debouncedSave(contentJson, contentString);
          }}
          isSaving={isSaving}
          lastSaved={lastSaved}
          onAddPage={() => showToast("Added to page")}
          onAddProject={() => setProjectPopoverOpen(true)}
        />
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

export default function QuickNotePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full bg-background">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <QuickNoteContent />
    </Suspense>
  );
}
