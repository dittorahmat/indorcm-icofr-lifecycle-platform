import { describe, it, expect } from 'vitest';
import { autoArrangeBpmDiagram } from '../utils/bpm-auto-layout';
import { DEFAULT_SWIMLANE_DIMENSIONS } from '../utils/bpm-constants';
import type { Node, Edge } from 'reactflow';

describe('autoArrangeBpmDiagram', () => {
  it('should return empty nodes and edges when canvas is empty', () => {
    const result = autoArrangeBpmDiagram([], []);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('should auto-arrange swimlanes with equalized width and align children', () => {
    const nodes: Node[] = [
      {
        id: 'lane-1',
        type: 'swimlane',
        position: { x: 500, y: 100 },
        data: { department: 'FINANCE' },
      },
      {
        id: 'lane-2',
        type: 'swimlane',
        position: { x: 50, y: 100 },
        data: { department: 'PROCUREMENT' },
      },
      {
        id: 'n1',
        type: 'start',
        position: { x: 20, y: 30 },
        parentId: 'lane-2',
        data: { label: 'Start' },
      },
      {
        id: 'n2',
        type: 'activity',
        position: { x: 20, y: 120 },
        parentId: 'lane-2',
        data: { label: 'Create PO' },
      },
      {
        id: 'n3',
        type: 'activity',
        position: { x: 20, y: 50 },
        parentId: 'lane-1',
        data: { label: 'Approve Payment' },
      },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ];

    const result = autoArrangeBpmDiagram(nodes, edges);

    // Should contain all nodes
    expect(result.nodes.length).toBe(5);

    const swimlanes = result.nodes.filter((n) => n.type === 'swimlane');
    expect(swimlanes.length).toBe(2);

    // Ordered horizontally by original X position (lane-2 at x:50 comes before lane-1 at x:500)
    expect(swimlanes[0].id).toBe('lane-2');
    expect(swimlanes[1].id).toBe('lane-1');

    // Equalized widths
    expect(swimlanes[0].width).toBe(swimlanes[1].width);
    expect(swimlanes[0].width).toBeGreaterThanOrEqual(DEFAULT_SWIMLANE_DIMENSIONS.minWidth);

    // Uniform height
    expect(swimlanes[0].height).toBe(swimlanes[1].height);

    // Child nodes centered in lane
    const childN1 = result.nodes.find((n) => n.id === 'n1')!;
    const childN2 = result.nodes.find((n) => n.id === 'n2')!;
    expect(childN1.position.y).toBeLessThan(childN2.position.y);

    // Edges enriched with clean orthogonal handles
    const edge1 = result.edges.find((e) => e.id === 'e1')!;
    // n1 (start) -> n2 (activity)
    expect(edge1.sourceHandle).toBeUndefined();
    expect(edge1.targetHandle).toBe('top');

    // n2 (activity in lane-2) -> n3 (activity in lane-1, horizontal flow to right)
    const edge2 = result.edges.find((e) => e.id === 'e2')!;
    expect(edge2.sourceHandle).toBe('m-r-src');
    expect(edge2.targetHandle).toBe('left');
  });

  it('should arrange standalone nodes vertically when no swimlanes exist', () => {
    const nodes: Node[] = [
      { id: 'n1', type: 'start', position: { x: 10, y: 10 }, data: { label: 'Start' } },
      { id: 'n2', type: 'activity', position: { x: 10, y: 80 }, data: { label: 'Step 1' } },
      { id: 'n3', type: 'end', position: { x: 10, y: 150 }, data: { label: 'End' } },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ];

    const result = autoArrangeBpmDiagram(nodes, edges);
    expect(result.nodes.length).toBe(3);
    expect(result.nodes[0].position.y).toBeLessThan(result.nodes[1].position.y);
    expect(result.nodes[1].position.y).toBeLessThan(result.nodes[2].position.y);

    const edge1 = result.edges.find((e) => e.id === 'e1')!;
    expect(edge1.sourceHandle).toBeUndefined(); // Start node has no handle id
    expect(edge1.targetHandle).toBe('top');

    const edge2 = result.edges.find((e) => e.id === 'e2')!;
    expect(edge2.sourceHandle).toBe('bottom');
    expect(edge2.targetHandle).toBeUndefined(); // End node has no handle id
  });

  it('should correctly assign decision handles for YES/NO cross-swimlane branches', () => {
    const nodes: Node[] = [
      {
        id: 'lane-1',
        type: 'swimlane',
        position: { x: 0, y: 0 },
        data: { department: 'REVIEWER' },
      },
      {
        id: 'lane-2',
        type: 'swimlane',
        position: { x: 450, y: 0 },
        data: { department: 'APPROVER' },
      },
      {
        id: 'dec-1',
        type: 'decision',
        position: { x: 100, y: 100 },
        parentId: 'lane-1',
        data: { label: 'Approved?' },
      },
      {
        id: 'act-reject',
        type: 'activity',
        position: { x: 10, y: 250 },
        parentId: 'lane-1',
        data: { label: 'Revise Doc' },
      },
      {
        id: 'act-proceed',
        type: 'activity',
        position: { x: 100, y: 100 },
        parentId: 'lane-2',
        data: { label: 'Execute PO' },
      },
    ];

    const edges: Edge[] = [
      { id: 'e-yes', source: 'dec-1', target: 'act-proceed', label: 'YES' },
      { id: 'e-no', source: 'dec-1', target: 'act-reject', label: 'NO' },
    ];

    const result = autoArrangeBpmDiagram(nodes, edges);

    const yesEdge = result.edges.find((e) => e.id === 'e-yes')!;
    expect(yesEdge.sourceHandle).toBe('yes');
    expect(yesEdge.targetHandle).toBe('left');

    const noEdge = result.edges.find((e) => e.id === 'e-no')!;
    expect(noEdge.sourceHandle).toBe('no');
  });
});

