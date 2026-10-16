/**
 * ai-cache — portable app-side cache seam (ADR-0007, SK-5/DKU.MBU/11/2024).
 *
 * Pure key/TTL/version logic shared by worker routes; persistence behind
 * AiCacheStore so unit tests run without a database or provider key.
 */

export type AiCacheLayer = 'suggest' | 'chat' | 'retrieval' | 'embedding';

export interface AiCacheVersions {
  kbVersion: string;
  simulationId: string;
}

export interface SuggestCacheContext {
  noGL?: unknown;
  /** Client alias: accepted and mapped to noGL by normalizeSuggestContext. */
  glCode?: unknown;
  glDesc?: unknown;
  bpmName?: unknown;
  nodeLabel?: unknown;
  riskDescription?: unknown;
}

export interface NormalizedSuggestContext {
  noGL: string;
  glDesc: string;
  bpmName: string;
  nodeLabel: string;
  riskDescription: string;
}

interface CacheEntry {
  payload: unknown;
  expiresAt: number;
  versions: AiCacheVersions;
}

/** Single trimming helper behind every AI seam. */
export function trimText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function hashStable(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function versionsSuffix(versions: AiCacheVersions): string {
  return `${versions.kbVersion}::${versions.simulationId}`;
}

/**
 * Single normalization behind the suggestion seam: trims every field and
 * maps the client `glCode` alias to the server `noGL` name so the popover
 * pre-flight hash, the route gate, and the cache lookup leverage identical
 * context. Pass-through for existing server payloads (already `noGL`).
 */
export function normalizeSuggestContext(ctx: SuggestCacheContext): NormalizedSuggestContext {
  const noGL = trimText(ctx.noGL) || trimText(ctx.glCode);
  return {
    noGL,
    glDesc: trimText(ctx.glDesc),
    bpmName: trimText(ctx.bpmName),
    nodeLabel: trimText(ctx.nodeLabel),
    riskDescription: trimText(ctx.riskDescription),
  };
}

export function suggestNormalizedString(kind: string, ctx: SuggestCacheContext): string {
  const n = normalizeSuggestContext(ctx);
  return [
    kind.trim(),
    n.noGL,
    n.glDesc,
    n.bpmName,
    n.nodeLabel,
    kind === 'control' ? n.riskDescription : '',
  ].join('|');
}

/** Client query-key hash: same normalized string, without org/versions. */
export function buildSuggestContextHash(kind: string, ctx: SuggestCacheContext): string {
  return hashStable(suggestNormalizedString(kind, ctx));
}

export function isCacheUnversioned(versions: AiCacheVersions): boolean {
  return !versions.kbVersion && !versions.simulationId;
}

export function buildSuggestCacheKey(
  orgId: string,
  kind: string,
  ctx: SuggestCacheContext,
  versions: AiCacheVersions,
): string {
  return `${orgId}:suggest:${hashStable(`${suggestNormalizedString(kind, ctx)}::${versionsSuffix(versions)}`)}`;
}

export function buildEmbeddingCacheKey(orgId: string, text: string, model: string): string {
  return `${orgId}:emb:${hashStable(`${model}::${text.trim()}`)}`;
}

export function buildRetrievalCacheKey(
  orgId: string,
  query: string,
  versions: AiCacheVersions,
): string {
  return `${orgId}:ret:${hashStable(`${query.trim().toLowerCase()}::${versionsSuffix(versions)}`)}`;
}

const DEFAULT_TTL_MS: Record<AiCacheLayer, number> = {
  suggest: 60 * 60 * 1000,
  chat: 30 * 60 * 1000,
  retrieval: 30 * 60 * 1000,
  embedding: 24 * 60 * 60 * 1000,
};

export function resolveAiCacheTtlMs(
  layer: AiCacheLayer,
  env: Record<string, string | undefined>,
): number {
  const key = `AI_CACHE_TTL_${layer.toUpperCase()}_MS`;
  const raw = env[key];
  const parsed = raw === undefined || raw === '' ? NaN : Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return DEFAULT_TTL_MS[layer];
}

export interface AiCacheStore {
  get(key: string, versions: AiCacheVersions): { payload: unknown } | null;
  set(key: string, entry: { payload: unknown }, ttlMs: number, versions: AiCacheVersions): void;
}

export class MemoryAiCacheStore implements AiCacheStore {
  private entries = new Map<string, CacheEntry>();

  get(key: string, versions: AiCacheVersions): { payload: unknown } | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return null;
    }
    if (entry.versions.kbVersion !== versions.kbVersion) return null;
    if (entry.versions.simulationId !== versions.simulationId) return null;
    return { payload: entry.payload };
  }

  set(key: string, entry: { payload: unknown }, ttlMs: number, versions: AiCacheVersions): void {
    this.entries.set(key, { payload: entry.payload, expiresAt: Date.now() + ttlMs, versions });
  }

  /** Removes entries whose key starts with prefix (per-org invalidation). Returns removed count. */
  invalidateByPrefix(prefix: string): number {
    let removed = 0;
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  clear(): void {
    this.entries.clear();
  }
}

export interface RateLimitState {
  count: number;
  resetDate: number;
}

/** Shared per-process rate-limit store behind the AI seam. Bucket keys are namespaced per route (`suggest:<ip>`, `chat:<ip>`). */
export const sharedAiRateLimitStore = new Map<string, RateLimitState>();

/**
 * Daily rate-limit check shared by AI routes. Cache hits count like any
 * other hit: callers run this BEFORE the cache lookup so abuse semantics
 * stay stable whether the answer comes from cache or provider.
 */
export function checkDailyRateLimit(
  store: Map<string, RateLimitState>,
  key: string,
  nowMs: number,
  limit = 100,
  windowMs = 86_400_000,
): { allowed: boolean; count: number } {
  let state = store.get(key);
  if (!state || nowMs > state.resetDate) {
    state = { count: 0, resetDate: nowMs + windowMs };
    store.set(key, state);
  }
  if (state.count >= limit) return { allowed: false, count: state.count };
  state.count += 1;
  return { allowed: true, count: state.count };
}

export interface ProviderPromptCache {
  get(key: string): Promise<{ payload: unknown } | null>;
  set(key: string, entry: { payload: unknown }, ttlMs: number): Promise<void>;
}

export class NoopProviderPromptCacheAdapter implements ProviderPromptCache {
  async get(_key: string): Promise<null> {
    return null;
  }

  async set(_key: string, _entry: { payload: unknown }, _ttlMs: number): Promise<void> {
    return undefined;
  }
}
