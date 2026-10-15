import {
  calculateBenchmarkValue,
  calculateOM,
  calculatePM,
  calculateScopingCompliance,
  getRowScopeClassification,
  identifySignificantAccounts,
} from '../services/materiality-calc';
import type { GLRow, MaterialitySimulation } from '@shared/types';

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}

interface MappingItem {
  accountCode: string;
  applicationId: string;
}

export function appMappingsFromItems(items: MappingItem[] | undefined): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const m of items ?? []) {
    if (!map[m.accountCode]) map[m.accountCode] = [];
    map[m.accountCode].push(m.applicationId);
  }
  return map;
}

interface AccountWithDept {
  fsliCode?: string | null;
  assignedDepartmentIds?: string[] | null;
}

export function deptMappingsFromAccounts(accounts: readonly AccountWithDept[] | undefined): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const sa of accounts ?? []) {
    if (sa.fsliCode && sa.assignedDepartmentIds) map[sa.fsliCode] = sa.assignedDepartmentIds;
  }
  return map;
}

export interface MaterialityViewInputs {
  filteredRows: GLRow[];
  allRows: GLRow[];
  snapshotPresent: boolean;
  basis: string;
  omPercentage: number;
  haircutPercentage: number;
  assessmentData: MaterialitySimulation['assessmentData'];
  selectedEntityCodes: string[];
  deptMappings: Record<string, string[]>;
}

export function computeMaterialityView(inputs: MaterialityViewInputs) {
  const { filteredRows, allRows, snapshotPresent, basis, omPercentage, haircutPercentage, assessmentData, selectedEntityCodes, deptMappings } = inputs;
  if (filteredRows.length === 0 || !snapshotPresent) {
    return { omValue: 0, pmValue: 0, multiplier: 1, benchmarkValue: 0, mergedGlData: [], significantAccounts: [], scopingCompliance: null };
  }
  const benchmarkValue = calculateBenchmarkValue(filteredRows, basis);
  const multiplier = 1;
  const omValue = calculateOM(benchmarkValue, omPercentage, multiplier);
  const pmValue = calculatePM(omValue, haircutPercentage);
  const mergedGlData = filteredRows.map((row) => ({
    ...row,
    assignedDepartmentIds: deptMappings[row.noGL] || [],
    scopeClassification: getRowScopeClassification({ row, pmValue, assessmentData, selectedEntityCodes, allGlRows: allRows }),
  }));
  const significantAccounts = identifySignificantAccounts({ glData: mergedGlData, pmValue, assessmentData });
  const scopingCompliance = calculateScopingCompliance(allRows, selectedEntityCodes);
  return { omValue, pmValue, multiplier, benchmarkValue, mergedGlData, significantAccounts, scopingCompliance };
}

export interface DraftFingerprintInputs {
  assessmentData: MaterialitySimulation['assessmentData'];
  locationCount: MaterialitySimulation['locationCount'];
  draftBasis: string;
  draftOmPercentage: number;
  draftHaircutPercentage: number;
  appMappings: Record<string, string[]>;
  deptMappings: Record<string, string[]>;
  materialityJustification: MaterialitySimulation['materialityJustification'];
}

export interface OriginalFingerprintInputs {
  initial: MaterialitySimulation;
  initialAppMappings: Record<string, string[]>;
}

export function draftFingerprint(inputs: DraftFingerprintInputs) {
  return {
    assessmentData: inputs.assessmentData || {},
    locationCount: inputs.locationCount || 0,
    omPercentage: inputs.draftOmPercentage || 0,
    haircutPercentage: inputs.draftHaircutPercentage || 0,
    basis: inputs.draftBasis || '',
    appMappings: inputs.appMappings || {},
    deptMappings: inputs.deptMappings || {},
    materialityJustification: inputs.materialityJustification || null,
  };
}

export function originalFingerprint({ initial, initialAppMappings }: OriginalFingerprintInputs) {
  return {
    assessmentData: initial.assessmentData || {},
    locationCount: initial.locationCount || 0,
    omPercentage: initial.omPercentage || 0,
    haircutPercentage: initial.haircutPercentage || 0,
    basis: initial.basis || '',
    appMappings: initialAppMappings || {},
    deptMappings: deptMappingsFromAccounts(initial.significantAccounts),
    materialityJustification: initial.materialityJustification || null,
  };
}

export function isScopingDirty(draft: ReturnType<typeof draftFingerprint>, original: ReturnType<typeof originalFingerprint>): boolean {
  return JSON.stringify(draft) !== JSON.stringify(original);
}

export function isEditorLocked(workflowStatus: MaterialitySimulation['workflowStatus']): boolean {
  return workflowStatus !== 'Draft' && workflowStatus !== 'Rejected';
}
