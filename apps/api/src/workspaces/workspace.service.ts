import { Prisma, prisma } from "@repo/db";
import { BadRequestError } from "../errors/httpErrors";
import { generateUniqueSlug } from "../utils/workspace";

function makeBaseSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function listWorkspacesService(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: {
      role: true,
      joinedAt: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
  });

  return memberships.map((membership) => ({
    id: membership.workspace.id,
    name: membership.workspace.name,
    slug: membership.workspace.slug,
    role: membership.role,
    memberCount: membership.workspace._count.members,
    createdAt: membership.workspace.createdAt,
    joinedAt: membership.joinedAt,
  }));
}

export async function createWorkspaceService(userId: string, name: string) {
  const cleanName = name.trim();

  if (cleanName.length < 2) {
    throw new BadRequestError("Workspace name must be at least 2 characters");
  }

  if (cleanName.length > 80) {
    throw new BadRequestError("Workspace name must be 80 characters or less");
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const baseSlug = makeBaseSlug(cleanName) || "workspace";
    const slug = await generateUniqueSlug(tx, baseSlug);

    const workspace = await tx.workspace.create({
      data: {
        name: cleanName,
        slug,
        createdById: userId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: "OWNER",
      },
    });

    await tx.workspaceSetting.create({
      data: {
        workspaceId: workspace.id,
        prefs: {},
      },
    });

    return {
      ...workspace,
      role: "OWNER",
      memberCount: 1,
      joinedAt: workspace.createdAt,
    };
  });
}

export async function getWorkspaceBootstrapService(workspaceId: string) {
  const [inboxCount, recentItems] = await Promise.all([
    prisma.item.count({
      where: {
        workspaceId,
        status: "ACTIVE",
        projectId: null,
      },
    }),
    prisma.item.findMany({
      where: {
        workspaceId,
        status: "ACTIVE",
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    inboxCount,
    recentItems,
  };
}

export async function getPinnedItemsService(workspaceId: string) {
  const [areas, projects, items] = await Promise.all([
    prisma.area.findMany({
      where: {
        workspaceId,
        isPinned: true,
      },
      orderBy: { pinnedAt: "desc" },
    }),
    prisma.project.findMany({
      where: {
        workspaceId,
        isPinned: true,
        status: "ACTIVE",
      },
      orderBy: { pinnedAt: "desc" },
    }),
    prisma.item.findMany({
      where: {
        workspaceId,
        isPinned: true,
        status: "ACTIVE",
        deletedAt: null,
      },
      orderBy: { pinnedAt: "desc" },
    }),
  ]);

  return { areas, projects, items };
}
