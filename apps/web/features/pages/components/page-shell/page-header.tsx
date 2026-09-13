"use client";

import { useEffect, useRef, useState } from "react";
import { SaveIndicator } from "./save-indicator";

type PageHeaderProps = {
  title: string;
  onTitleChange: (title: string) => void;
  /** Enter in the title moves focus into the document body. */
  onRequestFocusBody?: () => void;
};

/**
 * Page title + transient save status.
 *
 * The title is page metadata (not document content) so it lives in
 * React state and persists through the same debounced channel as the
 * document. Save state arrives via the external store — header edits
 * never re-render the editor tree.
 */
export function PageHeader({
  title,
  onTitleChange,
  onRequestFocusBody,
}: PageHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [local, setLocal] = useState(title);

  // Adopt external title changes (top-bar rename / duplicate flow).
  useEffect(() => {
    setLocal(title);
  }, [title]);

  const handleChange = (value: string) => {
    setLocal(value);
    onTitleChange(value);
  };

  return (
    <div className="mb-7">
      <div className="flex items-start justify-between gap-4">
        <div className="grid w-full min-w-0">
          <div
            aria-hidden
            className="invisible col-start-1 row-start-1 whitespace-pre-wrap break-words text-[36px] font-bold leading-[1.15] tracking-[-0.02em]"
          >
            {local || "Untitled"}
          </div>
          <input
            ref={inputRef}
            value={local}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onRequestFocusBody?.();
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                onRequestFocusBody?.();
              }
            }}
            placeholder="Untitled"
            aria-label="Page title"
            className="col-start-1 row-start-1 w-full bg-transparent text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-[#EEEEEE] outline-none placeholder:text-[#3A3D44]"
          />
        </div>
      </div>

      {/* Transient save pill; absolute so it never shifts layout */}
      <div className="relative mt-2 h-5">
        <div className="absolute right-0 top-0">
          <SaveIndicator />
        </div>
      </div>
    </div>
  );
}
