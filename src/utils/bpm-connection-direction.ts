import { canonicalizeHandleId } from './bpm-constants';

export interface RawConnectionParams {
  source: string | null;
  target: string | null;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface DragOriginRecord {
  nodeId: string | null;
  handleId?: string | null;
}

export interface NormalizedConnectionResult {
  source: string;
  target: string;
  sourceHandle: string | undefined;
  targetHandle: string | undefined;
}

/**
 * Normalizes connection parameters against the user's drag origin.
 *
 * In React Flow under ConnectionMode.Loose with stacked source & target handles,
 * dropping on a destination node can latch onto that node's source handle.
 * When that happens, React Flow inverts params (source = drop node, target = drag start node).
 *
 * This function guarantees the edge orientation ALWAYS matches the gesture:
 * the node where the drag started is `source`, and the node where it was dropped is `target`.
 */
export function normalizeConnectionDirection(
  params: RawConnectionParams,
  origin: DragOriginRecord | null | undefined
): NormalizedConnectionResult {
  let sourceNode = params.source ?? '';
  let targetNode = params.target ?? '';
  let rawSourceHandle = params.sourceHandle;
  let rawTargetHandle = params.targetHandle;

  if (origin?.nodeId && targetNode === origin.nodeId && sourceNode !== origin.nodeId) {
    // Inverted by React Flow drop latching: swap them back to preserve the drag direction.
    const swappedSource = targetNode;
    const swappedTarget = sourceNode;
    const swappedSourceHandle = rawTargetHandle ?? origin.handleId;
    const swappedTargetHandle = rawSourceHandle;

    sourceNode = swappedSource;
    targetNode = swappedTarget;
    rawSourceHandle = swappedSourceHandle;
    rawTargetHandle = swappedTargetHandle;
  }

  const repairedSource = rawSourceHandle
    ? (canonicalizeHandleId(rawSourceHandle, true) ?? undefined)
    : undefined;
  const repairedTarget = rawTargetHandle
    ? (canonicalizeHandleId(rawTargetHandle, false) ?? undefined)
    : undefined;

  return {
    source: sourceNode,
    target: targetNode,
    sourceHandle: repairedSource,
    targetHandle: repairedTarget,
  };
}
