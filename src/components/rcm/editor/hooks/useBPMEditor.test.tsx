import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { UnsavedChangesProvider } from '@/context/UnsavedChangesContext';
import { useBPMEditor } from './useBPMEditor';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/hooks/use-confirm', () => ({
  useConfirm: () => async () => true,
}));

vi.mock('@/hooks/use-bpm', () => ({
  useActiveSimulation: () => ({ data: null }),
  useSimulationSnapshot: () => ({ data: null }),
}));

import { api } from '@/lib/api-client';

let client: QueryClient;

function wrapper() {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <UnsavedChangesProvider>{children}</UnsavedChangesProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
  Wrapper.displayName = 'BPMEditorTestWrapper';
  return Wrapper;
}

const t = (key: string) => key;
const PARAMS = { diagramId: 'd1', subProcess: 'Kas', workingYear: '2024', t };

describe('useBPMEditor seam (one interface over eleven hooks)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.mocked(api).mockImplementation(async (url: string) => {
      if (url.startsWith('/api/bpm-diagrams/')) return { id: 'd1', year: '2024', metadata: {}, fsliName: 'Kas' };
      return {};
    });
  });

  it('exposes every namespace behind a single seam', async () => {
    const { result } = renderHook(() => useBPMEditor(PARAMS), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.state.isDiagramLoading).toBe(false));
    for (const key of ['graph', 'state', 'view', 'history', 'selection', 'ops', 'guides', 'sheets', 'handlers', 'persistence'] as const) {
      expect(result.current[key], key).toBeDefined();
    }
    expect(typeof result.current.handleNodesDelete).toBe('function');
    expect(typeof result.current.setDirty).toBe('function');
  });

  it('loads, edits, and undoes through the graph namespace', async () => {
    const { result } = renderHook(() => useBPMEditor(PARAMS), { wrapper: wrapper() });
    await waitFor(() => {
      expect(result.current.state.isDiagramLoading).toBe(false);
      expect(result.current.graph.nodes.map((n) => n.id)).toContain('2');
    });

    expect(result.current.graph.canUndo).toBe(false);

    act(() => {
      result.current.graph.loadDiagram(
        [
          { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
          { id: 'a1', type: 'activity', position: { x: 0, y: 100 }, data: { label: 'Terima kas' } },
        ],
        [{ id: 'e1', source: 'start', target: 'a1' }],
      );
    });
    expect(result.current.graph.nodes).toHaveLength(2);

    act(() => {
      result.current.graph.pushState(result.current.graph.nodes, result.current.graph.edges);
      result.current.graph.setNodes((nds) => nds.filter((n) => n.id !== 'a1'));
    });
    expect(result.current.graph.nodes).toHaveLength(1);
    expect(result.current.graph.canUndo).toBe(true);

    act(() => {
      result.current.graph.undoDiagram();
    });
    expect(result.current.graph.nodes).toHaveLength(2);
  });

  it('starts with no selection and empty suggestion context', async () => {
    const { result } = renderHook(() => useBPMEditor(PARAMS), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.state.isDiagramLoading).toBe(false));
    expect(result.current.selection.selectedNode ?? null).toBeNull();
    expect(result.current.suggestionGlDesc).toBe('');
  });
});
