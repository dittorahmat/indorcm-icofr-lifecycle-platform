import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useWorksheetControlUpdate } from './use-worksheet-control-update';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { strictT } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
    i18n: { language: 'en' },
  }),
}));

import { api } from '@/lib/api-client';
import { toast } from 'sonner';

let client: QueryClient;

function wrapper() {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'WorksheetUpdateTestWrapper';
  return Wrapper;
}

describe('useWorksheetControlUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.mocked(api).mockResolvedValue({ success: true });
  });

  it('updates the control via PUT /controls/:id and refreshes the worksheet', async () => {
    const spy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useWorksheetControlUpdate(), { wrapper: wrapper() });

    act(() => {
      result.current.mutate({ id: 'c1', data: { name: 'Baru' } });
    });

    await waitFor(() =>
      expect(vi.mocked(api)).toHaveBeenCalledWith(
        '/api/controls/c1',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
    expect(spy).toHaveBeenCalledWith({ queryKey: ['bpm-controls'] });
  });

  it('surfaces the server error when the update fails', async () => {
    vi.mocked(api).mockRejectedValueOnce(new Error('gagal update'));
    const { result } = renderHook(() => useWorksheetControlUpdate(), { wrapper: wrapper() });

    act(() => {
      result.current.mutate({ id: 'c1', data: {} });
    });

    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
  });
});
