import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasHistory } from '../hooks/use-canvas-history';
import type { Node, Edge } from 'reactflow';

describe('useCanvasHistory', () => {
  const initialNodes: Node[] = [
    { id: '1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } }
  ];
  const initialEdges: Edge[] = [];

  it('initializes with canUndo and canRedo as false', () => {
    const { result } = renderHook(() => useCanvasHistory(initialNodes, initialEdges));
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('pushes state and enables undo', () => {
    const { result } = renderHook(() => useCanvasHistory(initialNodes, initialEdges));

    act(() => {
      result.current.pushState(initialNodes, initialEdges);
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('handles discrete undo and redo correctly', () => {
    let currentNodes = [...initialNodes];
    let currentEdges = [...initialEdges];

    const setNodes = (action: any) => {
      currentNodes = typeof action === 'function' ? action(currentNodes) : action;
    };
    const setEdges = (action: any) => {
      currentEdges = typeof action === 'function' ? action(currentEdges) : action;
    };

    const { result } = renderHook(() => useCanvasHistory(initialNodes, initialEdges));

    // User adds node 2
    const state1Nodes: Node[] = [
      ...initialNodes,
      { id: '2', type: 'activity', position: { x: 100, y: 100 }, data: { label: 'Step' } }
    ];

    act(() => {
      result.current.pushState(initialNodes, initialEdges);
      currentNodes = state1Nodes;
    });

    expect(result.current.canUndo).toBe(true);

    // Undo action
    act(() => {
      result.current.undo(currentNodes, currentEdges, setNodes, setEdges);
    });

    expect(currentNodes.length).toBe(1);
    expect(currentNodes[0].id).toBe('1');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    // Redo action
    act(() => {
      result.current.redo(currentNodes, currentEdges, setNodes, setEdges);
    });

    expect(currentNodes.length).toBe(2);
    expect(currentNodes[1].id).toBe('2');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });
});
