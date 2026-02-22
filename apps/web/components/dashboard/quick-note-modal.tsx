"use client";

import React, { useState } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  Paperclip,
  Box,
  Tag,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

type QuickNoteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuickNoteModal({ open, onOpenChange }: QuickNoteModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() && !description.trim()) return;
    setIsSubmitting(true);

    // TODO: Save to database via API
    // e.g. const workspaceId = await resolveWorkspaceId();
    // await api.post(`/workspaces/${workspaceId}/items`, { title, contentJson: description, type: "QUICK_NOTE" });

    // For now, simulate a short delay and close
    setTimeout(() => {
      setIsSubmitting(false);
      setTitle("");
      setDescription("");
      onOpenChange(false);
    }, 400);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm antialiased font-sans">
      <div
        className={cn(
          "flex flex-col bg-white dark:bg-[#1C1D21] text-gray-900 dark:text-[#EEEEEE] border border-gray-200 dark:border-[#27282B] shadow-2xl transition-all duration-200 overflow-hidden",
          isExpanded
            ? "w-[95vw] h-[95vh] rounded-lg"
            : "w-full max-w-175 rounded-xl h-auto min-h-112.5"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#27282B]/50">
          <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500 dark:text-[#8A8F98]">
            <span className="text-gray-900 dark:text-[#EEEEEE] font-semibold">Quick Note</span>
          </div>

          <div className="flex items-center gap-1 text-gray-400 dark:text-[#8A8F98]">
            {/* TODO: Wire "Add to project" to a project picker */}
            <button className="flex items-center gap-1.5 px-2.5 py-1 mr-2 text-[12px] font-medium border border-gray-200 dark:border-[#27282B] rounded-md text-gray-600 dark:text-[#8A8F98] hover:text-gray-900 dark:hover:text-[#EEEEEE] hover:bg-gray-50 dark:hover:bg-[#26272B] transition-colors">
              <Box className="w-3.5 h-3.5" />
              <span>Add to project</span>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#26272B] rounded-md transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#26272B] rounded-md transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col px-5 py-4 overflow-y-auto">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="w-full bg-transparent text-[22px] font-semibold text-gray-900 dark:text-[#EEEEEE] placeholder:text-gray-300 dark:placeholder:text-[#5A5D66] border-none focus:outline-none focus:ring-0 mb-3"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Start writing..."
            className="w-full flex-1 bg-transparent text-[15px] text-gray-700 dark:text-[#A0A5B0] placeholder:text-gray-400 dark:placeholder:text-[#5A5D66] border-none focus:outline-none focus:ring-0 resize-none leading-relaxed"
          />

          {/* Attributes Row */}
          <div className="flex items-center gap-2 mt-4 pt-4 overflow-x-auto scrollbar-hide">
            {/* TODO: Wire tag picker */}
            <AttributeButton icon={Tag} label="Tags" />
            <button className="flex items-center justify-center w-7 h-7 border border-gray-200 dark:border-[#27282B] rounded-md text-gray-500 dark:text-[#8A8F98] hover:bg-gray-50 dark:hover:bg-[#26272B] transition-colors shrink-0">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-[#27282B]/50">
          {/* TODO: Wire attachment upload */}
          <button className="p-1.5 text-gray-400 dark:text-[#8A8F98] hover:text-gray-600 dark:hover:text-[#EEEEEE] transition-colors rounded-md">
            <Paperclip className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!title.trim() && !description.trim())}
              className="px-4 py-1.5 bg-[#5E6AD2] hover:bg-[#4B56B2] text-white text-[13px] font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Quick Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttributeButton({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium border border-gray-200 dark:border-[#27282B] rounded-md text-gray-600 dark:text-[#8A8F98] hover:text-gray-900 dark:hover:text-[#EEEEEE] hover:bg-gray-50 dark:hover:bg-[#26272B] transition-colors shrink-0">
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}