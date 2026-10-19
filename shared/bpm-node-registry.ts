/**
 * bpm-node-registry — the ONE owner of "what is this BPM node type?".
 *
 * Five modules used to answer that question separately, and they had drifted:
 * the literal list (`bpm-node-types.ts`), the dimension table
 * (`utils/bpm-constants.ts`), the canvas renderer map
 * (`editor/bpm-canvas-types.ts`), the OCR badge map
 * (`editor/ocr/ocr-shape-badges.ts`) and the palette buttons
 * (`BPMShapePalette.tsx`). A type could be creatable, dimensioned and
 * un-renderable at the same time; nothing asserted the three agreed.
 *
 * This module is **data only** — the React renderer map stays in
 * `editor/bpm-canvas-types.ts`, because `worker/services/bpm/bpm-ocr.ts` imports
 * this module and `shared/` must not pull React into the worker.
 *
 * The editor label is the node's own name (`bpm:editor.nodes.*`). The OCR review
 * badge keeps its own descriptive copy (`bpm:ocr.shapes.*`) on purpose: it names
 * the *drawn shape* so a reviewer can check the classification against the
 * picture. Two presentations, one key space per node type — not two truths.
 */
import { BPM_NODE_TYPES, type BpmNodeType } from './bpm-node-types';

export interface NodeDimension {
  width: number;
  height: number;
}

export interface BpmNodeTypeEntry {
  /** Default canvas size. Nodes with measured width/height override it. */
  dimensions: NodeDimension;
  /** Editor-facing label key, shared by node creation and the shape palette. */
  labelKey: string;
}

/** Standard activity box; also the size the six non-flow types fall back to. */
const BOX: NodeDimension = { width: 160, height: 56 };

export const BPM_NODE_REGISTRY: Record<BpmNodeType, BpmNodeTypeEntry> = {
  start: { dimensions: { width: 120, height: 40 }, labelKey: 'bpm:editor.nodes.start' },
  end: { dimensions: { width: 120, height: 40 }, labelKey: 'bpm:editor.nodes.end' },
  activity: { dimensions: BOX, labelKey: 'bpm:editor.nodes.activity' },
  'automated-activity': { dimensions: BOX, labelKey: 'bpm:editor.nodes.automated' },
  decision: { dimensions: { width: 110, height: 110 }, labelKey: 'bpm:editor.nodes.decision' },
  document: { dimensions: { width: 130, height: 48 }, labelKey: 'bpm:editor.nodes.document' },
  archive: { dimensions: { width: 64, height: 64 }, labelKey: 'bpm:editor.nodes.archive' },
  'data-media': { dimensions: { width: 100, height: 80 }, labelKey: 'bpm:editor.nodes.dataMedia' },
  reference: { dimensions: { width: 40, height: 40 }, labelKey: 'bpm:editor.nodes.reference' },
  'off-page-ref': { dimensions: { width: 120, height: 50 }, labelKey: 'bpm:editor.nodes.offPageRef' },
  'manual-input': { dimensions: BOX, labelKey: 'bpm:editor.nodes.manualInput' },
  'external-process': { dimensions: BOX, labelKey: 'bpm:editor.nodes.externalProcess' },
  'alternate-process': { dimensions: BOX, labelKey: 'bpm:editor.nodes.alternateProcess' },
  data: { dimensions: BOX, labelKey: 'bpm:editor.nodes.data' },
  'predefined-process': { dimensions: BOX, labelKey: 'bpm:editor.nodes.predefinedProcess' },
  'internal-storage': { dimensions: BOX, labelKey: 'bpm:editor.nodes.internalStorage' },
  'multi-document': { dimensions: BOX, labelKey: 'bpm:editor.nodes.multiDocument' },
  preparation: { dimensions: BOX, labelKey: 'bpm:editor.nodes.preparation' },
  'manual-operation': { dimensions: BOX, labelKey: 'bpm:editor.nodes.manualOperation' },
  card: { dimensions: BOX, labelKey: 'bpm:editor.nodes.card' },
  'punched-tape': { dimensions: BOX, labelKey: 'bpm:editor.nodes.punchedTape' },
  'summing-junction': { dimensions: { width: 50, height: 50 }, labelKey: 'bpm:editor.nodes.summingJunction' },
  or: { dimensions: { width: 50, height: 50 }, labelKey: 'bpm:editor.nodes.or' },
  collate: { dimensions: BOX, labelKey: 'bpm:editor.nodes.collate' },
  sort: { dimensions: BOX, labelKey: 'bpm:editor.nodes.sort' },
  extract: { dimensions: BOX, labelKey: 'bpm:editor.nodes.extract' },
  merge: { dimensions: BOX, labelKey: 'bpm:editor.nodes.merge' },
  'stored-data': { dimensions: BOX, labelKey: 'bpm:editor.nodes.storedData' },
  delay: { dimensions: BOX, labelKey: 'bpm:editor.nodes.delay' },
  'sequential-access': { dimensions: BOX, labelKey: 'bpm:editor.nodes.sequentialAccess' },
  'direct-access': { dimensions: BOX, labelKey: 'bpm:editor.nodes.directAccess' },
  display: { dimensions: BOX, labelKey: 'bpm:editor.nodes.display' },
  'loop-limit': { dimensions: BOX, labelKey: 'bpm:editor.nodes.loopLimit' },
  annotation: { dimensions: BOX, labelKey: 'bpm:editor.nodes.annotation' },
  // Non-flow types: the Linkage badges and the swimlane container. Their size
  // comes from `DEFAULT_SWIMLANE_DIMENSIONS` where they are created, so the
  // registry keeps the historical box fallback rather than inventing one.
  system: { dimensions: BOX, labelKey: 'bpm:editor.nodes.system' },
  risk: { dimensions: BOX, labelKey: 'bpm:editor.nodes.risk' },
  control: { dimensions: BOX, labelKey: 'bpm:editor.nodes.control' },
  'docked-risk': { dimensions: BOX, labelKey: 'bpm:editor.nodes.dockedRisk' },
  'docked-control': { dimensions: BOX, labelKey: 'bpm:editor.nodes.dockedControl' },
  swimlane: { dimensions: BOX, labelKey: 'bpm:editor.nodes.swimlane' },
};

const FALLBACK_DIMENSIONS: NodeDimension = { width: BOX.width, height: BOX.height };
const FALLBACK_LABEL_KEY = 'bpm:editor.nodes.activity';

/** Dimensions for a persisted or OCR-supplied type string. */
export function nodeDimensionsOf(type: string | null | undefined): NodeDimension {
  if (!type) return FALLBACK_DIMENSIONS;
  return BPM_NODE_REGISTRY[type as BpmNodeType]?.dimensions ?? FALLBACK_DIMENSIONS;
}

/** Editor label key for a type string; unknown types fall back to Activity. */
export function nodeLabelKeyOf(type: string | null | undefined): string {
  if (!type) return FALLBACK_LABEL_KEY;
  return BPM_NODE_REGISTRY[type as BpmNodeType]?.labelKey ?? FALLBACK_LABEL_KEY;
}

/**
 * Exact-parity lock: every `BPM_NODE_TYPES` member must have a registry entry.
 * The `Record<BpmNodeType, …>` annotation above already covers the other
 * direction; this exposes the invariant to a runtime assertion as well.
 */
export const BPM_NODE_REGISTRY_TYPES: readonly BpmNodeType[] = BPM_NODE_TYPES;
