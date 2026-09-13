"use client";

import { useCallback, useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";

import { BlockActionMenu } from "./block-action-menu";

/**
 * Mobile interaction model.
 *
 * Coarse pointers have no hover, so instead of shrinking the desktop
 * layout, block actions follow the caret: whenever the selection rests
 * inside a top-level block, a subtle affordance appears on that block's
 * right edge, opening the same accessible block menu (which includes
 * Move up/down as the touch/keyboard alternative to drag).
 */
export function TouchBlockControls({ editor }: { editor: Editor }) {
  const [target, setTarget] = useState<{
    blockId: string;
    top: number;
    left: number;
  } | null>(null);

  const updateFromSelection = useCallback(() => {
    if (typeof window === "undefined") return;

    const { selection } = editor.state;
    const $from = selection.$from;

    // Resolve the position *before* the top-level block at the caret.
    let blockPos: number | null = null;
    if ($from.depth > 0) {
      blockPos = $from.before(1);
    } else if ($from.nodeAfter) {
      blockPos = $from.pos;
    } else {
      const prev = editor.state.doc.childBefore($from.pos);
      if (prev.node) blockPos = prev.offset;
    }

    if (blockPos === null) {
      setTarget(null);
      return;
    }

    const node = editor.state.doc.nodeAt(blockPos);
    const blockId = node?.attrs.blockId as string | undefined;
    if (!node || !blockId) {
      setTarget(null);
      return;
    }

    try {
      const el = editor.view.nodeDOM(blockPos);
      if (!(el instanceof Element)) {
        setTarget(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setTarget({
        blockId,
        top: rect.top,
        left: Math.min(rect.right + 8, window.innerWidth - 56),
      });
    } catch {
      setTarget(null);
    }
  }, [editor]);

  useEffect(() => {
    const media = window.matchMedia("(hover: none)");
    if (!media.matches) return;

    const handler = () => updateFromSelection();
    const clear = () => setTarget(null);

    editor.on("selectionUpdate", handler);
    editor.on("blur", clear);
    editor.on("destroy", clear);
    window.addEventListener("scroll", clear, true);

    handler();

    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("blur", clear);
      editor.off("destroy", clear);
      window.removeEventListener("scroll", clear, true);
    };
  }, [editor, updateFromSelection]);

  if (!target) return null;

  return (
    <div className="hym-touch-controls" style={{ top: target.top, left: target.left }}>
      <BlockActionMenu
        editor={editor}
        blockId={target.blockId}
        anchor={{
          left: target.left,
          right: target.left,
          top: target.top,
          bottom: target.top,
        }}
        onClose={() => setTarget(null)}
      />
    </div>
  );
}
