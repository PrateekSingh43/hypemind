"use client";

import { useCallback, useEffect, useState } from "react";
import type { EditorState } from "@tiptap/pm/state";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Code,
  Italic,
  Link2,
  Link2Off,
  Highlighter,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";

type BubbleMenuProps = {
  editor: Editor;
};

function isLinkActive(state: EditorState): boolean {
  return state.selection.$from
    .marks()
    .some((mark) => mark.type.name === "link");
}

/** Module-scope: identity-stable across renders (plugin effect deps). */
const BUBBLE_MENU_OPTIONS = {
  placement: "top",
  offset: 10,
} as const;

/** 0 disables the plugin's debounce → toolbar tracks selection instantly. */
const UPDATE_DELAY = 0;
const RESIZE_DELAY = 0;

/**
 * Inline formatting toolbar shown on text selection.
 *
 * Uses Tiptap's BubbleMenu positioning (Floating UI) so it follows the
 * selection without custom selection mechanics.
 */
export function InlineBubbleMenu({ editor }: BubbleMenuProps) {
  const [linkMode, setLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const shouldShow = useCallback(({ state }: { state: EditorState }) => {
    // Only for genuine text selections; never during node drags.
    return !state.selection.empty && state.selection.from !== state.selection.to && state.selection.toJSON().type !== "node";
  }, []);

  // A new selection invalidates any in-progress link editing — otherwise
  // stale link UI reappears on the next selection.
  useEffect(() => {
    const reset = () => {
      setLinkMode(false);
      setLinkUrl("");
    };
    editor.on("selectionUpdate", reset);
    return () => {
      editor.off("selectionUpdate", reset);
    };
  }, [editor]);

  const items = [
    {
      label: "Bold",
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      active: () => editor.isActive("bold"),
    },
    {
      label: "Italic",
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: () => editor.isActive("italic"),
    },
    {
      label: "Underline",
      icon: UnderlineIcon,
      action: () => editor.chain().focus().toggleUnderline().run(),
      active: () => editor.isActive("underline"),
    },
    {
      label: "Strikethrough",
      icon: Strikethrough,
      action: () => editor.chain().focus().toggleStrike().run(),
      active: () => editor.isActive("strike"),
    },
    {
      label: "Code",
      icon: Code,
      action: () => editor.chain().focus().toggleCode().run(),
      active: () => editor.isActive("code"),
    },
    {
      label: "Highlight",
      icon: Highlighter,
      action: () => editor.chain().focus().toggleHighlight().run(),
      active: () => editor.isActive("highlight"),
    },
  ];

  return (
    <TiptapBubbleMenu
      editor={editor}
      options={BUBBLE_MENU_OPTIONS}
      shouldShow={shouldShow}
      updateDelay={UPDATE_DELAY}
      resizeDelay={RESIZE_DELAY}
    >
      <div className="flex items-center gap-0.5 rounded-lg border border-[#27282B] bg-[#151618] p-1 shadow-xl shadow-black/40 hym-fade-in">
        {linkMode ? (
          <div className="flex items-center gap-1 px-1">
            <input
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const url = normalizeUrl(linkUrl);
                  if (url) {
                    editor
                      .chain()
                      .focus()
                      .extendMarkRange("link")
                      .setLink({ href: url })
                      .run();
                  }
                  setLinkMode(false);
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setLinkMode(false);
                  editor.commands.focus();
                }
              }}
              placeholder="Paste or type a link…"
              className="h-7 w-56 rounded-md border border-[#27282B] bg-[#0E0F11] px-2 text-[12px] text-[#EEEEEE] placeholder:text-[#5A5D66] outline-none focus:border-[#42444A]"
            />
            <button
              aria-label="Apply link"
              title="Apply"
              onClick={() => {
                const url = normalizeUrl(linkUrl);
                if (url) {
                  editor
                    .chain()
                    .focus()
                    .extendMarkRange("link")
                    .setLink({ href: url })
                    .run();
                }
                setLinkMode(false);
              }}
              className="h-7 rounded-md px-2 text-[12px] font-medium text-[#A0A5B0] hover:bg-[#26272B] hover:text-[#EEEEEE]"
            >
              Apply
            </button>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <BubbleButton
                key={item.label}
                label={item.label}
                icon={item.icon}
                active={item.active()}
                onClick={item.action}
              />
            ))}
            <span className="mx-0.5 h-5 w-px bg-[#27282B]" />
            <BubbleButton
              label="Add link"
              icon={isLinkActive(editor.state) ? Link2Off : Link2}
              active={isLinkActive(editor.state)}
              onClick={() => {
                if (isLinkActive(editor.state)) {
                  editor.chain().focus().unsetLink().run();
                  return;
                }
                const attrs =
                  editor.getAttributes("link");
                setLinkUrl(typeof attrs.href === "string" ? attrs.href : "");
                setLinkMode(true);
              }}
            />
          </>
        )}
      </div>
    </TiptapBubbleMenu>
  );
}

function BubbleButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onMouseDown={(e) => {
        // Keep the text selection alive while interacting.
        e.preventDefault();
      }}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-75 ${
        active
          ? "bg-[#26272B] text-[#EEEEEE]"
          : "text-[#8A8F98] hover:bg-[#1E2023] hover:text-[#EEEEEE]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function normalizeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^mailto:/i.test(value)) return value;
  return `https://${value}`;
}
