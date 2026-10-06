import type { Edge, Node, NodeTypes } from 'reactflow';

export type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export interface OcrModalStaging {
  stagingNodes: Node[];
  stagingEdges: Edge[];
  nodeTypes: NodeTypes;
}
