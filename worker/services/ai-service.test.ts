import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AIService, clearAiServiceCaches, invalidateAiCachesForOrg, suggestResponseCache } from './ai-service';

const SCOPE = { orgId: 'org-1', kbVersion: '', simulationId: '' };

class EmbeddingStubService extends AIService {
  calls = 0;

  protected override async fetchEmbeddingFromProvider(_text: string): Promise<number[]> {
    this.calls += 1;
    return [0.1, 0.2, 0.3];
  }
}

const RETRIEVAL_ROWS = [
  { id: 'c1', content: 'Prosedur kas harian', title: 'SOP Kas', category: 'SOP', score: 1.2 },
];

describe('AIService AI Embedding Cache', () => {
  beforeEach(() => {
    clearAiServiceCaches();
  });

  it('calls the provider once for identical text', async () => {
    const service = new EmbeddingStubService({ provider: 'gemini', apiKey: 'test', cacheScope: SCOPE });
    const first = await service.generateEmbedding('Halo kas');
    const second = await service.generateEmbedding('Halo kas');
    expect(service.calls).toBe(1);
    expect(second).toEqual(first);
    expect(service.lastEmbeddingCacheHit).toBe(true);
  });

  it('misses for different text', async () => {
    const service = new EmbeddingStubService({ provider: 'gemini', apiKey: 'test', cacheScope: SCOPE });
    await service.generateEmbedding('Halo kas');
    await service.generateEmbedding('Rekonsiliasi bank');
    expect(service.calls).toBe(2);
  });
});

describe('AIService retrieval cache', () => {
  beforeEach(() => {
    clearAiServiceCaches();
  });

  it('reuses identical query results within TTL and reports the hit', async () => {
    let runnerCalls = 0;
    const service = new AIService({ provider: 'gemini', apiKey: 'test', cacheScope: SCOPE });
    const runQuery = async () => {
      runnerCalls += 1;
      return RETRIEVAL_ROWS;
    };
    const first = await service.hybridSearch(undefined, 'org-1', 'prosedur kas', [0.1], 10, { runQuery });
    const second = await service.hybridSearch(undefined, 'org-1', 'prosedur kas', [0.1], 10, { runQuery });
    expect(runnerCalls).toBe(1);
    expect(second).toEqual(first);
    expect(service.lastRetrievalCacheHit).toBe(true);
  });

  it('misses after kb version bump', async () => {
    let runnerCalls = 0;
    const runQuery = async () => {
      runnerCalls += 1;
      return RETRIEVAL_ROWS;
    };
    const v1 = new AIService({ provider: 'gemini', apiKey: 'test', cacheScope: SCOPE });
    await v1.hybridSearch(undefined, 'org-1', 'prosedur kas', [0.1], 10, { runQuery });
    const v2 = new AIService({
      provider: 'gemini',
      apiKey: 'test',
      cacheScope: { ...SCOPE, kbVersion: 'kb-2' },
    });
    await v2.hybridSearch(undefined, 'org-1', 'prosedur kas', [0.1], 10, { runQuery });
    expect(runnerCalls).toBe(2);
    expect(v2.lastRetrievalCacheHit).toBe(false);
  });
});

describe('invalidateAiCachesForOrg', () => {
  beforeEach(() => {
    clearAiServiceCaches();
  });

  it('drops only the invalidated org entries across all layers', async () => {
    const service = new EmbeddingStubService({ provider: 'gemini', apiKey: 'test', cacheScope: SCOPE });
    await service.generateEmbedding('Halo kas');
    const runQuery = async () => RETRIEVAL_ROWS;
    await service.hybridSearch(undefined, 'org-1', 'prosedur kas', [0.1], 10, { runQuery });
    suggestResponseCache.set('org-1:suggest:aaa', { payload: { kind: 'risk', items: [], emptyReason: null } }, 60_000, SCOPE);
    suggestResponseCache.set('org-2:suggest:bbb', { payload: { kind: 'risk', items: [], emptyReason: null } }, 60_000, SCOPE);

    const removed = invalidateAiCachesForOrg('org-1');

    expect(removed).toBe(3);
    await service.generateEmbedding('Halo kas');
    expect(service.calls).toBe(2);
    expect(service.lastEmbeddingCacheHit).toBe(false);
    expect(suggestResponseCache.get('org-2:suggest:bbb', SCOPE)?.payload).toBeDefined();
  });
});

describe('AIService chat temperature', () => {
  const calls: Array<Record<string, unknown>> = [];

  beforeEach(() => {
    calls.length = 0;
    vi.stubGlobal('fetch', async (_url: string, init?: { body?: string }) => {
      calls.push(JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>);
      return new Response(JSON.stringify({ choices: [{ message: { content: '{}' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function service(): AIService {
    return new AIService({
      provider: 'openai-compatible',
      apiKey: 'test',
      baseUrl: 'http://localhost:9999',
    });
  }

  it('forwards an explicit temperature to the provider payload', async () => {
    await service().generateChatResponse({ messages: [{ role: 'user', content: 'halo' }], temperature: 0 });

    expect(calls).toHaveLength(1);
    expect(calls[0].temperature).toBe(0);
  });

  it('leaves the provider default untouched when temperature is omitted', async () => {
    await service().generateChatResponse({ messages: [{ role: 'user', content: 'halo' }] });

    expect(calls).toHaveLength(1);
    expect(calls[0]).not.toHaveProperty('temperature');
  });
});
