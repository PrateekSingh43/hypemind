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
    },
    include: {
      projects: {
        where: {
          status: "ACTIVE"
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
