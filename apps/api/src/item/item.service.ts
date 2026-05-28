import { Prisma, prisma } from "@repo/db";

export async function getInboxItemsService(workspaceId: string) {
  const items = await prisma.item.findMany({
    where: {
      workspaceId,
      projectId: null,
      status: "ACTIVE",
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
  }));
}

export async function updateItemService(
  itemId: string,
  workspaceId: string,
  payload: { projectId?: string }
) {
  const data: Prisma.ItemUpdateInput = {};
  if (payload.projectId !== undefined) {
    data.project = { connect: { id: payload.projectId } };
  }

  const updatedItem = await prisma.item.update({
    where: {
      id: itemId,
      workspaceId, // security check
    },
    data,
  });

  return updatedItem;
}
