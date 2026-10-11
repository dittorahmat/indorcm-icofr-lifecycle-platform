import { describe, expect, it } from 'vitest';
import {
  BPM_NON_SYNC_NODE_TYPES,
  collectNodeSyncEntries,
  extractBaseId,
  linkedIdsOf,
  makeGlSpecificId,
  mappedRiskIdsFromNodes,
  regulatoryPairsOf,
  unmappedControlsFrom,
} from './control-linkage';

describe('control-linkage seam (Control Linkage locality)', () => {
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

  it('consults legacy risks when pairs are empty (sync/frontend agreement)', () => {
    const nodes = [{ id: 'n1', data: { regulatoryPairs: [], risks: [{ rcmId: 'R-9' }] } }];
    expect(mappedRiskIdsFromNodes(nodes)).toEqual(new Set(['R-9']));
  });

  it('extractBaseId strips GL suffixes to the canonical base id', () => {
    expect(extractBaseId('R-10008-000318')).toBe('R-10008');
    expect(extractBaseId('R-1')).toBe('R-1');
    expect(extractBaseId('C-TBD-GL100')).toBe('C-TBD');
    expect(extractBaseId('')).toBe('');
  });

  it('makeGlSpecificId fans a base id out per GL code', () => {
    expect(makeGlSpecificId('R-10008-000318', 'GL200')).toBe('R-10008-GL200');
    expect(makeGlSpecificId('R-1', '')).toBe('R-1');
  });

  it('BPM_NON_SYNC_NODE_TYPES covers the non-linkage node kinds', () => {
    expect([...BPM_NON_SYNC_NODE_TYPES].sort()).toEqual(['end', 'reference', 'start', 'swimlane']);
  });

  it('collectNodeSyncEntries fans pairs out per GL with one node pair row', () => {
    const entries = collectNodeSyncEntries(
      [{
        id: 'n1',
        type: 'activity',
        data: { regulatoryPairs: [{ riskId: 'R-1', controlId: 'C-1', controlDescription: 'Cek' }] },
      }],
      ['GL100'],
      { organizationId: 'org-1', diagramId: 'diag-1' },
      () => 'new-id-1',
    );
    expect([...entries.risksToSync.keys()]).toEqual(['R-1-GL100']);
    expect([...entries.controlsToSync.keys()]).toEqual(['C-1-GL100']);
    expect(entries.nodeRcmPairs).toEqual([
      { id: 'new-id-1', organizationId: 'org-1', diagramId: 'diag-1', nodeId: 'n1', rcmId: 'R-1-GL100' },
    ]);
    expect(entries.activeRiskControlPairs).toEqual(new Set(['R-1-GL100:C-1-GL100']));
  });

  it('collectNodeSyncEntries skips non-sync node types and malformed ids', () => {
    const entries = collectNodeSyncEntries(
      [
        { id: 'n0', type: 'start', data: { regulatoryPairs: [{ riskId: 'R-0', controlId: 'C-0' }] } },
        { id: 'n1', type: 'activity', data: { regulatoryPairs: [{ riskId: 42, controlId: null }] } },
      ],
      ['GL100'],
      { organizationId: 'org-1', diagramId: 'diag-1' },
      () => 'x',
    );
    expect(entries.risksToSync.size).toBe(0);
    expect(entries.nodeRcmPairs).toEqual([]);
  });

  it('collectNodeSyncEntries falls back to legacy risks only when no pairs exist', () => {
    const entries = collectNodeSyncEntries(
      [{
        id: 'n1',
        type: 'activity',
        data: { regulatoryPairs: [], risks: [{ rcmId: 'R-5', controlIds: ['C-5'] }] },
      }],
      [''],
      { organizationId: 'org-1', diagramId: 'diag-1' },
      () => 'x',
    );
    expect([...entries.risksToSync.keys()]).toEqual(['R-5']);
    expect(entries.activeRiskControlPairs).toEqual(new Set(['R-5:C-5']));
    expect(entries.activeControlIds).toEqual(new Set(['C-5']));
    expect(entries.controlsToSync.size).toBe(0);
  });
});
