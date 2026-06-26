import { describe, it, expect } from 'vitest';
import { 
  getGroupMultiplier, 
  calculateBenchmarkValue, 
  calculateOM, 
  calculatePM, 
  calculateRiskRating,
  calculateScopingCompliance,
  getRowScopeClassification
} from './materiality-calc';
import { GLRow } from '@shared/types';

describe('materiality-calc service', () => {
  describe('getGroupMultiplier (Table 25)', () => {
    it('should return 1 for 1 location', () => {
      expect(getGroupMultiplier(1)).toBe(1);
    });
    it('should return 1.5 for 2 locations', () => {
      expect(getGroupMultiplier(2)).toBe(1.5);
    });
    it('should return 2 for 4 locations', () => {
      expect(getGroupMultiplier(4)).toBe(2);
    });
    it('should return 3 for 9 locations', () => {
      expect(getGroupMultiplier(9)).toBe(3);
    });
    it('should return 9 for >130 locations', () => {
      expect(getGroupMultiplier(150)).toBe(9);
    });
  });

  describe('calculateBenchmarkValue', () => {
    const mockData: GLRow[] = [
      { noGL: '1', glDesc: 'A', balance: 1000, fsliName: 'Revenue', fsliBalance: null, id: '1', organizationId: 'o', snapshotId: 's', ymd: 'y', entityCode: 'e', parentEntityCode: null, entityId: null, currency: 'IDR', fsliCode: 'f', category: 'c', subKategori: 'sk', noUrut: 1, assignedDepartmentIds: [], ownerAcceptance: null, mappingConfidence: 1.0 },
      { noGL: '2', glDesc: 'B', balance: -500, fsliName: 'Revenue', fsliBalance: null, id: '2', organizationId: 'o', snapshotId: 's', ymd: 'y', entityCode: 'e', parentEntityCode: null, entityId: null, currency: 'IDR', fsliCode: 'f', category: 'c', subKategori: 'sk', noUrut: 2, assignedDepartmentIds: [], ownerAcceptance: null, mappingConfidence: 1.0 },
      { noGL: '3', glDesc: 'C', balance: 200, fsliName: 'Asset', fsliBalance: null, id: '3', organizationId: 'o', snapshotId: 's', ymd: 'y', entityCode: 'e', parentEntityCode: null, entityId: null, currency: 'IDR', fsliCode: 'f', category: 'c', subKategori: 'sk', noUrut: 3, assignedDepartmentIds: [], ownerAcceptance: null, mappingConfidence: 1.0 },
    ];

    it('should sum absolute values for the selected basis', () => {
      expect(calculateBenchmarkValue(mockData, 'Revenue')).toBe(1500);
    });

    it('should return 0 if basis not found', () => {
      expect(calculateBenchmarkValue(mockData, 'NonExistent')).toBe(0);
    });
  });

  describe('calculateOM', () => {
    it('should calculate OM correctly with multiplier', () => {
      // 1,000,000 * 5% * 1.4 = 70,000
      expect(calculateOM(1000000, 5, 1.4)).toBe(70000);
    });
  });

  describe('calculatePM', () => {
    it('should calculate PM correctly with haircut', () => {
      // 100,000 * (1 - 25%) = 75,000
      expect(calculatePM(100000, 25)).toBe(75000);
    });
  });

  describe('calculateRiskRating (3x3 Matrix)', () => {
    it('should return High if both are High', () => {
      expect(calculateRiskRating('High', 'High')).toBe('High');
    });
    it('should return Medium if Quant is High and Qual is Low', () => {
      expect(calculateRiskRating('High', 'Low')).toBe('Medium');
    });
    it('should return High if Quant is Medium and Qual is High', () => {
      expect(calculateRiskRating('Medium', 'High')).toBe('High');
    });
    it('should return Low if both are Low', () => {
      expect(calculateRiskRating('Low', 'Low')).toBe('Low');
    });
  });

  describe('calculateScopingCompliance', () => {
    const mockData: GLRow[] = [
      { id: '1', organizationId: 'o', snapshotId: 's', ymd: 'y', noGL: '101', glDesc: 'Cash A', balance: 500, entityCode: 'A', parentEntityCode: null, entityId: null, currency: 'IDR', fsliName: 'Kas dan Setara Kas', fsliCode: '101', category: 'Asset', subKategori: 'Cash', noUrut: 1, assignedDepartmentIds: [], ownerAcceptance: null, mappingConfidence: 1.0, fsliBalance: null },
      { id: '2', organizationId: 'o', snapshotId: 's', ymd: 'y', noGL: '102', glDesc: 'Cash B', balance: 300, entityCode: 'B', parentEntityCode: null, entityId: null, currency: 'IDR', fsliName: 'Kas dan Setara Kas', fsliCode: '101', category: 'Asset', subKategori: 'Cash', noUrut: 2, assignedDepartmentIds: [], ownerAcceptance: null, mappingConfidence: 1.0, fsliBalance: null },
      { id: '3', organizationId: 'o', snapshotId: 's', ymd: 'y', noGL: '103', glDesc: 'Cash C', balance: 200, entityCode: 'C', parentEntityCode: null, entityId: null, currency: 'IDR', fsliName: 'Kas dan Setara Kas', fsliCode: '101', category: 'Asset', subKategori: 'Cash', noUrut: 3, assignedDepartmentIds: [], ownerAcceptance: null, mappingConfidence: 1.0, fsliBalance: null },
      { id: '4', organizationId: 'o', snapshotId: 's', ymd: 'y', noGL: '201', glDesc: 'Revenue A', balance: 1000, entityCode: 'A', parentEntityCode: null, entityId: null, currency: 'IDR', fsliName: 'Revenue', fsliCode: '201', category: 'Revenue', subKategori: 'Revenue', noUrut: 4, assignedDepartmentIds: [], ownerAcceptance: null, mappingConfidence: 1.0, fsliBalance: null },
    ];

    it('should compute FSLI and aggregate coverage correctly', () => {
      const result = calculateScopingCompliance(mockData, ['A', 'B']);
      const cashCov = result.fsliCoverages.find(c => c.fsliName === 'Kas dan Setara Kas');
      expect(cashCov?.coveragePercentage).toBe(80);
      expect(cashCov?.isCompliant).toBe(true);

      expect(result.aggregateCompliance.revenue.percentage).toBe(100);
      expect(result.isOverallCompliant).toBe(true);
    });

    it('should mark non-compliant if coverage is under 2/3', () => {
      const result = calculateScopingCompliance(mockData, ['A']);
      const cashCov = result.fsliCoverages.find(c => c.fsliName === 'Kas dan Setara Kas');
      expect(cashCov?.isCompliant).toBe(false);
      expect(result.isOverallCompliant).toBe(false);
    });
  });

  describe('getRowScopeClassification', () => {
    const mockData: GLRow[] = [
      { id: '1', organizationId: 'o', snapshotId: 's', ymd: 'y', noGL: '101', glDesc: 'Cash A', balance: 2000, entityCode: 'A', parentEntityCode: null, entityId: null, currency: 'IDR', fsliName: 'Kas dan Setara Kas', fsliCode: '101', category: 'Asset', subKategori: 'Cash', noUrut: 1, assignedDepartmentIds: [], ownerAcceptance: null, mappingConfidence: 1.0, fsliBalance: null },
      { id: '2', organizationId: 'o', snapshotId: 's', ymd: 'y', noGL: '102', glDesc: 'Cash B', balance: 500, entityCode: 'B', parentEntityCode: null, entityId: null, currency: 'IDR', fsliName: 'Kas dan Setara Kas', fsliCode: '101', category: 'Asset', subKategori: 'Cash', noUrut: 2, assignedDepartmentIds: [], ownerAcceptance: null, mappingConfidence: 1.0, fsliBalance: null },
    ];

    it('should classify above PM row as above-pm', () => {
      const classification = getRowScopeClassification({
        row: mockData[0],
        pmValue: 1500,
        assessmentData: {},
        selectedEntityCodes: ['A', 'B'],
        allGlRows: mockData
      });
      expect(classification).toBe('above-pm');
    });

    it('should classify below PM but selected row as qualitative if FSLI is mandatory', () => {
      const classification = getRowScopeClassification({
        row: mockData[1],
        pmValue: 1500,
        assessmentData: {},
        selectedEntityCodes: ['A', 'B'],
        allGlRows: mockData
      });
      expect(classification).toBe('qualitative');
    });

    it('should classify below PM, not qualitative, but in scope row as two-thirds', () => {
      const otherData: GLRow[] = [
        { id: '1', organizationId: 'o', snapshotId: 's', ymd: 'y', noGL: '301', glDesc: 'Receivables A', balance: 2000, entityCode: 'A', parentEntityCode: null, entityId: null, currency: 'IDR', fsliName: 'Piutang', fsliCode: '301', category: 'Asset', subKategori: 'Receivables', noUrut: 1, assignedDepartmentIds: [], ownerAcceptance: null, mappingConfidence: 1.0, fsliBalance: null },
        { id: '2', organizationId: 'o', snapshotId: 's', ymd: 'y', noGL: '302', glDesc: 'Receivables B', balance: 500, entityCode: 'B', parentEntityCode: null, entityId: null, currency: 'IDR', fsliName: 'Piutang', fsliCode: '301', category: 'Asset', subKategori: 'Receivables', noUrut: 2, assignedDepartmentIds: [], ownerAcceptance: null, mappingConfidence: 1.0, fsliBalance: null },
      ];
      const classification = getRowScopeClassification({
        row: otherData[1],
        pmValue: 1500,
        assessmentData: {},
        selectedEntityCodes: ['A', 'B'],
        allGlRows: otherData
      });
      expect(classification).toBe('two-thirds');
    });
  });
});
