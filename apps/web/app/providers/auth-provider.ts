"use client";

import {
  storeWorkspaceId as persistWorkspaceId,
  getWorkspaceId,
  clearWorkspaceId,
  subscribeToWorkspaceChange,
} from "../../lib/api";

export function storeWorkspaceId(workspaceId: string) {
  persistWorkspaceId(workspaceId);
}

export { getWorkspaceId, clearWorkspaceId, subscribeToWorkspaceChange };
