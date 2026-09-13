"use client";

/**
 * TEMPORARY dev-only harness for driving the Pages editor without the
 * API. Used by automated interaction tests; not linked anywhere.
 */

import { useEffect, useReducer } from "react";
import { useEditor } from "@tiptap/react";

import { PageEditor } from "@/features/pages/components/page-shell/page-editor";
import { createPageEditorExtensions } from "@/features/pages/editor/editor-extensions";
import { createPageEditorProps } from "@/features/pages/editor/editor-config";

export default function DevEditorHarness() {
  const editor = useEditor({
    extensions: createPageEditorExtensions(),
    content: { type: "doc", content: [{ type: "paragraph" }] },
    immediatelyRender: false,
    autofocus: false,
    editorProps: createPageEditorProps(),
  });

  const [, force] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => force();
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
    };
  }, [editor]);

  if (!editor) {
    return <div style={{ padding: 40, color: "#888" }}>loading…</div>;
  }

  return (
    <div
      id="harness-root"
      style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", color: "#eee" }}
    >
      <PageEditor editor={editor} />
      <pre
        id="harness-doc"
        style={{ marginTop: 40, fontSize: 11, color: "#666", whiteSpace: "pre-wrap" }}
      >
        {JSON.stringify(editor.getJSON(), null, 2)}
      </pre>
    </div>
  );
}
