import { prisma } from "@repo/db";
import { ForbiddenError, NotFoundError } from "../errors/httpErrors";

const DEFAULT_PREFS = {
	themeMode: "system",
	themePalette: "hype-default",
	prefersReducedMotion: false,
	density: "comfortable",
	editorDefaultBlock: "paragraph",
	hotkeys: {
		quickCapture: "q",
		openSearch: "k",
		newJournal: "j",
		newCanvas: "c",
		toggleAssistant: ".",
		toggleTheme: "t",
		openInbox: "i",
	},
	experimental: {
		vectorSearch: false,
		graphLite: true,
		aiInlineRewrite: false,
	},
};

interface GetItemsFilters {
	type?: string;
	projectId?: string;
	isPinned?: boolean;
	limit?: number;
	cursor?: string;
}

interface InboxFilters {
	limit?: number;
	cursor?: string;
}

interface CreateItemData {
	title?: string;
	type: string;
	contentJson?: unknown;
	projectId?: string | null;
	url?: string | null;
	metadata?: Record<string, unknown> | null;
	description?: string;
	source?: string | null;
	tags?: string[];
}

interface UpdateItemData {
	title?: string;
	isPinned?: boolean;
	projectId?: string | null;
	contentJson?: unknown;
	metadata?: Record<string, unknown> | null;
	url?: string | null;
	tags?: string[];
}

interface CreateAreaData {
	title: string;
	slug?: string;
	description?: string;
}

interface CreateProjectData {
	title: string;
	slug?: string;
	description?: string;
}

function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

async function ensureWorkspaceMembership(workspaceId: string, userId: string) {
	const membership = await prisma.workspaceMember.findUnique({
		where: { workspaceId_userId: { workspaceId, userId } },
		select: { workspaceId: true },
	});

	if (!membership) {
		throw new ForbiddenError("Not a member of this workspace");
	}
}

async function ensureProjectInWorkspace(workspaceId: string, projectId: string) {
	const project = await prisma.project.findFirst({
		where: { id: projectId, area: { workspaceId } },
		select: { id: true },
	});

	if (!project) {
		throw new NotFoundError("Project not found");
	}
}

async function getWorkspaceIdForArea(areaId: string, userId: string) {
	const area = await prisma.area.findFirst({
		where: {
			id: areaId,
			workspace: { members: { some: { userId } } },
		},
		select: { workspaceId: true },
	});

	if (!area) {
		throw new NotFoundError("Area not found");
	}

	return area.workspaceId;
}

async function getWorkspaceIdForProject(projectId: string, userId: string) {
	const project = await prisma.project.findFirst({
		where: {
			id: projectId,
			area: { workspace: { members: { some: { userId } } } },
		},
		select: { area: { select: { workspaceId: true } } },
	});

	if (!project) {
		throw new NotFoundError("Project not found");
	}

	return project.area.workspaceId;
}

function normalizeMetadata(
	input: Record<string, unknown> | null | undefined,
	defaultSource: string | null,
	defaultAuthor: string,
	defaultTags: string[] = []
) {
	const metadata = input ?? {};
	const description =
		typeof metadata.description === "string" ? metadata.description : "";
	const source =
		typeof metadata.source === "string"
			? metadata.source
			: defaultSource;
	const author =
		typeof metadata.author === "string" && metadata.author.trim()
			? metadata.author
			: defaultAuthor;
	const tags = Array.isArray(metadata.tags)
		? metadata.tags.filter((value): value is string => typeof value === "string")
		: defaultTags;

	return {
		...metadata,
		description,
		source,
		author,
		tags,
	};
}

