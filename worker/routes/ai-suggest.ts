import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, AppError } from '../lib/utils';
import { getDb } from '../db';
import { AuditService } from '../services/audit-service';
import { AIService } from '../services/ai-service';
import { SUGGEST_RESPONSE_SCHEMA, parseSuggestKind, suggestRiskControls } from '../services/ai/suggest-risk-controls';
import { buildSuggestCacheKey, resolveAiCacheTtlMs, MemoryAiCacheStore } from '@shared/ai-cache';

const aiSuggestApp = new Hono<HonoEnv>();

const rateLimitStore = new Map<string, { count: number; resetDate: number }>();

/** Phase-2 placeholder: process-memory AI Response Cache. T4 promotes to Postgres. */
const suggestCacheStore = new MemoryAiCacheStore();

// POST /ai/suggest-risk-controls — manual Lightbulb-triggered Risk/Control
// suggestions for BPM node property sheets. Body: { kind, noGL, glDesc, bpmName, nodeLabel, riskDescription? }
aiSuggestApp.post('/ai/suggest-risk-controls', async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return bad(c, 'GEMINI_API_KEY not configured.');
  }

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return bad(c, 'Invalid request body');
  }

  const clientId = c.req.header('X-Forwarded-For') || c.req.header('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const dayMs = 86400000;

  let rateLimitData = rateLimitStore.get(clientId);
  if (!rateLimitData || now > rateLimitData.resetDate) {
    rateLimitData = { count: 0, resetDate: now + dayMs };
    rateLimitStore.set(clientId, rateLimitData);
  }

  if (rateLimitData.count >= 100) {
    return bad(c, 'Rate limit exceeded.', 429);
  }

  rateLimitData.count++;

  const aiService = new AIService({
    provider: c.env.AI_PROVIDER === 'openai-compatible' ? 'openai-compatible' : 'gemini',
    apiKey: apiKey,
    baseUrl: c.env.AI_BASE_URL,
    embeddingModel: c.env.AI_EMBEDDING_MODEL,
    chatModel: c.env.AI_CHAT_MODEL,
  });

  try {
    const kind = parseSuggestKind(body.kind);
    const orgId = c.get('organizationId') ?? 'unknown';
    const versions = { kbVersion: '', simulationId: '' };
    const cacheKey = buildSuggestCacheKey(orgId, kind, body, versions);
    const ttlMs = resolveAiCacheTtlMs('suggest', { AI_CACHE_TTL_SUGGEST_MS: c.env.AI_CACHE_TTL_SUGGEST_MS });
    const result = await suggestRiskControls(body, kind, async (prompt) => {
      const res = await aiService.generateChatResponse({
        messages: [{ role: 'user', content: prompt }],
        responseSchema: SUGGEST_RESPONSE_SCHEMA,
      });
      return res.content || '';
    }, { store: suggestCacheStore, key: cacheKey, ttlMs, versions });
    try {
      const db = getDb(c.env.DATABASE_URL);
      const audit = new AuditService(db);
      await audit.logAction({
        organizationId: orgId,
        userId: c.get('userId') ?? 'unknown',
        action: result.cacheHit ? 'AI_SUGGEST_CACHE_HIT' : 'AI_SUGGEST_GENERATE',
        entityType: 'AiSuggest',
        entityId: cacheKey,
        dataAfter: { cacheHit: result.cacheHit ?? false, kind },
      });
    } catch {
      // Audit must never fail the suggestion response.
    }
    return ok(c, result);
  } catch (error) {
    if (error instanceof AppError) {
      return bad(c, error.code, error.status, error.message);
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('[AI Suggest Route Error]:', message);
    return bad(c, `AI service error: ${message}`, 500);
  }
});

export default aiSuggestApp;
