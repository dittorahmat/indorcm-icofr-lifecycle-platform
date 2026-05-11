import { AIService } from "../worker/services/ai-service";
import { getDb } from "../worker/db";
import { documents, documentChunks } from "../worker/db/schema";
import { eq, sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

async function backfill() {
  console.log("🚀 Starting granular embedding backfill...");
  
  const db = getDb(DATABASE_URL);
  const aiService = new AIService(GEMINI_API_KEY);

  // 1. Get all documents
  const allDocs = await db.select().from(documents);

  console.log(`[Backfill] Processing ${allDocs.length} documents into chunks.`);

  for (const doc of allDocs) {
    if (!doc.content) continue;

    try {
      console.log(`[Backfill] Chunking: ${doc.title}...`);
      
      const chunks = AIService.splitIntoChunks(doc.content);
      console.log(`[Backfill] Generated ${chunks.length} chunks for ${doc.title}.`);

      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = chunks[i];
        
        // Check if chunk already exists to avoid duplication
        // (Simple check by matching content for this doc)
        const existing = await db.execute(sql`
          SELECT id FROM document_chunks 
          WHERE document_id = ${doc.id} 
          AND content = ${chunkContent} 
          LIMIT 1
        `);

        if (existing.rows.length > 0) {
          console.log(`[Backfill]   Skipping chunk ${i+1}/${chunks.length} (already exists)`);
          continue;
        }

        console.log(`[Backfill]   Embedding chunk ${i+1}/${chunks.length}...`);
        try {
          const embedding = await aiService.generateEmbedding(chunkContent);

          await db.insert(documentChunks).values({
            id: crypto.randomUUID(),
            organizationId: doc.organizationId,
            documentId: doc.id,
            content: chunkContent,
            embedding,
            ftsTokens: sql`to_tsvector('indonesian', ${chunkContent})`,
            metadata: { pagePart: i + 1 }
          });

          // Respect RPM limits: ~1.5s delay for ~40 RPM safe zone
          await new Promise(r => setTimeout(r, 1500));
        } catch (err: any) {
          console.error(`[Backfill] ❌ Error embedding chunk ${i+1}: ${err.message}`);
          // Wait longer on error
          await new Promise(r => setTimeout(r, 5000));
        }
      }

      console.log(`[Backfill] ✅ Success: ${doc.title}`);
    } catch (err: any) {
      console.error(`[Backfill] ❌ Failed: ${doc.title} - ${err.message}`);
    }
  }

  console.log("🏁 Granular backfill complete.");
}

backfill().catch(console.error);
