"use client";

import { useEffect, useMemo, useRef, useState, createElement } from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Check, ChevronDown, Copy } from "lucide-react";

import {
  CODE_LANGUAGES,
} from "../../editor/extensions/blocks/code-block-languages";

/**
 * React NodeView for code blocks: syntax-highlighted content (via
 * NodeViewContent + CodeBlockLowlight) plus a hover/focus language
 * picker and copy button — Notion-style chrome around ProseMirror-
 * owned content.
 */
export function CodeBlockView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  const language = (node.attrs.language as string | null) ?? "plaintext";

  const options = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return CODE_LANGUAGES;
    return CODE_LANGUAGES.filter(
      (l) => l.label.toLowerCase().includes(q) || l.id.includes(q),
    );
  }, [filter]);

  // Close picker on outside click.
  useEffect(() => {
    if (!pickerOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (
        pickerRef.current &&
        e.target instanceof Node &&
        pickerRef.current.contains(e.target)
      ) {
        return;
      }
      setPickerOpen(false);
      setFilter("");
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [pickerOpen]);

  const copyCode = () => {
    void navigator.clipboard?.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <NodeViewWrapper
      className="hym-code-block"
      data-selected={selected}
    >
      <div className="hym-code-toolbar">
        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            className="hym-code-language"
            onClick={() => setPickerOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={pickerOpen}
            aria-label={`Language: ${language}`}
          >
            {language}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {pickerOpen && (
            <div
              role="listbox"
              aria-label="Languages"
              className="hym-command-menu hym-fade-in scrollbar-thin !absolute right-0 top-full z-40 mt-1 max-h-64 w-56"
            >
              <div className="px-1.5 pb-1.5">
                <input
                  autoFocus
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      e.stopPropagation();
                      setPickerOpen(false);
                      setFilter("");
                    }
                  }}
                  placeholder="Filter languages…"
                  aria-label="Filter languages"
                  spellCheck={false}
                  className="hym-menu-filter"
                />
              </div>
              <div role="presentation">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={opt.id === language}
                    onMouseDown={(e) => {
                      if (e.target instanceof HTMLButtonElement)
                        e.preventDefault();
                    }}
                    onClick={() => {
                      updateAttributes({ language: opt.id });
                      setPickerOpen(false);
                      setFilter("");
                    }}
                    className={`hym-menu-item ${
                      opt.id === language ? "is-active" : ""
                    }`}
                  >
                    <span className="hym-menu-item-text">
                      <span className="hym-menu-item-label">{opt.label}</span>
                      <span className="hym-menu-item-desc">{opt.id}</span>
                    </span>
                    {opt.id === language && (
                      <Check className="ml-auto h-3.5 w-3.5 text-primary" />
                    )}
                  </button>
                ))}
                {options.length === 0 && (
                  <div className="px-3 py-3 text-center text-[12px] text-[#5A5D66]">
                    No languages match
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="hym-code-copy"
          onClick={copyCode}
          aria-label="Copy code"
          title="Copy code"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* ProseMirror owns this content entirely. NodeViewContent's
          `as` typing is narrow; createElement renders a real <code>. */}
      <pre className="hym-code-pre">
        {createElement(NodeViewContent, { as: "code" })}
      </pre>
    </NodeViewWrapper>
  );
}
