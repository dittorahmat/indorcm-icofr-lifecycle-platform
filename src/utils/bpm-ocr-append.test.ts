import { describe, it, expect } from 'vitest';
import type { Node, Edge } from 'reactflow';
import {
  calculateNodesBoundingBox,
  calculateAppendOffset,
  remapElementsForAppend,
  APPEND_GAP_X,
  APPEND_GAP_Y,
} from './bpm-ocr-append';

describe('bpm-ocr-append utility', () => {
  const existingNodes: Node[] = [
    { id: '1', type: 'start', position: { x: 100, y: 100 }, width: 120, height: 60, data: { label: 'Start' } },
    { id: '2', type: 'activity', position: { x: 100, y: 220 }, width: 200, height: 80, data: { label: 'Act 1' } },
  ];

  const incomingNodes: Node[] = [
    { id: '1', type: 'activity', position: { x: 50, y: 50 }, width: 150, height: 70, data: { label: 'New Act' } },
    { id: '2', type: 'end', position: { x: 50, y: 180 }, width: 100, height: 50, data: { label: 'New End' } },
  ];

  const incomingEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' },
  ];

  describe('calculateNodesBoundingBox', () => {
    it('returns null for empty nodes array', () => {
      expect(calculateNodesBoundingBox([])).toBeNull();
    });

    it('calculates correct min, max and dimensions for nodes', () => {
      const box = calculateNodesBoundingBox(existingNodes);
      expect(box).not.toBeNull();
      expect(box?.minX).toBe(100);
      expect(box?.minY).toBe(100);
      expect(box?.maxX).toBe(300); // 100 + 200
      expect(box?.maxY).toBe(300); // 220 + 80
      expect(box?.width).toBe(200);
      expect(box?.height).toBe(200);
    });
  });

  describe('calculateAppendOffset', () => {
    it('calculates offset for "below" direction', () => {
      const offset = calculateAppendOffset({
        direction: 'below',
        existingNodes,
        newNodes: incomingNodes,
      });

      // existing maxY = 300, incoming minY = 50 -> dy = 300 + 160 - 50 = 410
      expect(offset.dy).toBe(300 + APPEND_GAP_Y - 50);
      // existing minX = 100, incoming minX = 50 -> dx = 100 - 50 = 50
      expect(offset.dx).toBe(100 - 50);
    });

    it('calculates offset for "right" direction', () => {
      const offset = calculateAppendOffset({
        direction: 'right',
        existingNodes,
        newNodes: incomingNodes,
      });

      // existing maxX = 300, incoming minX = 50 -> dx = 300 + 200 - 50 = 450
      expect(offset.dx).toBe(300 + APPEND_GAP_X - 50);
      // existing minY = 100, incoming minY = 50 -> dy = 100 - 50 = 50
      expect(offset.dy).toBe(100 - 50);
    });

    it('returns (0,0) if either array is empty', () => {
      expect(calculateAppendOffset({ direction: 'below', existingNodes: [], newNodes: incomingNodes })).toEqual({ dx: 0, dy: 0 });
      expect(calculateAppendOffset({ direction: 'right', existingNodes, newNodes: [] })).toEqual({ dx: 0, dy: 0 });
    });
  });

  describe('remapElementsForAppend (collision isolation and parent-child)', () => {
    it('remaps node IDs and shifts positions without colliding with existing IDs', () => {
      const offset = { dx: 100, dy: 200 };
      const { nodes, edges } = remapElementsForAppend(incomingNodes, incomingEdges, offset, 'test_pfx');

      expect(nodes).toHaveLength(2);
      expect(nodes[0].id).toBe('test_pfx_0_1');
      expect(nodes[1].id).toBe('test_pfx_1_2');
      expect(nodes[0].position).toEqual({ x: 150, y: 250 }); // 50+100, 50+200
      expect(nodes[1].position).toEqual({ x: 150, y: 380 }); // 50+100, 180+200

      expect(edges).toHaveLength(1);
      expect(edges[0].id).toBe('test_pfx_edge_0_e1-2');
      expect(edges[0].source).toBe('test_pfx_0_1');
      expect(edges[0].target).toBe('test_pfx_1_2');
    });

    it('preserves relative coordinates for children inside parent swimlane', () => {
      const parentSwimlane: Node = {
        id: 'swim_1',
        type: 'swimlane',
        position: { x: 0, y: 0 },
        width: 400,
        height: 800,
        data: { label: 'Lane 1' },
      };
      const childNode: Node = {
        id: 'child_1',
        type: 'activity',
        parentId: 'swim_1',
        position: { x: 50, y: 100 }, // relative to parent
        data: { label: 'Child' },
      };

      const offset = { dx: 300, dy: 400 };
      const { nodes } = remapElementsForAppend([parentSwimlane, childNode], [], offset, 'pfx');

      expect(nodes[0].id).toBe('pfx_0_swim_1');
      expect(nodes[0].position).toEqual({ x: 300, y: 400 }); // shifted

      expect(nodes[1].id).toBe('pfx_1_child_1');
      expect(nodes[1].parentId).toBe('pfx_0_swim_1'); // remapped parentId!
      expect(nodes[1].position).toEqual({ x: 50, y: 100 }); // preserved relative position!
    });
  });
});
