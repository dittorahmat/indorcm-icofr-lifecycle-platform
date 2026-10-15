import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Edge } from 'reactflow';
import { nextBendOffset, useEdgeWaypoint, withBendOffset, withoutBendOffset } from './useEdgeWaypoint';

describe('useEdgeWaypoint seam (waypoint drag math)', () => {
  it('scales drag deltas by zoom and rounds', () => {
    expect(nextBendOffset({ x: 100, y: 100 }, { x: 0, y: 0 }, { x: 120, y: 140 }, 2)).toEqual({ x: 10, y: 20 });
    expect(nextBendOffset({ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 3, y: 3 }, 0)).toEqual({ x: 8, y: 8 });
  });

  it('merges and clears bend offsets without touching siblings', () => {
    expect(withBendOffset({ id: 'e1', data: { routingMode: 'auto' } }, { x: 4, y: 6 })).toEqual({
      id: 'e1',
      data: { routingMode: 'auto', bendOffset: { x: 4, y: 6 } },
    });
    expect(withoutBendOffset({ id: 'e1', data: { bendOffset: { x: 4, y: 6 } } })).toEqual({
      id: 'e1',
      data: { routingMode: 'auto' },
    });
  });

  it('resets the waypoint on double-click through the seam', () => {
    const setEdges = vi.fn((updater: (eds: Edge[]) => Edge[]) => updater([{ id: 'e1', source: 'a', target: 'b' } as Edge]));
    const { result } = renderHook(() => useEdgeWaypoint('e1', { x: 4, y: 6 }, { getZoom: () => 1, setEdges }));
    act(() => {
      result.current.handleWaypointDoubleClick({ stopPropagation: () => {}, preventDefault: () => {} } as React.MouseEvent);
    });
    expect(setEdges).toHaveBeenCalledTimes(1);
  });
});
