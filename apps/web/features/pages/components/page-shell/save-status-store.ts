"use client";

/**
 * External store for page save state.
 *
 * Deliberately OUTSIDE React state: persistence events fire on every
 * editor transaction, and routing them through useState would re-render
 * the entire editor subtree per keystroke. Only <SaveIndicator/>
 * subscribes here.
 */

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export type SaveStatusState = {
  status: SaveStatus;
  lastSavedAt: number | null;
  error: string | null;
};

let state: SaveStatusState = {
  status: "idle",
  lastSavedAt: null,
  error: null,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function patch(next: Partial<SaveStatusState>) {
  state = { ...state, ...next };
  emit();
}

export function getSaveStatusState(): SaveStatusState {
  return state;
}

export function subscribeSaveStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Per-keypress signal: cheap, never throws, coalesces naturally. */
export function markDirty() {
  if (state.status === "saving" || state.status === "dirty") return;
  patch({ status: "dirty", error: null });
}

export function markSaving() {
  patch({ status: "saving" });
}

export function markSaved(at: number = Date.now()) {
  patch({ status: "saved", lastSavedAt: at, error: null });
}

export function markError(message: string) {
  patch({ status: "error", error: message });
}
