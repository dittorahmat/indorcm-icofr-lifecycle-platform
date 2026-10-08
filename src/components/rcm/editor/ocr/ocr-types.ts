import type { Edge, Node, NodeTypes } from 'reactflow';

export type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export type OcrImportMode = 'overwrite' | 'append' | 'new_sheet';
export type OcrAppendDirection = 'below' | 'right';


export interface OcrModalStaging {
  stagingNodes: Node[];
  stagingEdges: Edge[];
  nodeTypes: NodeTypes;
}

export interface OcrParsedPage {
  pageNumber: number;
  previewUrl: string;
  nodes: Node[];
  edges: Edge[];
}

export interface OcrStagedPage {
  nodes: Node[];
  edges: Edge[];
}

export type OcrStagedPages = Map<number, OcrStagedPage> | Record<number, OcrStagedPage>;

// Single apply request crossing the modal → canvas boundary. The OCR-import
// adapter decides sheets vs canvas from `pages`; callers never branch.
export interface OcrApplyRequest {
  nodes: Node[];
  edges: Edge[];
  mode?: OcrImportMode;
  direction?: OcrAppendDirection;
  pages?: OcrStagedPages;
  activePage?: number;
  formatSheetName?: (page: number) => string;
}

