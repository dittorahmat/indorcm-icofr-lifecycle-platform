import { EdgeProps, useStore, useReactFlow, EdgeLabelRenderer } from 'reactflow';
import type { BPMEdgeRoutingMode, BPMEdgeData } from '../../../../shared/types';
import { useTranslation } from 'react-i18next';
import {
  normalizeHandlePosition,
  getDistributedPoint,
  getOrthogonalPath,
  type Segment,
} from './edge-routing-utils';
import { channelOffsetFor } from './edge-channel';
import { buildBridgedPath, type OtherEdgeSegments } from './edge-bridge-path';
import { useEdgeWaypoint } from './useEdgeWaypoint';

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

  const channelOffset = channelOffsetFor(id, source, target, edges);

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

  const { handleWaypointPointerDown, handleWaypointDoubleClick } = useEdgeWaypoint(id, bendOffset, { getZoom, setEdges });

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
  const otherEdgesSegments: OtherEdgeSegments[] = [];
  edges.forEach((e) => {
    if (e.id === id) return;
    const eSrcNode = nodeInternals.get(e.source);
    const eTgtNode = nodeInternals.get(e.target);
    if (!eSrcNode || !eTgtNode) return;

    const eSSide = normalizeHandlePosition(e.sourceHandle, undefined, eSrcNode, eTgtNode, true, nodeInternals);
    const eTSide = normalizeHandlePosition(e.targetHandle, undefined, eSrcNode, eTgtNode, false, nodeInternals);

    const eSrcPt = getDistributedPoint(eSrcNode, eSSide, e.id, edges, true, nodeInternals);
    const eTgtPt = getDistributedPoint(eTgtNode, eTSide, e.id, edges, false, nodeInternals);

    const otherOffset = channelOffsetFor(e.id, e.source, e.target, edges);

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

  const finalPath = buildBridgedPath(id, currentSegments as Segment[], otherEdgesSegments);

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
