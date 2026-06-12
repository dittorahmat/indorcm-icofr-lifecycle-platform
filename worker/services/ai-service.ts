import { GoogleGenerativeAI } from "@google/generative-ai";
import { sql } from "drizzle-orm";
import { documentChunks, documents } from "../db/schema";
import type { DrizzleDb } from "../db";

export type AIProvider = "gemini" | "openai-compatible";

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  embeddingModel?: string;
  chatModel?: string;
}

export class AIService {
  private config: AIConfig;
  private genAI?: GoogleGenerativeAI;

  constructor(config: AIConfig) {
    this.config = config;
    if (config.provider === "gemini") {
      this.genAI = new GoogleGenerativeAI(config.apiKey);
    }
  }

  /**
   * Utility to call a function with exponential backoff and jitter.
   */
  async callWithRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
    let delay = 2000;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        const isRateLimit = err.message?.includes("429") || err.status === 429;
        const isRetryableError = isRateLimit || err.status >= 500;
        
        if (isRetryableError && i < maxRetries - 1) {
          const waitTime = delay + (Math.random() * 1000);
          console.warn(`[AI Service] Retryable error. Retrying in ${Math.round(waitTime)}ms... (${i + 1}/${maxRetries})`);
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
   * Generates a vector embedding.
   */
  async generateEmbedding(text: string): Promise<number[]> {
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
   * Generates a chat response.
   */
  async generateChatResponse(params: {
    systemInstruction?: string;
    messages: Array<{ role: string; content: string }>;
    tools?: any[];
  }): Promise<{ content: string; toolCalls?: any[] }> {
    if (this.config.provider === "gemini") {
      const model = this.genAI!.getGenerativeModel({
        model: this.config.chatModel || "gemini-2.5-flash-lite",
        systemInstruction: params.systemInstruction,
        tools: params.tools ? [{ functionDeclarations: params.tools }] : undefined,
      });

      const chat = model.startChat({
        history: params.messages.slice(0, -1).map(m => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        })),
      });

      const lastMessage = params.messages[params.messages.length - 1].content;
      const result = await chat.sendMessage(lastMessage);
      const response = await result.response;
      
      return {
        content: response.text(),
        toolCalls: response.functionCalls(),
      };
    } else {
      // OpenAI-compatible
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
          model: this.config.chatModel || "gemma2",
          messages,
          tools: params.tools?.map(t => ({ type: "function", function: t })),
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

  static situationalChunking(content: string, metadata: { title: string; category?: string }): string {
    const header = `--- SOURCE: ${metadata.title} ${metadata.category ? `(${metadata.category})` : ""} ---\n`;
    return `${header}${content}`;
  }
}
