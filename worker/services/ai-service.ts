import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { sql } from "drizzle-orm";
import { documentChunks, documents } from "../db/schema";
import type { DrizzleDb } from "../db";
import { corpusMatch, corpusRank, substringPattern } from "./search-patterns";
import {
  buildEmbeddingCacheKey,
  buildRetrievalCacheKey,
  resolveAiCacheTtlMs,
  MemoryAiCacheStore,
} from "@shared/ai-cache";
import type { AiCacheStore, AiCacheVersions } from "@shared/ai-cache";

export type AIProvider = "gemini" | "openai-compatible";

export interface RetrievalRow {
  id: string;
  content: string;
  title: string;
  category: string;
  score: number;
}

export interface HybridSearchQueryDeps {
  store?: AiCacheStore;
  runQuery?: (input: { orgId: string; query: string; limit: number }) => Promise<RetrievalRow[]>;
}

/** Phase-2 placeholder: process-memory caches. T4 promotes to Postgres. */
const aiEmbeddingCache = new MemoryAiCacheStore();
const aiRetrievalCache = new MemoryAiCacheStore();

/** Shared suggest response cache (one per process; keyed per org + versions). */
export const suggestResponseCache = new MemoryAiCacheStore();

export function clearAiServiceCaches(): void {
  aiEmbeddingCache.clear();
  aiRetrievalCache.clear();
  suggestResponseCache.clear();
}

/** Per-org invalidation: KB document change or new Approved simulation. */
export function invalidateAiCachesForOrg(orgId: string): number {
  const prefix = `${orgId}:`;
  return (
    aiEmbeddingCache.invalidateByPrefix(prefix) +
    aiRetrievalCache.invalidateByPrefix(prefix) +
    suggestResponseCache.invalidateByPrefix(prefix)
  );
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  embeddingModel?: string;
  chatModel?: string;
  cacheScope?: { orgId: string; kbVersion?: string; simulationId?: string };
}

export class AIService {
  private config: AIConfig;
  private genAI?: GoogleGenerativeAI;

  /** Last-call cache flags for audit/response labelling. */
  lastEmbeddingCacheHit = false;
  lastRetrievalCacheHit = false;

  constructor(config: AIConfig) {
    this.config = config;
    if (config.provider === "gemini") {
      this.genAI = new GoogleGenerativeAI(config.apiKey);
    }
  }

  private cacheVersions(): AiCacheVersions {
    return {
      kbVersion: this.config.cacheScope?.kbVersion ?? "",
      simulationId: this.config.cacheScope?.simulationId ?? "",
    };
  }

  /**
   * Utility to call a function with exponential backoff and jitter.
   */
  async callWithRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
    let delay = 2500;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        const isRateLimit = err.message?.includes("429") || err.status === 429 || err.message?.includes("Quota exceeded");
        const isRetryableError = isRateLimit || err.status >= 500;
        
        if (isRetryableError && i < maxRetries - 1) {
          // Parse Google API retryDelay if available (e.g., "retryDelay":"2s" or "Please retry in 2.84s")
          let waitTime = delay;
          const match = err.message?.match(/Please retry in ([\d.]+)s/) || err.message?.match(/"retryDelay":"(\d+)s"/);
          if (match && match[1]) {
            waitTime = (parseFloat(match[1]) * 1000) + 500;
          } else {
            waitTime = delay + (Math.random() * 1000);
          }

          console.warn(`[AI Service] 429 Rate Limit / Retryable error detected. Waiting ${Math.round(waitTime)}ms before retry (${i + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          delay *= 2;
          continue;
        }
        throw err;
      }
    }
    throw new Error("Max retries reached");
  }

  /**
   * Generates a vector embedding. Identical text per organization reuses the
   * AI Embedding Cache without calling the provider twice.
   */
  async generateEmbedding(text: string, opts?: { orgId?: string }): Promise<number[]> {
    this.lastEmbeddingCacheHit = false;
    const orgId = opts?.orgId ?? this.config.cacheScope?.orgId;
    const versions = this.cacheVersions();
    if (orgId) {
      const model = this.config.embeddingModel
        ?? (this.config.provider === "gemini" ? "gemini-embedding-2" : "nomic-embed-text");
      const key = buildEmbeddingCacheKey(orgId, text, model);
      const hit = aiEmbeddingCache.get(key, versions);
      const values = (hit?.payload as { values?: unknown } | null)?.values;
      if (Array.isArray(values)) {
        this.lastEmbeddingCacheHit = true;
        return values as number[];
      }
      const fresh = await this.fetchEmbeddingFromProvider(text);
      aiEmbeddingCache.set(key, { payload: { values: fresh } }, resolveAiCacheTtlMs("embedding", {}), versions);
      return fresh;
    }
    return this.fetchEmbeddingFromProvider(text);
  }

  /** Provider call behind the embedding cache. Overridable in tests. */
  protected async fetchEmbeddingFromProvider(text: string): Promise<number[]> {
    if (this.config.provider === "gemini") {
      return this.callWithRetry(async () => {
        const model = this.genAI!.getGenerativeModel({ 
          model: this.config.embeddingModel || "gemini-embedding-2" 
        });
        const result = await model.embedContent({
          content: { role: "user", parts: [{ text }] },
          outputDimensionality: 768,
        } as any);
        return result.embedding.values;
      });
    } else {
      // OpenAI-compatible (Ollama, vLLM, etc.)
      return this.callWithRetry(async () => {
        const response = await fetch(`${this.config.baseUrl}/embeddings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.embeddingModel || "nomic-embed-text",
            input: text,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`OpenAI Embedding Error: ${response.status} - ${error}`);
        }

