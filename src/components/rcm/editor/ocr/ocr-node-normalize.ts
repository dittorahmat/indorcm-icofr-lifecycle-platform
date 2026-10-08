import { MarkerType } from 'reactflow';
import type { Edge, Node } from 'reactflow';
import {
  deriveLabelFromId,
  layoutOcrDiagram,
  type OcrLayoutResult,
  type OcrLayoutWarning,
  type OcrRawEdge,
  type OcrRawNode,
} from '@/utils/ocr-layout';

// Single normalization for OCR layout output → canvas nodes/edges.
// Both the staging preview and the apply path consume this module, so what
// the reviewer sees is byte-identical to what lands on the canvas.

export interface StagedDiagram {
  nodes: Node[];
  edges: Edge[];
  warnings: OcrLayoutWarning[];
}

export interface CanvasEnrichmentDeps {
  isLocked: boolean;
  defaultRole: string;
  toggleNodeLock: (id: string) => void;
  updateNodeData: (id: string, partial: Record<string, unknown>) => void;
  handleSwimlaneResizeEnd: (laneId: string, params: unknown) => void;
}

function bridgeEdgeStyle() {
  return {
    type: 'bridge',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#0f172a' },
    style: { strokeWidth: 2, stroke: '#0f172a' },
  };
}

export function normalizeLaidOutNodes(laidOut: OcrLayoutResult): Node[] {
  return laidOut.nodes.map((n) => {
    const isSwimlane = n.type === 'swimlane';
    const resolvedDept = n.department?.trim() || n.label?.trim() || deriveLabelFromId(n.id);
    const resolvedLabel = n.label?.trim() || resolvedDept;
    return {
      id: n.id,
      type: n.type,
      position: { x: n.position.x, y: n.position.y },
      parentId: n.parentId,
      width: n.width,
      height: n.height,
      style: isSwimlane ? { width: n.width || 400, height: n.height || 1200 } : undefined,
      zIndex: isSwimlane ? -1 : 10,
      dragHandle: isSwimlane ? '.swimlane-drag-handle' : undefined,
      draggable: true,
      data: isSwimlane
        ? {
            label: resolvedLabel,
            department: resolvedDept,
            function: n.function?.trim() || '',
            isLocked: false,
          }
        : { label: n.label, type: n.type },
    };
  });
}

export function normalizeRawEdges(edges: OcrRawEdge[]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    label: e.label || '',
    ...bridgeEdgeStyle(),
  }));
}

export function fallbackRawNodesToCanvas(nodes: OcrRawNode[]): Node[] {
  return nodes.map((n) => ({
    id: String(n.id),
    type: String(n.type || 'activity'),
    position: { x: Number(n.position?.x ?? 0), y: Number(n.position?.y ?? 0) },
    parentId: n.parentId,
    style: n.type === 'swimlane' ? { width: n.width || 400, height: n.height || 1000 } : undefined,
    zIndex: n.type === 'swimlane' ? -1 : 10,
    data: { label: n.label || '', type: n.type },
  }));
}

function layoutFailureMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function stageRawDiagram(raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] }): StagedDiagram {
  try {
    const result = layoutOcrDiagram(raw);
    return {
      nodes: normalizeLaidOutNodes(result),
      edges: normalizeRawEdges(result.edges),
      warnings: result.warnings ?? [],
    };
  } catch (err: unknown) {
    return {
      nodes: fallbackRawNodesToCanvas(raw.nodes ?? []),
      edges: normalizeRawEdges(raw.edges ?? []),
      warnings: [{ code: 'unknown-parent', message: layoutFailureMessage(err) || 'Layout failed' }],
    };
  }
}

// Attaches live-canvas behavior (lock toggles, swimlane editors) on top of
// already-normalized nodes. Labels, geometry and ids pass through untouched,
// so staging preview and canvas landing cannot drift apart.
export function enrichCanvasNodes(nodes: Node[], deps: CanvasEnrichmentDeps): Node[] {
  return nodes.map((node) => {
    const isSwimlane = node.type === 'swimlane';
    const previous = node.data ?? {};
    const isNodeLocked = !!previous.isLocked;
    if (isSwimlane) {
      return {
        ...node,
        draggable: !deps.isLocked && !isNodeLocked,
        zIndex: -1,
        dragHandle: '.swimlane-drag-handle',
        style: { width: node.width || 400, height: node.height || 1200, ...(node.style || {}) },
        data: {
          ...previous,
          isLocked: false,
          onToggleLock: () => deps.toggleNodeLock(node.id),
          onChangeDepartment: (v: string) => deps.updateNodeData(node.id, { department: v }),
          onChangeFunction: (v: string) => deps.updateNodeData(node.id, { function: v }),
          onResizeEnd: (params: unknown) => deps.handleSwimlaneResizeEnd(node.id, params),
        },
      };
    }
    const regulatoryPairs = Array.isArray(previous.regulatoryPairs) ? previous.regulatoryPairs : [];
    return {
      ...node,
      draggable: !deps.isLocked && !isNodeLocked,
      zIndex: node.zIndex ?? 10,
      dragHandle: undefined,
      style: node.style ? { ...node.style } : undefined,
      data: {
        ...previous,
        label: previous.label ?? '',
        type: node.type,
        regulatoryPairs,
        role: previous.role ?? deps.defaultRole,
        isLocked: false,
        onToggleLock: () => deps.toggleNodeLock(node.id),
      },
    };
  });
}
