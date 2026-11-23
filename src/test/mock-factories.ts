import type { GLRow } from '@shared/types';
import type { FormattedDoDRow } from '@/components/reports/dod/dod-types';

/**
 * Standard factory for GLRow in unit tests.
 * Eliminates redundant 20-field mock boilerplate.
 */
export function makeMockGLRow(overrides: Partial<GLRow> = {}, index = 1): GLRow {
  return {
    id: `gl-${index}`,
    organizationId: 'org-test',
    snapshotId: 'snap-test',
    ymd: '2026-11-23',
    entityCode: 'BUMN01',
    parentEntityCode: null,
    entityId: null,
    noGL: `100${String(index).padStart(2, '0')}`,
    glDesc: `Account Description ${index}`,
    currency: 'IDR',
    balance: index * 1_000_000_000,
    fsliBalance: null,
    fsliCode: `F-${(index % 3) + 1}`,
    fsliName: `FSLI Category ${(index % 3) + 1}`,
    category: 'Asset',
    subKategori: 'Current',
    noUrut: index,
    assignedDepartmentIds: [],
    ownerAcceptance: null,
    mappingConfidence: 1,
    ...overrides,
  };
}

/**
 * Standard factory for FormattedDoDRow in unit tests.
 */
export function makeMockDoDRow(overrides: Partial<FormattedDoDRow> = {}, index = 1): FormattedDoDRow {
  return {
    ref: `DEF-${index}`,
    description: `Deficiency Description ${index}`,
    isRemediated: false,
    ineffectivePeriod: 'Q4 2026',
    exposureValue: 50_000_000,
    severity: 'ICD',
    impactedAccount: '100100',
    cosoComponent: 'Control Activities',
    businessProcess: 'Procurement',
    businessUnit: 'Head Office',
    assertions: {
      c: false,
      a: false,
      eo: false,
      co: false,
      ro: false,
      va: false,
      pd: false,
    },
    boxes: {
      box1: false,
      box2: false,
      box3: false,
      box4: false,
      box5: false,
      box6: false,
      box7: false,
    },
    ...overrides,
  };
}
