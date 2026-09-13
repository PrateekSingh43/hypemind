"use client";

import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { ImagePlus } from "lucide-react";

/**
 * React NodeView for image blocks.
 *
 * Empty-src images render a URL input so images can be added without
 * leaving the document flow. Loaded images show selection and error
 * states without any DOM manipulation — everything flows through
 * node attributes.
 */
export function ImageBlockView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const src = (node.attrs.src as string | null) ?? "";
  const alt = (node.attrs.alt as string | null) ?? "";
  const [draftUrl, setDraftUrl] = useState("");
  const [failed, setFailed] = useState(false);

  if (!src) {
    return (
      <NodeViewWrapper data-selected={selected}>
        <div className="hym-image-placeholder">
          <ImagePlus className="h-5 w-5 text-[#5A5D66]" />
          <input
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const url = draftUrl.trim();
                if (url) updateAttributes({ src: url });
              }
              // Keep editor shortcuts from hijacking the input.
              e.stopPropagation();
            }}
            placeholder="Paste an image URL and press Enter"
            aria-label="Image URL"
            className="hym-image-url-input"
          />
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper data-selected={selected} as="figure">
      <div className={`hym-image-frame ${selected ? "is-selected" : ""}`}>
        {failed ? (
          <div className="hym-image-error" role="status">
            <ImagePlus className="h-4 w-4" />
            <span>Couldn&rsquo;t load this image.</span>
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                setFailed(false);
                setDraftUrl(src);
                updateAttributes({ src: "" });
              }}
            >
              Edit URL
            </button>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={alt}
            draggable={false}
            onError={() => setFailed(true)}
            className="hym-image"
            loading="lazy"
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}
