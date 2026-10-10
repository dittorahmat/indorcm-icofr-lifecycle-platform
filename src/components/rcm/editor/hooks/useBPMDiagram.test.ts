import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useBPMDiagram } from './useBPMDiagram';
import type { Edge, Node } from 'reactflow';

const NODES: Node[] = [
  { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
  { id: 'a1', type: 'activity', position: { x: 0, y: 100 }, data: { label: 'Terima kas' } },
];
const EDGES: Edge[] = [{ id: 'e1', source: 'start', target: 'a1' }];

describe('useBPMDiagram seam (diagram ownership without canvas mount)', () => {
  it('starts empty with no undo history', () => {
    const { result } = renderHook(() => useBPMDiagram());
    expect(result.current.nodes).toEqual([]);
    expect(result.current.edges).toEqual([]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('loads a diagram, edits, undoes, and redoes through one interface', () => {
    const { result } = renderHook(() => useBPMDiagram());

    act(() => {
      result.current.loadDiagram(NODES, EDGES);
    });
    expect(result.current.nodes).toHaveLength(2);

    act(() => {
      result.current.pushState(result.current.nodes, result.current.edges);
      result.current.setNodes((nds) => nds.filter((n) => n.id !== 'a1'));
    });
    expect(result.current.nodes).toHaveLength(1);
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.undoDiagram();
    });
    expect(result.current.nodes).toHaveLength(2);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redoDiagram();
    });
    expect(result.current.nodes).toHaveLength(1);
  });

  it('loading resets the history stack', () => {
    const { result } = renderHook(() => useBPMDiagram());

    act(() => {
      result.current.pushState(result.current.nodes, result.current.edges);
    });
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.loadDiagram(NODES, EDGES);
    });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });
});
