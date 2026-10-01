import type { Node, Edge } from 'reactflow';

/**
 * Sanitizes an object by stripping any non-serializable properties (e.g. functions, React handlers)
 * to keep payload light, avoid circular references, and prevent JSON serialization issues.
 */
function cleanDataObject(obj: Record<string, any> | undefined): Record<string, any> {
  if (!obj || typeof obj !== 'object') return {};
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Strip function callbacks (e.g. onToggleLock, onChangeDepartment, onResizeEnd)
    if (typeof value === 'function') continue;
    // Omit undefined
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      cleaned[key] = value.map((item) =>
        item && typeof item === 'object' ? cleanDataObject(item) : item
      );
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      cleaned[key] = cleanDataObject(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/**
 * Sanitizes React Flow nodes before persisting them to the database.
 * Preserves essential layout and compliance data while stripping DOM events and callbacks.
 */
export function sanitizeNodesForSave(nodes: Node[]): any[] {
  if (!Array.isArray(nodes)) return [];

  return nodes.map((node) => {
    const sanitizedNode: any = {
      id: String(node.id),
      type: node.type || 'activity',
      position: {
        x: Number(node.position?.x ?? 0),
        y: Number(node.position?.y ?? 0),
      },
    };

    if (node.parentId) sanitizedNode.parentId = String(node.parentId);
    if (node.width !== undefined && node.width !== null) sanitizedNode.width = Number(node.width);
    if (node.height !== undefined && node.height !== null) sanitizedNode.height = Number(node.height);
    if (node.zIndex !== undefined) sanitizedNode.zIndex = Number(node.zIndex);
    if (node.style) sanitizedNode.style = cleanDataObject(node.style);

    sanitizedNode.data = cleanDataObject(node.data);

    return sanitizedNode;
  });
}

/**
 * Sanitizes React Flow edges before persisting them to the database.
 */
export function sanitizeEdgesForSave(edges: Edge[]): any[] {
  if (!Array.isArray(edges)) return [];

  return edges.map((edge) => {
    const sanitizedEdge: any = {
      id: String(edge.id),
      source: String(edge.source),
      target: String(edge.target),
    };

    if (edge.sourceHandle) sanitizedEdge.sourceHandle = String(edge.sourceHandle);
    if (edge.targetHandle) sanitizedEdge.targetHandle = String(edge.targetHandle);
    if (edge.label) sanitizedEdge.label = String(edge.label);
    if (edge.type) sanitizedEdge.type = String(edge.type);
    if (edge.style) sanitizedEdge.style = cleanDataObject(edge.style as any);
    if (edge.markerEnd) sanitizedEdge.markerEnd = cleanDataObject(edge.markerEnd as any);
    if (edge.data) sanitizedEdge.data = cleanDataObject(edge.data);

    return sanitizedEdge;
  });
}
