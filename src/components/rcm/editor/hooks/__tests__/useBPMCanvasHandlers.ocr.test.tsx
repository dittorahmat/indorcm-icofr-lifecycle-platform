import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Edge, Node } from 'reactflow';

import { useBPMCanvasHandlers } from '../useBPMCanvasHandlers';
import { LANDING_PADDING_PX } from '@/utils/ocr-landing-viewport';
import { strictT } from '@/test/mock-i18n';

function lane(id: string, x: number): Node {
  return {
    id,
    type: 'swimlane',
    position: { x, y: 60 },
    width: 400,
    height: 900,
    data: { label: id, department: id },
  };
}

function buildProps() {
  const setViewport = vi.fn();
  const fitView = vi.fn();
  const setNodes = vi.fn();
  const setEdges = vi.fn();

  return {
    setViewport,
    fitView,
    props: {
      isLocked: false,
      rfInstance: { setViewport, fitView },
      nodes: [] as Node[],
      edges: [] as Edge[],
      setNodes,
      setEdges,
      pushState: vi.fn(),
      setDirty: vi.fn(),
      toggleNodeLock: vi.fn(),
      updateNodeData: vi.fn(),
      handleSwimlaneResizeEnd: vi.fn(),
      t: strictT,
    },
  };
}

describe('useBPMCanvasHandlers — OCR landing camera', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lands at a legible zoom anchored to the drawing top-left instead of fitting everything', () => {
    const { props, setViewport, fitView } = buildProps();
    const { result } = renderHook(() => useBPMCanvasHandlers(props));

    act(() => {
      result.current.handleApplyOcr({
        nodes: [lane('lane-a', 0), lane('lane-b', 416)],
        edges: [],
      });
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(fitView).not.toHaveBeenCalled();
    expect(setViewport).toHaveBeenCalledTimes(1);

    const [viewport] = setViewport.mock.calls[0];
    expect(viewport.zoom).toBeGreaterThanOrEqual(0.7);
    expect(viewport.x + 0 * viewport.zoom).toBe(LANDING_PADDING_PX);
    expect(viewport.y + 60 * viewport.zoom).toBe(LANDING_PADDING_PX);
  });

  it('lands on the origin at the same legible zoom for a multi-page sheet import', () => {
    const { props, setViewport, fitView } = buildProps();
    const onImportMultipleSheets = vi.fn();
    const { result } = renderHook(() =>
      useBPMCanvasHandlers({ ...props, onImportMultipleSheets }),
    );

    act(() => {
      result.current.handleApplyOcr({
        nodes: [],
        edges: [],
        pages: new Map([
          [1, { nodes: [], edges: [] }],
          [2, { nodes: [], edges: [] }],
        ]),
        activePage: 1,
        formatSheetName: (page: number) => `Sheet ${page}`,
      });
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onImportMultipleSheets).toHaveBeenCalledTimes(1);
    expect(fitView).not.toHaveBeenCalled();
    expect(setViewport).toHaveBeenCalledTimes(1);

    const [viewport] = setViewport.mock.calls[0];
    expect(viewport.zoom).toBeGreaterThanOrEqual(0.7);
    expect(viewport.x).toBe(LANDING_PADDING_PX);
    expect(viewport.y).toBe(LANDING_PADDING_PX);
  });
});
