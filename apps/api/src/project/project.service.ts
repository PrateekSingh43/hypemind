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

export async function getProjectsService(workspaceId: string) {
  const projects = await prisma.project.findMany({
    where: {
      workspaceId,
      status: "ACTIVE",
      areaId: null,
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
  data: { areaId?: string | null }
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
