import { describe, it, expect, vi } from 'vitest';
import { sanitizeNodesForSave, sanitizeEdgesForSave } from '../sanitize-bpm-nodes';

describe('sanitizeNodesForSave', () => {
  it('strips function callbacks and preserves essential node data', () => {
    const rawNodes = [
      {
        id: 'node-1',
        type: 'swimlane',
        position: { x: 100, y: 200 },
        width: 400,
        height: 800,
        zIndex: -1,
        style: { width: 400, height: 800 },
        data: {
          label: 'Finance Dept',
          department: 'Finance',
          function: 'Accounting',
          isLocked: false,
          onToggleLock: vi.fn(),
          onChangeDepartment: vi.fn(),
          nested: {
            deepHandler: vi.fn(),
            title: 'Valid Nested Text',
          },
        },
      },
      {
        id: 'node-2',
        type: 'activity',
        position: { x: 150, y: 250 },
        parentId: 'node-1',
        data: {
          label: 'Process Invoices',
          regulatoryPairs: [
            {
              riskId: 'R-01',
              riskDescription: 'Risk 1',
              onInspect: vi.fn(),
            },
          ],
        },
      },
    ];

    const sanitized = sanitizeNodesForSave(rawNodes as any);

    expect(sanitized).toHaveLength(2);
    expect(sanitized[0].id).toBe('node-1');
    expect(sanitized[0].type).toBe('swimlane');
    expect(sanitized[0].position).toEqual({ x: 100, y: 200 });
    expect(sanitized[0].data.label).toBe('Finance Dept');
    expect(sanitized[0].data.department).toBe('Finance');
    expect(sanitized[0].data.nested.title).toBe('Valid Nested Text');

    // Confirm functions are completely stripped
    expect(sanitized[0].data.onToggleLock).toBeUndefined();
    expect(sanitized[0].data.onChangeDepartment).toBeUndefined();
    expect(sanitized[0].data.nested.deepHandler).toBeUndefined();

    // Confirm nested arrays inside data are cleaned
    expect(sanitized[1].data.regulatoryPairs[0].riskId).toBe('R-01');
    expect(sanitized[1].data.regulatoryPairs[0].onInspect).toBeUndefined();
  });

  it('handles empty or invalid node arrays gracefully', () => {
    expect(sanitizeNodesForSave([])).toEqual([]);
    expect(sanitizeNodesForSave(null as any)).toEqual([]);
  });
});

describe('sanitizeEdgesForSave', () => {
  it('strips non-serializable properties from edges', () => {
    const rawEdges = [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        label: 'Flow',
        style: { stroke: '#000', onHover: vi.fn() },
      },
    ];

    const sanitized = sanitizeEdgesForSave(rawEdges as any);
    expect(sanitized).toHaveLength(1);
    expect(sanitized[0].id).toBe('edge-1');
    expect(sanitized[0].source).toBe('node-1');
    expect(sanitized[0].target).toBe('node-2');
    expect(sanitized[0].label).toBe('Flow');
    expect(sanitized[0].style.stroke).toBe('#000');
    expect(sanitized[0].style.onHover).toBeUndefined();
  });
});
