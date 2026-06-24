import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { AIService } from "../worker/services/ai-service";
import { getDb } from "../worker/db";
import { documents, documentChunks, organization } from "../worker/db/schema";
import { eq, sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GUIDE_PATH = path.join(process.cwd(), "USAGE_GUIDE.md");
const DOC_ID = "SYSTEM_USAGE_GUIDE";
const SYSTEM_ORG_ID = "SYSTEM";

async function sync() {
  console.log("📖 Syncing USAGE_GUIDE.md to AI Knowledge Base...");

  if (!fs.existsSync(GUIDE_PATH)) {
    console.error("❌ USAGE_GUIDE.md not found!");
    process.exit(1);
  }

  const content = fs.readFileSync(GUIDE_PATH, "utf-8");
  const hash = crypto.createHash("sha256").update(content).digest("hex");

  const directUrl = DATABASE_URL.replace('-pooler', '');
  const db = getDb(directUrl);
  const aiService = new AIService({
    provider: (process.env.AI_PROVIDER as any) || "gemini",
    apiKey: GEMINI_API_KEY,
    baseUrl: process.env.AI_BASE_URL,
    embeddingModel: process.env.AI_EMBEDDING_MODEL,
  });

  // 1. Ensure SYSTEM organization exists (for RBAC consistency)
  await db.insert(organization).values({
    id: SYSTEM_ORG_ID,
    name: "System Wide",
    slug: "system",
    createdAt: new Date(),
  }).onConflictDoNothing();

  // 2. Check if doc exists and hash matches
  const existing = await db.select().from(documents).where(eq(documents.id, DOC_ID)).limit(1);

  if (existing.length > 0 && (existing[0].metadata as any)?.hash === hash) {
    console.log("✅ Usage guide is already up to date. Skipping sync.");
    return;
  }

  console.log("🔄 Changes detected or new document. Updating vector store...");

  // 3. Upsert document record
  const docData = {
    id: DOC_ID,
    organizationId: SYSTEM_ORG_ID,
    title: "Panduan Penggunaan IndoGRC Pro",
    type: "Internal",
    category: "Product Guide",
    content: content,
    metadata: { hash: hash },
    createdAt: new Date(),
  };

  if (existing.length > 0) {
    await db.update(documents).set(docData).where(eq(documents.id, DOC_ID));
  } else {
    await db.insert(documents).values(docData as any);
  }

  // 4. Implement "Delete & Replace" logic for chunks (Task 1.3)
  await db.delete(documentChunks).where(eq(documentChunks.documentId, DOC_ID));

  // 5. Chunking and Embedding (Task 1.4)
  // Markdown-aware chunking: split by sections (## headers)
  const sections = content.split(/\n## /).map((s, i) => i === 0 ? s : "## " + s);
  
  console.log(`[Sync] Generated ${sections.length} sections from guide.`);

  for (let i = 0; i < sections.length; i++) {
    const sectionContent = sections[i].trim();
    if (!sectionContent) continue;

    console.log(`[Sync]   Processing section ${i + 1}/${sections.length}...`);
    
    try {
      const embedding = await aiService.generateEmbedding(sectionContent);

      await db.insert(documentChunks).values({
        id: crypto.randomUUID(),
        organizationId: SYSTEM_ORG_ID,
        documentId: DOC_ID,
        content: sectionContent,
        embedding,
        ftsTokens: sql`to_tsvector('indonesian', ${sectionContent})`,
        metadata: { sectionIndex: i + 1 }
      });

      // Avoid rate limits: ~1s delay
      await new Promise(r => setTimeout(r, 1000));
    } catch (err: any) {
      console.error(`[Sync] ❌ Error processing section ${i + 1}: ${err.message}`);
    }
  }

  console.log("🏁 Sync complete. AI is now updated with the latest USAGE_GUIDE.md.");
}

sync().then(() => {
  process.exit(0);
}).catch(err => {
  console.error("❌ Fatal Sync Error:", err);
  process.exit(1);
});
