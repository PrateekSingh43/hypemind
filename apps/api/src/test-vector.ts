import "dotenv/config";
import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse"; 
import { VoyageAIClient } from "voyageai";
import { prisma } from "@repo/db";

const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

async function permanentIngest(filePath: string) {
  console.log(`\n--- PERMANENT INGESTION START ---`);
  console.log(`📄 File: ${path.basename(filePath)}`);

  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  
  try {
    const result = await parser.getText();
    // Chunking by double newlines
    const chunks = result.text.split(/\n\s*\n/).filter((t) => t.trim().length > 20);
    
    console.log(`🧬 Generating embeddings for ${chunks.length} chunks...`);

    // 1. Create a permanent Workspace for these docs if it doesn't exist
    const workspaceId = "permanent-knowledge-base";
    await prisma.workspace.upsert({
      where: { slug: workspaceId },
      update: {},
      create: { 
        id: workspaceId, 
        name: "Company Knowledge Base", 
        slug: workspaceId 
      }
    });

    // 2. Process and Store
    for (let i = 0; i < chunks.length; i++) {
      const itemId = `doc-${Date.now()}-${i}`;
      
      // Get Embedding from Voyage-4
      const embed = await voyage.embed({ input: [chunks[i]], model: "voyage-4" });
      const vectorStr = `[${embed.data?.[0]?.embedding?.join(",")}]`;

      // Save the Text
      await prisma.item.create({
        data: {
          id: itemId,
          workspaceId: workspaceId,
          type: "PAGE",
          title: `${path.basename(filePath)} - Part ${i + 1}`,
          contentJson: { text: chunks[i] }
        }
      });

      // Save the Vector
      await prisma.$executeRaw`
        INSERT INTO "VectorEmbedding" (id, "itemId", "chunkIndex", embedding, model, status)
        VALUES (${"vec-" + itemId}, ${itemId}, ${i}, ${vectorStr}::vector, 'voyage-4', 'READY'::"EmbeddingState")
      `;
      
      process.stdout.write("."); // Progress indicator
    }

    console.log(`\n\n✅ SUCCESS: ${chunks.length} chunks are now stored permanently in Supabase.`);
    console.log(`Workspace: ${workspaceId}`);

  } catch (error) {
    console.error("❌ Ingestion failed:", error);
  } finally {
    await parser.destroy();
    await prisma.$disconnect();
  }
}

const pathArg = process.argv[2];
if (!pathArg) {
  console.error("Please provide a PDF path.");
  process.exit(1);
}

permanentIngest(pathArg);

