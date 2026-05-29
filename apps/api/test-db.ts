import { PrismaClient } from '@repo/db';
const prisma = new PrismaClient();

async function main() {
  try {
    const areas = await prisma.area.findMany();
    console.log("Areas found:", areas.length);
  } catch (err) {
    console.error("Database Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
