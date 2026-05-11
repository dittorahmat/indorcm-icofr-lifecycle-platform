import { GoogleGenerativeAI } from "@google/generative-ai";
import { sql } from "drizzle-orm";
import { documentChunks, documents } from "../db/schema";
import type { DrizzleDb } from "../db";

export class AIService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Utility to call a function with exponential backoff and jitter.
   * Target: 429 (Rate Limit) and 500+ errors.
   */
  async callWithRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
    let delay = 2000; // Start with 2s
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        const isRateLimit = err.message?.includes("429") || err.status === 429;
        const isRetryableError = isRateLimit || err.status >= 500;
        
        if (isRetryableError && i < maxRetries - 1) {
          const jitter = Math.random() * 1000;
          const waitTime = delay + jitter;
          console.warn(`[AI Service] Rate limited or error. Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          delay *= 2; // Exponential backoff
          continue;
        }
        throw err;
      }
    }
    throw new Error("Max retries reached");
  }

  /**
   * Generates a vector embedding for a given text using Gemini.
   * Model: gemini-embedding-2 (Configured to 768 dimensions)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    return this.callWithRetry(async () => {
      const model = this.genAI.getGenerativeModel({ model: "gemini-embedding-2" });
      const result = await model.embedContent({
        content: { role: "user", parts: [{ text }] },
        outputDimensionality: 768,
      } as any);
      return result.embedding.values;
    });
  }

  /**
   * Splits a long text into smaller chunks.
   * Target: ~3000 characters per chunk with some overlap.
   */
  static splitIntoChunks(text: string, chunkSize = 3000, overlap = 300): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = start + chunkSize;
      chunks.push(text.slice(start, end));
      start += (chunkSize - overlap);
    }
    return chunks;
  }

  /**
   * Performs a Hybrid Search (Semantic + Keyword) using Reciprocal Rank Fusion (RRF)
   * on the granular chunks table.
   */
  async hybridSearch(
    db: DrizzleDb,
    orgId: string,
    query: string,
    queryVector: number[],
    limit = 5
  ) {
    const result = await db.execute(sql`
      WITH vector_search AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> ${JSON.stringify(queryVector)}::vector) as rank
        FROM document_chunks
        WHERE organization_id = ${orgId}
        ORDER BY embedding <=> ${JSON.stringify(queryVector)}::vector
        LIMIT 50
      ),
      text_search AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank_cd(fts_tokens, websearch_to_tsquery('indonesian', ${query})) DESC) as rank
        FROM document_chunks
        WHERE organization_id = ${orgId}
        AND fts_tokens @@ websearch_to_tsquery('indonesian', ${query})
        ORDER BY rank
        LIMIT 50
      )
      SELECT 
        c.id,
        c.content,
        d.title,
        d.category,
        COALESCE(1.0 / (60 + v.rank), 0.0) + 
        COALESCE(1.0 / (60 + t.rank), 0.0) AS score
      FROM document_chunks c
      JOIN documents d ON c.document_id = d.id
      LEFT JOIN vector_search v ON c.id = v.id
      LEFT JOIN text_search t ON c.id = t.id
      WHERE v.id IS NOT NULL OR t.id IS NOT NULL
      ORDER BY score DESC
      LIMIT ${limit}
    `);

    return result.rows as unknown as {
      id: string;
      content: string;
      title: string;
      category: string;
      score: number;
    }[];
  }

  /**
   * Prepend situational context to a text chunk.
   */
  static situationalChunking(content: string, metadata: { title: string; category?: string }): string {
    const header = `--- SOURCE: ${metadata.title} ${metadata.category ? `(${metadata.category})` : ""} ---\n`;
    return `${header}${content}`;
  }
}