async function upsertTagsForItem(
	workspaceId: string,
	itemId: string,
	tagNames: string[] | undefined
) {
	if (!tagNames) return;

	const deduped = Array.from(
		new Set(
			tagNames
				.map((tag) => tag.trim())
				.filter((tag) => tag.length > 0)
		)
	);

	if (deduped.length === 0) {
		await prisma.itemTag.deleteMany({ where: { itemId } });
		return;
	}

	const existing = await prisma.tag.findMany({
		where: { workspaceId, name: { in: deduped } },
		select: { id: true, name: true },
	});

	const existingNames = new Set(existing.map((tag) => tag.name));
	const missing = deduped.filter((name) => !existingNames.has(name));

	const created = await Promise.all(
		missing.map((name) =>
			prisma.tag.create({
				data: { workspaceId, name },
				select: { id: true },
			})
		)
	);

	const tagIds = [...existing.map((tag) => tag.id), ...created.map((tag) => tag.id)];

	await prisma.item.update({
		where: { id: itemId },
		data: {
			tags: {
				deleteMany: {},
				create: tagIds.map((tagId) => ({ tagId })),
			},
		},
	});
}

export async function getBootstrap(workspaceId: string, userId: string) {
	await ensureWorkspaceMembership(workspaceId, userId);

	const workspace = await prisma.workspace.findFirst({
		where: { id: workspaceId },
		select: { id: true, name: true },
	});

	if (!workspace) {
		throw new NotFoundError("Workspace not found");
	}

	const [areas, recentItems, inboxCount, pinned, settingsRecord] = await Promise.all([
		prisma.area.findMany({
			where: { workspaceId },
			orderBy: { createdAt: "asc" },
			select: {
				id: true,
				title: true,
				slug: true,
				description: true,
				projects: {
					orderBy: { updatedAt: "desc" },
					select: {
						id: true,
						title: true,
						slug: true,
						status: true,
						_count: { select: { items: true } },
					},
				},
				_count: { select: { projects: true } },
			},
		}),
		prisma.item.findMany({
			where: { workspaceId, deletedAt: null },
			orderBy: { updatedAt: "desc" },
			take: 5,
			select: {
				id: true,
				title: true,
				type: true,
				isPinned: true,
				updatedAt: true,
				projectId: true,
				project: { select: { id: true, title: true } },
				contentJson: true,
				metadata: true,
				url: true,
			},
		}),
		prisma.item.count({
			where: {
				workspaceId,
				deletedAt: null,
				OR: [{ projectId: null }],
			},
		}),
		prisma.item.findMany({
			where: { workspaceId, isPinned: true, deletedAt: null },
			orderBy: [{ pinnedAt: "desc" }, { updatedAt: "desc" }],
			take: 5,
			select: {
				id: true,
				title: true,
				type: true,
				isPinned: true,
				pinnedAt: true,
				updatedAt: true,
				projectId: true,
				project: { select: { id: true, title: true } },
				contentJson: true,
				metadata: true,
				url: true,
			},
		}),
		prisma.userSetting.findUnique({
			where: { userId },
			select: { prefs: true },
		}),
	]);

	return {
		workspace,
		areas: areas.map((area) => ({
			id: area.id,
			title: area.title,
			slug: area.slug,
			description: area.description,
			projectsCount: area._count.projects,
			projects: area.projects,
		})),
		pinned,
		pinnedItems: pinned,
		inboxCount,
		recentItems,
		settings: {
			prefs: (settingsRecord?.prefs as Record<string, unknown>) ?? DEFAULT_PREFS,
		},
	};
}

export async function getAreas(workspaceId: string) {
	return prisma.area.findMany({
		where: { workspaceId },
		orderBy: { createdAt: "asc" },
		select: {
			id: true,
			title: true,
			slug: true,
			description: true,
			_count: { select: { projects: true } },
		},
	});
}

