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
  CheckCircle,
  Loader2,
  Highlighter,
  Search,
  ChevronRight,
} from "lucide-react";
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
};

function QuickNoteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const noteId = searchParams.get("id");

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
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

        setLastSaved(new Date());
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
      <div className="h-14 flex items-center px-6 shrink-0 border-b border-[#27282B] bg-[#0E0F11]">
        <div className="flex items-center gap-2 text-[12px] text-[#5A5D66] font-medium">
          <span className="hover:text-[#8A8F98] cursor-pointer transition-colors">Quick Notes</span>
          {title && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#8A8F98] truncate max-w-[200px]">{title}</span>
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
