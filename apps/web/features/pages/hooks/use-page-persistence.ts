"use client";

import { useCallback, useEffect, useRef } from "react";
import { getAccessToken, getApiBaseUrl } from "@/lib/api";
import { savePage, type PagePatch } from "../persistence/page-repository";
import {
  markDirty,
  markError,
  markSaved,
  markSaving,
} from "../components/page-shell/save-status-store";

const DEBOUNCE_MS = 800;

type UsePagePersistenceOptions = {
  workspaceId: string;
  pageId: string;
  debounceMs?: number;
};

/**
 * Owns page persistence for one open page.
 *
 * - Debounces rapid edits into single PATCH requests.
 * - Writes save state to the external save-status store so typing never
 *   re-renders React (only <SaveIndicator/> listens).
 * - Flushes pending edits on unmount (SPA navigation) and best-effort
 *   via keepalive fetch when the tab hides/closes.
 * - Never silently drops edits: failures surface as error state while
 *   the payload stays queued for retry.
 *
 * NOTE: document payloads are NOT serialized here. Callers queue field
 * patches; `flushNow` receives a resolver for live document state so
 * serialization happens once per actual network flush, not per
 * keystroke.
 */
export function usePagePersistence({
  workspaceId,
  pageId,
  debounceMs = DEBOUNCE_MS,
}: UsePagePersistenceOptions) {
  const pendingRef = useRef<PagePatch>({});
  const dirtyDocRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const docResolverRef = useRef<(() => PagePatch) | null>(null);

  /** Registers how to read the live document at flush time. */
  const setDocResolver = useCallback((resolver: () => PagePatch) => {
    docResolverRef.current = resolver;
  }, []);

  const flushNow = useCallback(async (): Promise<boolean> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (inFlightRef.current) {
      // A save is running; anything pending re-fires afterwards.
      return false;
    }

    const hasQueued = Object.keys(pendingRef.current).length > 0;
    if (!hasQueued && !dirtyDocRef.current) {
      return true;
    }

    const patch: PagePatch = { ...pendingRef.current };
    pendingRef.current = {};

    if (dirtyDocRef.current && docResolverRef.current) {
      Object.assign(patch, docResolverRef.current());
      dirtyDocRef.current = false;
    }

    if (Object.keys(patch).length === 0) {
      return true;
    }

    inFlightRef.current = true;
    markSaving();
    try {
      await savePage(workspaceId, pageId, patch);
      if (!mountedRef.current) return true;
      markSaved();

      // Anything queued while saving goes out immediately after.
      if (
        Object.keys(pendingRef.current).length > 0 ||
        dirtyDocRef.current
      ) {
        void flushNow();
      }
      return true;
    } catch (err) {
      if (!mountedRef.current) return false;
      // Re-queue so nothing is lost; the user sees the failure.
      pendingRef.current = { ...patch, ...pendingRef.current };
      // Document content must be re-serialized fresh on retry.
      if ("contentJson" in patch || "contentString" in patch) {
        dirtyDocRef.current = true;
      }
      markError(err instanceof Error ? err.message : "Failed to save page");
      return false;
    } finally {
      inFlightRef.current = false;
    }
  }, [workspaceId, pageId]);

  /**
   * Marks the live document as needing persistence; flushes after the
   * debounce window. Zero React work per keystroke.
   */
  const scheduleDocSave = useCallback(() => {
    dirtyDocRef.current = true;
    markDirty();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void flushNow();
    }, debounceMs);
  }, [debounceMs, flushNow]);

  /** Queues metadata patches (title etc.) alongside the debounced flow. */
  const schedulePatch = useCallback(
    (patch: PagePatch) => {
      pendingRef.current = { ...pendingRef.current, ...patch };
      markDirty();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void flushNow();
      }, debounceMs);
    },
    [debounceMs, flushNow],
  );

  // Flush on SPA navigation / component disposal.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (
        Object.keys(pendingRef.current).length > 0 ||
        dirtyDocRef.current ||
        inFlightRef.current
      ) {
        void flushNow();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [flushNow]);

  // Best-effort flush when the tab is hidden or closing. Uses keepalive
  // because normal requests are cancelled on unload.
  useEffect(() => {
    function handleHidden() {
      if (document.visibilityState !== "hidden") return;

      const patch: PagePatch = { ...pendingRef.current };
      pendingRef.current = {};
      if (dirtyDocRef.current && docResolverRef.current) {
        Object.assign(patch, docResolverRef.current());
        dirtyDocRef.current = false;
      }
      if (Object.keys(patch).length === 0) return;

      const token = getAccessToken();
      void fetch(`${getApiBaseUrl()}/workspaces/${workspaceId}/item/${pageId}`, {
        method: "PATCH",
        credentials: "include",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(patch),
      }).catch(() => {
        // Restore the queue; visibilitychange is best-effort.
        pendingRef.current = { ...patch, ...pendingRef.current };
        dirtyDocRef.current = true;
      });
    }

    document.addEventListener("visibilitychange", handleHidden);
    return () =>
      document.removeEventListener("visibilitychange", handleHidden);
  }, [workspaceId, pageId]);

  return {
    scheduleDocSave,
    schedulePatch,
    setDocResolver,
    flushNow,
  };
}
