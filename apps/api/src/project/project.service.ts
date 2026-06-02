import { Prisma, prisma } from "@repo/db";

function makeBaseSlug(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function generateProjectSlug(tx: Prisma.TransactionClient, baseSlug: string, workspaceId: string) {
  let slug = baseSlug;
  let counter = 1;
  while (await tx.project.findUnique({ where: { workspaceId_slug: { workspaceId, slug } } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

export async function getProjectsService(workspaceId: string, all?: boolean) {
  const projects = await prisma.project.findMany({
    where: {
      workspaceId,
      status: "ACTIVE",
      deletedAt: null,
      ...(all ? {} : { areaId: null }),
    },
    orderBy: { createdAt: "desc" },
  });

  return projects;
}


export async function getProjectByIdService(workspaceId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId,
    },
    include: {
      area: true,
      items: {
        where: { deletedAt: null },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!project) return null;

  return {
    ...project,
    items: project.items.map((item) => ({
      ...item,
      tags: item.tags.map((t) => t.tag.name),
    })),
  };
}

export async function createProjectService({
  userId,
  workspaceId,
  title,
  description,
  tags,
  areaId,
}: {
  userId: string;
  workspaceId: string;
  title: string;
  description: string | null;
  tags: string[];
  areaId: string | null;
}) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const baseSlug = makeBaseSlug(title) || "project";
    const slug = await generateProjectSlug(tx, baseSlug, workspaceId);

    const project = await tx.project.create({
      data: {
        workspaceId,
        areaId,
        title,
        slug,
        description,
        createdById: userId,
      },
    });

    return project;
  });
}

export async function updateProjectService(
  workspaceId: string,
  projectId: string,
  data: { 
    areaId?: string | null; 
    isPinned?: boolean; 
    pinnedAt?: Date | null;
    title?: string;
    description?: string | null;
    tags?: string[];
    deletedAt?: Date | null;
  }
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
  });
  if (!project) return null;

  return prisma.project.update({
    where: { id: projectId },
    data,
  });
}

export async function duplicateProjectService(
  userId: string,
  workspaceId: string,
  projectId: string
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const originalProject = await tx.project.findFirst({
      where: { id: projectId, workspaceId },
      include: { items: true },
    });

    if (!originalProject) {
      throw new Error("Project not found");
    }

    const titleMatch = originalProject.title.match(/^(.*) \((\d+)\)$/);
    let baseTitle = originalProject.title;
    if (titleMatch) {
      baseTitle = titleMatch[1];
    } else {
      // Also check if it ends with " (Copy)" and remove it to be clean
      const copyMatch = originalProject.title.match(/^(.*) \(Copy\)$/);
      if (copyMatch) {
        baseTitle = copyMatch[1];
      }
    }

    const existingProjects = await tx.project.findMany({
      where: {
        workspaceId,
        title: {
          startsWith: baseTitle,
        },
      },
      select: { title: true },
    });

    let maxNum = 0;
    let hasExactBase = false;

    for (const p of existingProjects) {
      if (p.title === baseTitle) {
        hasExactBase = true;
      } else {
        const escapedBase = baseTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const match = p.title.match(new RegExp(`^${escapedBase} \\((\\d+)\\)$`));
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    }

    // If maxNum is 0, we check if the base itself exists. If base exists, next is (1).
    // Actually, if we are duplicating, we always want at least (1).
    // If the highest is (N), we want (N+1).
    const newTitle = `${baseTitle} (${maxNum + 1})`;
    
    const baseSlug = makeBaseSlug(newTitle);
    const slug = await generateProjectSlug(tx, baseSlug, workspaceId);

    const newProject = await tx.project.create({
      data: {
        workspaceId,
        areaId: originalProject.areaId,
        title: newTitle,
        slug,
        description: originalProject.description,
        createdById: userId,
      },
    });

    // Duplicate all items
    if (originalProject.items && originalProject.items.length > 0) {
      const newItems = originalProject.items.map((item) => ({
        workspaceId,
        projectId: newProject.id,
        title: item.title,
        type: item.type,
        status: item.status,
        contentString: item.contentString,
        contentJson: item.contentJson ? JSON.parse(JSON.stringify(item.contentJson)) : null,
        url: item.url,
        metadata: item.metadata ? JSON.parse(JSON.stringify(item.metadata)) : null,
        createdById: userId,
      }));

      await tx.item.createMany({
        data: newItems,
      });
    }

    return newProject;
  });
}
