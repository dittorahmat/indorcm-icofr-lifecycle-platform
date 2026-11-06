import type { MaterialitySimulation } from '@shared/types';

/**
 * Single source of truth test fixture for MaterialitySimulation.
 * Pre-populates all mandatory domain fields so test files do not need
 * partial casts, escape-casts, or inline type assertions.
 */
export function createMockMaterialitySimulation(
  partial: Partial<MaterialitySimulation> = {}
): MaterialitySimulation {
  const now = Date.now();
  return {
    id: 'sim-1',
    organizationId: 'org-test-1',
    year: 2026,
    name: 'Baseline Simulation Test',
    basis: 'Laba Sebelum Pajak',
    status: 'Draft',
    workflowStatus: 'Draft',
    omPercentage: 5,
    haircutPercentage: 25,
    omValue: 5000000,
    pmValue: 3750000,
    locationCount: 1,
    locationThreshold: 0,
    locationResults: null,
    assessmentData: {},
    workflowHistory: [],
    history: [],
    significantAccounts: [],
    materialityJustification: null,
    glSnapshotId: null,
    createdBy: 'user-test-1',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}
