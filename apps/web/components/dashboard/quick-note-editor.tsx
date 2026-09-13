import React, { useState, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Tag,
  FolderGit2,
  FileOutput,
  CheckCircle,
  Loader2,
  Highlighter,
  Search,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import HighlightExtension from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";

const INITIAL_TAGS = ["ui", "bug", "backend", "ai", "planning"];

export const isTiptapDoc = (value: unknown): value is JSONContent => {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "doc"
  );
};

export const textToDocument = (text?: string | null): JSONContent => {
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

export const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export type QuickNoteEditorProps = {
  title: string;
  tags: string[];
  initialContentString?: string | null;
  initialContentJson?: unknown;
  onUpdateTitle: (title: string) => void;
  onUpdateTags: (tags: string[]) => void;
  onUpdateContent: (contentString: string, contentJson: JSONContent) => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
  onAddPage?: () => void;
  onAddProject?: () => void;
};

export function QuickNoteEditor({
  title,
  tags,
  initialContentString,
  initialContentJson,
  onUpdateTitle,
  onUpdateTags,
  onUpdateContent,
  isSaving,
  lastSaved,
  onAddPage,
  onAddProject,
}: QuickNoteEditorProps) {
  const [availableTags, setAvailableTags] = useState(INITIAL_TAGS);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  const tagInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Initialize Editor
  const editor = useEditor({
    extensions: [
      // StarterKit v3 includes Underline (and Link, TrailingNode, etc.)
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
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
      onUpdateContent(editor.getText(), editor.getJSON());
    },
  });

  // Load initial content
  useEffect(() => {
    if (editor) {
      const documentContent = isTiptapDoc(initialContentJson)
        ? initialContentJson
        : textToDocument(initialContentString);
      
      editor.commands.setContent(documentContent, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, initialContentJson]);

  // Sync available tags with initial tags
  useEffect(() => {
    setAvailableTags((prev) => Array.from(new Set([...prev, ...tags])));
  }, [tags]);

  const handleToggleTag = (tag: string) => {
    let newTags;
    if (tags.includes(tag)) {
      newTags = tags.filter((t) => t !== tag);
    } else {
      newTags = [...tags, tag];
    }
    onUpdateTags(newTags);
  };

  const handleCreateTag = (newTagRaw: string) => {
    const newTag = newTagRaw.trim().toLowerCase();
    if (!newTag) return;

    if (!availableTags.includes(newTag)) {
      setAvailableTags([...availableTags, newTag]);
    }
    if (!tags.includes(newTag)) {
      onUpdateTags([...tags, newTag]);
    }
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

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full mx-auto pt-10 pb-8 px-6 md:px-0">
      {/* TOP ROW: TITLE + TAGS */}
      <div className="flex items-start justify-between gap-6 mb-6 shrink-0 relative">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => onUpdateTitle(e.target.value)}
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
                      !availableTags.includes(tagSearch.trim().toLowerCase()) && (
                        <div
                          onClick={() => handleCreateTag(tagSearch)}
                          className="px-3 py-2 mt-1 mx-1 rounded-md text-[13px] text-foreground hover:bg-muted cursor-pointer flex items-center gap-2 border-t border-border/50"
                        >
                          <span className="text-muted-foreground">Create</span>
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
          {isSaving !== undefined ? (
            isSaving ? (
              <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1.5 absolute right-0 top-[-24px]">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="text-[11px] text-muted-foreground/40 absolute right-0 top-[-24px]">
                Auto-saved
              </span>
            ) : null
          ) : null}
        </div>
      </div>

      {/* TOP DIVIDER */}
      <div className="h-px bg-border/60 w-full mb-6 shrink-0" />

      {/* EDITOR AREA */}
      <div className="shrink min-h-0 overflow-y-auto scrollbar-hide flex flex-col mb-4">
        <EditorContent editor={editor} className="cursor-text" />
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
      {(onAddPage || onAddProject) && (
        <div className="shrink-0 flex items-center justify-end gap-3">
          {onAddPage && (
            <button
              type="button"
              onClick={onAddPage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <FileOutput className="w-3.5 h-3.5" />
              Add to Page
            </button>
          )}
          {onAddProject && (
            <button
              type="button"
              onClick={onAddProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              Add to Project
            </button>
          )}
        </div>
      )}
    </div>
  );
}
