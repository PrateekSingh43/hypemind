"use client";

import { useState } from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

const EMOJI_CHOICES = [
  "💡",
  "📌",
  "⚠️",
  "✅",
  "🔥",
  "📝",
  "🎯",
  "🧠",
  "❓",
  "⭐️",
];

/**
 * React NodeView for callout blocks.
 *
 * Only the icon control is application UI; document text stays inside
 * NodeViewContent so ProseMirror keeps full ownership of content.
 */
export function CalloutBlockView({ node, updateAttributes }: NodeViewProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const icon = (node.attrs.icon as string | undefined) ?? "💡";

  return (
    <NodeViewWrapper className="hym-callout" data-type="callout">
      <div className="relative">
        <button
          type="button"
          aria-label="Change callout icon"
          className="hym-callout-icon"
          onClick={() => setPickerOpen((v) => !v)}
        >
          {icon}
        </button>

        {pickerOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setPickerOpen(false)}
              aria-hidden
            />
            <div
              role="menu"
              aria-label="Pick an icon"
              className="absolute left-0 top-full z-40 mt-1 flex gap-1 rounded-lg border border-[#27282B] bg-[#151618] p-1.5 shadow-xl shadow-black/40 hym-fade-in"
            >
              {EMOJI_CHOICES.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  role="menuitem"
                  aria-label={`Set icon ${emoji}`}
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-[15px] transition-colors ${
                    emoji === icon ? "bg-[#26272B]" : "hover:bg-[#1E2023]"
                  }`}
                  onClick={() => {
                    updateAttributes({ icon: emoji });
                    setPickerOpen(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <NodeViewContent className="hym-callout-content" />
    </NodeViewWrapper>
  );
}
