import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const workspaceId = "test-workspace-id"; // just any string
  try {
    const areas = await prisma.area.findMany({
      where: { workspaceId, deletedAt: { not: null } },
      select: { id: true, title: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
      take: 1
    });
    console.log("Areas OK");
  } catch (e) {
    console.error("Areas Error:", e);
  }

  try {
    const projects = await prisma.project.findMany({
      where: { workspaceId, deletedAt: { not: null } },
      select: { id: true, title: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
      take: 1
    });
    console.log("Projects OK");
  } catch (e) {
    console.error("Projects Error:", e);
  }

  try {
    const items = await prisma.item.findMany({
      where: { workspaceId, deletedAt: { not: null } },
      select: { id: true, title: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
      take: 1
    });
    console.log("Items OK");
  } catch (e) {
    console.error("Items Error:", e);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
