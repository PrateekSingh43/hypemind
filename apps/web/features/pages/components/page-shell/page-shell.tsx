"use client";

import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";

import { PageHeader } from "./page-header";
import { PageEditor } from "./page-editor";

type PageShellProps = {
  title: string;
  editor: Editor | null;
  onTitleChange: (title: string) => void;
};

/**
 * Premium vertical document surface.
 *
 * - No artificial pagination; the document grows naturally.
 * - Centered reading canvas; title and body share the same container
 *   so alignment is structural, not coincidental.
 * - Save state flows through the external store — this component does
 *   not re-render while the user types.
 */
export function PageShell({ title, editor, onTitleChange }: PageShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);

  // Focus the document body when requested from the title input.
  const focusBody = () => {
    if (!editor) return;
    if (editor.isEmpty) {
      editor.commands.focus("start");
    } else {
      editor.commands.focus("end");
    }
  };

  // Keep keyboard focus sane when the page mounts.
  useEffect(() => {
    shellRef.current?.setAttribute("data-page-ready", "true");
  }, []);

  return (
    <div ref={shellRef} className="hym-page-shell min-h-full w-full">
      <div className="mx-auto w-full max-w-[860px] px-6 pb-40 pt-14 md:px-10">
        <PageHeader
          title={title}
          onTitleChange={onTitleChange}
          onRequestFocusBody={focusBody}
        />

        {editor && <PageEditor editor={editor} />}

        {/* Generous bottom writing space — part of the endless surface. */}
        <div aria-hidden className="h-[35vh]" />
      </div>
    </div>
  );
}
