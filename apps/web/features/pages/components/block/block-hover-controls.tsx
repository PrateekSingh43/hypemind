"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Node as PMNode } from "@tiptap/pm/model";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { Plus, GripVertical } from "lucide-react";

import { findBlockById, insertBlocksAfter } from "../../editor/commands/block-commands";
import type { Editor } from "@tiptap/react";
import { plusCommandStore } from "../menus/block-command-menu-store";
import { BlockActionMenu, type BlockActionMenuAnchor } from "./block-action-menu";

type BlockHoverControlsProps = {
  editor: Editor;
};

/**
 * Module-scope so its identity never changes: the DragHandle effect
 * re-registers plugins whenever this prop changes, which must never
 * happen mid-typing.
 */
const DRAG_HANDLE_POSITION_CONFIG = {
  placement: "left-start",
  strategy: "absolute",
} as const;

/**
 * Block controls: `[+] [⋮⋮]`.
 *
 * - "+" opens the shared block command menu anchored to this block and
 *   inserts the chosen block BELOW it (spec §10/§13).
 * - The six-dot grip starts a native drag (Tiptap DragHandle + HTML5
 *   drag onto ProseMirror performs the move) and OPENS on click for
 *   the block action menu — drag and click are independent gestures.
 *
 * All callbacks/configs are identity-stable: the underlying plugin is
 * registered exactly once per editor lifetime.
 */
export function BlockHoverControls({ editor }: BlockHoverControlsProps) {
  const [targetBlockId, setTargetBlockId] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<{
    blockId: string;
    anchor: BlockActionMenuAnchor;
  } | null>(null);

  /** Tracks press origin to distinguish click from the start of a drag. */
  const pressOriginRef = useRef<{ x: number; y: number } | null>(null);

  const handleNodeChange = useCallback(({ node }: { node: PMNode | null }) => {
    setTargetBlockId(node ? ((node.attrs.blockId as string | null) ?? null) : null);
  }, []);

  /** "+" executor: inserts below the hovered block via command layer. */
  useEffect(() => {
    plusCommandStore.setExecutor((index) => {
      const state = plusCommandStore.getState();
      const anchorBlockId = state.context.anchorBlockId;
      if (!anchorBlockId) return false;

      const def = state.items[index];
      if (!def) return false;

      const built = def.buildContent();
      const blocks = Array.isArray(built) ? built : [built];
      const ok = insertBlocksAfter({
        editor,
        afterBlockId: anchorBlockId,
        blocks,
        focus: true,
      });

      // Contract: execute → focus (insertBlocksAfter focuses) → close.
      plusCommandStore.close();
      return ok;
    });
  }, [editor]);

  const openPlusMenu = useCallback(() => {
    if (!targetBlockId) return;
    const handle = findBlockById(editor, targetBlockId);
    if (!handle) return;
    const dom = editor.view.nodeDOM(handle.from);
    if (!(dom instanceof Element)) return;
    const rect = dom.getBoundingClientRect();
    // Toggle: clicking + on the same open menu closes it.
    if (
      plusCommandStore.getState().isOpen &&
      plusCommandStore.getState().context.anchorBlockId === targetBlockId
    ) {
      plusCommandStore.close();
      return;
    }
    plusCommandStore.open(
      { left: rect.left, top: rect.top, bottom: rect.bottom },
      {
        mode: "plus",
        anchorBlockId: targetBlockId,
        query: "",
      },
    );
  }, [editor, targetBlockId]);

  /**
   * Grip gesture handling: a press that ends within DRAG_THRESHOLD px
   * opens the action menu; anything beyond it is the start of a native
   * drag (which fires dragstart and never reaches pointerup-as-click).
   */
  const DRAG_THRESHOLD_PX = 4;

  const handleGripPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      pressOriginRef.current = { x: e.clientX, y: e.clientY };
    },
    [],
  );

  const handleGripPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const origin = pressOriginRef.current;
      pressOriginRef.current = null;
      if (!origin || !targetBlockId) return;

      const moved =
        Math.abs(e.clientX - origin.x) + Math.abs(e.clientY - origin.y);
      if (moved > DRAG_THRESHOLD_PX) return; // user is dragging

      // Toggle (§17): same handle while open closes the menu.
      const current = actionMenu;
      if (current && current.blockId === targetBlockId) {
        setActionMenu(null);
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      setActionMenu({
        blockId: targetBlockId,
        anchor: {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        },
      });
    },
    [targetBlockId, actionMenu],
  );

  const handleGripPointerCancel = useCallback(() => {
    pressOriginRef.current = null;
  }, []);

  // Active-block presentation state: marks the block DOM so CSS can
  // show a coherent "this block is selected" region. Pure decoration —
  // never touches the document.
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(
      ".hym-document [data-active-block]",
    );
    els.forEach((el) => delete el.dataset.activeBlock);

    if (actionMenu) {
      const handle = findBlockById(editor, actionMenu.blockId);
      if (handle) {
        const el = editor.view.nodeDOM(handle.from);
        if (el instanceof HTMLElement) {
          el.dataset.activeBlock = "true";
        }
      }
    }
  }, [actionMenu, editor]);

  return (
    <>
      <DragHandle
        editor={editor}
        className="hym-block-controls"
        onNodeChange={handleNodeChange}
        computePositionConfig={DRAG_HANDLE_POSITION_CONFIG}
      >
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Insert block below"
            title="Insert block below"
            className="hym-control-btn"
            onClick={openPlusMenu}
          >
            <Plus className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Open block actions (drag to move)"
            title="Click for actions · drag to move"
            className="hym-control-btn hym-drag-grip"
            onPointerDown={handleGripPointerDown}
            onPointerUp={handleGripPointerUp}
            onPointerCancel={handleGripPointerCancel}
            onKeyDown={(e) => {
              // Keyboard path opens actions directly.
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!targetBlockId) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setActionMenu({
                  blockId: targetBlockId,
                  anchor: {
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    bottom: rect.bottom,
                  },
                });
              }
            }}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      </DragHandle>

      {actionMenu && (
        <BlockActionMenu
          editor={editor}
          blockId={actionMenu.blockId}
          anchor={actionMenu.anchor}
          onClose={() => setActionMenu(null)}
        />
      )}
    </>
  );
}
