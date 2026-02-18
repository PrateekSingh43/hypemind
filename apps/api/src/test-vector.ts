import { prisma } from "@repo/db";

async function verifyVectorOperations() {
  const testWorkspaceId = "test-workspace-" + Date.now();
  const testItemId = "test-item-" + Date.now();
  const testVectorId = "test-vector-" + Date.now();
  
  const vectorArray = Array(1536).fill(0.01);
  const vectorString = `[${vectorArray.join(',')}]`;

  await prisma.workspace.create({
    data: {
      id: testWorkspaceId,
      name: "Test Workspace",
      slug: "test-workspace-" + Date.now()
    }
  });

  await prisma.item.create({
    data: {
      id: testItemId,
      workspaceId: testWorkspaceId,
      type: "PAGE"
    }
  });

  await prisma.$executeRaw`
    INSERT INTO "VectorEmbedding" (id, "itemId", "chunkIndex", embedding, status)
    VALUES (${testVectorId}, ${testItemId}, 0, ${vectorString}::vector, 'READY'::"EmbeddingState")
  `;

  const result = await prisma.$queryRaw`
    SELECT id, "itemId", embedding::text FROM "VectorEmbedding" 
    WHERE id = ${testVectorId}
  `;

  console.log(result);

  await prisma.workspace.delete({
    where: { id: testWorkspaceId }
  });
}

verifyVectorOperations().catch(console.error);