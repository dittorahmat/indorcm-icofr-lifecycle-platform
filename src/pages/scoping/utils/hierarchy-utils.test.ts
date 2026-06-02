import { describe, it, expect } from 'vitest';
import { buildEntityHierarchy, calculateRollupBalances, getAllDescendantCodes } from './hierarchy-utils';
import { GLRow } from '@shared/types';

describe('hierarchy-utils', () => {
  const mockRows: Partial<GLRow>[] = [
    { entityCode: 'H', parentEntityCode: null, balance: 100 },
    { entityCode: 'A1', parentEntityCode: 'H', balance: 50 },
    { entityCode: 'A2', parentEntityCode: 'H', balance: 50 },
    { entityCode: 'C1', parentEntityCode: 'A1', balance: 25 },
    { entityCode: 'C2', parentEntityCode: 'A1', balance: 25 },
  ];

  describe('buildEntityHierarchy', () => {
    it('should build a tree from flat rows', () => {
      const tree = buildEntityHierarchy(mockRows as GLRow[]);
      expect(tree.length).toBe(1);
      expect(tree[0].code).toBe('H');
      expect(tree[0].children.length).toBe(2);
      expect(tree[0].children[0].code).toBe('A1');
      expect(tree[0].children[0].children.length).toBe(2);
    });
  });

  describe('calculateRollupBalances', () => {
    it('should recursively sum balances', () => {
      const tree = buildEntityHierarchy(mockRows as GLRow[]);
      calculateRollupBalances(tree);
      
      // C1 (25), C2 (25) -> A1 (50 + 25 + 25 = 100)
      // A2 (50)
      // H (100 + A1(100) + A2(50) = 250)
      expect(tree[0].balance).toBe(250);
      expect(tree[0].children.find(c => c.code === 'A1')?.balance).toBe(100);
    });
  });

  describe('getAllDescendantCodes', () => {
    it('should return all codes in sub-tree', () => {
      const tree = buildEntityHierarchy(mockRows as GLRow[]);
      const hNode = tree[0];
      const allCodes = getAllDescendantCodes(hNode);
      expect(allCodes).toContain('H');
      expect(allCodes).toContain('A1');
      expect(allCodes).toContain('C1');
      expect(allCodes.length).toBe(5);
    });
  });
});
