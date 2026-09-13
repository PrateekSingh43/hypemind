import type { EditorOptions } from "@tiptap/core";

/**
 * Shared editor DOM configuration for page documents.
 *
 * Kept separate from component code so tests and server-side rendering
 * can reference identical settings.
 */
export function createPageEditorProps(): EditorOptions["editorProps"] {
  return {
    attributes: {
      class: "hym-document",
      role: "textbox",
      "aria-multiline": "true",
      "aria-label": "Page content",
      spellcheck: "true",
    },
    // Keep native browser paste behavior; ProseMirror handles schema
    // fitting. No custom transformPasted rules are needed yet.
  };
}
