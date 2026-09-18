// src/utils/bpm-constants.ts
// Single source of truth for standardized BPM node and swimlane dimensions

export interface NodeDimension {
  width: number;
  height: number;
}

export const DEFAULT_NODE_DIMENSIONS: Record<string, NodeDimension> = {
  start: { width: 120, height: 40 },
  end: { width: 120, height: 40 },
  decision: { width: 110, height: 110 },
  document: { width: 130, height: 48 },
  archive: { width: 64, height: 64 },
  'data-media': { width: 100, height: 80 },
  reference: { width: 40, height: 40 },
  'off-page-ref': { width: 120, height: 50 },
  'manual-input': { width: 160, height: 56 },
  'external-process': { width: 160, height: 56 },
  'automated-activity': { width: 160, height: 56 },
  activity: { width: 160, height: 56 },
  'alternate-process': { width: 160, height: 56 },
  data: { width: 160, height: 56 },
  'predefined-process': { width: 160, height: 56 },
  'internal-storage': { width: 160, height: 56 },
  'multi-document': { width: 160, height: 56 },
  preparation: { width: 160, height: 56 },
  'manual-operation': { width: 160, height: 56 },
  card: { width: 160, height: 56 },
  'punched-tape': { width: 160, height: 56 },
  'summing-junction': { width: 50, height: 50 },
  or: { width: 50, height: 50 },
  collate: { width: 160, height: 56 },
  sort: { width: 160, height: 56 },
  extract: { width: 160, height: 56 },
  merge: { width: 160, height: 56 },
  'stored-data': { width: 160, height: 56 },
  delay: { width: 160, height: 56 },
  'sequential-access': { width: 160, height: 56 },
  'direct-access': { width: 160, height: 56 },
  display: { width: 160, height: 56 },
  'loop-limit': { width: 160, height: 56 },
  annotation: { width: 160, height: 56 },
  output: { width: 160, height: 56 }
};

export const DEFAULT_SWIMLANE_DIMENSIONS: {
  minWidth: number;
  minHeight: number;
  defaultWidth: number;
  defaultHeight: number;
  gapX: number;
  headerHeight: number;
  gapY: number;
  paddingHorizontal: number;
  laneGap: number;
} = {
  minWidth: 400,
  minHeight: 800,
  defaultWidth: 400,
  defaultHeight: 1000,
  gapX: 16,
  headerHeight: 80,
  gapY: 70,
  paddingHorizontal: 90,
  laneGap: 16
};

export const DEFAULT_NODE_SPACING = {
  verticalGap: 70,
  horizontalGap: 60,
  topOffset: 60
};

export function getStandardNodeDimensions(type: string): NodeDimension {
  return DEFAULT_NODE_DIMENSIONS[type] || { width: 160, height: 56 };
}
