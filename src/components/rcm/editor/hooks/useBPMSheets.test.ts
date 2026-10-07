import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBPMSheets } from './useBPMSheets';
import type { Node, Edge } from 'reactflow';

describe('useBPMSheets hook', () => {
  it('initializes with fallback single sheet when diagram has no sheets', () => {
    let mockNodes: Node[] = [{ id: '1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } }];
    let mockEdges: Edge[] = [];
    const setNodes = vi.fn((updater) => {
      mockNodes = typeof updater === 'function' ? updater(mockNodes) : updater;
    });
    const setEdges = vi.fn((updater) => {
      mockEdges = typeof updater === 'function' ? updater(mockEdges) : updater;
    });

    const { result } = renderHook(() =>
      useBPMSheets({
        diagram: { id: 'diag-1', nodes: mockNodes, edges: mockEdges },
        nodes: mockNodes,
        edges: mockEdges,
        setNodes,
        setEdges,
      })
    );

    expect(result.current.sheets).toHaveLength(1);
    expect(result.current.isMultiSheet).toBe(false);
  });

  it('adds a sheet, preserves state, and switches active sheet', () => {
    let currentNodes: Node[] = [{ id: 'start-1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start 1' } }];
    let currentEdges: Edge[] = [];
    const setNodes = vi.fn((updater) => {
      currentNodes = typeof updater === 'function' ? updater(currentNodes) : updater;
    });
    const setEdges = vi.fn((updater) => {
      currentEdges = typeof updater === 'function' ? updater(currentEdges) : updater;
    });

    const { result } = renderHook(() =>
      useBPMSheets({
        diagram: { id: 'diag-1', nodes: currentNodes, edges: currentEdges },
        nodes: currentNodes,
        edges: currentEdges,
        setNodes,
        setEdges,
      })
    );

    act(() => {
      result.current.addSheet('Fase 2 - Gudang');
    });

    expect(result.current.sheets).toHaveLength(2);
    expect(result.current.isMultiSheet).toBe(true);
    expect(result.current.sheets[1].name).toBe('Fase 2 - Gudang');

    // Switch back to sheet 1
    const sheet1Id = result.current.sheets[0].id;
    act(() => {
      result.current.switchSheet(sheet1Id);
    });
    expect(result.current.activeSheetId).toBe(sheet1Id);
  });
});
