import { describe, it, expect } from 'vitest';
import { sortGLHierarchically } from './compliance-utils';
import { GLRow } from '@shared/types';

describe('compliance-utils hierarchal sorting', () => {
  it('should sort FSLIs by their minimum noUrut', () => {
    const data: Partial<GLRow>[] = [
      { fsliName: 'FSLI B', noUrut: 10, balance: 100 },
      { fsliName: 'FSLI A', noUrut: 1, balance: 200 }, // minNoUrut: 1
      { fsliName: 'FSLI B', noUrut: 5, balance: 300 },  // minNoUrut: 5
      { fsliName: 'FSLI C', noUrut: 20, balance: 400 }, // minNoUrut: 20
    ];

    const sorted = sortGLHierarchically(data as GLRow[]);

    // Expected order based on minNoUrut:
    // 1. FSLI A (min: 1)
    // 2. FSLI B (min: 5)
    // 3. FSLI C (min: 20)

    expect(sorted[0].fsliName).toBe('FSLI A');
    expect(sorted[1].fsliName).toBe('FSLI B');
    expect(sorted[2].fsliName).toBe('FSLI B');
    expect(sorted[3].fsliName).toBe('FSLI C');
  });

  it('should sort alphabetically if min noUrut is the same', () => {
    const data: Partial<GLRow>[] = [
      { fsliName: 'FSLI B', noUrut: 1, balance: 100 },
      { fsliName: 'FSLI A', noUrut: 1, balance: 200 },
    ];

    const sorted = sortGLHierarchically(data as GLRow[]);

    expect(sorted[0].fsliName).toBe('FSLI A');
    expect(sorted[1].fsliName).toBe('FSLI B');
  });
});
