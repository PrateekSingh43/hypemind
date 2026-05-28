import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const projects = await prisma.project.findMany({
      where: { workspaceId: 'fake', status: 'ACTIVE', areaId: null },
      orderBy: { createdAt: 'desc' }
    });
    console.log('projects query works', projects);
  } catch(e) {
    console.error('projects query error:', e.message);
  }

  try {
    const items = await prisma.item.findMany({
      where: { workspaceId: 'fake', projectId: null, status: 'ACTIVE' },
      include: { tags: { include: { tag: true } } },
      orderBy: { updatedAt: 'desc' }
    });
    console.log('items query works', items);
  } catch(e) {
    console.error('items query error:', e.message);
  }
}

main().finally(() => prisma.$disconnect());
