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
  glDesc?: unknown;
  bpmName?: unknown;
  nodeLabel?: unknown;
  riskDescription?: unknown;
}

interface CacheEntry {
  payload: unknown;
  expiresAt: number;
  versions: AiCacheVersions;
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Deterministic djb2 hex — no new dependency for hashing. */
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

export function buildSuggestCacheKey(
  orgId: string,
  kind: string,
  ctx: SuggestCacheContext,
  versions: AiCacheVersions,
): string {
  const normalized = [
    kind.trim(),
    textOf(ctx.noGL),
    textOf(ctx.glDesc),
    textOf(ctx.bpmName),
    textOf(ctx.nodeLabel),
    kind === 'control' ? textOf(ctx.riskDescription) : '',
  ].join('|');
  return `${orgId}:suggest:${hashStable(`${normalized}::${versionsSuffix(versions)}`)}`;
}

export function buildEmbeddingCacheKey(orgId: string, text: string, model: string): string {
  return `${orgId}:emb:${hashStable(`${model}::${text.trim()}`)}`;
}

export function buildChatCacheKey(
  orgId: string,
  prefixHash: string,
  message: string,
  versions: AiCacheVersions,
): string {
  return `${orgId}:chat:${hashStable(`${prefixHash}::${message.trim()}::${versionsSuffix(versions)}`)}`;
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

  clear(): void {
    this.entries.clear();
  }
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
