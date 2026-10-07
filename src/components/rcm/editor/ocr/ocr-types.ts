import type { Edge, Node, NodeTypes } from 'reactflow';

export type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export type OcrImportMode = 'overwrite' | 'append';
export type OcrAppendDirection = 'below' | 'right';

export interface OcrModalStaging {
  stagingNodes: Node[];
  stagingEdges: Edge[];
  nodeTypes: NodeTypes;
}
