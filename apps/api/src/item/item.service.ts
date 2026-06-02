import { Prisma, prisma } from "@repo/db";

export async function getInboxItemsService(workspaceId: string) {
  const items = await prisma.item.findMany({
    where: {
      workspaceId,
      projectId: null,
      status: "ACTIVE",
      deletedAt: null,
      type: {
        not: "PAGE",
      },
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    updatedAt: item.updatedAt.toISOString(),
    content: item.contentString,
    tags: item.tags.map((t) => t.tag.name),
    isPinned: item.isPinned,
  }));
}

export async function getPagesService(workspaceId: string) {
  const items = await prisma.item.findMany({
    where: {
      workspaceId,
      type: "PAGE",
      status: "ACTIVE",
      deletedAt: null,
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    updatedAt: item.updatedAt.toISOString(),
    content: item.contentString,
    tags: item.tags.map((t) => t.tag.name),
    isPinned: item.isPinned,
  }));
}

export async function createPageService(workspaceId: string, userId: string, payload: { title?: string; contentJson?: any; contentString?: string; projectId?: string }) {
  const item = await prisma.item.create({
    data: {
      workspaceId,
      projectId: payload.projectId || null,
      createdById: userId,
      type: "PAGE",
      title: payload.title || "Untitled Page",
      contentJson: payload.contentJson || { type: "doc", content: [{ type: "paragraph" }] },
      contentString: payload.contentString || "",
    },
  });
  return item;
}

export async function updateItemService(
  itemId: string,
  workspaceId: string,
  payload: { projectId?: string; isPinned?: boolean; deletedAt?: Date | string | null; title?: string; contentJson?: any; contentString?: string }
) {
  const data: Prisma.ItemUpdateInput = {};
  if (payload.projectId !== undefined) {
    data.project = { connect: { id: payload.projectId } };
  }
  if (payload.isPinned !== undefined) {
    data.isPinned = payload.isPinned;
    data.pinnedAt = payload.isPinned ? new Date() : null;
  }
  if (payload.deletedAt !== undefined) {
    data.deletedAt = payload.deletedAt;
  }
  if (payload.title !== undefined) {
    data.title = payload.title;
  }
  if (payload.contentJson !== undefined) {
    data.contentJson = payload.contentJson;
  }
  if (payload.contentString !== undefined) {
    data.contentString = payload.contentString;
  }

  const existing = await prisma.item.findFirst({
    where: { id: itemId, workspaceId },
  });
  if (!existing) throw new Error("Item not found");

  const updatedItem = await prisma.item.update({
    where: {
      id: itemId,
    },
    data,
  });

  return updatedItem;
}

export const duplicateItemService = async (
  userId: string,
  workspaceId: string,
  itemId: string
) => {
  const originalItem = await prisma.item.findFirst({
    where: { id: itemId, workspaceId },
    include: { tags: { include: { tag: true } } },
  });

  if (!originalItem) {
    throw new Error("Item not found");
  }

  const titleMatch = (originalItem.title || "Untitled").match(/^(.*) \((\d+)\)$/);
  let baseTitle = originalItem.title || "Untitled";
  if (titleMatch) {
    baseTitle = titleMatch[1];
  } else {
    const copyMatch = baseTitle.match(/^(.*) \(Copy\)$/);
    if (copyMatch) baseTitle = copyMatch[1];
  }

  const existingItems = await prisma.item.findMany({
    where: {
      workspaceId,
      type: originalItem.type,
      title: { startsWith: baseTitle },
    },
    select: { title: true },
  });

  let maxNum = 0;
  for (const p of existingItems) {
    if (p.title === baseTitle) {
      // base exists
    } else {
      const escapedBase = baseTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = (p.title || "").match(new RegExp(`^${escapedBase} \\((\\d+)\\)$`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  const newTitle = `${baseTitle} (${maxNum + 1})`;

  const duplicatedItem = await prisma.$transaction(async (tx) => {
    const created = await tx.item.create({
      data: {
        title: newTitle,
        contentString: originalItem.contentString,
        contentJson: originalItem.contentJson
          ? JSON.parse(JSON.stringify(originalItem.contentJson))
          : undefined,
        type: originalItem.type,
        status: originalItem.status,
        isPinned: originalItem.isPinned,
        workspaceId,
        createdById: userId,
        projectId: originalItem.projectId,
      },
    });

    for (const { tag } of originalItem.tags) {
      const dbTag = await tx.tag.upsert({
        where: { workspaceId_name: { workspaceId, name: tag.name } },
        update: {},
        create: { workspaceId, name: tag.name },
      });
      await tx.itemTag.create({
        data: { itemId: created.id, tagId: dbTag.id },
      });
    }

    return tx.item.findFirstOrThrow({
      where: { id: created.id },
      include: { tags: { include: { tag: true } } }
    });
  });

  return {
    id: duplicatedItem.id,
    title: duplicatedItem.title,
    type: duplicatedItem.type,
    updatedAt: duplicatedItem.updatedAt.toISOString(),
    content: duplicatedItem.contentString,
    tags: duplicatedItem.tags.map((t) => t.tag.name),
    isPinned: duplicatedItem.isPinned,
  };
};
