import { describe, expect, it } from 'vitest';
import {
  apiErrorMessage,
  appMappingsFromItems,
  computeMaterialityView,
  deptMappingsFromAccounts,
  draftFingerprint,
  isEditorLocked,
  isScopingDirty,
  originalFingerprint,
} from './scoping-materiality-view';
import type { GLRow, MaterialitySimulation } from '@shared/types';

function row(partial: Partial<GLRow>): GLRow {
  return {
    id: 'r', organizationId: 'o', snapshotId: 's', ymd: 'y', noGL: '101', glDesc: 'Kas', balance: 1000,
    entityCode: 'E1', parentEntityCode: null, entityId: null, currency: 'IDR', fsliName: 'Kas dan Setara Kas',
    fsliCode: '101', category: 'Asset', subKategori: 'Cash', noUrut: 1, assignedDepartmentIds: [],
    ownerAcceptance: null, mappingConfidence: 1.0, fsliBalance: null, ...partial,
  } as GLRow;
}

const ROWS = [row({ noGL: '101', balance: 1000 }), row({ id: 'r2', noGL: '102', glDesc: 'Bank', balance: 500, noUrut: 2 })];

const SIM = {
  basis: 'Kas dan Setara Kas', omPercentage: 5, haircutPercentage: 50, locationCount: 1,
  assessmentData: {}, significantAccounts: [], materialityJustification: null, workflowStatus: 'Draft',
} as MaterialitySimulation;

describe('scoping-materiality-view seam (OM/PM view + dirty fingerprint)', () => {
  it('computes zero view without rows or snapshot', () => {
    const view = computeMaterialityView({
      filteredRows: [], allRows: [], snapshotPresent: true, basis: 'x', omPercentage: 5,
      haircutPercentage: 50, assessmentData: {}, selectedEntityCodes: [], deptMappings: {},
    });
    expect(view).toMatchObject({ omValue: 0, pmValue: 0, multiplier: 1, benchmarkValue: 0 });
    expect(view.mergedGlData).toEqual([]);
  });

  it('derives OM/PM and merges department mappings', () => {
    const view = computeMaterialityView({
      filteredRows: ROWS, allRows: ROWS, snapshotPresent: true, basis: 'Kas dan Setara Kas', omPercentage: 5,
      haircutPercentage: 50, assessmentData: {}, selectedEntityCodes: ['E1'], deptMappings: { '101': ['d1'] },
    });
    expect(view.benchmarkValue).toBe(1500);
    expect(view.omValue).toBe(75);
    expect(view.pmValue).toBe(37.5);
    expect(view.mergedGlData[0]).toMatchObject({ assignedDepartmentIds: ['d1'] });
    expect(view.scopingCompliance).not.toBeNull();
  });

  it('builds app and department mappings from server rows', () => {
    expect(appMappingsFromItems([{ accountCode: '101', applicationId: 'a1' }, { accountCode: '101', applicationId: 'a2' }]))
      .toEqual({ '101': ['a1', 'a2'] });
    expect(appMappingsFromItems(undefined)).toEqual({});
    expect(deptMappingsFromAccounts([{ fsliCode: '101', assignedDepartmentIds: ['d1'] }, { fsliCode: null }]))
      .toEqual({ '101': ['d1'] });
  });

  it('detects draft drift through the fingerprint', () => {
    const original = originalFingerprint({ initial: SIM, initialAppMappings: {} });
    const clean = draftFingerprint({
      assessmentData: {}, locationCount: 1, draftBasis: 'Kas dan Setara Kas', draftOmPercentage: 5,
      draftHaircutPercentage: 50, appMappings: {}, deptMappings: {}, materialityJustification: null,
    });
    expect(isScopingDirty(clean, original)).toBe(false);
    expect(isScopingDraftDirtyAfterOmChange(clean, original)).toBe(true);
  });

  it('scales OM by the Table-25 group multiplier', () => {
    const view = computeMaterialityView({
      filteredRows: ROWS, allRows: ROWS, snapshotPresent: true, basis: 'Kas dan Setara Kas', omPercentage: 5,
      haircutPercentage: 50, assessmentData: {}, selectedEntityCodes: ['E1', 'E2', 'E3'], deptMappings: {},
      entityCount: 3,
    });
    expect(view.multiplier).toBe(2);
    expect(view.benchmarkValue).toBe(1500);
    expect(view.omValue).toBe(150);
    expect(view.pmValue).toBe(75);
  });

  it('falls back to selected entities when entityCount is omitted', () => {
    const view = computeMaterialityView({
      filteredRows: ROWS, allRows: ROWS, snapshotPresent: true, basis: 'Kas dan Setara Kas', omPercentage: 5,
      haircutPercentage: 50, assessmentData: {}, selectedEntityCodes: ['E1', 'E2'], deptMappings: {},
    });
    expect(view.multiplier).toBe(1.5);
    expect(view.omValue).toBe(112.5);
  });

  it('ignores key order in the dirty fingerprint', () => {
    const original = originalFingerprint({ initial: SIM, initialAppMappings: {} });
    const clean = draftFingerprint({
      assessmentData: {}, locationCount: 1, draftBasis: 'Kas dan Setara Kas', draftOmPercentage: 5,
      draftHaircutPercentage: 50, appMappings: {}, deptMappings: {}, materialityJustification: null,
    });
    const reordered = {
      ...clean,
      appMappings: { b: ['x'], a: ['y'] },
      deptMappings: { d2: ['u'], d1: ['v'] },
    };
    const reorderedOriginal = {
      ...original,
      appMappings: { a: ['y'], b: ['x'] },
      deptMappings: { d1: ['v'], d2: ['u'] },
    };
    expect(isScopingDirty(reordered, reorderedOriginal)).toBe(false);
    expect(isScopingDirty({ ...reordered, omPercentage: 9 }, reorderedOriginal)).toBe(true);
  });

  it('locks the editor outside Draft/Rejected', () => {
    expect(isEditorLocked('Draft')).toBe(false);
    expect(isEditorLocked('Rejected')).toBe(false);
    expect(isEditorLocked('Approved')).toBe(true);
  });

  it('reads error messages from unknown inputs', () => {
    expect(apiErrorMessage(new Error('boom'), 'fallback')).toBe('boom');
    expect(apiErrorMessage('plain', 'fallback')).toBe('plain');
    expect(apiErrorMessage(null, 'fallback')).toBe('fallback');
  });
});

function isScopingDraftDirtyAfterOmChange(
  clean: ReturnType<typeof draftFingerprint>,
  original: ReturnType<typeof originalFingerprint>,
): boolean {
  return isScopingDirty({ ...clean, omPercentage: 7 }, original);
}
