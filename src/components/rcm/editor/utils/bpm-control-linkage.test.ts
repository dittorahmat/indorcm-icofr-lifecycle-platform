import { describe, expect, it } from 'vitest';
import {
  linkedIdsOf,
  mappedRiskIdsFromNodes,
  regulatoryPairsOf,
  unmappedControlsFrom,
} from './bpm-control-linkage';

describe('bpm-control-linkage seam (Control Linkage locality)', () => {
  it('prefers regulatoryPairs over legacy regulatoryData', () => {
    expect(
      regulatoryPairsOf({ regulatoryPairs: [{ riskId: 'R-1' }], regulatoryData: { riskId: 'R-0' } }),
    ).toEqual([{ riskId: 'R-1' }]);
    expect(regulatoryPairsOf({ regulatoryData: { riskId: 'R-0' } })).toEqual([{ riskId: 'R-0' }]);
  });

  it('returns an empty list for missing or malformed pair data', () => {
    expect(regulatoryPairsOf(null)).toEqual([]);
    expect(regulatoryPairsOf(undefined)).toEqual([]);
    expect(regulatoryPairsOf({})).toEqual([]);
    expect(regulatoryPairsOf({ regulatoryPairs: 'R-1' })).toEqual([]);
  });

  it('collects mapped risk ids including the legacy risks fallback', () => {
    const nodes = [
      { id: 'n1', data: { regulatoryPairs: [{ riskId: 'R-1' }, { riskId: '' }] } },
      { id: 'n2', data: { risks: [{ rcmId: 'R-2' }] } },
      { id: 'n3', data: { regulatoryPairs: [{ riskId: 'R-1' }] } },
      { id: 'n4' },
    ];
    expect(mappedRiskIdsFromNodes(nodes)).toEqual(new Set(['R-1', 'R-2']));
  });

  it('ignores legacy risks when regulatoryPairs exist on the same node', () => {
    const nodes = [{ id: 'n1', data: { regulatoryPairs: [{ riskId: 'R-1' }], risks: [{ rcmId: 'R-9' }] } }];
    expect(mappedRiskIdsFromNodes(nodes)).toEqual(new Set(['R-1']));
  });

  it('derives distinct badge ids from pairs', () => {
    expect(
      linkedIdsOf([{ riskId: 'R-1', controlId: 'C-1' }, { riskId: 'R-1', controlId: '' }]),
    ).toEqual({ riskIds: ['R-1'], controlIds: ['C-1'] });
    expect(linkedIdsOf([])).toEqual({ riskIds: [], controlIds: [] });
  });

  it('filters unmapped controls via rcmId, mappingId prefix, riskId, or id', () => {
    const nodes = [{ id: 'n1', data: { regulatoryPairs: [{ riskId: 'R-1' }] } }];
    const items = [
      { rcmId: 'R-1' },
      { mappingId: 'R-1:ctrl-9' },
      { riskId: 'R-1' },
      { id: 'R-1' },
      { rcmId: 'R-2' },
      { mappingId: 'R-3:ctrl-1' },
    ];
    expect(unmappedControlsFrom(items, nodes)).toEqual([{ rcmId: 'R-2' }, { mappingId: 'R-3:ctrl-1' }]);
  });
});
