export interface Point {
  x: number;
  y: number;
}

export interface Segment {
  p1: Point;
  p2: Point;
}

// Nodes that must lock connection points at exact center/apex
export const FIXED_CENTER_TYPES = new Set([
  'decision',
  'start',
  'end',
  'reference',
  'off-page-ref',
  'summing-junction',
  'or',
  'archive'
]);

export function getNodeDimensions(node: {
  width?: number;
  height?: number;
  type?: string;
  data?: { nodeScaleOverride?: string };
}) {
  if (node.width && node.height) {
    return { width: node.width, height: node.height };
  }

  let width = 160;
  let height = 56;

  switch (node.type) {
    case 'start':
    case 'end':
      width = 120;
      height = 40;
      break;
    case 'decision':
      width = 110;
      height = 110;
      break;
    case 'document':
      width = 130;
      height = 48;
      break;
    case 'archive':
      width = 64;
      height = 64;
      break;
    case 'data-media':
      width = 100;
      height = 80;
      break;
    case 'reference':
      width = 40;
      height = 40;
      break;
    default:
      width = 160;
      height = 56;
  }

  const nodeScale = node.data?.nodeScaleOverride || 'md';
  if (nodeScale === 'sm') {
    width = Math.round(width * 0.8);
    height = Math.round(height * 0.8);
  } else if (nodeScale === 'lg') {
    width = Math.round(width * 1.25);
    height = Math.round(height * 1.25);
  }

  return { width, height };
}

export function getNodeAbsolutePosition(
  node: { position?: { x: number; y: number }; parentId?: string; parentNode?: string },
  nodeInternals: Map<string, any>
): Point {
  if (!node) return { x: 0, y: 0 };
  
  let x = node.position?.x ?? 0;
  let y = node.position?.y ?? 0;
  
  let parentId = node.parentId || node.parentNode;
  while (parentId) {
    const parentNode = nodeInternals.get(parentId);
    if (parentNode) {
      x += parentNode.position?.x ?? 0;
      y += parentNode.position?.y ?? 0;
      parentId = parentNode.parentId || parentNode.parentNode;
    } else {
      break;
    }
  }
  
  return { x, y };
}
