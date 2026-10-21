import { describe, expect, it } from 'vitest';
import { BPM_NODE_TYPES } from '@shared/bpm-node-types';
import { BPM_CANVAS_Z_INDEX } from '@/utils/bpm-constants';
import { bpmNodeTypes } from '../bpm-canvas-types';
import { canvasNodeChrome } from '../canvas-hydration';

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

  it('locks canvas z-index stacking hierarchy contracts to prevent arrow/edge occlusion', () => {
    // Swimlane background layer
    expect(BPM_CANVAS_Z_INDEX.SWIMLANE).toBe(-1);

    // Standard shape layer must be below edge layer so lines/markers never submerge
    expect(BPM_CANVAS_Z_INDEX.SHAPE).toBe(5);
    expect(BPM_CANVAS_Z_INDEX.EDGE).toBe(10);
    expect(BPM_CANVAS_Z_INDEX.EDGE).toBeGreaterThan(BPM_CANVAS_Z_INDEX.SHAPE);

    // Badges and drag handles sit above edges
    expect(BPM_CANVAS_Z_INDEX.BADGE).toBe(20);
    expect(BPM_CANVAS_Z_INDEX.BADGE).toBeGreaterThan(BPM_CANVAS_Z_INDEX.EDGE);

    // Verify node chrome output follows contract
    const shapeNode = { id: 'act-1', type: 'activity', position: { x: 0, y: 0 }, data: {} };
    const swimlaneNode = { id: 'lane-1', type: 'swimlane', position: { x: 0, y: 0 }, data: {} };
    const badgeNode = { id: 'badge_ctrl-1', type: 'control', position: { x: 0, y: 0 }, data: {} };

    expect(canvasNodeChrome(shapeNode, false).zIndex).toBe(5);
    expect(canvasNodeChrome(swimlaneNode, false).zIndex).toBe(-1);
    expect(canvasNodeChrome(badgeNode, false).zIndex).toBe(20);
  });
});
