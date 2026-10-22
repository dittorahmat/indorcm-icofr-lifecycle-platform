// ocr-layout-types.ts — shapes shared by the OCR layout engines and orchestrator.

export interface PlacedNode {
  id: string;
  type: string;
  label: string;
  parentId: string;
  department?: string;
  function?: string;
  width: number;
  height: number;
  /** Lane-relative. */
  x: number;
  /** Lane-relative. */
  y: number;
}

export interface LanePlacement {
  laneId: string;
  width: number;
  height: number;
  nodes: PlacedNode[];
}

export interface EngineResult {
  lanes: LanePlacement[];
}
