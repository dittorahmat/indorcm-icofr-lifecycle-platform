import { describe, it, expect } from 'vitest';
import { countAllProcesses, findDiagramFor, resolveDiagramTarget } from '../diagram-list-utils';
import type { BPMDiagram, BPMProcessWithChildren } from '@shared/types';

const roots = [
  { id: 'p1', name: 'Proc A', children: [{ id: 'c1', name: 'Sub A1' }, { id: 'c2', name: 'Sub A2' }] },
  { id: 'p2', name: 'Proc B' },
] as unknown as BPMProcessWithChildren[];

const diagrams = {
  items: [{ id: 'd1', subProcess: 'Proc A', name: 'Proc A' } as unknown as BPMDiagram],
};

describe('diagram-list-utils', () => {
  it('counts roots plus children', () => {
    expect(countAllProcesses(roots)).toBe(4);
    expect(countAllProcesses([])).toBe(0);
  });

  it('finds a diagram by subProcess or name', () => {
    expect(findDiagramFor(diagrams, { name: 'Proc A' } as never)?.id).toBe('d1');
    expect(findDiagramFor(diagrams, { name: 'Missing' } as never)).toBeUndefined();
    expect(findDiagramFor(undefined, { name: 'Proc A' } as never)).toBeUndefined();
  });

  it('resolves open-vs-create targets for macro and micro diagrams', () => {
    expect(resolveDiagramTarget(diagrams, { name: 'Proc A' } as never)).toEqual({ mode: 'open', diagramId: 'd1' });
    expect(resolveDiagramTarget(diagrams, { name: 'Missing' } as never)).toEqual({ mode: 'create' });
  });
});
