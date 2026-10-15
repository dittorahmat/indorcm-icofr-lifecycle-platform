import React, { useCallback, useRef } from 'react';
import type { Edge } from 'reactflow';

export interface BendOffset {
  x: number;
  y: number;
}

export interface WaypointEdge {
  id: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

interface WaypointDeps {
  getZoom: () => number;
  setEdges: (updater: (eds: Edge[]) => Edge[]) => void;
}

export function nextBendOffset(
  start: { x: number; y: number },
  initial: BendOffset,
  move: { x: number; y: number },
  zoom: number,
): BendOffset {
  const safeZoom = zoom || 1;
  return {
    x: Math.round(initial.x + (move.x - start.x) / safeZoom),
    y: Math.round(initial.y + (move.y - start.y) / safeZoom),
  };
}

export function withBendOffset<E extends WaypointEdge>(edge: E, offset: BendOffset): E {
  return { ...edge, data: { ...((edge.data as Record<string, unknown>) || {}), bendOffset: { x: offset.x, y: offset.y } } };
}

export function withoutBendOffset<E extends WaypointEdge>(edge: E): E {
  const nextData = { ...((edge.data as Record<string, unknown>) || {}) };
  delete nextData.bendOffset;
  nextData.routingMode = 'auto';
  return { ...edge, data: nextData };
}

export function useEdgeWaypoint(id: string, bendOffset: { x?: number; y?: number } | undefined, { getZoom, setEdges }: WaypointDeps) {
  const dragRef = useRef<{ startX: number; startY: number; initial: BendOffset } | null>(null);

  const handleWaypointPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const initial = { x: bendOffset?.x ?? 0, y: bendOffset?.y ?? 0 };
      dragRef.current = { startX: e.clientX, startY: e.clientY, initial };

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!dragRef.current) return;
        const next = nextBendOffset(
          { x: dragRef.current.startX, y: dragRef.current.startY },
          dragRef.current.initial,
          { x: moveEvent.clientX, y: moveEvent.clientY },
          getZoom(),
        );
        setEdges((eds) => eds.map((edge) => (edge.id !== id ? edge : withBendOffset(edge, next))));
      };

      const handlePointerUp = () => {
        dragRef.current = null;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [id, bendOffset, getZoom, setEdges],
  );

  const handleWaypointDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setEdges((eds) => eds.map((edge) => (edge.id !== id ? edge : withoutBendOffset(edge))));
    },
    [id, setEdges],
  );

  return { handleWaypointPointerDown, handleWaypointDoubleClick };
}
