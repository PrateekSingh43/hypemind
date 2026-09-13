"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { BlockMenuStore } from "./block-command-menu-store";
import {
  BLOCK_CATEGORY_ORDER,
  type BlockCategory,
  type BlockDefinition,
} from "../../blocks/registry";

const PANEL_MAX_HEIGHT = 340;
const VIEWPORT_MARGIN = 12;

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  basic: "Basic blocks",
  toggles: "Toggle blocks",
  lists: "Lists",
  media: "Media",
  advanced: "Advanced",
};

// Single source of truth — MUST be the same ordering searchBlocks()
// returns, so a row's data-menu-index always equals state.items index.
const CATEGORY_ORDER = BLOCK_CATEGORY_ORDER;

type BlockCommandMenuProps = {
  store: BlockMenuStore;
  width?: number;
  /** Called after close so hosts can return focus to the editor. */
  onRequestCloseFocus?: () => void;
};

/**
 * Shared floating command menu — the single presentation used by BOTH
 * the "/" slash trigger and the "+" insert trigger (spec §13).
 *
 * Interaction split (explicit `context.mode`, never inferred):
 * - Slash mode: the editor text IS the search query (@tiptap/suggestion);
 *   no input is rendered so focus never leaves the document.
 * - Plus mode: an auto-focused input filters blocks; arrow/enter/escape
 *   are handled locally.
 */
export function BlockCommandMenu({
  store,
  width = 320,
  onRequestCloseFocus,
}: BlockCommandMenuProps) {
  const state = useSyncExternalStore(store.subscribe, store.getState);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");

  // Only the "+" insert palette owns a text input. Slash mode filters
  // through the editor itself: characters typed after "/" are the query
  // (@tiptap/suggestion), so an extra box here would just steal focus.
  const isPlusMode = state.context.mode === "plus";

  // Reset local input whenever the panel opens fresh.
  useEffect(() => {
    if (state.isOpen) setInputValue("");
  }, [state.isOpen]);

  const closeAndRestoreFocus = () => {
    store.close();
    onRequestCloseFocus?.();
  };

  // Click-outside closes both menu flavors (slash also self-closes via
  // suggestion exit; this is required for plus mode).
  useEffect(() => {
    if (!state.isOpen) return;
    function handlePointerDown(e: PointerEvent) {
      const panels = document.querySelectorAll<HTMLElement>(".hym-command-menu");
      const target = e.target as Node | null;
      if (
        target &&
        !Array.from(panels).some((panel) => panel.contains(target))
      ) {
        store.close();
        onRequestCloseFocus?.();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [state.isOpen, store, onRequestCloseFocus]);

  const grouped = useMemo(() => {
    const map = new Map<BlockCategory, BlockDefinition[]>();
    for (const category of CATEGORY_ORDER) map.set(category, []);
    for (const item of state.items) {
      const bucket = map.get(item.category);
      if (bucket) bucket.push(item);
    }
    return [...map.entries()].filter(([, items]) => items.length > 0);
  }, [state.items]);

  // Keep the highlighted option visible during keyboard navigation.
  useEffect(() => {
    if (!state.isOpen || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-menu-index="${state.selectedIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [state.selectedIndex, state.isOpen]);

  if (!state.isOpen || !state.anchor) return null;

  const { anchor } = state;
  const spaceBelow = window.innerHeight - anchor.bottom;
  const desiredHeight = Math.min(PANEL_MAX_HEIGHT, 300);
  const placeAbove =
    spaceBelow < desiredHeight && anchor.top > desiredHeight;

  const left = Math.min(
    anchor.left,
    window.innerWidth - width - VIEWPORT_MARGIN,
  );

  const style: React.CSSProperties = placeAbove
    ? {
        position: "fixed",
        left,
        bottom: window.innerHeight - anchor.top + 8,
        maxHeight: Math.min(PANEL_MAX_HEIGHT, anchor.top - VIEWPORT_MARGIN),
      }
    : {
        position: "fixed",
        left,
        top: anchor.bottom + 6,
        maxHeight: Math.min(PANEL_MAX_HEIGHT, spaceBelow - VIEWPORT_MARGIN),
      };

  let flatIndex = -1;

  return (
    <div
      role="dialog"
      aria-label="Insert block"
      style={{ ...style, width }}
      className="hym-command-menu hym-fade-in scrollbar-thin"
      onMouseDown={(e) => {
        // Pressing a menu row must not steal focus/selection from the
        // editor — the executor relies on the captured context and the
        // click event still fires normally afterwards.
        if (e.target instanceof HTMLButtonElement) {
          e.preventDefault();
        }
      }}
    >
      {/* Plus mode: type-to-filter like Notion's insert palette. */}
      {isPlusMode && (
        <div className="px-1.5 pb-1.5">
          <input
            ref={inputRef}
            autoFocus
            value={inputValue}
            onChange={(e) => {
              const next = e.target.value;
              setInputValue(next);
              store.updateQuery(next, state.anchor);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                store.moveSelection(1);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                store.moveSelection(-1);
              } else if (e.key === "Enter") {
                e.preventDefault();
                store.executeAt(store.getState().selectedIndex);
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                closeAndRestoreFocus();
              }
            }}
            placeholder="Filter blocks…"
            aria-label="Filter blocks"
            spellCheck={false}
            className="hym-menu-filter"
          />
        </div>
      )}

      <div ref={listRef} role="listbox" aria-label="Blocks">
        {grouped.map(([category, items]) => (
          <section key={category}>
            <header className="hym-menu-category">
              {CATEGORY_LABELS[category]}
            </header>
            {items.map((item) => {
              flatIndex += 1;
              const index = flatIndex;
              const Icon = item.icon;
              const isActive = index === state.selectedIndex;
              return (
                <button
                  key={item.key}
                  type="button"
                  id={`block-menu-item-${index}`}
                  role="option"
                  aria-selected={isActive}
                  data-menu-index={index}
                  className={`hym-menu-item ${isActive ? "is-active" : ""}`}
                  onMouseEnter={() => store.setSelectedIndex(index)}
                  onClick={() => store.executeAt(index)}
                >
                  <span className="hym-menu-item-icon" aria-hidden>
                    <Icon />
                  </span>
                  <span className="hym-menu-item-text">
                    <span className="hym-menu-item-label">{item.label}</span>
                    <span className="hym-menu-item-desc">{item.description}</span>
                  </span>
                </button>
              );
            })}
          </section>
        ))}
        {state.items.length === 0 && (
          <div className="px-3 py-4 text-center text-[12px] text-[#5A5D66]">
            No blocks match &ldquo;{isPlusMode ? inputValue : state.query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
