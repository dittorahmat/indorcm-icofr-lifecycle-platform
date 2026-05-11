import { describe, it, expect } from 'vitest';
import { 
  getGroupMultiplier, 
  calculateBenchmarkValue, 
  calculateOM, 
  calculatePM, 
  calculateRiskRating 
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
      { noGL: '1', glDesc: 'A', balance: 1000, fsliName: 'Revenue', id: '1', organizationId: 'o', snapshotId: 's', ymd: 'y', entityCode: 'e', currency: 'IDR', fsliCode: 'f', category: 'c', subKategori: 'sk', noUrut: 1, assignedDepartmentIds: [], ownerAcceptance: null },
      { noGL: '2', glDesc: 'B', balance: -500, fsliName: 'Revenue', id: '2', organizationId: 'o', snapshotId: 's', ymd: 'y', entityCode: 'e', currency: 'IDR', fsliCode: 'f', category: 'c', subKategori: 'sk', noUrut: 2, assignedDepartmentIds: [], ownerAcceptance: null },
      { noGL: '3', glDesc: 'C', balance: 200, fsliName: 'Asset', id: '3', organizationId: 'o', snapshotId: 's', ymd: 'y', entityCode: 'e', currency: 'IDR', fsliCode: 'f', category: 'c', subKategori: 'sk', noUrut: 3, assignedDepartmentIds: [], ownerAcceptance: null },
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
});
