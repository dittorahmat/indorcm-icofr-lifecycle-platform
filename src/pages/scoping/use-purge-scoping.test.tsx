import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePurgeScoping } from './use-purge-scoping';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

vi.mock('@/hooks/use-confirm', () => ({
  useConfirm: () => confirmFn,
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

const confirmFn = vi.fn();

let client: QueryClient;

function wrapper() {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'PurgeTestWrapper';
  return Wrapper;
}

describe('usePurgeScoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    confirmFn.mockResolvedValue(true);
    vi.mocked(api).mockResolvedValue({ success: true });
  });

  it('purges via POST with confirmation and refreshes afterwards', async () => {
    const spy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => usePurgeScoping(), { wrapper: wrapper() });

    let done: boolean | undefined;
    await act(async () => {
      done = await result.current.purgeScoping();
    });

    expect(confirmFn).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' }),
    );
    expect(vi.mocked(api)).toHaveBeenCalledWith(
      '/api/dev/purge-scoping',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(spy).toHaveBeenCalled();
    expect(vi.mocked(toast.success)).toHaveBeenCalled();
    expect(done).toBe(true);
  });

  it('does nothing when the dialog is dismissed', async () => {
    confirmFn.mockResolvedValue(false);
    const { result } = renderHook(() => usePurgeScoping(), { wrapper: wrapper() });

    let done: boolean | undefined;
    await act(async () => {
      done = await result.current.purgeScoping();
    });

    expect(vi.mocked(api)).not.toHaveBeenCalled();
    expect(done).toBe(false);
  });

  it('surfaces the server error when purging fails', async () => {
    vi.mocked(api).mockRejectedValueOnce(new Error('gagal purge'));
    const { result } = renderHook(() => usePurgeScoping(), { wrapper: wrapper() });

    let done: boolean | undefined;
    await act(async () => {
      done = await result.current.purgeScoping();
    });

    expect(vi.mocked(toast.error)).toHaveBeenCalled();
    expect(done).toBe(false);
  });
});
