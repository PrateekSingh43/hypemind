"use client";

import type { BlockDefinition } from "../../blocks/registry";
import { searchBlocks } from "../../blocks/registry";

/**
 * Generic external store powering every Block Command Menu instance
 * (the "/" trigger and the "+" trigger share this exact machinery).
 *
 * The document never flows through these stores — only UI state and a
 * small execution-context snapshot. The snapshot is what makes menu
 * clicks deterministic: it is captured while the editor is guaranteed
 * consistent (onStart/onUpdate) and validated against the live doc at
 * execute time, independent of focus/blur ordering.
 */

export type BlockMenuAnchor = { left: number; top: number; bottom: number };

/** Which trigger opened the menu. Drives UI + execution semantics. */
export type BlockMenuMode = "slash" | "plus";

export type BlockMenuContext = {
  /** Which trigger owns this open session. */
  mode: BlockMenuMode;
  /**
   * Suggestion range covering the full "/query" text (slash mode).
   * Validated/clamped against the live document before execution.
   */
  range?: { from: number; to: number };
  /** Insertion anchor ("+" mode) / originating block (slash mode). */
  anchorBlockId: string | null;
  query: string;
};

export type BlockMenuState = {
  isOpen: boolean;
  query: string;
  items: BlockDefinition[];
  selectedIndex: number;
  anchor: BlockMenuAnchor | null;
  context: BlockMenuContext;
};

export type BlockMenuStore = ReturnType<typeof createBlockMenuStore>;

const emptyContext: BlockMenuContext = {
  mode: "slash",
  range: undefined,
  anchorBlockId: null,
  query: "",
};

export function createBlockMenuStore() {
  let state: BlockMenuState = {
    isOpen: false,
    query: "",
    items: [],
    selectedIndex: 0,
    anchor: null,
    context: emptyContext,
  };

  const listeners = new Set<() => void>();
  const patch = (next: Partial<BlockMenuState>) => {
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  };

  /** Set by the owning trigger extension; executes item at index. */
  let executor: ((index: number) => boolean) | null = null;

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getState(): BlockMenuState {
      return state;
    },

    open(
      anchor: BlockMenuState["anchor"],
      context: BlockMenuContext,
    ) {
      patch({
        isOpen: true,
        query: context.query,
        items: searchBlocks(context.query),
        selectedIndex: 0,
        anchor,
        context,
      });
    },

    updateQuery(
      query: string,
      anchor: BlockMenuState["anchor"],
      context?: BlockMenuContext,
    ) {
      const items = searchBlocks(query);
      const selectedIndex = Math.min(
        state.selectedIndex,
        Math.max(0, items.length - 1),
      );
      patch({
        query,
        items,
        selectedIndex,
        anchor,
        ...(context ? { context } : {}),
      });
    },

    updateAnchor(anchor: BlockMenuState["anchor"]) {
      patch({ anchor });
    },

    moveSelection(delta: number) {
      const count = state.items.length;
      if (count === 0) return;
      const next =
        (state.selectedIndex + delta + count) % count;
      patch({ selectedIndex: next });
    },

    setSelectedIndex(index: number) {
      patch({ selectedIndex: index });
    },

    close() {
      if (!state.isOpen) return;
      patch({
        isOpen: false,
        query: "",
        items: [],
        selectedIndex: 0,
        context: emptyContext,
      });
    },

    setExecutor(fn: (index: number) => boolean) {
      executor = fn;
    },

    executeAt(index: number): boolean {
      return executor ? executor(index) : false;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Singleton instances                                                 */
/* ------------------------------------------------------------------ */

/** Driven by typing "/" (@tiptap/suggestion). */
export const slashCommandStore = createBlockMenuStore();

/** Driven by clicking the "+" block control. */
export const plusCommandStore = createBlockMenuStore();
