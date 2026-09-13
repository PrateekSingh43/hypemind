import type { JSONContent } from "@tiptap/core";

/**
 * Canonical editor document representation.
 *
 * The document is stored and transported as Tiptap/ProseMirror JSON.
 * HTML is never used as the persistence format.
 */
export type EditorDocument = JSONContent;

/**
 * Application-level page metadata that lives outside the document.
 */

/** Ordered list of block ids pinned for quick navigation (future). */
  // Intentionally empty today; the shape exists so future properties
  // (icon, cover, layout, permissions) evolve without breaking callers.

// export type PageProperties = {

  
  
// };

/**
 * A Page is the product-level unit. It owns metadata plus exactly one
 * editor document. Blocks are NOT modeled in React state — they live
 * inside `document` under ProseMirror ownership.
 */
export type Page = {
  id: string;
  workspaceId: string;
  projectId: string | null;
  title: string;
  document: EditorDocument;
  contentString: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Shape returned by the pages list endpoint (no full documents). */
export type PageSummary = {
  id: string;
  title: string | null;
  type: string;
  updatedAt: string;
  content: string | null;
  tags: string[];
  isPinned: boolean;
};

export const EMPTY_DOCUMENT: EditorDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
