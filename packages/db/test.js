const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.item.findMany({
      where: { workspaceId: 'fake', projectId: null, status: 'ACTIVE' },
      include: { tags: { include: { tag: true } } },
      orderBy: { updatedAt: 'desc' }
    });
    console.log('items query works');
  } catch(e) {
    console.error('items query error:', e.message);
  }
}

main().finally(() => prisma.$disconnect());
