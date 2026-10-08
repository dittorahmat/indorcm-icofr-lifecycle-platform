// ocr-validate.ts — OCR response validation (pure, no canvas dependencies).
// Extracted from ocr-layout.ts so the layout orchestrator stays under the
// 400 LOC soft limit; behavior is byte-identical, locked by ocr-layout.test.ts.
import { DEFAULT_SWIMLANE_DIMENSIONS } from './bpm-constants';

export interface OcrRawNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  parentId?: string;
  department?: string;
  function?: string;
  width?: number;
  height?: number;
}

export interface OcrRawEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface OcrLayoutWarning {
  code: 'orphan-edge' | 'unlabeled-node' | 'missing-dims' | 'unknown-parent';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

const LANE_MIN_W = DEFAULT_SWIMLANE_DIMENSIONS.minWidth;

export function deriveLabelFromId(id: string): string {
  if (!id) return '';
  const cleaned = id.replace(/^(swimlane|lane)[-_]/i, '').replace(/[-_]/g, ' ').trim();
  return cleaned ? cleaned.toUpperCase() : '';
}

export function validateOcrResponse(raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] }): OcrLayoutWarning[] {
  const warnings: OcrLayoutWarning[] = [];
  const idSet = new Set<string>(raw.nodes.map((n) => n.id));
  const swimlaneIdSet = new Set<string>(raw.nodes.filter((n) => n.type === 'swimlane').map((n) => n.id));

  for (const e of raw.edges) {
    const missingSource = !idSet.has(e.source);
    const missingTarget = !idSet.has(e.target);
    if (missingSource || missingTarget) {
      const missing = missingSource && missingTarget ? `source ${e.source} and target ${e.target}` : missingSource ? `source ${e.source}` : `target ${e.target}`;
      warnings.push({
        code: 'orphan-edge',
        message: `Edge ${e.id} references unknown node: ${missing}`,
        edgeId: e.id,
      });
    }
  }

  for (const n of raw.nodes) {
    const isSwimlane = n.type === 'swimlane';
    const effectiveLabel = isSwimlane
      ? (n.label?.trim() || n.department?.trim() || deriveLabelFromId(n.id))
      : n.label?.trim();

    if (!effectiveLabel) {
      warnings.push({
        code: 'unlabeled-node',
        message: `Node ${n.id} has empty label`,
        nodeId: n.id,
      });
    }
  }

  for (const n of raw.nodes) {
    if (n.type === 'swimlane') {
      const missW = n.width === undefined || n.width === null;
      const missH = n.height === undefined || n.height === null;
      const belowMin = n.width !== undefined && n.width !== null && n.width < LANE_MIN_W;
      if (missW || missH || belowMin) {
        const reason = missW && missH ? 'missing width and height' : missW ? 'missing width' : missH ? 'missing height' : `width ${n.width} below minimum ${LANE_MIN_W}`;
        warnings.push({
          code: 'missing-dims',
          message: `Lane ${n.id} has ${reason}`,
          nodeId: n.id,
        });
      }
    }
  }

  for (const n of raw.nodes) {
    if (n.parentId !== undefined && n.parentId !== null && n.parentId !== '' && !swimlaneIdSet.has(n.parentId)) {
      warnings.push({
        code: 'unknown-parent',
        message: `Node ${n.id} references unknown parent ${n.parentId}`,
        nodeId: n.id,
      });
    }
  }

  return warnings;
}
