"use client";

import {
	storeWorkspaceId as persistWorkspaceId,
	getWorkspaceId,
	clearWorkspaceId,
} from "../../lib/api";

export function storeWorkspaceId(workspaceId: string) {
	persistWorkspaceId(workspaceId);
}

export { getWorkspaceId, clearWorkspaceId };
