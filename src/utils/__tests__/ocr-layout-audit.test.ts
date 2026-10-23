import { describe, expect, it } from 'vitest';

import { layoutOcrDiagram, type OcrLayoutResult } from '../ocr-layout';
import { auditOcrLayout, auditSourceOrder, auditUpwardDrift } from '../ocr-layout-audit';
import { buildKurSourceFixture } from '../../test/fixtures/bpm-kur-source';

function laneOnly(): OcrLayoutResult {
  return {
    nodes: [
      {
        id: 'lane-a',
        type: 'swimlane',
        label: 'A',
        position: { x: 0, y: 0 },
        width: 400,
        height: 300,
        department: 'A',
      },
    ],
    edges: [],
    warnings: [],
  };
}

describe('auditOcrLayout', () => {
  it('passes the real KUR layout', () => {
    const audit = auditOcrLayout(layoutOcrDiagram(buildKurSourceFixture()));

    expect(audit.violations).toEqual([]);
    expect(audit.ok).toBe(true);
    expect(audit.stats.shapeCount).toBe(14);
  });

  it('flags overlapping shapes (so the auditor cannot pass everything)', () => {
    const layout: OcrLayoutResult = {
      ...laneOnly(),
      nodes: [
        ...laneOnly().nodes,
        { id: 'a', type: 'activity', label: 'A', position: { x: 20, y: 140 }, parentId: 'lane-a', width: 160, height: 56 },
        { id: 'b', type: 'activity', label: 'B', position: { x: 20, y: 150 }, parentId: 'lane-a', width: 160, height: 56 },
      ],
    };

    const audit = auditOcrLayout(layout);
    expect(audit.ok).toBe(false);
    expect(audit.violations.some((v) => v.startsWith('overlap: a x b'))).toBe(true);
  });

  it('flags a shape that escapes its lane', () => {
    const layout: OcrLayoutResult = {
      ...laneOnly(),
      nodes: [
        ...laneOnly().nodes,
        { id: 'a', type: 'activity', label: 'A', position: { x: 350, y: 140 }, parentId: 'lane-a', width: 160, height: 56 },
      ],
    };

    expect(auditOcrLayout(layout).violations).toContain('outside lane: a');
  });

  it('flags a lane whose height no longer matches deepest content + footer', () => {
    const layout: OcrLayoutResult = {
      ...laneOnly(),
      nodes: [
        ...laneOnly().nodes,
        { id: 'a', type: 'activity', label: 'A', position: { x: 20, y: 260 }, parentId: 'lane-a', width: 160, height: 56 },
      ],
    };

    // deepest content 316 + 80 footer = 396, but the lane kept 300
    expect(auditOcrLayout(layout).violations.some((v) => v.startsWith('lane height: lane-a'))).toBe(true);
  });
});

describe('auditSourceOrder', () => {
  it('flags a lane whose canvas order contradicts the source order', () => {
    const source = buildKurSourceFixture();
    const layout = layoutOcrDiagram(source);
    const start = layout.nodes.find((node) => node.id === 'k-start')!;
    const recv = layout.nodes.find((node) => node.id === 'k-recv')!;
    const swapped: OcrLayoutResult = {
      ...layout,
      nodes: layout.nodes.map((node) =>
        node.id === 'k-start'
          ? { ...node, position: { ...node.position, y: recv.position.y } }
          : node.id === 'k-recv'
            ? { ...node, position: { ...node.position, y: start.position.y } }
            : node,
      ),
    };

    expect(auditSourceOrder(source.nodes, swapped).length).toBeGreaterThan(0);
  });
});

describe('auditUpwardDrift', () => {
  const source = buildKurSourceFixture();
  const layout = layoutOcrDiagram(source);

  it('accepts the real upward hand-offs the drawing already has', () => {
    expect(auditUpwardDrift(source.nodes, layout)).toEqual([]);
  });

  it('flags an edge the layout pushes above its source', () => {
    const target = layout.nodes.find((node) => node.id === 'k-recv');
    expect(target).toBeDefined();
    const pushed: OcrLayoutResult = {
      ...layout,
      nodes: layout.nodes.map((node) =>
        node.id === 'k-recv' ? { ...node, position: { ...node.position, y: 0 } } : node,
      ),
    };

    expect(auditUpwardDrift(source.nodes, pushed).length).toBeGreaterThan(0);
  });
});
