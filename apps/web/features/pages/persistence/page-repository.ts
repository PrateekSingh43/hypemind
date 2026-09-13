import type { Editor } from "@tiptap/core";
import { api } from "@/lib/api";
import {
  EMPTY_DOCUMENT,
  type EditorDocument,
  type Page,
} from "../domain/page";
import { normalizeDocument } from "./serialization";

export type PagePatch = {
  title?: string;
  contentJson?: unknown;
  contentString?: string;
  isPinned?: boolean;
  projectId?: string | null;
  deletedAt?: string | null;
};

function endpoint(workspaceId: string): string {
  return `/workspaces/${workspaceId}/item/page`;
}

export async function fetchPage(
  workspaceId: string,
  pageId: string,
): Promise<Page> {
  const res = await api.get<{ success: boolean; data: unknown }>(
    `${endpoint(workspaceId)}/${pageId}`,
  );
  const raw = res.data as Record<string, unknown>;
  return {
    id: String(raw.id),
    workspaceId: String(raw.workspaceId ?? workspaceId),
    projectId: (raw.projectId as string | null) ?? null,
    title: typeof raw.title === "string" ? raw.title : "",
    document: normalizeDocument(raw.contentJson),
    contentString:
      typeof raw.contentString === "string" ? raw.contentString : "",
    isPinned: Boolean(raw.isPinned),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

export async function createPage(
  workspaceId: string,
  init: { title?: string; document?: EditorDocument } = {},
): Promise<Page> {
  const res = await api.post<{
    success: boolean;
    data: Record<string, unknown>;
  }>(endpoint(workspaceId), {
    title: init.title ?? "Untitled Page",
    contentJson: init.document ?? EMPTY_DOCUMENT,
    contentString: "",
  });
  const raw = res.data;
  return {
    id: String(raw.id),
    workspaceId: String(raw.workspaceId ?? workspaceId),
    projectId: (raw.projectId as string | null) ?? null,
    title: typeof raw.title === "string" ? raw.title : "",
    document: normalizeDocument(raw.contentJson),
    contentString: "",
    isPinned: Boolean(raw.isPinned),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

export async function savePage(
  workspaceId: string,
  pageId: string,
  patch: PagePatch,
): Promise<void> {
  await api.patch(`/workspaces/${workspaceId}/item/${pageId}`, patch);
}

/** Serializes the live editor state into the persistence payload. */
export function documentToPayload(editor: Editor): {
  contentJson: EditorDocument;
  contentString: string;
} {
  return {
    contentJson: editor.getJSON() as EditorDocument,
    contentString: editor.getText(),
  };
}
