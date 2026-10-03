import React, { useCallback, useRef } from 'react';
import { EdgeProps, useStore, useReactFlow, EdgeLabelRenderer } from 'reactflow';
import type { BPMEdgeRoutingMode, BPMEdgeData } from '../../../../shared/types';
import { useTranslation } from 'react-i18next';
import {
  normalizeHandlePosition,
  getDistributedPoint,
  getOrthogonalPath,
  getLineIntersection,
  type Segment,
  type Point,
} from './edge-routing-utils';

interface BridgeEdgeProps extends EdgeProps {
  borderRadius?: number;
  sourceHandleId?: string;
  targetHandleId?: string;
  data?: BPMEdgeData;
}

export function BridgeEdge({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  label,
  data,
}: BridgeEdgeProps) {
  const { t } = useTranslation(['bpm']);
  const { getZoom, setEdges } = useReactFlow();
  const edges = useStore((state) => state.edges);
  const nodeInternals = useStore((state) => state.nodeInternals);

  // Drag tracking state ref for waypoint
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialBendOffset: { x: number; y: number };
  } | null>(null);

  // Force re-evaluation during node drags
  useStore((state) => {
    const nodeArray = Array.from(state.nodeInternals.values());
    return nodeArray.map((n) => `${n.id}:${n.position.x},${n.position.y}`).join('|');
  });

  const sourceNode = nodeInternals.get(source);
  const targetNode = nodeInternals.get(target);

  const sSide = normalizeHandlePosition(sourceHandleId, sourcePosition, sourceNode, targetNode, true, nodeInternals);
  const tSide = normalizeHandlePosition(targetHandleId, targetPosition, sourceNode, targetNode, false, nodeInternals);

  const sourcePt = sourceNode
    ? getDistributedPoint(sourceNode, sSide, id, edges, true, nodeInternals)
    : { x: 0, y: 0 };
  const targetPt = targetNode
    ? getDistributedPoint(targetNode, tSide, id, edges, false, nodeInternals)
    : { x: 0, y: 0 };

  // Compute channel offset for parallel edges connecting similar node pairs / directions
  // to avoid overlapping coincident orthogonal segments
  const parallelEdges = edges.filter((e) => {
    return (
      (e.source === source && e.target === target) ||
      (e.source === target && e.target === source)
    );
  });

  let channelOffset = 0;
  if (parallelEdges.length > 1) {
    parallelEdges.sort((a, b) => a.id.localeCompare(b.id));
    const edgeIndex = parallelEdges.findIndex((e) => e.id === id);
    if (edgeIndex !== -1) {
      const spacing = 20; // 20px channel spacing
      channelOffset = (edgeIndex - (parallelEdges.length - 1) / 2) * spacing;
    }
  }

  const edgeData = (data as BPMEdgeData | undefined);
  const bendOffset = edgeData?.bendOffset;
  const routingMode: BPMEdgeRoutingMode = edgeData?.routingMode || 'auto';

  const { path: basePath, segments: currentSegments, primaryHandle } = getOrthogonalPath(
    sourcePt,
    sSide,
    targetPt,
    tSide,
    channelOffset,
    bendOffset,
    routingMode
  );

  // Handle pointer down for dragging the bend coordinate handle
  const handleWaypointPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const zoom = getZoom() || 1;
    const initialBend = {
      x: bendOffset?.x ?? 0,
      y: bendOffset?.y ?? 0,
    };

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialBendOffset: initialBend,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = (moveEvent.clientX - dragRef.current.startX) / zoom;
      const dy = (moveEvent.clientY - dragRef.current.startY) / zoom;

      const newOffsetX = Math.round(dragRef.current.initialBendOffset.x + dx);
      const newOffsetY = Math.round(dragRef.current.initialBendOffset.y + dy);

      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== id) return edge;
          return {
            ...edge,
            data: {
              ...(edge.data || {}),
              bendOffset: {
                x: newOffsetX,
                y: newOffsetY,
              },
            },
          };
        })
      );
    };

    const handlePointerUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [id, bendOffset, getZoom, setEdges]);

  // Double-click reset to default path
  const handleWaypointDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id !== id) return edge;
        const nextData = { ...(edge.data || {}) };
        delete nextData.bendOffset;
        nextData.routingMode = 'auto';
        return {
          ...edge,
          data: nextData,
        };
      })
    );
  }, [id, setEdges]);

  const selectedEdgeStyle: React.CSSProperties = selected
    ? {
        ...style,
        stroke: '#2563eb',
        strokeWidth: 3.5,
        filter: 'drop-shadow(0 0 4px rgba(37, 99, 235, 0.5))',
      }
    : style;

  // Waypoint Handle element rendered when selected
  const waypointHandleElement = selected && primaryHandle ? (
    <EdgeLabelRenderer>
      <div
        style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${Math.round(primaryHandle.x)}px, ${Math.round(primaryHandle.y)}px)`,
          pointerEvents: 'all',
          zIndex: 1000,
        }}
        className="nodrag nopan flex items-center justify-center"
      >
        <div
          role="button"
          tabIndex={0}
          onPointerDown={handleWaypointPointerDown}
          onDoubleClick={handleWaypointDoubleClick}
          title={t('bpm:editor.edge.resetWaypointHint', { defaultValue: 'Drag to adjust bend coordinates. Double-click to reset.' })}
          className={`w-3.5 h-3.5 rounded-full bg-white border-2 border-amber-500 shadow-md transition-transform hover:scale-125 active:scale-110 active:bg-amber-100 ${
            primaryHandle.axis === 'x' ? 'cursor-col-resize' : 'cursor-row-resize'
          }`}
          aria-label={t('bpm:editor.edge.resetWaypointHint', { defaultValue: 'Waypoint handle' })}
        />
      </div>
    </EdgeLabelRenderer>
  ) : null;

  if (currentSegments.length === 0) {
    return (
      <>
        <path
          d={basePath}
          fill="none"
          stroke="transparent"
          strokeWidth={24}
          style={{ pointerEvents: 'stroke' }}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path id={id} style={selectedEdgeStyle} className="react-flow__edge-path" d={basePath} markerEnd={markerEnd} />
        {waypointHandleElement}
      </>
    );
  }

  // Get segments for all other edges
  const otherEdgesSegments: { edgeId: string; segments: Segment[] }[] = [];
  edges.forEach((e) => {
    if (e.id === id) return;
    const eSrcNode = nodeInternals.get(e.source);
    const eTgtNode = nodeInternals.get(e.target);
    if (!eSrcNode || !eTgtNode) return;

    const eSSide = normalizeHandlePosition(e.sourceHandle, undefined, eSrcNode, eTgtNode, true, nodeInternals);
    const eTSide = normalizeHandlePosition(e.targetHandle, undefined, eSrcNode, eTgtNode, false, nodeInternals);

    const eSrcPt = getDistributedPoint(eSrcNode, eSSide, e.id, edges, true, nodeInternals);
    const eTgtPt = getDistributedPoint(eTgtNode, eTSide, e.id, edges, false, nodeInternals);

    let otherOffset = 0;
    const otherParallels = edges.filter((pe) => {
      return (
        (pe.source === e.source && pe.target === e.target) ||
        (pe.source === e.target && pe.target === e.source)
      );
    });
    if (otherParallels.length > 1) {
      otherParallels.sort((a, b) => a.id.localeCompare(b.id));
      const idx = otherParallels.findIndex((pe) => pe.id === e.id);
      if (idx !== -1) {
        otherOffset = (idx - (otherParallels.length - 1) / 2) * 20;
      }
    }

    const otherData = (e.data as BPMEdgeData | undefined);
    const { segments: otherSegs } = getOrthogonalPath(
      eSrcPt,
      eSSide,
      eTgtPt,
      eTSide,
      otherOffset,
      otherData?.bendOffset,
      otherData?.routingMode || 'auto'
    );
    if (otherSegs.length > 0) {
      otherEdgesSegments.push({
        edgeId: e.id,
        segments: otherSegs,
      });
    }
  });

  // Construct final path with bridges on intersections
  const bridgeRadius = 6;
  let finalPath = `M ${currentSegments[0].p1.x} ${currentSegments[0].p1.y}`;

  currentSegments.forEach((seg) => {
    const intersections: { pt: Point; otherEdgeId: string }[] = [];
    otherEdgesSegments.forEach((other) => {
      other.segments.forEach((otherSeg) => {
        const pt = getLineIntersection(seg.p1, seg.p2, otherSeg.p1, otherSeg.p2);
        if (pt) {
          intersections.push({ pt, otherEdgeId: other.edgeId });
        }
      });
    });

    if (intersections.length > 0) {
      intersections.sort((a, b) => {
        const distA = Math.hypot(a.pt.x - seg.p1.x, a.pt.y - seg.p1.y);
        const distB = Math.hypot(b.pt.x - seg.p1.x, b.pt.y - seg.p1.y);
        return distA - distB;
      });

      intersections.forEach(({ pt, otherEdgeId }) => {
        if (id < otherEdgeId) {
          return;
        }

        const dx = seg.p2.x - seg.p1.x;
        const dy = seg.p2.y - seg.p1.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          const ux = dx / len;
          const uy = dy / len;

          const startX = pt.x - ux * bridgeRadius;
          const startY = pt.y - uy * bridgeRadius;
          const endX = pt.x + ux * bridgeRadius;
          const endY = pt.y + uy * bridgeRadius;

          let sweep = 1;
          if (Math.abs(ux) > Math.abs(uy)) {
            sweep = ux > 0 ? 1 : 0;
          } else {
            sweep = uy > 0 ? 0 : 1;
          }

          finalPath += ` L ${startX} ${startY}`;
          finalPath += ` A ${bridgeRadius} ${bridgeRadius} 0 0 ${sweep} ${endX} ${endY}`;
        }
      });
    }

    finalPath += ` L ${seg.p2.x} ${seg.p2.y}`;
  });

  return (
    <>
      <path
        d={finalPath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        style={{ pointerEvents: 'stroke' }}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        id={id}
        style={selectedEdgeStyle}
        className="react-flow__edge-path"
        d={finalPath}
        markerEnd={markerEnd}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${Math.round((sourcePt.x + targetPt.x) / 2)}px, ${Math.round((sourcePt.y + targetPt.y) / 2)}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan px-2 py-0.5 rounded border border-slate-300 bg-white text-xs font-semibold text-slate-700 shadow-sm select-none tracking-tight"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
      {waypointHandleElement}
    </>
  );
}
