"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import {
  getSaveStatusState,
  subscribeSaveStatus,
  type SaveStatusState,
} from "./save-status-store";

const LABELS: Record<SaveStatusState["status"], string> = {
  idle: "",
  dirty: "Unsaved",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

/**
 * Transient save-state pill for the top-right of the page header.
 *
 * Subscribes directly to the external save-status store so editor
 * transactions never re-render the page tree. "Saved" auto-hides after
 * a moment; failures persist until the next successful save.
 */
export function SaveIndicator() {
  const state = useSyncExternalStore(subscribeSaveStatus, getSaveStatusState);
  const [showSaved, setShowSaved] = useState(false);

  // Auto-hide the quiet "Saved" confirmation shortly after it appears.
  useEffect(() => {
    if (state.status !== "saved") {
      setShowSaved(false);
      return;
    }
    setShowSaved(true);
    const t = setTimeout(() => setShowSaved(false), 1600);
    return () => clearTimeout(t);
  }, [state.status, state.lastSavedAt]);

  if (state.status === "idle") return null;
  if (state.status === "saved" && !showSaved) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      className={`hym-save-indicator hym-fade-in flex items-center gap-1.5 rounded-full border border-transparent px-2 py-0.5 text-[11px] font-medium ${
        state.status === "error" ? "text-red-400/90" : "text-[#6f7480]"
      }`}
    >
      {state.status === "saving" && (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      )}
      {state.status === "saved" && <Check className="h-3 w-3" aria-hidden />}
      {state.status === "error" && (
        <AlertTriangle className="h-3 w-3" aria-hidden />
      )}
      {LABELS[state.status]}
    </span>
  );
}
