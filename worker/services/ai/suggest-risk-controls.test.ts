import { describe, it, expect, vi } from 'vitest';
import {
  buildSuggestPrompt,
  parseSuggestKind,
  parseSuggestResponse,
  suggestRiskControls,
  validateSuggestInput,
} from './suggest-risk-controls';
import { isGenericNodeLabel } from '@shared/suggest-guards';
import { AppError } from '../../lib/utils';

const CTX = {
  noGL: '10008-000318',
  glDesc: 'Setoran Tunai',
  bpmName: 'Setoran di Teller',
  nodeLabel: 'menerima uang dari nasabah',
};

describe('validateSuggestInput', () => {
  it('accepts a full risk request', () => {
    expect(validateSuggestInput(CTX, 'risk')).toMatchObject({ noGL: '10008-000318', nodeLabel: 'menerima uang dari nasabah' });
  });

  it('rejects non-object bodies with AppError 400', () => {
    try {
      validateSuggestInput(null, 'risk');
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).status).toBe(400);
    }
  });

  it('requires bpmName and nodeLabel', () => {
    expect(() => validateSuggestInput({ ...CTX, bpmName: '  ' }, 'risk')).toThrowError(AppError);
    expect(() => validateSuggestInput({ ...CTX, nodeLabel: '' }, 'risk')).toThrowError(AppError);
  });

  it('requires riskDescription for control kind with RISK_REQUIRED code', () => {
    try {
      validateSuggestInput(CTX, 'control');
      expect.unreachable();
    } catch (e) {
      expect((e as AppError).code).toBe('RISK_REQUIRED');
      expect((e as AppError).status).toBe(400);
    }
  });
});

describe('isGenericNodeLabel', () => {
  it.each(['Proses 1', 'langkah 2', 'Step 3', 'abc', '  '])('flags %s as generic', (label) => {
    expect(isGenericNodeLabel(label)).toBe(true);
  });

  it.each(['menerima uang dari nasabah', 'verifikasi tanda tangan'])('keeps %s as specific', (label) => {
    expect(isGenericNodeLabel(label)).toBe(false);
  });
});

describe('buildSuggestPrompt', () => {
  it('embeds GL, BPM and node context for risk', () => {
    const prompt = buildSuggestPrompt({ ...CTX, riskDescription: '' }, 'risk');
    expect(prompt).toContain('10008-000318');
    expect(prompt).toContain('Setoran di Teller');
    expect(prompt).toContain('menerima uang dari nasabah');
    expect(prompt).toContain('SK-5');
  });

  it('embeds the selected risk for control', () => {
    const prompt = buildSuggestPrompt({ ...CTX, riskDescription: 'Kas selisih karena salah hitung' }, 'control');
    expect(prompt).toContain('Kas selisih karena salah hitung');
  });

  it('forbids materiality figures', () => {
    expect(buildSuggestPrompt({ ...CTX, riskDescription: '' }, 'risk').toLowerCase()).toContain('materialitas');
  });
});

describe('parseSuggestResponse', () => {
  it('parses a valid 3-item payload', () => {
    const raw = JSON.stringify({
      items: [
        { description: 'Risiko A', rationale: 'Karena A' },
        { description: 'Risiko B', rationale: 'Karena B' },
        { description: 'Risiko C', rationale: 'Karena C' },
      ],
    });
    const res = parseSuggestResponse(raw, 'risk');
    expect(res.items).toHaveLength(3);
    expect(res.emptyReason).toBeNull();
  });

  it('repairs truncated JSON and caps at 3 items', () => {
    const raw = '{"items":[{"description":"A","rationale":"x"},{"description":"B","rationale":"y"},{"description":"C","rationale":"z"},{"description":"D","rationale":"w"}';
    const res = parseSuggestResponse(raw, 'risk');
    expect(res.items).toHaveLength(3);
  });

  it('drops items without description and reports MODEL_EMPTY when none survive', () => {
    const res = parseSuggestResponse(JSON.stringify({ items: [{ rationale: 'x' }] }), 'risk');
    expect(res.items).toHaveLength(0);
    expect(res.emptyReason).toBe('MODEL_EMPTY');
  });

  it('reports MODEL_INVALID_JSON on garbage', () => {
    const res = parseSuggestResponse('bukan json {{{', 'control');
    expect(res.items).toHaveLength(0);
    expect(res.emptyReason).toBe('MODEL_INVALID_JSON');
  });
});

describe('parseSuggestKind', () => {
  it('accepts risk and control', () => {
    expect(parseSuggestKind('risk')).toBe('risk');
    expect(parseSuggestKind('control')).toBe('control');
  });

  it('rejects missing or unknown kinds with AppError 400', () => {
    for (const bad of [undefined, null, '', 'risks', 'CONTROL', 42]) {
      try {
        parseSuggestKind(bad);
        expect.unreachable(`expected AppError for kind=${String(bad)}`);
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe('INVALID_SUGGEST_REQUEST');
        expect((e as AppError).status).toBe(400);
      }
    }
  });
});

describe('suggestRiskControls', () => {
  it('skips the LLM for generic labels with the shared gate reason', async () => {
    const generate = vi.fn();
    const res = await suggestRiskControls({ ...CTX, nodeLabel: 'Proses 1' }, 'risk', generate);
    expect(generate).not.toHaveBeenCalled();
    expect(res.items).toHaveLength(0);
    expect(res.emptyReason).toBe('GENERIC_LABEL');
  });

  it('calls generate once with the built prompt for specific labels', async () => {
    const generate = vi.fn().mockResolvedValue(JSON.stringify({ items: [{ description: 'R', rationale: 'x' }] }));
    const res = await suggestRiskControls(CTX, 'risk', generate);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate.mock.calls[0]?.[0]).toContain('menerima uang dari nasabah');
    expect(res.items).toHaveLength(1);
  });
});

describe('suggestRiskControls with AI Response Cache', () => {
  it('returns cached payload without calling generate twice', async () => {
    const { MemoryAiCacheStore } = await import('@shared/ai-cache');
    const store = new MemoryAiCacheStore();
    const versions = { kbVersion: '', simulationId: '' };
    const generate = vi.fn().mockResolvedValue(JSON.stringify({ items: [{ description: 'R', rationale: 'x' }] }));
    const first = await suggestRiskControls(CTX, 'risk', generate, {
      store, key: 'k1', ttlMs: 60_000, versions,
    });
    const second = await suggestRiskControls(CTX, 'risk', generate, {
      store, key: 'k1', ttlMs: 60_000, versions,
    });
    expect(generate).toHaveBeenCalledTimes(1);
    expect(first.cacheHit).toBe(false);
    expect(second.cacheHit).toBe(true);
    expect(second.items).toHaveLength(1);
  });

  it('misses after version bump', async () => {
    const { MemoryAiCacheStore } = await import('@shared/ai-cache');
    const store = new MemoryAiCacheStore();
    const generate = vi.fn().mockResolvedValue(JSON.stringify({ items: [{ description: 'R', rationale: 'x' }] }));
    await suggestRiskControls(CTX, 'risk', generate, {
      store, key: 'k2', ttlMs: 60_000, versions: { kbVersion: '', simulationId: '' },
    });
    const res = await suggestRiskControls(CTX, 'risk', generate, {
      store, key: 'k2', ttlMs: 60_000, versions: { kbVersion: 'kb-2', simulationId: '' },
    });
    expect(generate).toHaveBeenCalledTimes(2);
    expect(res.cacheHit).toBe(false);
  });
});
