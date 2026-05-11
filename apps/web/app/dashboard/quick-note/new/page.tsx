"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { api, resolveWorkspaceId } from "../../../../lib/api";

const EMPTY_DOC = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export default function NewQuickNotePage() {
  const router = useRouter();
  const creatingRef = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (creatingRef.current) return;

    const createQuickNote = async () => {
      creatingRef.current = true;
      setFailed(false);

      try {
        const workspaceId = await resolveWorkspaceId();
        if (!workspaceId) throw new Error("Workspace not found");

        const res = await api.post<{ data: { id: string } }>(
          `/workspaces/${workspaceId}/item/quick-note`,
          {
            content: " ",
            contentJson: EMPTY_DOC,
          },
        );

        window.dispatchEvent(
          new CustomEvent("hm:quick-note-updated", {
            detail: {
              id: res.data.id,
              title: "Untitled Note",
              contentString: " ",
              tags: [],
              updatedAt: new Date().toISOString(),
            },
          }),
        );
        router.replace(`/dashboard/quick-note?id=${res.data.id}`);
      } catch (err) {
        console.error("Failed to create quick note:", err);
        setFailed(true);
        creatingRef.current = false;
      }
    };

    void createQuickNote();
  }, [attempt, router]);

  return (
    <div className="flex h-full w-full items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground">
          {failed ? (
            <FileText className="h-5 w-5" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}
        </div>
        {failed ? (
          <>
            <p className="text-[14px] font-medium">Could not create note</p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Try again
            </button>
          </>
        ) : (
          <p className="text-[13px] text-muted-foreground">
            Creating quick note...
          </p>
        )}
      </div>
    </div>
  );
}
