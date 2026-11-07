import { describe, it, expect } from 'vitest';
import { normalizeConnectionDirection } from '@/utils/bpm-connection-direction';

describe('normalizeConnectionDirection', () => {
  it('keeps normal drag connection orientation (A -> B)', () => {
    const raw = {
      source: 'nodeA',
      target: 'nodeB',
      sourceHandle: 'bottom',
      targetHandle: 'top',
    };
    const origin = { nodeId: 'nodeA', handleId: 'bottom' };

    const res = normalizeConnectionDirection(raw, origin);
    expect(res).toEqual({
      source: 'nodeA',
      target: 'nodeB',
      sourceHandle: 'bottom',
      targetHandle: 'top',
    });
  });

  it('inverts connection when React Flow latches onto source handle at destination (B -> A inverted to A -> B)', () => {
    // React Flow returns params where source is nodeB and target is nodeA,
    // because user dropped onto nodeB's source handle.
    const raw = {
      source: 'nodeB',
      target: 'nodeA',
      sourceHandle: 'top-src',
      targetHandle: 'bottom',
    };
    const origin = { nodeId: 'nodeA', handleId: 'bottom' };

    const res = normalizeConnectionDirection(raw, origin);
    expect(res.source).toBe('nodeA');
    expect(res.target).toBe('nodeB');
    // Origin bottom canonicalizes to bottom
    expect(res.sourceHandle).toBe('bottom');
    // Dropped on top-src canonicalizes to target 'top'
    expect(res.targetHandle).toBe('top');
  });

  it('canonicalizes quick-connect handles (qc-bottom -> bottom)', () => {
    const raw = {
      source: 'nodeA',
      target: 'nodeB',
      sourceHandle: 'qc-bottom',
      targetHandle: 'qc-top',
    };
    const origin = { nodeId: 'nodeA', handleId: 'qc-bottom' };

    const res = normalizeConnectionDirection(raw, origin);
    expect(res.sourceHandle).toBe('bottom');
    expect(res.targetHandle).toBe('top');
  });
});