export async function getItems(workspaceId: string, filters: GetItemsFilters) {
	const where: Record<string, unknown> = {
		workspaceId,
		deletedAt: null,
	};

	if (filters.type) where.type = filters.type;
	if (filters.projectId !== undefined) {
		where.projectId = filters.projectId === "null" ? null : filters.projectId;
	}
	if (filters.isPinned !== undefined) where.isPinned = filters.isPinned;

	const take = Math.min(Math.max(filters.limit ?? 50, 1), 100);

	return prisma.item.findMany({
		where,
		orderBy: { updatedAt: "desc" },
		take,
		...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
		select: {
			id: true,
			workspaceId: true,
			title: true,
			type: true,
			isPinned: true,
			pinnedAt: true,
			updatedAt: true,
			createdAt: true,
			projectId: true,
			project: { select: { id: true, title: true } },
			contentJson: true,
			url: true,
			metadata: true,
		},
	});
}

export async function createItem(workspaceId: string, userId: string, data: CreateItemData) {
	await ensureWorkspaceMembership(workspaceId, userId);

	if (data.projectId) {
		await ensureProjectInWorkspace(workspaceId, data.projectId);
	}

	const source = data.source ?? (typeof data.url === "string" ? data.url : null);
	const author = source ? "HypeMind Clipper" : "HypeMind Web";
	const tags = data.tags ?? [];
	const metadata = normalizeMetadata(data.metadata, source, author, tags);

	const created = await prisma.item.create({
		data: {
			workspaceId,
			title: data.title?.trim() || null,
			type: data.type as any,
			contentJson: (data.contentJson ?? { blocks: [] }) as any,
			projectId: data.projectId ?? null,
			url: data.url ?? null,
			metadata: metadata as any,
			createdById: userId,
		},
		select: {
			id: true,
			workspaceId: true,
			projectId: true,
			title: true,
			type: true,
			contentJson: true,
			url: true,
			metadata: true,
			isPinned: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	await upsertTagsForItem(workspaceId, created.id, metadata.tags as string[]);

	await prisma.interactionEvent.create({
		data: {
			userId,
			workspaceId,
			itemId: created.id,
			action: "CREATE",
		},
	});

	return created;
}

export async function updateItem(
	workspaceId: string,
	itemId: string,
	userId: string,
	data: UpdateItemData
) {
	await ensureWorkspaceMembership(workspaceId, userId);

	const existing = await prisma.item.findFirst({
		where: { id: itemId, workspaceId, deletedAt: null },
		select: { id: true, metadata: true },
	});

	if (!existing) {
		throw new NotFoundError("Item not found");
	}

	if (typeof data.projectId === "string" && data.projectId.length > 0) {
		await ensureProjectInWorkspace(workspaceId, data.projectId);
	}

	const updateData: Record<string, unknown> = {};

	if (data.title !== undefined) updateData.title = data.title;
	if (data.contentJson !== undefined) updateData.contentJson = data.contentJson;
	if (data.projectId !== undefined) updateData.projectId = data.projectId;
	if (data.url !== undefined) updateData.url = data.url;
	if (data.metadata !== undefined) {
		updateData.metadata = normalizeMetadata(
			data.metadata,
			typeof data.url === "string" ? data.url : null,
			"HypeMind Web",
			data.tags
		) as any;
	}
	if (data.isPinned !== undefined) {
		updateData.isPinned = data.isPinned;
		updateData.pinnedAt = data.isPinned ? new Date() : null;
	}

	const updated = await prisma.item.update({
		where: { id: itemId },
		data: updateData,
		select: {
			id: true,
			workspaceId: true,
			projectId: true,
			title: true,
			type: true,
			contentJson: true,
			url: true,
			metadata: true,
			isPinned: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	if (data.tags !== undefined) {
		await upsertTagsForItem(workspaceId, itemId, data.tags);
	}

	void prisma.interactionEvent.create({
		data: {
			userId,
			workspaceId,
			itemId,
			action: "EDIT",
			meta: { fields: Object.keys(data) },
		},
	});

	return updated;
}

export async function updateItemById(itemId: string, userId: string, data: UpdateItemData) {
	const item = await prisma.item.findFirst({
		where: {
			id: itemId,
			deletedAt: null,
			workspace: { members: { some: { userId } } },
		},
		select: { workspaceId: true },
	});

	if (!item) {
		throw new NotFoundError("Item not found");
	}

	return updateItem(item.workspaceId, itemId, userId, data);
}

export async function seedWorkspace(workspaceId: string, userId: string) {
	await ensureWorkspaceMembership(workspaceId, userId);

	const existingAreaCount = await prisma.area.count({ where: { workspaceId } });
	if (existingAreaCount > 0) {
		return { seeded: false, message: "Workspace already has data" };
	}

	await prisma.$transaction(async (tx) => {
		const area = await tx.area.create({
			data: {
				workspaceId,
				title: "Personal",
				slug: "personal",
				description: "Your personal area for organizing projects",
				createdById: userId,
			},
		});

		await tx.project.create({
			data: {
				areaId: area.id,
				title: "Getting Started",
				slug: "getting-started",
				description: "Your first project",
				status: "ACTIVE",
				createdById: userId,
			},
		});

		await tx.item.create({
			data: {
				workspaceId,
				title: "Welcome to HypeMind",
				type: "QUICK_NOTE",
				contentJson: { blocks: [] },
				metadata: {
					description: "",
					author: "HypeMind Web",
					source: null,
					tags: [],
				},
				isPinned: true,
				pinnedAt: new Date(),
				createdById: userId,
			},
		});
	});

	return { seeded: true, message: "Workspace seeded with defaults" };
}

export async function getInbox(workspaceId: string, filters: InboxFilters = {}) {
	const take = Math.min(Math.max(filters.limit ?? 25, 1), 100);

	const items = await prisma.item.findMany({
		where: {
			workspaceId,
			deletedAt: null,
			OR: [{ projectId: null }],
		},
		orderBy: { updatedAt: "desc" },
		take: take + 1,
		...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
		select: {
			id: true,
			workspaceId: true,
			projectId: true,
			title: true,
			type: true,
			contentJson: true,
			url: true,
			metadata: true,
			isPinned: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	const hasMore = items.length > take;
	const pageItems = hasMore ? items.slice(0, take) : items;

	return {
		items: pageItems,
		nextCursor: hasMore ? pageItems[pageItems.length - 1]?.id ?? null : null,
	};
}

export async function getProjects(workspaceId: string) {
	return prisma.project.findMany({
		where: { area: { workspaceId } },
		orderBy: { updatedAt: "desc" },
		select: {
			id: true,
			title: true,
			slug: true,
			description: true,
			status: true,
			_count: { select: { items: true } },
		},
	});
}

export async function getProject(projectId: string, userId: string) {
	const project = await prisma.project.findFirst({
		where: {
			id: projectId,
			area: { workspace: { members: { some: { userId } } } },
		},
		include: {
			area: {
				select: {
					id: true,
					title: true,
					workspaceId: true,
				},
			},
			items: {
				where: { deletedAt: null },
				orderBy: { updatedAt: "desc" },
				select: {
					id: true,
					title: true,
					type: true,
					isPinned: true,
					updatedAt: true,
				},
			},
			_count: { select: { items: true } },
		},
	});

	if (!project) {
		throw new NotFoundError("Project not found");
	}

	return project;
}

export async function getArea(areaId: string, userId: string) {
	const area = await prisma.area.findFirst({
		where: {
			id: areaId,
			workspace: { members: { some: { userId } } },
		},
		include: {
			projects: {
				orderBy: { updatedAt: "desc" },
				include: {
					_count: { select: { items: true } },
				},
			},
			_count: { select: { projects: true } },
		},
	});

	if (!area) {
		throw new NotFoundError("Area not found");
	}

	return area;
}

export async function getItem(id: string, userId: string) {
	const item = await prisma.item.findFirst({
		where: {
			id,
			deletedAt: null,
			workspace: { members: { some: { userId } } },
		},
		include: {
			project: { select: { id: true, title: true } },
			tags: { include: { tag: true } },
			assets: true,
		},
	});

	if (!item) {
		throw new NotFoundError("Item not found");
	}

	void prisma.interactionEvent.create({
		data: {
			userId,
			workspaceId: item.workspaceId,
			itemId: item.id,
			action: "OPEN",
		},
	});

	const tagNames = item.tags.map((entry) => entry.tag.name);
	const existingMetadata =
		(item.metadata as Record<string, unknown> | null | undefined) ?? null;

	return {
		...item,
		metadata: normalizeMetadata(existingMetadata, item.url, "HypeMind Web", tagNames),
	};
}

export async function pinItem(id: string, userId: string, isPinned: boolean) {
	const item = await prisma.item.findFirst({
		where: {
			id,
			deletedAt: null,
			workspace: { members: { some: { userId } } },
		},
		select: { workspaceId: true },
	});

	if (!item) {
		throw new NotFoundError("Item not found");
	}

	const updated = await prisma.item.update({
		where: { id },
		data: {
			isPinned,
			pinnedAt: isPinned ? new Date() : null,
		},
		select: { isPinned: true },
	});

	await prisma.interactionEvent.create({
		data: {
			userId,
			workspaceId: item.workspaceId,
			itemId: id,
			action: "PIN",
			meta: { isPinned },
		},
	});

	return updated;
}

export async function archiveItem(id: string, userId: string) {
	const item = await prisma.item.findFirst({
		where: {
			id,
			deletedAt: null,
			workspace: { members: { some: { userId } } },
		},
		select: { id: true },
	});

	if (!item) {
		throw new NotFoundError("Item not found");
	}

	return prisma.item.update({
		where: { id },
		data: { deletedAt: new Date() },
		select: { id: true, deletedAt: true },
	});
}

export async function createArea(workspaceId: string, userId: string, data: CreateAreaData) {
	await ensureWorkspaceMembership(workspaceId, userId);

	const area = await prisma.area.create({
		data: {
			workspaceId,
			title: data.title.trim(),
			slug: data.slug?.trim() || slugify(data.title),
			description: data.description?.trim() || null,
			createdById: userId,
		},
		include: {
			_count: { select: { projects: true } },
		},
	});

	return area;
}

export async function createProject(areaId: string, userId: string, data: CreateProjectData) {
	const workspaceId = await getWorkspaceIdForArea(areaId, userId);
	await ensureWorkspaceMembership(workspaceId, userId);

	const project = await prisma.project.create({
		data: {
			areaId,
			title: data.title.trim(),
			slug: data.slug?.trim() || slugify(data.title),
			description: data.description?.trim() || null,
			createdById: userId,
		},
		include: {
			_count: { select: { items: true } },
			area: { select: { id: true, title: true, workspaceId: true } },
		},
	});

	return project;
}

export async function getAreaProjects(areaId: string, userId: string) {
	const workspaceId = await getWorkspaceIdForArea(areaId, userId);
	await ensureWorkspaceMembership(workspaceId, userId);

	return prisma.project.findMany({
		where: { areaId },
		orderBy: { updatedAt: "desc" },
		include: {
			_count: { select: { items: true } },
			area: { select: { id: true, title: true, workspaceId: true } },
		},
	});
}

export async function getProjectItems(projectId: string, userId: string) {
	const workspaceId = await getWorkspaceIdForProject(projectId, userId);
	await ensureWorkspaceMembership(workspaceId, userId);

	return prisma.item.findMany({
		where: { projectId, deletedAt: null },
		orderBy: { updatedAt: "desc" },
		select: {
			id: true,
			workspaceId: true,
			projectId: true,
			title: true,
			type: true,
			isPinned: true,
			updatedAt: true,
			createdAt: true,
			contentJson: true,
			url: true,
			metadata: true,
		},
	});
}
