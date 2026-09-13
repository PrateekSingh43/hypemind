"use client";

import { EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";

import { BlockHoverControls } from "../block/block-hover-controls";
import { TouchBlockControls } from "../block/touch-block-controls";
import { BlockCommandMenu } from "../menus/block-command-menu";
import {
  plusCommandStore,
  slashCommandStore,
} from "../menus/block-command-menu-store";
import { InlineBubbleMenu } from "../menus/bubble-menu";

type PageEditorProps = {
  editor: Editor;
};

/**
 * The document surface: ProseMirror content plus the interaction
 * overlays (block controls, slash menu, plus-insert menu, bubble).
 *
 * This element is the positioning context for the floating block
 * controls — Tiptap's DragHandle appends its wrapper to
 * `editor.view.dom.parentElement`, which is exactly this node.
 */
export function PageEditor({ editor }: PageEditorProps) {
  return (
    <div className="relative">
      <EditorContent
        editor={editor}
        className="hym-editor cursor-text"
        onClick={(e) => {
          // Clicking empty space below content moves the caret to the end.
          const target = e.target as HTMLElement;
          if (target.closest(".hym-document")) return;
          editor.commands.focus("end");
        }}
      />

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
