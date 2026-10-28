import { MarkerType } from 'reactflow';
import type { Edge, Node } from 'reactflow';
import { canonicalizeHandleId, BPM_CANVAS_Z_INDEX } from '@/utils/bpm-constants';

/**
 * canvas-hydration — the ONE place that turns a persisted or staged node/edge
 * into a live-canvas node/edge.
 *
 * Three call sites used to re-derive the same things: the diagram loader on
 * open, the OCR path on stage/apply, and the document view's default edge
 * options. They disagreed (two `zIndex` dialects, three copies of the edge
 * marker/stroke), so `bridge` edges and badge stacking depended on which path
 * built the graph. Callers now cross this seam.
 *
 * Node *data* normalization (labels, `regulatoryPairs`, role defaults) stays
 * with the OCR adapter — it is that path's concern, not the canvas contract.
 */

/** Swimlanes are dragged by their header, never by their body. */
export const SWIMLANE_DRAG_HANDLE = '.swimlane-drag-handle';

const EDGE_COLOR = '#0f172a';

export interface CanvasHydrationDeps {
  isLocked: boolean;
  toggleNodeLock: (id: string) => void;
  updateNodeData: (id: string, partial: Record<string, unknown>) => void;
  handleSwimlaneResizeEnd: (laneId: string, params: { width: number; height: number }) => void;
}

export const isSwimlaneNode = (node: Node): boolean => node.type === 'swimlane';

/** `draggable` / `zIndex` / `dragHandle` for one node, in the one dialect. */
export function canvasNodeChrome(
  node: Node,
  isLocked: boolean,
): Pick<Node, 'draggable' | 'zIndex' | 'dragHandle'> {
  const swimlane = isSwimlaneNode(node);
  return {
    draggable: !isLocked && !node.data?.isLocked,
    zIndex: swimlane
      ? BPM_CANVAS_Z_INDEX.SWIMLANE
      : (node.zIndex ?? (node.id.startsWith('badge_') ? BPM_CANVAS_Z_INDEX.BADGE : BPM_CANVAS_Z_INDEX.SHAPE)),
    dragHandle: swimlane ? SWIMLANE_DRAG_HANDLE : undefined,
  };
}

/**
 * The live callbacks a node needs: a swimlane gets its editor trio, every other
 * shape only the lock toggle.
 */
export function canvasNodeHandlers(node: Node, deps: CanvasHydrationDeps): Record<string, unknown> {
  const onToggleLock = () => deps.toggleNodeLock(node.id);
  if (!isSwimlaneNode(node)) return { onToggleLock };
  return {
    onToggleLock,
    onChangeDepartment: (v: string) => deps.updateNodeData(node.id, { department: v }),
    onChangeFunction: (v: string) => deps.updateNodeData(node.id, { function: v }),
    onResizeEnd: (params: { width: number; height: number }) => deps.handleSwimlaneResizeEnd(node.id, params),
  };
}

/** The bridge edge options every canvas renders (shared by the diagram view). */
export const bridgeEdgeOptions = {
  type: 'bridge',
  markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: EDGE_COLOR },
  style: { strokeWidth: 2, stroke: EDGE_COLOR, fill: 'none' },
} as const;

/**
 * One edge on its way to the canvas: the shared bridge style plus the
 * repair-on-load pass. Legacy OCR edges persist handle ids the canvas never
 * renders (`left` source, `t-c-src`, …); map them to the canonical ids, and
 * unknown handles drop to `undefined` so geometry fallback derives the side
 * from the node positions.
 */
export function hydrateCanvasEdge(edge: Edge): Edge {
  return {
    ...edge,
    sourceHandle: (edge.sourceHandle ? canonicalizeHandleId(edge.sourceHandle, true) : null) ?? undefined,
    targetHandle: (edge.targetHandle ? canonicalizeHandleId(edge.targetHandle, false) : null) ?? undefined,
    ...bridgeEdgeOptions,
  };
}

export function hydrateCanvasEdges(edges: Edge[]): Edge[] {
  return edges.map(hydrateCanvasEdge);
}
