import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, AppError } from '../lib/utils';
import { getDb } from '../db';
import { AuditService } from '../services/audit-service';
import { AIService, suggestResponseCache } from '../services/ai-service';
import { SUGGEST_RESPONSE_SCHEMA, parseSuggestKind, suggestRiskControls } from '../services/ai/suggest-risk-controls';
import { getAiCacheVersions, createDocMarkerLoader, createApprovedSimulationLoader } from '../services/ai/ai-cache-versions';
import { buildSuggestCacheKey, normalizeSuggestContext, resolveAiCacheTtlMs, checkDailyRateLimit, isCacheUnversioned, sharedAiRateLimitStore } from '@shared/ai-cache';

const aiSuggestApp = new Hono<HonoEnv>();

// POST /ai/suggest-risk-controls — manual Lightbulb-triggered Risk/Control
// suggestions for BPM node property sheets. Body: { kind, noGL, glDesc, bpmName, nodeLabel, riskDescription? }
// rbac-exempt: generation — the handler writes no lifecycle entity (only an audit
// entry for the suggestion it returned); quota is the control, not a role list.
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

  // Contract: cache hits count toward the daily limit — checked before cache lookup.
  const limit = checkDailyRateLimit(sharedAiRateLimitStore, `suggest:${clientId}`, Date.now());
  if (!limit.allowed) {
    return bad(c, 'Rate limit exceeded.', 429);
  }

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
    const db = getDb(c.env.DATABASE_URL);
    const versions = await getAiCacheVersions({
      loadDocMarker: createDocMarkerLoader(db),
      loadApprovedSimulationId: createApprovedSimulationLoader(db),
    }, orgId);
    const cacheKey = buildSuggestCacheKey(orgId, kind, normalizeSuggestContext(body), versions);
    const unversioned = isCacheUnversioned(versions);
    const ttlMs = resolveAiCacheTtlMs('suggest', { AI_CACHE_TTL_SUGGEST_MS: c.env.AI_CACHE_TTL_SUGGEST_MS });
    const result = await suggestRiskControls(body, kind, async (prompt) => {
      const res = await aiService.generateChatResponse({
        messages: [{ role: 'user', content: prompt }],
        responseSchema: SUGGEST_RESPONSE_SCHEMA,
      });
      return res.content || '';
    }, { store: suggestResponseCache, key: cacheKey, ttlMs, versions });
    try {
      const audit = new AuditService(db);
      await audit.logAction({
        organizationId: orgId,
        userId: c.get('userId') ?? 'unknown',
        action: result.cacheHit ? 'AI_SUGGEST_CACHE_HIT' : 'AI_SUGGEST_GENERATE',
        entityType: 'AiSuggest',
        entityId: cacheKey,
        dataAfter: {
          cacheHit: result.cacheHit ?? false,
          kind,
          kbVersion: versions.kbVersion,
          simulationId: versions.simulationId,
          unversioned,
        },
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
