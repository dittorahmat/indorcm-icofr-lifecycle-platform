import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { useCSA } from './use-csa';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

vi.mock('@/hooks/use-confirm', () => ({
  useConfirm: () => vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), loading: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts?.message ? `${key}:${String(opts.message)}` : key,
    i18n: { language: 'en' },
  }),
}));

import { api } from '@/lib/api-client';
import { toast } from 'sonner';

let client: QueryClient;

function wrapper() {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
  Wrapper.displayName = 'CsaSaveTestWrapper';
  return Wrapper;
}

describe('useCSA save mutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.mocked(api).mockImplementation((url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? Promise.reject(new Error('Simpan gagal: boom'))
        : Promise.resolve({ items: [] }),
    );
  });

  it('surfaces the server error when saving fails instead of failing silently', async () => {
    const { result } = renderHook(() => useCSA({ bpmProcessId: 'p1' }), { wrapper: wrapper() });

    act(() => {
      result.current.createMutation.mutate({ period: '2027-Q1', result: 'Effective', isDraft: true });
    });

    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
    expect(vi.mocked(toast.error).mock.calls[0][0]).toContain('boom');
  });

  it('invalidates the worklist after a successful save', async () => {
    vi.mocked(api).mockImplementation((url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? Promise.resolve({ id: 'csa-9' })
        : Promise.resolve({ items: [] }),
    );
    const spy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useCSA({ bpmProcessId: 'p1' }), { wrapper: wrapper() });

    act(() => {
      result.current.createMutation.mutate({ period: '2027-Q1', result: 'Effective', isDraft: true });
    });

    await waitFor(() => expect(vi.mocked(toast.success)).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith({ queryKey: ['csa-worklist'] });
  });
});
