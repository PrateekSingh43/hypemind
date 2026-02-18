import "dotenv/config";
import { VoyageAIClient } from "voyageai";
import { prisma } from "@repo/db";

async function executeRAGRetrieval() {
  const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
  const textPayload = "PostgreSQL is a highly stable, open-source relational database.";
  const query = "Tell me about SQL databases.";

  // 1. Generate Embeddings
  const [docEmbed, queryEmbed] = await Promise.all([
    client.embed({ input: [textPayload], model: "voyage-4" }),
    client.embed({ input: [query], model: "voyage-4" })
  ]);

  const docVectorStr = `[${(docEmbed.data?.[0]?.embedding ?? []).join(',')}]`;
  const queryVectorStr = `[${(queryEmbed.data?.[0]?.embedding ?? []).join(',')}]`;


  
  const workspaceId = "rag-workspace";
  const itemId = "rag-item-" + Date.now();

  await prisma.workspace.upsert({
    where: { slug: workspaceId },
    update: {},
    create: { id: workspaceId, name: "RAG Workspace", slug: workspaceId }
  });

  await prisma.item.create({
    data: {
      id: itemId,
      workspaceId,
      type: "PAGE",
      title: "Database Documentation",
      contentJson: { text: textPayload } // Storing the raw data
    }
  });

  const vectorId = `vec-${Date.now()}`;
  await prisma.$executeRaw`
    INSERT INTO "VectorEmbedding" (id, "itemId", "chunkIndex", embedding, model, status)
    VALUES (${vectorId}, ${itemId}, 0, ${docVectorStr}::vector, 'voyage-4', 'READY'::"EmbeddingState")
  `;

  // 3. Retrieve Foreign Key via Vector Similarity
  const vectorMatches: any[] = await prisma.$queryRaw`
    SELECT "itemId", 1 - (embedding <=> ${queryVectorStr}::vector) AS similarity
    FROM "VectorEmbedding"
    ORDER BY embedding <=> ${queryVectorStr}::vector
    LIMIT 1
  `;

  const match = vectorMatches[0];

  // 4. Retrieve Original Data via Foreign Key
  const retrievedItem = await prisma.item.findUnique({
    where: { id: match.itemId },
    select: {
      title: true,
      contentJson: true
    }
  });

  console.log("--- DATABASE RETRIEVAL OUTPUT ---");
  console.log(`Query: ${query}`);
  console.log(`Vector Match Similarity: ${match.similarity.toFixed(4)}`);
  console.log(`Retrieved Document Title: ${retrievedItem?.title}`);
  
  // Extracting the exact string payload saved to the database
  const parsedContent = retrievedItem?.contentJson as { text: string };
  console.log(`Retrieved Data Payload: "${parsedContent.text}"`);
}

executeRAGRetrieval().catch(console.error);