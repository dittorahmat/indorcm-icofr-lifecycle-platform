import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  controlTemplateFor,
  duplicateIdSet,
  generatePairId,
  groupPairsByRisk,
  newRiskTemplate,
  suggestBaseFor,
  useRegulatoryPairs,
} from './useRegulatoryPairs';
import type { RegulatoryPair } from '@shared/control-linkage';

const PAIRS: RegulatoryPair[] = [
  { riskId: 'R-BPM-0001', controlId: 'C-BPM-0001', riskDescription: 'Kas hilang', _tempControlId: 'C-BPM-0001' },
  { riskId: 'R-BPM-0001', controlId: 'C-BPM-0002', riskDescription: 'Kas hilang', _tempControlId: 'C-BPM-0002' },
  { riskId: 'R-BPM-0002', controlId: 'C-BPM-0001', riskDescription: 'Bank beda', _tempControlId: 'C-BPM-0001' },
];

describe('useRegulatoryPairs seam (Control Linkage ownership)', () => {
  it('groups pairs by risk while preserving the global pair index', () => {
    const groups = groupPairsByRisk(PAIRS);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.controls.map((c) => c.index)).toEqual([0, 1]);
    expect(groups[1]?.controls.map((c) => c.index)).toEqual([2]);
    expect(groups[0]?.risk.riskDescription).toBe('Kas hilang');
  });

  it('spots duplicate risk and control ids', () => {
    expect(duplicateIdSet(PAIRS, 'riskId')).toEqual(new Set(['R-BPM-0001']));
    expect(duplicateIdSet(PAIRS, 'controlId')).toEqual(new Set(['C-BPM-0001']));
    expect(duplicateIdSet([{ riskId: '  R-1 ' }, { riskId: 'R-1' }], 'riskId')).toEqual(new Set(['R-1']));
  });

  it('falls back to a uuid fragment without sequence data', () => {
    expect(generatePairId('risk', undefined, [])).toMatch(/^R-[0-9a-f-]{8}$/);
    expect(generatePairId('control', undefined, [])).toMatch(/^C-[0-9a-f-]{8}$/);
  });

  it('advances the sequence past ids already on the canvas', () => {
    const seq = { nextRiskSeq: 3, nextControlSeq: 5, bpmCode: 'BPM' };
    const nodes = [{ data: { regulatoryPairs: [{ riskId: 'R-BPM-0007' }] } }];
    expect(generatePairId('risk', seq, nodes)).toBe('R-BPM-0008');
    expect(generatePairId('control', seq, [])).toBe('C-BPM-0005');
  });

  it('ships TLC defaults for new risk and control templates', () => {
    expect(newRiskTemplate('R-1', 'C-1')).toMatchObject({ riskId: 'R-1', controlId: 'C-1', classification: 'TLC', frequency: 'Bulanan' });
    expect(controlTemplateFor({ riskId: 'R-1', controlDescription: 'lama' }, 'C-9')).toMatchObject({
      riskId: 'R-1',
      controlId: 'C-9',
      controlDescription: '',
      cosoPrinciples: [],
    });
  });

  it('builds Suggestion Context once, or null without a BPM name', () => {
    expect(suggestBaseFor(undefined, 'Terima kas')).toBeNull();
    expect(suggestBaseFor({ glCode: '1-1000', glDesc: '', bpmName: '' }, 'x')).toBeNull();
    expect(suggestBaseFor({ glCode: '1-1000', glDesc: 'Kas', bpmName: 'Arus Kas' }, 'Terima kas')).toMatchObject({
      bpmName: 'Arus Kas',
      nodeLabel: 'Terima kas',
    });
  });

  it('commits pair edits through one seam', () => {
    const onUpdateNodeData = vi.fn();
    const { result } = renderHook(() =>
      useRegulatoryPairs({ nodeId: 'n1', nodeData: { regulatoryPairs: PAIRS }, nodes: [], sequenceData: undefined, onUpdateNodeData }),
    );
    expect(result.current.groupedRisks).toHaveLength(2);

    act(() => {
      result.current.updateSpecificControl(0, 'controlDescription', 'Opname harian');
    });
    expect(onUpdateNodeData).toHaveBeenCalledWith('n1', { regulatoryPairs: expect.arrayContaining([expect.objectContaining({ controlDescription: 'Opname harian' })]) });

    act(() => {
      result.current.removeRisk('R-BPM-0002');
    });
    const last = onUpdateNodeData.mock.calls.at(-1)?.[1] as { regulatoryPairs: RegulatoryPair[] };
    expect(last.regulatoryPairs).toHaveLength(2);
  });
});
