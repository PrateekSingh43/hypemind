import { Prisma, prisma } from "@repo/db";

export type TrashItem = {
  id: string;
  title: string;
  type: "AREA" | "PROJECT" | "ITEM" | "GLOBAL_PAGE";
  deletedAt: Date;
};

export async function getTrashService(workspaceId: string): Promise<TrashItem[]> {
  const [areas, projects, items] = await Promise.all([
    prisma.area.findMany({
      where: { workspaceId, deletedAt: { not: null } },
      select: { id: true, title: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.project.findMany({
      where: { workspaceId, deletedAt: { not: null } },
      select: { id: true, title: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.item.findMany({
      where: { workspaceId, deletedAt: { not: null } },
      select: { id: true, title: true, deletedAt: true, type: true },
      orderBy: { deletedAt: "desc" },
    }),
  ]);

  const trash: TrashItem[] = [
    ...areas.map((a) => ({ id: a.id, title: a.title, type: "AREA" as const, deletedAt: a.deletedAt! })),
    ...projects.map((p) => ({ id: p.id, title: p.title, type: "PROJECT" as const, deletedAt: p.deletedAt! })),
    ...items.map((i) => ({ id: i.id, title: i.title || "Untitled", type: i.type === "PAGE" ? "GLOBAL_PAGE" as const : "ITEM" as const, deletedAt: i.deletedAt! })),
  ];

  return trash.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
}

export async function restoreTrashItemService(workspaceId: string, id: string, type: "AREA" | "PROJECT" | "ITEM" | "GLOBAL_PAGE") {
  if (type === "AREA") {
    return prisma.area.updateMany({ where: { id, workspaceId }, data: { deletedAt: null } });
  } else if (type === "PROJECT") {
    return prisma.project.updateMany({ where: { id, workspaceId }, data: { deletedAt: null } });
  } else if (type === "ITEM" || type === "GLOBAL_PAGE") {
    return prisma.item.updateMany({ where: { id, workspaceId }, data: { deletedAt: null } });
  }
  return null;
}

export async function permanentDeleteTrashItemService(workspaceId: string, id: string, type: "AREA" | "PROJECT" | "ITEM" | "GLOBAL_PAGE") {
  if (type === "AREA") {
    return prisma.area.deleteMany({ where: { id, workspaceId } });
  } else if (type === "PROJECT") {
    return prisma.project.deleteMany({ where: { id, workspaceId } });
  } else if (type === "ITEM" || type === "GLOBAL_PAGE") {
    return prisma.item.deleteMany({ where: { id, workspaceId } });
  }
  return null;
}
