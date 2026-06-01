"use client";

import React, { useState, useEffect } from "react";
import { Trash2, RotateCcw, FileText, FolderGit2, Folder } from "lucide-react";
import { api, resolveWorkspaceId } from "../../../lib/api";

type TrashItem = {
  id: string;
  title: string;
  type: "AREA" | "PROJECT" | "ITEM" | "GLOBAL_PAGE";
  deletedAt: string;
};

export default function TrashPage() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrashItems = async () => {
    setLoading(true);
    try {
      const workspaceId = await resolveWorkspaceId();
      if (!workspaceId) return;
      const res = await api.get<{ data: TrashItem[] }>(`/workspaces/${workspaceId}/trash`);
      setItems(res.data || []);
    } catch (error) {
      console.error("Failed to fetch trash data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTrashItems();
  }, []);

  const handleRestore = async (id: string, type: string) => {
    try {
      const workspaceId = await resolveWorkspaceId();
      if (!workspaceId) return;
      await api.post(`/workspaces/${workspaceId}/trash/restore`, { id, type });
      setItems((prev) => prev.filter((item) => item.id !== id));
      // Dispatch an event to update sidebar
      window.dispatchEvent(new CustomEvent("hm:workspace-changed"));
    } catch (err) {
      console.error("Failed to restore item:", err);
    }
  };

  const handlePermanentDelete = async (id: string, type: string) => {
    if (!confirm("Are you sure you want to permanently delete this item? This action cannot be undone.")) return;
    try {
      const workspaceId = await resolveWorkspaceId();
      if (!workspaceId) return;
      await api.post(`/workspaces/${workspaceId}/trash/permanent`, { id, type });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete item permanently:", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "AREA":
        return <Folder className="w-5 h-5 text-muted-foreground" />;
      case "PROJECT":
        return <FolderGit2 className="w-5 h-5 text-muted-foreground" />;
      case "GLOBAL_PAGE":
        return <FileText className="w-5 h-5 text-muted-foreground" />;
      case "ITEM":
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "AREA": return "Area";
      case "PROJECT": return "Project";
      case "GLOBAL_PAGE": return "Global Page";
      case "ITEM": return "Item";
      default: return "Unknown";
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center gap-3 border-b border-border pb-6">
        <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted">
          <Trash2 className="size-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Trash</h1>
          <p className="text-sm text-muted-foreground">Your deleted items live here for 30 days.</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          Loading trash...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
          <Trash2 className="size-10 text-muted-foreground/30 mb-3" />
          <span>Trash is empty.</span>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getTypeLabel(item.type)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500/80"></span>
                  {Math.max(0, 30 - Math.floor((new Date().getTime() - new Date(item.deletedAt).getTime()) / (1000 * 60 * 60 * 24)))} days left
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRestore(item.id, item.type)}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    <RotateCcw className="size-3.5" />
                    Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(item.id, item.type)}
                    className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}