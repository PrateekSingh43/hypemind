import { prisma, ItemStatus, Prisma } from "@repo/db";

export type SearchResultItem = {
	id: string;
	title: string | null;
	type: string;
	contentString: string | null;
	updatedAt: Date;
	createdAt: Date;
	isPinned: boolean;
	projectId: string | null;
};

/**
 * Full-text search across all active items in a workspace.
 * Uses case-insensitive pattern matching on title and contentString.
 * Results are ordered by relevance: pinned first, then most recently updated.
 */
export async function searchItemsService(
	workspaceId: string,
	query: string,
	limit = 10,
): Promise<SearchResultItem[]> {
	const trimmed = query.trim();
	if (!trimmed) return [];

	// Escape special characters for LIKE pattern
	const escaped = trimmed.replace(/[%_\\]/g, "\\$&");
	const pattern = `%${escaped}%`;

	const items = await prisma.item.findMany({
		where: {
			workspaceId,
			status: ItemStatus.ACTIVE,
			OR: [
				{ title: { contains: trimmed, mode: "insensitive" as Prisma.QueryMode } },
				{ contentString: { contains: trimmed, mode: "insensitive" as Prisma.QueryMode } },
			],
		},
		orderBy: [
			{ isPinned: "desc" },
			{ updatedAt: "desc" },
		],
		take: limit,
		select: {
			id: true,
			title: true,
			type: true,
			contentString: true,
			updatedAt: true,
			createdAt: true,
			isPinned: true,
			projectId: true,
		},
	});

	return items;
}

/**
 * Returns suggested items for the search modal's initial state (before the user types).
 * Strategy:
 * 1. Top 3 most recently interacted-with items (VIEW, OPEN, EDIT)
 * 2. Top 3 most recently created items
 * Both are deduplicated and capped at 6 total.
 */
export async function searchSuggestionsService(
	workspaceId: string,
): Promise<{ recent: SearchResultItem[]; trending: SearchResultItem[] }> {
	// 1. Recently interacted items (most engaged)
	const recentInteractions = await prisma.interactionEvent.findMany({
		where: {
			workspaceId,
			action: { in: ["VIEW", "OPEN", "EDIT"] },
			itemId: { not: null },
		},
		orderBy: { createdAt: "desc" },
		take: 20, // Grab extra to deduplicate
		select: {
			itemId: true,
			item: {
				select: {
					id: true,
					title: true,
					type: true,
					contentString: true,
					updatedAt: true,
					createdAt: true,
					isPinned: true,
					projectId: true,
					status: true,
				},
			},
		},
	});

	const seenIds = new Set<string>();
	const trending: SearchResultItem[] = [];

	for (const event of recentInteractions) {
		if (!event.item || event.item.status !== "ACTIVE") continue;
		if (seenIds.has(event.item.id)) continue;
		seenIds.add(event.item.id);
		trending.push({
			id: event.item.id,
			title: event.item.title,
			type: event.item.type,
			contentString: event.item.contentString,
			updatedAt: event.item.updatedAt,
			createdAt: event.item.createdAt,
			isPinned: event.item.isPinned,
			projectId: event.item.projectId,
		});
		if (trending.length >= 3) break;
	}

	// 2. Most recently created items
	const recentItems = await prisma.item.findMany({
		where: {
			workspaceId,
			status: ItemStatus.ACTIVE,
			id: { notIn: Array.from(seenIds) },
		},
		orderBy: { createdAt: "desc" },
		take: 3,
		select: {
			id: true,
			title: true,
			type: true,
			contentString: true,
			updatedAt: true,
			createdAt: true,
			isPinned: true,
			projectId: true,
		},
	});

	return {
		trending,
		recent: recentItems,
	};
}
