"use client";

import { useCallback } from "react";
import { useEditor } from "@tiptap/react";

import type { Page } from "../domain/page";
import { documentToPayload } from "../persistence/page-repository";
import { usePagePersistence } from "./use-page-persistence";
import { createPageEditorExtensions } from "../editor/editor-extensions";
import { createPageEditorProps } from "../editor/editor-config";

type UsePageEditorOptions = {
  page: Page;
};

/**
 * Creates the Tiptap editor for one open page and binds it to
 * debounced persistence.
 *
 * Guarantees:
 * - One editor instance per page (deps = [page.id]; verified against
 *   @tiptap/react v3: equal deps never recreate or re-apply options).
 * - Tiptap owns document state; React only renders around it.
 * - Typing performs ZERO React work: onUpdate only marks a dirty flag;
 *   serialization happens once per actual network flush.
 */
export function usePageEditor({ page }: UsePageEditorOptions) {
  const persistence = usePagePersistence({
    workspaceId: page.workspaceId,
    pageId: page.id,
  });

  const editor = useEditor(
    {
      extensions: createPageEditorExtensions(),
      content: page.document,
      immediatelyRender: false,
      autofocus: false,
      editorProps: createPageEditorProps(),
      onUpdate: () => {
        persistence.scheduleDocSave();
      },
    },
    [page.id],
  );

  // The persistence layer reads live document state only at flush time.
  persistence.setDocResolver(
    useCallback(() => {
      if (!editor || editor.isDestroyed) return {};
      return documentToPayload(editor);
    }, [editor]),
  );

  const scheduleTitleSave = useCallback(
    (title: string) => {
      persistence.schedulePatch({ title });
    },
    [persistence],
  );

  return {
    editor,
    flushSave: persistence.flushNow,
    scheduleTitleSave,
  };
}
