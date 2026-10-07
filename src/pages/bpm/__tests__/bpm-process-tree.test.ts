import { describe, it, expect } from 'vitest';
import { buildProcessTree } from '../utils/bpm-process-tree';
import type { BPMProcess } from '@shared/types';

describe('buildProcessTree', () => {
  const createMockProcess = (p: Partial<BPMProcess> & { id: string; name: string }): BPMProcess => ({
    organizationId: 'org1',
    noGL: '1000',
    bpmCode: null,
    fsliName: null,
    parentId: null,
    level: 'process',
    workflowStatus: 'Draft',
    workflowHistory: [],
    year: 2026,
    riskCount: 0,
    controlCount: 0,
    standardTestProcedure: null,
    createdBy: 'user1',
    createdAt: 1700000000000,
    ...p
  });

  const mockProcesses: BPMProcess[] = [
    createMockProcess({
      id: 'p1',
      name: 'Procurement Process',
      bpmCode: 'PROC-01',
      parentId: null,
      level: 'process',
    }),
    createMockProcess({
      id: 'p2',
      name: 'Vendor Selection',
      bpmCode: 'PROC-01-01',
      parentId: 'p1',
      level: 'sub_process',
    }),
    createMockProcess({
      id: 'p3',
      name: 'Treasury Operations',
      bpmCode: 'TR-01',
      parentId: null,
      level: 'process',
    })
  ];

  it('builds a tree structure connecting children to parents', () => {
    const tree = buildProcessTree(mockProcesses);
    expect(tree.length).toBe(2);

    const procurement = tree.find((p) => p.id === 'p1');
    expect(procurement).toBeDefined();
    expect(procurement?.children?.length).toBe(1);
    expect(procurement?.children?.[0].id).toBe('p2');

    const treasury = tree.find((p) => p.id === 'p3');
    expect(treasury?.children?.length).toBe(0);
  });

  it('filters processes by name or code query', () => {
    const filteredByChildName = buildProcessTree(mockProcesses, 'Vendor');
    expect(filteredByChildName.length).toBe(1);
    expect(filteredByChildName[0].id).toBe('p1');
    expect(filteredByChildName[0].children?.[0].id).toBe('p2');

    const filteredByCode = buildProcessTree(mockProcesses, 'TR-01');
    expect(filteredByCode.length).toBe(1);
    expect(filteredByCode[0].id).toBe('p3');
  });

  it('returns empty array when query does not match anything', () => {
    const result = buildProcessTree(mockProcesses, 'non-existent-xyz');
    expect(result.length).toBe(0);
  });
});
