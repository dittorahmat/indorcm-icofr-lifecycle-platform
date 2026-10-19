import { describe, expect, it } from 'vitest';
import { BPM_NODE_TYPES } from '@shared/bpm-node-types';
import { bpmNodeTypes } from '../bpm-canvas-types';

/**
 * The renderer map locks this at compile time via `satisfies`; this restates it
 * at runtime so a future refactor that weakens the type still fails the suite.
 * Precedent defect: `risk` and `control` were persistable with no renderer.
 */
describe('bpmNodeTypes renderer coverage', () => {
  it('has a renderer for every BPM node type', () => {
    const missing = BPM_NODE_TYPES.filter((type) => !bpmNodeTypes[type]);
    expect(missing).toEqual([]);
  });

  it('renders the linkage badge types that used to fall through to the default node', () => {
    expect(bpmNodeTypes['risk']).toBeDefined();
    expect(bpmNodeTypes['control']).toBeDefined();
    expect(bpmNodeTypes['docked-risk']).toBe(bpmNodeTypes['docked-control']);
  });

  it('keeps the legacy alias keys renderable without making them node types', () => {
    expect(bpmNodeTypes['risk-control-badge']).toBeDefined();
    expect(BPM_NODE_TYPES as readonly string[]).not.toContain('risk-control-badge');
  });
});
