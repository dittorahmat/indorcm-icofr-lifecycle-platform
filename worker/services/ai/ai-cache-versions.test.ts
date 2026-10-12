import { describe, it, expect } from 'vitest';
import { getAiCacheVersions } from './ai-cache-versions';

describe('getAiCacheVersions', () => {
  it('composes kb marker and approved simulation id', async () => {
    const versions = await getAiCacheVersions(
      {
        loadDocMarker: async () => 'doc-9@2026-10-01',
        loadApprovedSimulationId: async () => 'sim-3@2026-10-02',
      },
      'org-1',
    );
    expect(versions).toEqual({ kbVersion: 'doc-9@2026-10-01', simulationId: 'sim-3@2026-10-02' });
  });

  it('falls back to empty versions when loaders fail', async () => {
    const versions = await getAiCacheVersions(
      {
        loadDocMarker: async () => {
          throw new Error('db down');
        },
        loadApprovedSimulationId: async () => 'sim-3',
      },
      'org-1',
    );
    expect(versions).toEqual({ kbVersion: '', simulationId: '' });
  });

  it('falls back when there is no approved simulation yet', async () => {
    const versions = await getAiCacheVersions(
      {
        loadDocMarker: async () => '',
        loadApprovedSimulationId: async () => '',
      },
      'org-1',
    );
    expect(versions).toEqual({ kbVersion: '', simulationId: '' });
  });
});
