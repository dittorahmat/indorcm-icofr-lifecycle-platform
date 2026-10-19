import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BPM_NODE_TYPES, isBpmNodeType } from './bpm-node-types';
import {
  BPM_NODE_REGISTRY,
  nodeDimensionsOf,
  nodeLabelKeyOf,
  type NodeDimension,
} from './bpm-node-registry';

// vitest runs from the repo root, so the bundles are reachable without relying
// on this file's own URL depth.
const readBundle = (locale: 'en' | 'id'): Record<string, unknown> =>
  JSON.parse(readFileSync(resolve(process.cwd(), 'src/i18n/locales', locale, 'bpm.json'), 'utf-8')) as Record<
    string,
    unknown
  >;

/** Resolves a dotted key (`editor.nodes.document`) inside a parsed bundle. */
const resolveKey = (bundle: Record<string, unknown>, key: string): unknown =>
  key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object') return (node as Record<string, unknown>)[part];
    return undefined;
  }, bundle);

describe('BPM node-type registry (one owner per node type)', () => {
  it('covers every BPM_NODE_TYPES member, with no extra keys', () => {
    expect(Object.keys(BPM_NODE_REGISTRY).sort()).toEqual([...BPM_NODE_TYPES].sort());
  });

  it('resolves every registry label key in BOTH locale bundles', () => {
    const bundles = { en: readBundle('en'), id: readBundle('id') };
    for (const [type, entry] of Object.entries(BPM_NODE_REGISTRY)) {
      // Key shape: `bpm:editor.nodes.<name>` — strip the namespace prefix.
      const dotted = entry.labelKey.replace(/^bpm:/, '');
      for (const [locale, bundle] of Object.entries(bundles)) {
        expect(resolveKey(bundle, dotted), `${type} label missing from ${locale}`).toBeTypeOf('string');
      }
    }
  });

  it('gives every type a positive whole-pixel box', () => {
    for (const entry of Object.values(BPM_NODE_REGISTRY)) {
      const { width, height } = entry.dimensions as NodeDimension;
      expect(Number.isInteger(width) && width > 0).toBe(true);
      expect(Number.isInteger(height) && height > 0).toBe(true);
    }
  });

  it('does not register `output`, the shape that had no renderer', () => {
    expect(Object.keys(BPM_NODE_REGISTRY)).not.toContain('output');
    expect(isBpmNodeType('output')).toBe(false);
  });
});

describe('registry lookups', () => {
  it('reads dimensions from the registry, not a second table', () => {
    expect(nodeDimensionsOf('decision')).toEqual({ width: 110, height: 110 });
    expect(nodeDimensionsOf('summing-junction')).toEqual({ width: 50, height: 50 });
    expect(nodeDimensionsOf('archive')).toEqual({ width: 64, height: 64 });
  });

  it('falls back to the standard box for unknown or missing types', () => {
    expect(nodeDimensionsOf('mystery-shape')).toEqual({ width: 160, height: 56 });
    expect(nodeDimensionsOf(undefined)).toEqual({ width: 160, height: 56 });
    expect(nodeDimensionsOf(null)).toEqual({ width: 160, height: 56 });
  });

  it('maps a type to its editor label key and falls back for unknowns', () => {
    expect(nodeLabelKeyOf('data-media')).toBe('bpm:editor.nodes.dataMedia');
    expect(nodeLabelKeyOf('docked-risk')).toBe('bpm:editor.nodes.dockedRisk');
    expect(nodeLabelKeyOf('mystery-shape')).toBe('bpm:editor.nodes.activity');
    expect(nodeLabelKeyOf(undefined)).toBe('bpm:editor.nodes.activity');
  });
});
