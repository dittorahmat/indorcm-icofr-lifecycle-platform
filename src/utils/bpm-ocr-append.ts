import type { Edge, Node } from 'reactflow';

export type OcrImportMode = 'overwrite' | 'append';
export type OcrAppendDirection = 'below' | 'right';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export const APPEND_GAP_X = 200;
export const APPEND_GAP_Y = 160;

/**
 * Calculates bounding box of a collection of React Flow nodes.
 * Takes node widths/heights into account (fallback to default sizes if undefined).
 */
export function calculateNodesBoundingBox(nodes: Node[]): BoundingBox | null {
  if (!nodes || nodes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const x = node.position.x;
    const y = node.position.y;
    // Default node dimensions if not specified: swimlanes are wider/taller, activities standard
    const isSwimlane = node.type === 'swimlane';
    const defaultW = isSwimlane ? 400 : 200;
    const defaultH = isSwimlane ? 1200 : 80;

    const width = Number(node.width ?? node.style?.width ?? defaultW);
    const height = Number(node.height ?? node.style?.height ?? defaultH);

    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + width > maxX) maxX = x + width;
    if (y + height > maxY) maxY = y + height;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export interface AppendOffsetOptions {
  direction: OcrAppendDirection;
  existingNodes: Node[];
  newNodes: Node[];
  gapX?: number;
  gapY?: number;
}

/**
 * Computes the (dx, dy) translation offset to place `newNodes` relative to `existingNodes`
 * without overlapping.
 */
export function calculateAppendOffset({
  direction,
  existingNodes,
  newNodes,
  gapX = APPEND_GAP_X,
  gapY = APPEND_GAP_Y,
}: AppendOffsetOptions): { dx: number; dy: number } {
  const existingBox = calculateNodesBoundingBox(existingNodes);
  const newBox = calculateNodesBoundingBox(newNodes);

  if (!existingBox || !newBox) {
    return { dx: 0, dy: 0 };
  }

  if (direction === 'below') {
    // Shift below existing maxY
    const dy = existingBox.maxY + gapY - newBox.minY;
    // Align X start with existing minX
    const dx = existingBox.minX - newBox.minX;
    return { dx, dy };
  } else {
    // Shift right of existing maxX
    const dx = existingBox.maxX + gapX - newBox.minX;
    // Align Y start with existing minY
    const dy = existingBox.minY - newBox.minY;
    return { dx, dy };
  }
}

/**
 * Remaps IDs of incoming nodes and edges to avoid collisions with existing canvas elements,
 * while shifting positions by (dx, dy) for collision-free placement.
 * Preserves parent-child swimlane hierarchies.
 */
export function remapElementsForAppend(
  incomingNodes: Node[],
  incomingEdges: Edge[],
  offset: { dx: number; dy: number },
  idPrefix = `ocr_${Date.now()}`
): { nodes: Node[]; edges: Edge[] } {
  const idMap = new Map<string, string>();

  // 1. Generate unique IDs for all incoming nodes
  incomingNodes.forEach((node, index) => {
    const newId = `${idPrefix}_${index}_${node.id}`;
    idMap.set(node.id, newId);
  });

  // 2. Remap nodes: update id, parentId (if inside swimlane), and adjust position
  const remappedNodes: Node[] = incomingNodes.map((node) => {
    const newId = idMap.get(node.id) || node.id;
    const remappedParentId = node.parentId ? (idMap.get(node.parentId) || node.parentId) : undefined;

    // React Flow sub-nodes relative positions:
    // If a node has a parentId, its position is relative to its parent, so only shift the parent!
    const isChild = !!node.parentId;
    const position = isChild
      ? { ...node.position }
      : {
          x: Math.round(node.position.x + offset.dx),
          y: Math.round(node.position.y + offset.dy),
        };

    return {
      ...node,
      id: newId,
      parentId: remappedParentId,
      position,
    };
  });

  // 3. Remap edges: update id, source, and target
  const remappedEdges: Edge[] = incomingEdges.map((edge, index) => {
    const newEdgeId = `${idPrefix}_edge_${index}_${edge.id}`;
    const newSource = idMap.get(edge.source) || edge.source;
    const newTarget = idMap.get(edge.target) || edge.target;

    return {
      ...edge,
      id: newEdgeId,
      source: newSource,
      target: newTarget,
    };
  });

  return { nodes: remappedNodes, edges: remappedEdges };
}