        const data: any = await response.json();
        // Support both OpenAI and Ollama formats
        const embedding = data.data?.[0]?.embedding || data.embedding;
        
        if (!embedding) throw new Error("No embedding found in response");
        
        // Basic validation for pgvector dimensions (768)
        if (embedding.length !== 768) {
          console.warn(`[AI Service] Warning: Received embedding with ${embedding.length} dims, expected 768. Search may fail.`);
        }
        
        return embedding;
      });
    }
  }

  /**
   * Generates a chat response. Supports multimodal messages and structured JSON output.
   */
  async generateChatResponse(params: {
    systemInstruction?: string;
    messages: Array<{ role: string; content: string | any[] }>;
    tools?: any[];
    responseSchema?: any;
  }): Promise<{ content: string; toolCalls?: any[] }> {
    // Helper to parse data URI into base64 data and mimeType
    const parseDataUri = (dataUri: string) => {
      const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error("Invalid image data URI format");
      return { mimeType: match[1], data: match[2] };
    };

    // Helper to map content (string or array) to Gemini Parts format
    const mapContentToGeminiParts = (content: string | any[]): Part[] => {
      if (typeof content === "string") {
        return [{ text: content }];
      }
      return content.map(part => {
        if (part.type === "text") {
          return { text: part.text };
        }
        if (part.type === "image_url" && part.image_url?.url) {
          try {
            const { mimeType, data } = parseDataUri(part.image_url.url);
            return {
              inlineData: { data, mimeType }
            };
          } catch (e: any) {
            console.error("[AI Service] Failed to parse image URI:", e.message);
            return { text: "[Image Parse Failed]" };
          }
        }
        return { text: "" };
      }) as Part[];
    };

    if (this.config.provider === "gemini") {
      const model = this.genAI!.getGenerativeModel({
        model: this.config.chatModel || "gemini-2.5-flash",
        systemInstruction: params.systemInstruction,
        tools: params.tools ? [{ functionDeclarations: params.tools }] : undefined,
        generationConfig: {
          maxOutputTokens: 65536,
          ...(params.responseSchema ? {
            responseMimeType: "application/json",
            responseSchema: params.responseSchema,
          } : {})
        },
      });

      const chat = model.startChat({
        history: params.messages.slice(0, -1).map(m => ({
          role: m.role === "user" ? "user" : "model",
          parts: mapContentToGeminiParts(m.content),
        })),
      });

      const lastMessage = params.messages[params.messages.length - 1].content;
      const lastMessageParts = mapContentToGeminiParts(lastMessage);
      const result = await this.callWithRetry(async () => {
        return await chat.sendMessage(lastMessageParts);
      });
      const response = await result.response;
      
      return {
        content: response.text(),
        toolCalls: response.functionCalls(),
      };
    } else {
      // OpenAI-compatible (supports both text and multimodal content array formats)
      const messages = [];
      if (params.systemInstruction) {
        messages.push({ role: "system", content: params.systemInstruction });
      }
      messages.push(...params.messages);

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.chatModel || "gemma4",
          messages,
          tools: params.tools?.map(t => ({ type: "function", function: t })),
          response_format: params.responseSchema ? {
            type: "json_object"
          } : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI Chat Error: ${response.status} - ${error}`);
      }

      const data: any = await response.json();
      const choice = data.choices[0];
      
      return {
        content: choice.message.content || "",
        toolCalls: choice.message.tool_calls?.map((tc: any) => ({
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments),
        })),
      };
    }
  }

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

  // NOTE: tool-path chat responses are never cached — tool outputs read live
  // application data (scoping simulations, testing stats, deficiencies) that
  // must not go stale. Prefix-cost savings arrive via embedding + retrieval
  // caches; Line 1 materiality redaction stays upstream of any cache read.
  async hybridSearch(
    db: DrizzleDb | undefined,
    orgId: string,
    query: string,
    queryVector: number[],
    limit = 5,
    deps?: HybridSearchQueryDeps
  ): Promise<RetrievalRow[]> {
    const versions = this.cacheVersions();
    this.lastRetrievalCacheHit = false;
    const key = buildRetrievalCacheKey(orgId, `${query}::${limit}`, versions);
    const store = deps?.store ?? aiRetrievalCache;
    const hit = store.get(key, versions);
    const cached = hit?.payload as { rows?: unknown } | null;
    if (cached && Array.isArray(cached.rows)) {
      this.lastRetrievalCacheHit = true;
      return cached.rows as RetrievalRow[];
    }
    const fresh = deps?.runQuery
      ? await deps.runQuery({ orgId, query, limit })
      : await this.runHybridSearchQuery(db, orgId, query, queryVector, limit);
    store.set(key, { payload: { rows: fresh } }, resolveAiCacheTtlMs("retrieval", {}), versions);
    return fresh;
  }

  protected async runHybridSearchQuery(
    db: DrizzleDb | undefined,
    orgId: string,
    query: string,
    queryVector: number[],
    limit: number
  ): Promise<RetrievalRow[]> {
    if (!db) throw new Error("hybridSearch requires a database handle");
    const result = await db.execute(sql`
      WITH vector_search AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> ${sql.raw(`'${JSON.stringify(queryVector)}'::vector`)}) as rank
        FROM icofr.document_chunks
        WHERE organization_id = ${orgId}
        ORDER BY embedding <=> ${sql.raw(`'${JSON.stringify(queryVector)}'::vector`)}
        LIMIT 50
      ),
      text_search AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY ${corpusRank(sql.raw('fts_tokens'), query)} DESC) as rank
        FROM icofr.document_chunks
        WHERE organization_id = ${orgId}
        AND ${corpusMatch(sql.raw('fts_tokens'), query)}
        ORDER BY rank
        LIMIT 50
      ),
      title_search AS (
        SELECT c.id, 1 as rank
        FROM icofr.document_chunks c
        JOIN icofr.documents d ON c.document_id = d.id
        WHERE c.organization_id = ${orgId}
        AND d.title ILIKE ${substringPattern(query)}
        LIMIT 50
      )
      SELECT 
        c.id,
        c.content,
        d.title,
        d.category,
        COALESCE(1.0 / (60 + v.rank), 0.0) + 
        COALESCE(1.0 / (60 + t.rank), 0.0) +
        COALESCE(1.0 / (30 + ts.rank), 0.0) AS score
      FROM icofr.document_chunks c
      JOIN icofr.documents d ON c.document_id = d.id
      LEFT JOIN vector_search v ON c.id = v.id
      LEFT JOIN text_search t ON c.id = t.id
      LEFT JOIN title_search ts ON c.id = ts.id
      WHERE v.id IS NOT NULL OR t.id IS NOT NULL OR ts.id IS NOT NULL
      ORDER BY score DESC
      LIMIT ${limit}
    `);

    const rows = Array.isArray(result) ? result : (result as any)?.rows || [];
    return rows as unknown as RetrievalRow[];
  }

  static situationalChunking(content: string, metadata: { title: string; category?: string }): string {
    const header = `--- SOURCE: ${metadata.title} ${metadata.category ? `(${metadata.category})` : ""} ---\n`;
    return `${header}${content}`;
  }
}
