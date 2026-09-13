"use client";

import { useEffect, useRef } from "react";
import {
  ArrowDown,
  ArrowUp,
  CopyPlus,
  Link2,
  Trash2,
} from "lucide-react";

import { getTurnIntoOptions, findBlockKeyForNode } from "../../blocks/registry";
import {
  deleteBlock,
  duplicateBlock,
  findBlockById,
  moveBlockByOffset,
  turnInto as runTurnInto,
} from "../../editor/commands/block-commands";
import type { Editor } from "@tiptap/react";

export type BlockActionMenuAnchor = {
  /** Grip button rect in viewport coordinates. */
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type BlockActionMenuProps = {
  editor: Editor;
  blockId: string;
  anchor: BlockActionMenuAnchor;
  onClose: () => void;
};

const PANEL_WIDTH = 240;
const VIEWPORT_GAP = 12;

/**
 * Contextual actions for one block, opened by clicking the six-dot
 * handle.
 *
 * Hand-rolled popover (matching the repo's existing popover patterns):
 * Radix DropdownMenuTrigger calls preventDefault on pointerdown, which
 * cancels native drag initiation from the same handle. Every action
 * delegates to the command layer; Move up/down double as the keyboard
 * alternative to dragging.
 */
export function BlockActionMenu({
  editor,
  blockId,
  anchor,
  onClose,
}: BlockActionMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handle = findBlockById(editor, blockId);
  const currentKey = handle
    ? findBlockKeyForNode(handle.node.type.name, handle.node.attrs as Record<string, unknown>)
    : null;
  const turnIntoOptions = getTurnIntoOptions(currentKey);

  // Outside click + Escape close; focus returns to the document.
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (
        panelRef.current &&
        e.target instanceof Node &&
        panelRef.current.contains(e.target)
      ) {
        return;
      }
      onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [onClose]);

  // Keep the drag handle visible while the menu is open. The plugin
  // reads this transaction meta directly — the `lockDragHandle` COMMAND
  // belongs to the standalone DragHandle extension, which we do not
  // register, so dispatching the meta is the correct mechanism.
  useEffect(() => {
    const { view } = editor;
    view.dispatch(view.state.tr.setMeta("lockDragHandle", true));
    return () => {
      if (!editor.isDestroyed) {
        editor.view.dispatch(
          editor.view.state.tr.setMeta("lockDragHandle", false),
        );
      }
    };
  }, [editor]);

  const run = (fn: () => void) => {
    onClose();
    fn();
    requestAnimationFrame(() => {
      if (!editor.isDestroyed) editor.commands.focus();
    });
  };

  const copyBlockLink = () => {
    const url = `${window.location.origin}/dashboard/pages#${blockId}`;
    void navigator.clipboard?.writeText(url);
  };

  // Viewport-aware placement: prefer right of the grip, flip above when
  // tight. The panel never exceeds the available space on its side — it
  // scrolls instead — which matters now that "Turn into" offers the
  // full registry.
  const spaceBelow = window.innerHeight - VIEWPORT_GAP - anchor.bottom;
  const spaceAbove = anchor.top - VIEWPORT_GAP;
  const estHeight = 96 + turnIntoOptions.length * 34 + 40;
  const placeAbove =
    spaceBelow < Math.min(estHeight, 400) && spaceAbove > spaceBelow;
  const maxHeight = Math.max(
    200,
    Math.min(estHeight + 8, placeAbove ? spaceAbove : spaceBelow),
  );
  const style: React.CSSProperties = {
    position: "fixed",
    width: PANEL_WIDTH,
    maxHeight,
    overflowY: "auto",
    left: Math.min(
      anchor.right + 8,
      window.innerWidth - PANEL_WIDTH - 12,
    ),
    ...(placeAbove
      ? { bottom: window.innerHeight - anchor.top + 6 }
      : { top: anchor.bottom + 6 }),
  };

  return (
    <div
      ref={panelRef}
      role="menu"
      aria-label="Block actions"
      style={style}
      className="hym-action-menu hym-fade-in scrollbar-thin"
      onMouseDown={(e) => {
        // Preserve editor state while pressing action rows.
        if (e.target instanceof HTMLButtonElement) {
          e.preventDefault();
        }
      }}
      onPointerDown={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        const items = Array.from(
          panelRef.current?.querySelectorAll<HTMLButtonElement>(
            "[role='menuitem']",
          ) ?? [],
        );
        const currentIndex = items.findIndex((el) => el === document.activeElement);
        if (e.key === "ArrowDown") {
          e.preventDefault();
          items[(currentIndex + 1 + items.length) % items.length]?.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          items[(currentIndex - 1 + items.length) % items.length]?.focus();
        }
      }}
    >
      {turnIntoOptions.length > 0 && (
        <>
          <div className="hym-menu-category">Turn into</div>
          {turnIntoOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={`turn-${option.key}`}
                type="button"
                role="menuitem"
                className="hym-menu-item"
                onClick={() =>
                  run(() => option.turnInto && runTurnInto(editor, blockId, option.turnInto))
                }
              >
                <span className="hym-menu-item-icon" aria-hidden>
                  <Icon />
                </span>
                <span className="hym-menu-item-text">
                  <span className="hym-menu-item-label">{option.label}</span>
                </span>
              </button>
            );
          })}
          <div className="hym-menu-divider" role="separator" />
        </>
      )}

      <button
        type="button"
        role="menuitem"
        className="hym-menu-item"
        onClick={() => run(() => duplicateBlock(editor, blockId))}
      >
        <span className="hym-menu-item-icon" aria-hidden><CopyPlus /></span>
        <span className="hym-menu-item-text"><span className="hym-menu-item-label">Duplicate</span></span>
      </button>

      <button
        type="button"
        role="menuitem"
        className="hym-menu-item"
        onClick={() => run(() => moveBlockByOffset(editor, blockId, -1))}
      >
        <span className="hym-menu-item-icon" aria-hidden><ArrowUp /></span>
        <span className="hym-menu-item-text"><span className="hym-menu-item-label">Move up</span></span>
      </button>

      <button
        type="button"
        role="menuitem"
        className="hym-menu-item"
        onClick={() => run(() => moveBlockByOffset(editor, blockId, 1))}
      >
        <span className="hym-menu-item-icon" aria-hidden><ArrowDown /></span>
        <span className="hym-menu-item-text"><span className="hym-menu-item-label">Move down</span></span>
      </button>

      <button
        type="button"
        role="menuitem"
        className="hym-menu-item"
        onClick={() => run(copyBlockLink)}
      >
        <span className="hym-menu-item-icon" aria-hidden><Link2 /></span>
        <span className="hym-menu-item-text"><span className="hym-menu-item-label">Copy link to block</span></span>
      </button>

      <div className="hym-menu-divider" role="separator" />

      <button
        type="button"
        role="menuitem"
        className="hym-menu-item is-danger"
        onClick={() => run(() => deleteBlock(editor, blockId))}
      >
        <span className="hym-menu-item-icon" aria-hidden><Trash2 /></span>
        <span className="hym-menu-item-text"><span className="hym-menu-item-label">Delete</span></span>
      </button>
    </div>
  );
}
