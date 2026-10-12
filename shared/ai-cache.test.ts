import { describe, it, expect } from 'vitest';
import {
  buildSuggestCacheKey,
  buildEmbeddingCacheKey,
  resolveAiCacheTtlMs,
  MemoryAiCacheStore,
  NoopProviderPromptCacheAdapter,
} from './ai-cache';

const VERSIONS = { kbVersion: 'kb-7', simulationId: 'sim-9' };

describe('buildSuggestCacheKey', () => {
  it('is stable for identical Suggestion Context triple per org', () => {
    const a = buildSuggestCacheKey('org-1', 'risk', {
      noGL: '10008',
      glDesc: 'Kas',
      bpmName: 'Setoran di Teller',
      nodeLabel: 'menerima uang dari nasabah',
      riskDescription: '',
    }, VERSIONS);
    const b = buildSuggestCacheKey('org-1', 'risk', {
      noGL: ' 10008 ',
      glDesc: 'Kas',
      bpmName: 'Setoran di Teller',
      nodeLabel: 'menerima uang dari nasabah',
      riskDescription: '',
    }, VERSIONS);
    expect(b).toBe(a);
    expect(a.startsWith('org-1:')).toBe(true);
  });

  it('separates orgs and kb versions', () => {
    const base = {
      noGL: '', glDesc: '', bpmName: 'P', nodeLabel: 'menerima uang dari nasabah', riskDescription: '',
    };
    const orgA = buildSuggestCacheKey('org-a', 'risk', base, VERSIONS);
    const orgB = buildSuggestCacheKey('org-b', 'risk', base, VERSIONS);
    expect(orgA).not.toBe(orgB);
    const otherKb = buildSuggestCacheKey('org-a', 'risk', base, { ...VERSIONS, kbVersion: 'kb-8' });
    expect(otherKb).not.toBe(orgA);
  });
});

describe('buildEmbeddingCacheKey', () => {
  it('hashes identical text to the same key', () => {
    expect(buildEmbeddingCacheKey('org-1', 'Halo kas', 'gemini-embedding-2')).toBe(
      buildEmbeddingCacheKey('org-1', 'Halo kas', 'gemini-embedding-2'),
    );
  });
});

describe('resolveAiCacheTtlMs', () => {
  it('returns defaults for suggest and chat', () => {
    expect(resolveAiCacheTtlMs('suggest', {})).toBe(60 * 60 * 1000);
    expect(resolveAiCacheTtlMs('chat', {})).toBe(30 * 60 * 1000);
  });
});

describe('MemoryAiCacheStore', () => {
  it('hits before expiry and misses after version bump', () => {
    const store = new MemoryAiCacheStore();
    const key = buildSuggestCacheKey('org-1', 'risk', {
      noGL: '', glDesc: '', bpmName: 'P', nodeLabel: 'menerima uang dari nasabah', riskDescription: '',
    }, VERSIONS);
    store.set(key, { payload: { items: [] } }, 60_000, VERSIONS);
    expect(store.get(key, VERSIONS)?.payload).toEqual({ items: [] });
    expect(store.get(key, { ...VERSIONS, simulationId: 'sim-10' })).toBeNull();
  });
});

describe('NoopProviderPromptCacheAdapter', () => {
  it('always reports a miss so portable path stays authoritative', async () => {
    const adapter = new NoopProviderPromptCacheAdapter();
    await expect(adapter.get('any')).resolves.toBeNull();
  });
});
