"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";

import { createPageEditorExtensions } from "../../features/pages/editor/editor-extensions";
import { createPageEditorProps } from "../../features/pages/editor/editor-config";
import { normalizeDocument } from "../../features/pages/persistence/serialization";
import { BlockHoverControls } from "../../features/pages/components/block/block-hover-controls";
import { TouchBlockControls } from "../../features/pages/components/block/touch-block-controls";
import { BlockCommandMenu } from "../../features/pages/components/menus/block-command-menu";
import {
  plusCommandStore,
  slashCommandStore,
} from "../../features/pages/components/menus/block-command-menu-store";
import { InlineBubbleMenu } from "../../features/pages/components/menus/bubble-menu";

export type EditorProps = {
  initialContent?: unknown;
  onUpdate?: (content: JSONContent) => void;
};

/**
 * Compatibility entry point for surfaces that embed a page document
 * without the full page shell (e.g. project detail view).
 *
 * Uses the exact same extension set as Pages so documents stay
 * portable across contexts.
 */
export function Editor({ initialContent, onUpdate }: EditorProps) {
  const editor = useEditor({
    extensions: createPageEditorExtensions(),
    content: normalizeDocument(initialContent),
    immediatelyRender: false,
    autofocus: false,
    editorProps: createPageEditorProps(),
    onUpdate: ({ editor: current }) => {
      onUpdate?.(current.getJSON());
    },
  });

  if (!editor) {
    return (
      <div className="hym-editor-loading" aria-busy="true">
        <div className="hym-skeleton-line w-1/2" />
        <div className="hym-skeleton-line w-5/6" />
        <div className="hym-skeleton-line w-2/3" />
      </div>
    );
  }

  return (
    <div className="relative">
      <EditorContent editor={editor} className="hym-editor cursor-text" />

      <BlockHoverControls editor={editor} />
      <TouchBlockControls editor={editor} />
      <BlockCommandMenu
        store={slashCommandStore}
        onRequestCloseFocus={() => editor.commands.focus()}
      />
      <BlockCommandMenu
        store={plusCommandStore}
        onRequestCloseFocus={() => editor.commands.focus()}
      />
      <InlineBubbleMenu editor={editor} />
    </div>
  );
}
