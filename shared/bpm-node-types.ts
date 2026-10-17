/**
 * bpm-node-types — the single runtime source of BPM node-type literals.
 *
 * `BPMNode['type']` (`shared/types/rcm-bpm.ts`) is the type-level source of
 * truth; this module is its runtime mirror for the places that need an actual
 * list at runtime (the OCR response schema, membership guards). Hand-copied
 * enums drift (the OCR schema was six members short — see
 * `docs/agents/arch-hotspots-worker.md` C3), so parity is locked both ways by
 * the compile-time assertion below and by `bpm-node-types.test.ts`.
 */
import type { BPMNode } from './types/rcm-bpm';

export type BpmNodeType = BPMNode['type'];

export const BPM_NODE_TYPES = [
  'start',
  'end',
  'activity',
  'automated-activity',
  'decision',
  'document',
  'system',
  'risk',
  'control',
  'archive',
  'swimlane',
  'docked-risk',
  'docked-control',
  'reference',
  'manual-input',
  'external-process',
  'off-page-ref',
  'data-media',
  'alternate-process',
  'data',
  'predefined-process',
  'internal-storage',
  'multi-document',
  'preparation',
  'manual-operation',
  'card',
  'punched-tape',
  'summing-junction',
  'or',
  'collate',
  'sort',
  'extract',
  'merge',
  'stored-data',
  'delay',
  'sequential-access',
  'direct-access',
  'display',
  'loop-limit',
  'annotation',
] as const satisfies readonly BpmNodeType[];

/**
 * Exact-parity lock, direction 2 (the `satisfies` above is direction 1: no
 * array member outside the union). If a member is added to `BPMNode['type']`
 * without an entry in `BPM_NODE_TYPES`, this resolves to `false` and the
 * assignment below stops compiling — surfaced by `tsc` at the join gate.
 */
export type BpmNodeTypesExhaustive =
  Exclude<BpmNodeType, (typeof BPM_NODE_TYPES)[number]> extends never ? true : false;

export const BPM_NODE_TYPES_EXHAUSTIVE: BpmNodeTypesExhaustive = true;

const BPM_NODE_TYPE_SET: ReadonlySet<string> = new Set<string>(BPM_NODE_TYPES);

/** Boundary guard: narrows an arbitrary string (e.g. LLM output) to `BpmNodeType`. */
export function isBpmNodeType(value: unknown): value is BpmNodeType {
  return typeof value === 'string' && BPM_NODE_TYPE_SET.has(value);
}
