import { describe, it, expect } from 'vitest';
import {
  buildSuggestCacheKey,
  buildSuggestContextHash,
  buildEmbeddingCacheKey,
  buildRetrievalCacheKey,
  checkDailyRateLimit,
  isCacheUnversioned,
  normalizeSuggestContext,
  resolveAiCacheTtlMs,
  sharedAiRateLimitStore,
  trimText,
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

describe('MemoryAiCacheStore.invalidateByPrefix', () => {
  it('clears only entries of the given organization', () => {
    const store = new MemoryAiCacheStore();
    const versions = { kbVersion: '', simulationId: '' };
    store.set('org-1:suggest:aaa', { payload: 1 }, 60_000, versions);
    store.set('org-2:suggest:bbb', { payload: 2 }, 60_000, versions);
    expect(store.invalidateByPrefix('org-1:')).toBe(1);
    expect(store.get('org-1:suggest:aaa', versions)).toBeNull();
    expect(store.get('org-2:suggest:bbb', versions)?.payload).toBe(2);
  });
});

describe('checkDailyRateLimit', () => {
  it('allows 100 hits then blocks, and resets after the window', () => {
    const store = new Map<string, { count: number; resetDate: number }>();
    for (let i = 0; i < 100; i += 1) {
      expect(checkDailyRateLimit(store, 'c1', 1_000).allowed).toBe(true);
    }
    expect(checkDailyRateLimit(store, 'c1', 1_000).allowed).toBe(false);
    expect(checkDailyRateLimit(store, 'c1', 1_000 + 86_400_001).allowed).toBe(true);
  });

  it('counts cache hits like any other hit: check runs before cache lookup', () => {
    const store = new Map<string, { count: number; resetDate: number }>();
    const first = checkDailyRateLimit(store, 'c2', 1_000);
    const second = checkDailyRateLimit(store, 'c2', 1_000);
    expect(first.count).toBe(1);
    expect(second.count).toBe(2);
  });
});

describe('buildRetrievalCacheKey', () => {
  it('is case-insensitive and version-bound', () => {
    const v = { kbVersion: '', simulationId: '' };
    expect(buildRetrievalCacheKey('org-1', 'Prosedur Kas::10', v)).toBe(
      buildRetrievalCacheKey('org-1', 'prosedur kas::10', v),
    );
    expect(buildRetrievalCacheKey('org-1', 'prosedur kas::10', v)).not.toBe(
      buildRetrievalCacheKey('org-1', 'prosedur kas::10', { ...v, kbVersion: 'kb-2' }),
    );
  });
});

describe('normalizeSuggestContext parity', () => {
  it('maps client glCode to server noGL with identical keys', () => {
    const client = { glCode: ' 10008 ', glDesc: 'Kas', bpmName: 'Teller', nodeLabel: 'terima uang' };
    const server = { noGL: '10008', glDesc: 'Kas', bpmName: 'Teller', nodeLabel: 'terima uang' };
    expect(normalizeSuggestContext(client)).toEqual(normalizeSuggestContext(server));
    expect(buildSuggestCacheKey('org-1', 'risk', client, VERSIONS)).toBe(
      buildSuggestCacheKey('org-1', 'risk', server, VERSIONS),
    );
  });
  it('control kind includes trimmed riskDescription, risk kind ignores it', () => {
    const withRisk = { noGL: '1', bpmName: 'B', nodeLabel: 'N', riskDescription: '  r  ' };
    const withoutRisk = { noGL: '1', bpmName: 'B', nodeLabel: 'N', riskDescription: 'other' };
    expect(buildSuggestCacheKey('o', 'risk', withRisk, VERSIONS)).toBe(
      buildSuggestCacheKey('o', 'risk', withoutRisk, VERSIONS),
    );
    expect(buildSuggestCacheKey('o', 'control', withRisk, VERSIONS)).not.toBe(
      buildSuggestCacheKey('o', 'control', withoutRisk, VERSIONS),
    );
  });
  it('shares one normalized hash between popover query-key and route cache-key', () => {
    const client = { glCode: ' 10008 ', glDesc: 'Kas', bpmName: 'Teller', nodeLabel: 'terima uang' };
    const server = { noGL: '10008', glDesc: 'Kas', bpmName: 'Teller', nodeLabel: 'terima uang' };
    expect(buildSuggestContextHash('risk', client)).toBe(buildSuggestContextHash('risk', server));
    expect(trimText('  x  ')).toBe('x');
    expect(trimText(42)).toBe('');
  });
  it('flags empty versions as explicitly unversioned', () => {
    expect(isCacheUnversioned({ kbVersion: '', simulationId: '' })).toBe(true);
    expect(isCacheUnversioned(VERSIONS)).toBe(false);
    expect(isCacheUnversioned({ kbVersion: 'kb-1', simulationId: '' })).toBe(false);
  });
  it('isolates rate-limit buckets per route namespace', () => {
    sharedAiRateLimitStore.clear();
    expect(checkDailyRateLimit(sharedAiRateLimitStore, 'suggest:c1', 1_000).allowed).toBe(true);
    expect(checkDailyRateLimit(sharedAiRateLimitStore, 'chat:c1', 1_000).count).toBe(1);
  });
});
