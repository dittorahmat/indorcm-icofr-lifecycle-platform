import { describe, it, expect } from "vitest";
import { getAlignmentGuides } from "../utils/alignment-guides";

describe("getAlignmentGuides (Visio-like Smart Alignment)", () => {
  const targetNode = {
    id: "node-1",
    x: 200,
    y: 100,
    width: 160,
    height: 60,
  };

  it("snaps center-to-center vertically within threshold", () => {
    // targetCenterY is 100 + 30 = 130
    // draggedNode has height 60, center at y + 30.
    // If draggedNode has y = 102, then center is 132 (diff is 2px <= 5px)
    const draggedNode = {
      id: "node-2",
      x: 450,
      y: 102,
      width: 160,
      height: 60,
    };

    const result = getAlignmentGuides(draggedNode, [targetNode]);
    expect(result.guides.horizontal).toBe(130);
    expect(result.snappedY).toBe(100);
  });

  it("snaps center-to-center horizontally within threshold", () => {
    // targetCenterX is 200 + 80 = 280
    // draggedNode has width 160, center at x + 80.
    // If draggedNode has x = 203, then center is 283 (diff is 3px <= 5px)
    const draggedNode = {
      id: "node-2",
      x: 203,
      y: 350,
      width: 160,
      height: 60,
    };

    const result = getAlignmentGuides(draggedNode, [targetNode]);
    expect(result.guides.vertical).toBe(280);
    expect(result.snappedX).toBe(200);
  });

  it("does not snap when distance exceeds threshold", () => {
    const draggedNode = {
      id: "node-2",
      x: 220,
      y: 150,
      width: 160,
      height: 60,
    };

    const result = getAlignmentGuides(draggedNode, [targetNode]);
    expect(result.guides.horizontal).toBeUndefined();
    expect(result.guides.vertical).toBeUndefined();
    expect(result.snappedX).toBe(220);
    expect(result.snappedY).toBe(150);
  });
});
