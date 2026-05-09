import { describe, it, expect } from 'vitest';
import { sortGLHierarchically } from './compliance-utils';
import { GLRow } from '@shared/types';

describe('sortGLHierarchically', () => {
  it('should sort FSLIs by their minimum noUrut and GLs within FSLIs by noUrut', () => {
    // FSLI A: min noUrut = 2
    // FSLI B: min noUrut = 3
    // FSLI C: min noUrut = 1
    const data: Partial<GLRow>[] = [
      { fsliName: 'FSLI A', glDesc: 'GL X', noUrut: 2, noGL: 'A1' },
      { fsliName: 'FSLI A', glDesc: 'GL Y', noUrut: 5, noGL: 'A2' },
      { fsliName: 'FSLI B', glDesc: 'GL Z', noUrut: 3, noGL: 'B1' },
      { fsliName: 'FSLI B', glDesc: 'GL W', noUrut: 4, noGL: 'B2' },
      { fsliName: 'FSLI C', glDesc: 'GL V', noUrut: 1, noGL: 'C1' },
      { fsliName: 'FSLI C', glDesc: 'GL U', noUrut: 6, noGL: 'C2' },
    ];

    const sorted = sortGLHierarchically(data as GLRow[]);

    // Expected FSLI order: C (min 1), A (min 2), B (min 3)
    // Within C: V (1), U (6)
    // Within A: X (2), Y (5)
    // Within B: Z (3), W (4)

    expect(sorted[0].glDesc).toBe('GL V'); // FSLI C
    expect(sorted[1].glDesc).toBe('GL U'); // FSLI C
    expect(sorted[2].glDesc).toBe('GL X'); // FSLI A
    expect(sorted[3].glDesc).toBe('GL Y'); // FSLI A
    expect(sorted[4].glDesc).toBe('GL Z'); // FSLI B
    expect(sorted[5].glDesc).toBe('GL W'); // FSLI B
  });

  it('should handle missing noUrut by defaulting to 0', () => {
    const data: Partial<GLRow>[] = [
      { fsliName: 'FSLI B', glDesc: 'GL B1', noUrut: 10, noGL: 'B1' },
      { fsliName: 'FSLI A', glDesc: 'GL A1', noUrut: undefined, noGL: 'A1' }, // defaults to 0
    ];

    const sorted = sortGLHierarchically(data as GLRow[]);

    expect(sorted[0].fsliName).toBe('FSLI A');
    expect(sorted[1].fsliName).toBe('FSLI B');
  });

  it('should sort alphabetically if min noUrut is the same', () => {
    const data: Partial<GLRow>[] = [
      { fsliName: 'FSLI B', glDesc: 'GL B1', noUrut: 1, noGL: 'B1' },
      { fsliName: 'FSLI A', glDesc: 'GL A1', noUrut: 1, noGL: 'A1' },
    ];

    const sorted = sortGLHierarchically(data as GLRow[]);

    expect(sorted[0].fsliName).toBe('FSLI A');
    expect(sorted[1].fsliName).toBe('FSLI B');
  });
});
