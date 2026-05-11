import { describe, it, expect } from 'vitest';
import { identifySignificantAccounts } from '../pages/scoping/services/materiality-calc';
import { GLRow } from '@shared/types';

describe('significantAccounts calculation logic', () => {
  it('should correctly mark accounts as significant at FSLI level', () => {
    // Simulasi data row
    const mockGlData = [
      { fsliName: 'FSLI-A', balance: 1000, noGL: '101', id: '1', organizationId: 'o', snapshotId: 's', ymd: 'y', entityCode: 'e', currency: 'IDR', fsliCode: 'f', category: 'c', subKategori: 'sk', noUrut: 1, assignedDepartmentIds: [], ownerAcceptance: null },
      { fsliName: 'FSLI-A', balance: 50, noGL: '102', id: '2', organizationId: 'o', snapshotId: 's', ymd: 'y', entityCode: 'e', currency: 'IDR', fsliCode: 'f', category: 'c', subKategori: 'sk', noUrut: 2, assignedDepartmentIds: [], ownerAcceptance: null },
      { fsliName: 'FSLI-B', balance: 200, noGL: '201', id: '3', organizationId: 'o', snapshotId: 's', ymd: 'y', entityCode: 'e', currency: 'IDR', fsliCode: 'f', category: 'c', subKategori: 'sk', noUrut: 3, assignedDepartmentIds: [], ownerAcceptance: null },
    ] as GLRow[];

    const assessmentData = { 'FSLI-A': { 1: 'High' } }; // FSLI-A signifikan secara kualitatif
    const pmValue = 500;

    const result = identifySignificantAccounts({
      glData: mockGlData,
      pmValue,
      assessmentData
    });

    // Ekspektasi: FSLI-A signifikan (dua akun), FSLI-B tidak (karena balance < pmValue)
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('FSLI-A');
    expect(result[1].name).toBe('FSLI-A');
  });

  it('should mark account as significant if balance exceeds PM even if qualitative is low', () => {
     const mockGlData = [
      { fsliName: 'FSLI-B', balance: 1000, noGL: '201', id: '3', organizationId: 'o', snapshotId: 's', ymd: 'y', entityCode: 'e', currency: 'IDR', fsliCode: 'f', category: 'c', subKategori: 'sk', noUrut: 3, assignedDepartmentIds: [], ownerAcceptance: null },
    ] as GLRow[];

    const result = identifySignificantAccounts({
      glData: mockGlData,
      pmValue: 500
    });

    expect(result.length).toBe(1);
    expect(result[0].isQuantitative).toBe(true);
  });
});
