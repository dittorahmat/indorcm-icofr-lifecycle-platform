import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCsaWorklist } from './use-csa-worklist';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

import { api } from '@/lib/api-client';

const ITEMS = [
  { controlId: 'c1', code: 'C-KUR-001', name: 'Wawancara', level: 'TLC', bpmProcessId: 'p1', bpmProcessName: 'Pengajuan Fasilitas KUR', noGL: '12071', riskDescription: 'Data beda' },
  { controlId: 'c2', code: 'C-KUR-002', name: 'Dukcapil', level: 'TLC', bpmProcessId: 'p1', bpmProcessName: 'Pengajuan Fasilitas KUR', noGL: '12071', riskDescription: 'Data beda' },
  { controlId: 'c3', code: 'C-12071', name: 'Verifikasi', level: 'TLC', bpmProcessId: 'p2', bpmProcessName: 'Pelunasan Dipercepat', noGL: '12071', riskDescription: 'Tanpa wewenang' },
];

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'WorklistTestWrapper';
  return Wrapper;
}

describe('useCsaWorklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFiscalYearStore.setState({ workingYear: '2027' });
  });

  it('fetches the worklist for the working year and groups it by BPM', async () => {
    vi.mocked(api).mockResolvedValue({ items: ITEMS, totalControls: 3 });
    const { result } = renderHook(() => useCsaWorklist(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(vi.mocked(api)).toHaveBeenCalledWith('/api/csa/worklist?year=2027');
    expect(result.current.groups.map((g) => g.key)).toEqual(['p1', 'p2']);
    expect(result.current.groups[0]?.items).toHaveLength(2);
    expect(result.current.emptyKind).toBeNull();
  });

  it('reports all-assessed when the year has controls but none are unassessed', async () => {
    vi.mocked(api).mockResolvedValue({ items: [], totalControls: 3 });
    const { result } = renderHook(() => useCsaWorklist(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.emptyKind).toBe('all-assessed');
  });

  it('reports no-controls when the year has no controls at all', async () => {
    vi.mocked(api).mockResolvedValue({ items: [], totalControls: 0 });
    const { result } = renderHook(() => useCsaWorklist(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.emptyKind).toBe('no-controls');
  });
});
