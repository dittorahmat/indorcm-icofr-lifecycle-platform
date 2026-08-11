import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

if (!(Promise as any).try) {
  (Promise as any).try = function (fn: Function, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

import { extractText } from 'unpdf';
import pino from 'pino';
import { getDb } from '../worker/db';
import { documents, documentChunks } from '../worker/db/schema';
import { eq, sql } from 'drizzle-orm';
import { AIService } from '../worker/services/ai-service';

const logger = pino({ name: 'reindex-empty-documents' });

async function main() {
  const dbUrl = process.env.DATABASE_URL || 'postgres://indorcm:indorcm_secure_pass@localhost:5432/indorcm_icofr';
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    logger.error('GEMINI_API_KEY is not configured in process.env');
    process.exit(1);
  }

  const db = getDb(dbUrl);
  logger.info('Connected to DB, querying documents needing re-indexing...');

  const allDocs = await db.select().from(documents);
  logger.info(`Found ${allDocs.length} total documents in database.`);

  const aiService = new AIService({
    provider: (process.env.AI_PROVIDER as any) || 'gemini',
    apiKey: apiKey,
    baseUrl: process.env.AI_BASE_URL,
    embeddingModel: process.env.AI_EMBEDDING_MODEL,
    chatModel: process.env.AI_CHAT_MODEL,
  });

  for (const doc of allDocs) {
    // Check existing chunks count
    const existingChunks = await db
      .select({ count: sql<number>`count(*)` })
      .from(documentChunks)
      .where(eq(documentChunks.documentId, doc.id));

    const chunkCount = Number(existingChunks[0]?.count || 0);
    logger.info(`Document: "${doc.title}" (ID: ${doc.id}) -> Content len: ${doc.content?.length || 0}, Chunks: ${chunkCount}`);

    let textContent = doc.content || '';

    // If text content is empty or 0 chunks exist, attempt file extraction
    if ((!textContent || textContent.trim().length === 0 || chunkCount === 0) && doc.fileUrl) {
      logger.info(`Attempting file text extraction for document "${doc.title}" from fileUrl: ${doc.fileUrl}`);
      
      const potentialPaths = [
        path.resolve(process.cwd(), doc.fileUrl),
        path.resolve(process.cwd(), 'uploads', doc.fileUrl),
        path.resolve(process.cwd(), 'docs', doc.title + '.pdf'),
        path.resolve(process.cwd(), 'docs', doc.title),
      ];

      let fileBuffer: Buffer | null = null;
      for (const p of potentialPaths) {
        if (existsSync(p)) {
          logger.info(`Found file at: ${p}`);
          fileBuffer = await fs.readFile(p);
          break;
        }
      }

      if (fileBuffer) {
        try {
          const extracted = await extractText(new Uint8Array(fileBuffer));
          textContent = Array.isArray(extracted.text) ? extracted.text.join('\n') : (extracted.text || '');
          logger.info(`Successfully extracted ${textContent.length} characters from file.`);
          
          // Update documents table content
          await db
            .update(documents)
            .set({ content: textContent })
            .where(eq(documents.id, doc.id));
        } catch (err: any) {
          logger.error(`Failed to extract text from PDF: ${err.message}`);
        }
      } else {
        logger.warn(`Could not locate local physical file for document ${doc.id}`);
      }
    }

    if (textContent && textContent.trim().length > 0 && chunkCount === 0) {
      logger.info(`Generating chunks and embeddings for document "${doc.title}"...`);
      const chunks = AIService.splitIntoChunks(textContent);
      logger.info(`Split text into ${chunks.length} chunks.`);

      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = chunks[i];
        try {
          const embedding = await aiService.generateEmbedding(chunkContent);
          await db.insert(documentChunks).values({
            id: crypto.randomUUID(),
            organizationId: doc.organizationId,
            documentId: doc.id,
            content: chunkContent,
            embedding,
            ftsTokens: sql`to_tsvector('indonesian', ${chunkContent})`,
            metadata: { pagePart: i + 1 },
          });
          logger.info(`Created chunk ${i + 1}/${chunks.length} for doc ${doc.id}`);
          if (chunks.length > 1) await new Promise(r => setTimeout(r, 100));
        } catch (embErr: any) {
          logger.error(`Failed to generate embedding for chunk ${i + 1}: ${embErr.message}`);
        }
      }
      logger.info(`Finished re-indexing document "${doc.title}".`);
    }
  }

  logger.info('Re-indexing process finished successfully!');
}

main().catch(err => {
  logger.error(err, 'Re-indexing failed:');
  process.exit(1);
});
