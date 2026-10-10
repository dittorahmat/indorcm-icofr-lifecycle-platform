import { describe, expect, it } from 'vitest';
import { isGenericNodeLabel, suggestGate } from './suggest-guards';

describe('suggest-guards seam (single blocked predicate, worker + client)', () => {
  it('flags generic node labels', () => {
    for (const label of ['Proses 1', 'langkah 2', 'Step 3', 'abc', '  ']) {
      expect(isGenericNodeLabel(label)).toBe(true);
    }
    for (const label of ['menerima uang dari nasabah', 'verifikasi tanda tangan']) {
      expect(isGenericNodeLabel(label)).toBe(false);
    }
  });

  it('passes specific risk requests', () => {
    expect(
      suggestGate({ kind: 'risk', bpmName: 'Setoran di Teller', nodeLabel: 'menerima uang dari nasabah' }),
    ).toEqual({ blocked: false, reason: null });
  });

  it('blocks missing bpm context', () => {
    expect(suggestGate({ kind: 'risk', bpmName: '', nodeLabel: 'menerima uang dari nasabah' })).toEqual({
      blocked: true,
      reason: 'MISSING_CONTEXT',
    });
    expect(suggestGate({ kind: 'risk', bpmName: 'Setoran di Teller', nodeLabel: '  ' })).toEqual({
      blocked: true,
      reason: 'MISSING_CONTEXT',
    });
  });

  it('blocks generic labels before the risk check', () => {
    expect(
      suggestGate({ kind: 'control', bpmName: 'Setoran di Teller', nodeLabel: 'Proses 1', riskDescription: '' }),
    ).toEqual({ blocked: true, reason: 'GENERIC_LABEL' });
  });

  it('blocks control requests without a risk description', () => {
    expect(
      suggestGate({
        kind: 'control',
        bpmName: 'Setoran di Teller',
        nodeLabel: 'menerima uang dari nasabah',
        riskDescription: '  ',
      }),
    ).toEqual({ blocked: true, reason: 'RISK_REQUIRED' });
  });

  it('passes control requests with a risk description', () => {
    expect(
      suggestGate({
        kind: 'control',
        bpmName: 'Setoran di Teller',
        nodeLabel: 'menerima uang dari nasabah',
        riskDescription: 'Kas selisih karena salah hitung',
      }),
    ).toEqual({ blocked: false, reason: null });
  });

  it('treats unknown kinds as unblocked (kind validation owns rejection)', () => {
    expect(
      suggestGate({ kind: 'audit', bpmName: 'Setoran di Teller', nodeLabel: 'menerima uang dari nasabah' }),
    ).toEqual({ blocked: false, reason: null });
  });
});
