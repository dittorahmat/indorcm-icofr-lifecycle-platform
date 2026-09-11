export interface AlignmentGuide {
  type: "horizontal" | "vertical";
  coordinate: number;
  snapCoordinate: number;
}

export interface NodeRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const SNAP_THRESHOLD = 5;

/**
 * Computes magnetic alignment guides and snapped coordinates for a dragging node against target nodes.
 */
export function getAlignmentGuides(
  draggedNode: NodeRect,
  otherNodes: NodeRect[],
  threshold = SNAP_THRESHOLD
): {
  snappedX: number;
  snappedY: number;
  guides: { horizontal?: number; vertical?: number };
} {
  let snappedX = draggedNode.x;
  let snappedY = draggedNode.y;
  const guides: { horizontal?: number; vertical?: number } = {};

  const draggedCenterX = draggedNode.x + draggedNode.width / 2;
  const draggedRightX = draggedNode.x + draggedNode.width;

  const draggedCenterY = draggedNode.y + draggedNode.height / 2;
  const draggedBottomY = draggedNode.y + draggedNode.height;

  let minDiffX = threshold + 1;
  let minDiffY = threshold + 1;

  for (const target of otherNodes) {
    if (target.id === draggedNode.id) continue;

    const targetCenterX = target.x + target.width / 2;
    const targetRightX = target.x + target.width;

    const targetCenterY = target.y + target.height / 2;
    const targetBottomY = target.y + target.height;

    // --- Vertical Guides (X alignments: Left, Center, Right) ---
    // 1. Center-to-Center
    const diffCenterCenterX = Math.abs(draggedCenterX - targetCenterX);
    if (diffCenterCenterX < minDiffX) {
      minDiffX = diffCenterCenterX;
      snappedX = targetCenterX - draggedNode.width / 2;
      guides.vertical = targetCenterX;
    }

    // 2. Left-to-Left
    const diffLeftLeftX = Math.abs(draggedNode.x - target.x);
    if (diffLeftLeftX < minDiffX) {
      minDiffX = diffLeftLeftX;
      snappedX = target.x;
      guides.vertical = target.x;
    }

    // 3. Right-to-Right
    const diffRightRightX = Math.abs(draggedRightX - targetRightX);
    if (diffRightRightX < minDiffX) {
      minDiffX = diffRightRightX;
      snappedX = targetRightX - draggedNode.width;
      guides.vertical = targetRightX;
    }

    // --- Horizontal Guides (Y alignments: Top, Center, Bottom) ---
    // 1. Center-to-Center
    const diffCenterCenterY = Math.abs(draggedCenterY - targetCenterY);
    if (diffCenterCenterY < minDiffY) {
      minDiffY = diffCenterCenterY;
      snappedY = targetCenterY - draggedNode.height / 2;
      guides.horizontal = targetCenterY;
    }

    // 2. Top-to-Top
    const diffTopTopY = Math.abs(draggedNode.y - target.y);
    if (diffTopTopY < minDiffY) {
      minDiffY = diffTopTopY;
      snappedY = target.y;
      guides.horizontal = target.y;
    }

    // 3. Bottom-to-Bottom
    const diffBottomBottomY = Math.abs(draggedBottomY - targetBottomY);
    if (diffBottomBottomY < minDiffY) {
      minDiffY = diffBottomBottomY;
      snappedY = targetBottomY - draggedNode.height;
      guides.horizontal = targetBottomY;
    }
  }

  return {
    snappedX,
    snappedY,
    guides
  };
}
