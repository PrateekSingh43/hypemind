"use client";

import { useEffect, useState } from "react";

import type { Page } from "../../domain/page";
import { usePageEditor } from "../../hooks/use-page-editor";
import { PageShell } from "./page-shell";

type PageWorkspaceProps = {
  /** Fully loaded page (metadata + document). */
  page: Page;
  /** Notifies parents (e.g. sidebar lists) of live title edits. */
  onTitleChange?: (title: string) => void;
};

/**
 * Binds one loaded page to the editor + persistence pipeline.
 *
 * Mount with a stable `key={page.id}` so switching pages remounts the
 * editor kernel cleanly instead of mutating live document state.
 */
export function PageWorkspace({ page, onTitleChange }: PageWorkspaceProps) {
  const { editor, scheduleTitleSave } = usePageEditor({ page });

  const [title, setTitle] = useState(page.title);

  // Adopt external renames (top bar rename action, duplicate flow).
  useEffect(() => {
    setTitle(page.title);
  }, [page.id, page.title]);

  const handleTitleChange = (next: string) => {
    setTitle(next);
    scheduleTitleSave(next);
    onTitleChange?.(next);
  };

  return (
    <PageShell
      title={title}
      editor={editor}
      onTitleChange={handleTitleChange}
    />
  );
}
