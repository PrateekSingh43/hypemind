"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import HighlightExtension from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { api, resolveWorkspaceId } from "../../../lib/api";

const INITIAL_TAGS = ["ui", "bug", "backend", "ai", "planning"];
const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

type QuickNoteRecord = {
  id: string;
  title?: string | null;
  contentString?: string | null;
  contentJson?: unknown;
  tags?: string[];
};

const isTiptapDoc = (value: unknown): value is JSONContent => {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "doc"
  );
};

const textToDocument = (text?: string | null): JSONContent => {
  const lines = text ? text.split("\n") : [""];

  return {
    type: "doc",
    content: lines.map((line) =>
      line
        ? { type: "paragraph", content: [{ type: "text", text: line }] }
        : { type: "paragraph" },
    ),
  };
};

function QuickNoteContent() {
  const searchParams = useSearchParams();
  const noteId = searchParams.get("id");

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState(INITIAL_TAGS);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      UnderlineExtension,
      HighlightExtension,
      Placeholder.configure({
        placeholder: "Start writing your note...",
      }),
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap quick-note-editor focus:outline-none min-h-[120px] text-[15px] leading-relaxed text-foreground",
      },
    },
    onUpdate: ({ editor }) => {
      debouncedSave(editor.getJSON(), editor.getText());
    },
  });

  // Load existing note
  useEffect(() => {
    if (!noteId) {
      initialLoadDone.current = false;
      setNotFound(false);
      setLoading(false);
      editor?.commands.setContent(EMPTY_DOC, { emitUpdate: false });
      return;
    }

    if (!editor) return;

    const loadNote = async () => {
      initialLoadDone.current = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setLoading(true);
      setNotFound(false);
      setTagPopoverOpen(false);
      setTagSearch("");
      try {
        const workspaceId = await resolveWorkspaceId();
        if (!workspaceId) return;

        const res = await api.get<{ data: QuickNoteRecord[] }>(
          `/workspaces/${workspaceId}/item/quick-note`,
        );

        const note = res.data.find((n) => n.id === noteId);
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
        setAvailableTags((prev) => Array.from(new Set([...prev, ...noteTags])));
        currentContentRef.current = {
          content: note.contentString || "",
          contentJson: documentContent,
        };
        editor.commands.setContent(documentContent, { emitUpdate: false });
        initialLoadDone.current = true;
      } catch (err) {
        console.error("Failed to load note:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadNote();
  }, [noteId, editor]);

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

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleTag = (tag: string) => {
    setTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleCreateTag = (newTagRaw: string) => {
    const newTag = newTagRaw.trim().toLowerCase();
    if (!newTag) return;

    if (!availableTags.includes(newTag)) {
      setAvailableTags([...availableTags, newTag]);
    }
    setTags((prev) => {
      if (!prev.includes(newTag)) {
        return [...prev, newTag];
      }
      return prev;
    });
    setTagSearch("");
  };

  useEffect(() => {
    if (tagPopoverOpen && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [tagPopoverOpen]);

  const filteredTagsList = availableTags.filter((tag) =>
    tag.toLowerCase().includes(tagSearch.toLowerCase()),
  );

  const toolbarItems = [
    {
      icon: Bold,
      label: "Bold",
      action: () => editor?.chain().focus().toggleBold().run(),
      isActive: () => editor?.isActive("bold") ?? false,
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => editor?.chain().focus().toggleItalic().run(),
      isActive: () => editor?.isActive("italic") ?? false,
    },
    {
      icon: UnderlineIcon,
      label: "Underline",
      action: () => editor?.chain().focus().toggleUnderline().run(),
      isActive: () => editor?.isActive("underline") ?? false,
    },
    {
      icon: Highlighter,
      label: "Highlight",
      action: () => editor?.chain().focus().toggleHighlight().run(),
      isActive: () => editor?.isActive("highlight") ?? false,
    },
    {
      icon: List,
      label: "Bullet list",
      action: () => editor?.chain().focus().toggleBulletList().run(),
      isActive: () => editor?.isActive("bulletList") ?? false,
    },
    {
      icon: ListOrdered,
      label: "Numbered list",
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      isActive: () => editor?.isActive("orderedList") ?? false,
    },
  ];

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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-border text-foreground px-5 py-3.5 rounded-lg shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[13px] font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col flex-1 min-h-0 max-w-[720px] w-full mx-auto px-6 md:px-0 pt-10 pb-8">
        {/* TOP ROW: TITLE + TAGS */}
        <div className="flex items-start justify-between gap-6 mb-6 shrink-0 relative">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Note"
            className="flex-1 bg-transparent text-[30px] font-semibold text-foreground placeholder:text-muted-foreground/25 focus:outline-none border-none leading-tight min-w-0"
          />

          <div className="flex items-center gap-3 shrink-0 mt-1.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => setTagPopoverOpen(!tagPopoverOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Tags</span>
                <span className="ml-0.5 bg-muted text-foreground px-1.5 py-0.5 rounded-sm text-[10px] leading-none font-semibold">
                  {tags.length}
                </span>
              </button>
              {tagPopoverOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setTagPopoverOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
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
                    <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
                      {filteredTagsList.map((tag) => {
                        const isSelected = tags.includes(tag);
                        return (
                          <div
                            key={tag}
                            onClick={() => handleToggleTag(tag)}
                            className="px-3 py-2 mt-1 mx-1 rounded-md text-[13px] text-foreground hover:bg-muted cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="truncate">{tag}</span>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-3.5 h-3.5 text-primary" />
                            )}
                          </div>
                        );
                      })}
                      {tagSearch.trim() &&
                        !availableTags.includes(
                          tagSearch.trim().toLowerCase(),
                        ) && (
                          <div
                            onClick={() => handleCreateTag(tagSearch)}
                            className="px-3 py-2 mt-1 mx-1 rounded-md text-[13px] text-foreground hover:bg-muted cursor-pointer flex items-center gap-2 border-t border-border/50"
                          >
                            <span className="text-muted-foreground">
                              Create
                            </span>
                            <span className="font-semibold px-1.5 py-0.5 bg-muted rounded text-[11px] text-foreground">
                              &quot;{tagSearch.trim().toLowerCase()}&quot;
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Auto-save indicator */}
            {isSaving ? (
              <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1.5 absolute right-0 top-[-24px]">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="text-[11px] text-muted-foreground/40 absolute right-0 top-[-24px]">
                Auto-saved
              </span>
            ) : null}
          </div>
        </div>

        {/* TOP DIVIDER */}
        <div className="h-px bg-border/60 w-full mb-6 shrink-0" />

        {/* EDITOR AREA */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col mb-4">
          <EditorContent editor={editor} className="flex-1 cursor-text" />
        </div>

        {/* FORMATTING TOOLBAR */}
        <div className="shrink-0 mb-6">
          <div className="inline-flex items-center gap-0.5 px-2 py-1.5 border border-border rounded-md bg-surface">
            {toolbarItems.map((item) => {
              const Icon = item.icon;
              const active = item.isActive();
              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={item.action}
                  title={item.label}
                  className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-75 ${
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* BOTTOM DIVIDER */}
        <div className="h-px bg-border/60 w-full mb-6 shrink-0" />

        {/* BOTTOM ACTION BUTTONS */}
        <div className="shrink-0 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => showToast("Added to page")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <FileOutput className="w-3.5 h-3.5" />
            Add to Page
          </button>
          <button
            type="button"
            onClick={() => showToast("Added to project")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            Add to Project
          </button>
        </div>
      </div>
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
