import { Prisma, prisma } from "@repo/db";

function makeBaseSlug(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function generateAreaSlug(tx: Prisma.TransactionClient, baseSlug: string, workspaceId: string) {
  let slug = baseSlug;
  let counter = 1;
  while (await tx.area.findUnique({ where: { workspaceId_slug: { workspaceId, slug } } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

export async function getAreasService(workspaceId: string) {
  const areas = await prisma.area.findMany({
    where: {
      workspaceId,
      deletedAt: null,
    },
    include: {
      projects: {
        where: {
          status: "ACTIVE",
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return areas;
}

export async function createAreaService({
  userId,
  workspaceId,
  title,
  description,
}: {
  userId: string;
  workspaceId: string;
  title: string;
  description: string | null;
}) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const baseSlug = makeBaseSlug(title) || "area";
    const slug = await generateAreaSlug(tx, baseSlug, workspaceId);

    const area = await tx.area.create({
      data: {
        workspaceId,
        title,
        slug,
        description,
        createdById: userId,
      },
    });

    return area;
  });
}

export async function updateAreaService(
  workspaceId: string,
  areaId: string,
  data: { title?: string; isPinned?: boolean; pinnedAt?: Date | null; deletedAt?: Date | string | null }
) {
  const area = await prisma.area.findFirst({
    where: { id: areaId, workspaceId },
  });
  if (!area) return null;

  const updateData: Prisma.AreaUpdateInput = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.isPinned !== undefined) {
    updateData.isPinned = data.isPinned;
    updateData.pinnedAt = data.isPinned ? new Date() : null;
  }
  if (data.deletedAt !== undefined) {
    updateData.deletedAt = data.deletedAt;
  }

  return prisma.$transaction(async (tx) => {
    if (updateData.deletedAt) {
      await tx.project.updateMany({
        where: { areaId },
        data: { areaId: null },
      });
    }

    return tx.area.update({
      where: { id: areaId },
      data: updateData,
    });
  });
}

export async function duplicateAreaService(
  userId: string,
  workspaceId: string,
  areaId: string
) {
  const originalArea = await prisma.area.findFirst({
    where: { id: areaId, workspaceId },
  });

  if (!originalArea) {
    throw new Error("Area not found");
  }

  const titleMatch = originalArea.title.match(/^(.*) \((\d+)\)$/);
  let baseTitle = originalArea.title;
  if (titleMatch) {
    baseTitle = titleMatch[1];
  } else {
    const copyMatch = baseTitle.match(/^(.*) \(Copy\)$/);
    if (copyMatch) baseTitle = copyMatch[1];
  }

  const existingAreas = await prisma.area.findMany({
    where: {
      workspaceId,
      title: { startsWith: baseTitle },
    },
    select: { title: true },
  });

  let maxNum = 0;
  for (const a of existingAreas) {
    if (a.title === baseTitle) {
      // Base exists
    } else {
      const escapedBase = baseTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = a.title.match(new RegExp(`^${escapedBase} \\((\\d+)\\)$`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  const newTitle = `${baseTitle} (${maxNum + 1})`;

  return prisma.$transaction(async (tx) => {
    const baseSlug = makeBaseSlug(newTitle) || "area";
    const slug = await generateAreaSlug(tx, baseSlug, workspaceId);

    const created = await tx.area.create({
      data: {
        workspaceId,
        title: newTitle,
        slug,
        description: originalArea.description,
        createdById: userId,
      },
    });
    return created;
  });
}
