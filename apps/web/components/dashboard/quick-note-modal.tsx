"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, CheckCircle } from "lucide-react";

import { api, getWorkspaceId, resolveWorkspaceId } from "../../lib/api";

const MAX_CHARS = 2500;

type QuickNoteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuickNoteModal({ open, onOpenChange }: QuickNoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Focus textarea on open
  useEffect(() => {
    if (open) {
      setError(null);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50); // slight delay for animation
    }
  }, [open]);

  // Keyboard events
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      
      if (!open || isSaving) return;

      // Cmd/Ctrl + Enter to save
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }

      // Esc to close
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseAttempt();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [open, title, content, showConfirm, isSaving]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!open || showConfirm || isSaving) return;
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleCloseAttempt();
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [open, title, content, showConfirm, isSaving]);

  const handleCloseAttempt = () => {
    if (isSaving) return;
    if (title.trim() || content.trim()) {
      setShowConfirm(true);
    } else {
      close();
    }
  };

  const close = () => {
    setTitle("");
    setContent("");
    setShowConfirm(false);
    setError(null);
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    if (isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const workspaceId = await resolveWorkspaceId();
      if (!workspaceId) {
        throw new Error("No active workspace found. Please refresh.");
      }

      await api.post(`/workspaces/${workspaceId}/item/quick-note`, {
        title: title.trim() || undefined,
        content: content.trim(),
      });

      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
      }, 3000);
      
      close();
    } catch (err: any) {
      console.error("Failed to save quick note:", err);
      setError(err.message || "Failed to save note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open && !toastVisible) return null;

  return (
    <>
      {toastVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-border text-foreground px-5 py-3.5 rounded-lg shadow-2xl flex items-center gap-3 z-[60] animate-in fade-in slide-in-from-bottom-5 overflow-hidden">
          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[13px] font-medium">Saved to Quick Notes</span>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] antialiased font-sans p-4">
          <div
            ref={modalRef}
            className="relative flex flex-col bg-surface text-foreground shadow-2xl border border-border w-full max-w-[460px] rounded-[16px] overflow-hidden animate-in fade-in zoom-in-95 duration-150 ease-out"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Note
              </span>
              <button
                onClick={handleCloseAttempt}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Editor Area */}
            <div className="flex flex-col px-5 py-2 relative group">
              {/* Subtle Character Count (Top Right) */}
              <div className={`absolute top-0 right-5 text-[10px] font-medium tracking-tight transition-all duration-200 opacity-0 group-hover:opacity-100 ${content.length >= MAX_CHARS ? "text-red-500 opacity-100" : "text-muted-foreground/30"}`}>
                {content.length} / {MAX_CHARS}
              </div>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSaving}
                placeholder="Title"
                className="w-full bg-transparent text-[16px] font-semibold text-foreground placeholder:text-muted-foreground border-none focus:outline-none focus:ring-0 mb-2 p-0 disabled:opacity-50"
              />
              
              <div className="max-h-[50vh] overflow-y-auto scrollbar-hide -mx-5 px-5">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length <= MAX_CHARS) {
                      setContent(val);
                    }
                  }}
                  disabled={isSaving}
                  placeholder="Start typing..."
                  className="w-full bg-transparent text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground border-none focus:outline-none focus:ring-0 resize-none min-h-[160px] p-0 m-0 disabled:opacity-50"
                />
              </div>

              {error && (
                <div className="mt-2 text-[12px] text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-border/30 mt-2 bg-muted/20">
              <div className="flex flex-col">
                <span className="text-[11px] text-muted-foreground font-medium">
                  {isSaving ? "Saving thought..." : "Esc to close"}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving || content.length > MAX_CHARS || (!title.trim() && !content.trim())}
                  className="px-4 py-1.5 bg-foreground text-background hover:bg-foreground/90 text-[12px] font-medium rounded-md transition-colors disabled:opacity-30 flex items-center gap-2 shadow-sm min-w-[100px] justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Note"
                  )}
                </button>
              </div>
            </div>

            {/* Discard Confirmation Overlay */}
            {showConfirm && (
              <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-100 p-6 text-center">
                <h3 className="text-[15px] font-semibold text-foreground mb-1">Discard this note?</h3>
                <p className="text-[13px] text-muted-foreground mb-6">Your thought has not been saved.</p>
                <div className="flex justify-center gap-3 mt-2 w-full">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-5 py-1.5 rounded-[6px] border border-border text-[13px] font-medium text-foreground hover:bg-muted transition-colors outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={close}
                    className="px-5 py-1.5 rounded-[6px] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-transparent hover:border-red-500/50 text-[13px] font-medium transition-colors outline-none"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}