"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  List,
  ListOrdered,
  Tag,
  FolderGit2,
  FileOutput,
  X,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { api, resolveWorkspaceId } from "../../../../lib/api";

export default function NewQuickNotePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string } | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus title on mount
  React.useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 100);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      UnderlineExtension,
      Placeholder.configure({
        placeholder: "Start writing your note...",
      }),
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap quick-note-editor focus:outline-none min-h-[400px] text-[15px] leading-relaxed text-foreground",
      },
    },
  });

  const handleSaveNote = async () => {
    if (isSaving) return;

    const plainText = editor?.getText() || "";
    const noteTitle = title.trim();

    // Must have some content
    if (!plainText.trim() && !noteTitle) {
      showToast("Write something before saving");
      return;
    }

    setIsSaving(true);
    try {
      const workspaceId = await resolveWorkspaceId();
      if (!workspaceId) return;

      await api.post(
        `/workspaces/${workspaceId}/item/quick-note`,
        {
          title: noteTitle || "Untitled Note",
          content: plainText || " ",
        }
      );

      setIsSaved(true);
      showToast("Note saved");

      // Navigate to the quick-note list after a brief delay
      setTimeout(() => {
        router.push("/dashboard/quick-note");
      }, 600);
    } catch (err) {
      console.error("Failed to save note:", err);
      showToast("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
    if (e.key === "Escape") {
      setShowTagInput(false);
      setTagInput("");
    }
  };

  // Formatting toolbar actions
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
      icon: Heading2,
      label: "Heading",
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor?.isActive("heading", { level: 2 }) ?? false,
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

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground font-sans antialiased overflow-hidden relative">
      {/* Toast */}
      {toast?.visible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-border text-foreground px-5 py-3.5 rounded-lg shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[13px] font-medium">{toast.message}</span>
        </div>
      )}

      {/* HEADER: Title + Tags + Save */}
      <div className="shrink-0">
        <div className="max-w-[720px] w-full mx-auto px-6 md:px-0 pt-10">
          <div className="flex items-start justify-between gap-4">
            {/* Title */}
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Note"
              className="flex-1 bg-transparent text-[28px] font-bold text-foreground placeholder:text-muted-foreground/20 focus:outline-none border-none leading-tight tracking-tight"
            />

            {/* Tags + Save */}
            <div className="flex items-center gap-2 shrink-0 mt-1">
              <button
                onClick={() => {
                  setShowTagInput(!showTagInput);
                  setTimeout(() => tagInputRef.current?.focus(), 50);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Tag className="w-3.5 h-3.5" />
                Tags
              </button>
              <button
                onClick={handleSaveNote}
                disabled={isSaving || isSaved}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : isSaved ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Saved
                  </>
                ) : (
                  "Save Note"
                )}
              </button>
            </div>
          </div>

          {/* Tags Display & Input */}
          {(tags.length > 0 || showTagInput) && (
            <div className="flex items-center flex-wrap gap-1.5 mt-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-muted-foreground border border-border/50"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {showTagInput && (
                <input
                  ref={tagInputRef}
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => {
                    if (tagInput.trim()) handleAddTag();
                    else setShowTagInput(false);
                  }}
                  placeholder="Add tag..."
                  className="bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none border-none w-24"
                />
              )}
            </div>
          )}

          {/* Separator below title/tags */}
          <div className="h-px bg-border/30 mt-5" />
        </div>
      </div>

      {/* EDITOR CONTENT — Notion-style centered */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-[720px] w-full mx-auto px-6 md:px-0 pt-6 pb-32">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* BOTTOM BAR: Toolbar (horizontal) | separator | Actions */}
      <div className="shrink-0 border-t border-border/30">
        <div className="flex items-center px-4 md:px-6 py-2 gap-0">
          {/* Formatting toolbar — horizontal */}
          <div className="flex items-center gap-0.5">
            {toolbarItems.map((item) => {
              const Icon = item.icon;
              const active = item.isActive();
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  title={item.label}
                  className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* Vertical separator */}
          <div className="w-px h-5 bg-border/40 mx-3" />

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast("Added to page")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <FileOutput className="w-3.5 h-3.5" />
              Add to Page
            </button>
            <button
              onClick={() => showToast("Added to project")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              Add to Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
