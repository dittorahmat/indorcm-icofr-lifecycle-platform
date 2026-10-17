import { describe, it, expect } from 'vitest';
import {
  BPM_NODE_TYPES,
  BPM_NODE_TYPES_EXHAUSTIVE,
  isBpmNodeType,
  type BpmNodeType,
} from './bpm-node-types';

/**
 * Known-good literal list, transcribed from `BPMNode['type']`
 * (`shared/types/rcm-bpm.ts`) — NOT derived from the implementation. The OCR
 * schema read six members short of this list (system, risk, control,
 * docked-risk, docked-control, off-page-ref); this suite fails the moment the
 * runtime source drifts from the union again.
 */
const EXPECTED_NODE_TYPES = [
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

describe('BPM_NODE_TYPES', () => {
  it('mirrors BPMNode[\'type\'] exactly (known-good literal list)', () => {
    expect([...BPM_NODE_TYPES]).toEqual([...EXPECTED_NODE_TYPES]);
  });

  it('has 40 unique members', () => {
    expect(BPM_NODE_TYPES).toHaveLength(40);
    expect(new Set<string>(BPM_NODE_TYPES).size).toBe(40);
  });

  it('reports compile-time exhaustiveness as true', () => {
    // `BPM_NODE_TYPES_EXHAUSTIVE` is typed `true`; a union member missing from
    // the array flips it to `false` and breaks the build in the source module.
    expect(BPM_NODE_TYPES_EXHAUSTIVE).toBe(true);
  });
});

describe('isBpmNodeType', () => {
  it('accepts every canonical member', () => {
    for (const type of EXPECTED_NODE_TYPES) {
      expect(isBpmNodeType(type)).toBe(true);
    }
  });

  it('rejects unknown strings and non-strings', () => {
    expect(isBpmNodeType('not-a-node-type')).toBe(false);
    expect(isBpmNodeType('')).toBe(false);
    expect(isBpmNodeType(undefined)).toBe(false);
    expect(isBpmNodeType(null)).toBe(false);
    expect(isBpmNodeType(42)).toBe(false);
    expect(isBpmNodeType({ type: 'activity' })).toBe(false);
  });
});
