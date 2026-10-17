import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { validateI18nKey } from '@/test/mock-i18n';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

vi.mock('@/hooks/use-confirm', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), loading: vi.fn() },
}));

/**
 * Strict i18n mock: every static key is validated against the real `en` bundle
 * (`validateI18nKey`), then interpolated the way i18next would, so a missing
 * key goes red and a server message still reaches the assertion.
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (typeof opts?.defaultValue === 'string') {
        const template = opts.defaultValue;
        return typeof opts.message === 'string' ? template.replace('{{message}}', String(opts.message)) : template;
      }
      validateI18nKey(key);
      return typeof opts?.message === 'string' ? `${key}:${String(opts.message)}` : key;
    },
    i18n: { language: 'en' },
  }),
}));

// Spy on the single guarded compressor without replacing its behaviour: the
// upload mutation must delegate to it (and only once).
vi.mock('./csa/use-evidence-upload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./csa/use-evidence-upload')>();
  return { ...actual, compressEvidenceImage: vi.fn(actual.compressEvidenceImage) };
});

import { useCSA } from './use-csa';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { compressEvidenceImage } from './csa/use-evidence-upload';

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

/** GET noise (bpm-processes, csa list, diagram) plus a per-test write reply. */
function mockApi(write: (init?: RequestInit) => Promise<unknown> | undefined) {
  vi.mocked(api).mockImplementation((_url: string, init?: RequestInit) => {
    if (init?.method) {
      const reply = write(init);
      if (reply) return reply;
    }
    return Promise.resolve({ items: [] });
  });
}

describe('useCSA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    mockApi(() => undefined);
  });

  it('surfaces the server error when saving fails instead of failing silently', async () => {
    mockApi((init) =>
      init?.method === 'POST' ? Promise.reject(new Error('Simpan gagal: boom')) : undefined,
    );

    const { result } = renderHook(() => useCSA({ bpmProcessId: 'p1', year: '2026' }), { wrapper: wrapper() });

    act(() => {
      result.current.createMutation.mutate({ period: '2027-Q1', result: 'Effective', isDraft: true });
    });

    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
    expect(vi.mocked(toast.error).mock.calls[0][0]).toContain('boom');
  });

  it('invalidates the list and worklist with the working year after a successful save', async () => {
    mockApi((init) => (init?.method === 'POST' ? Promise.resolve({ id: 'csa-9' }) : undefined));
    const spy = vi.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useCSA({ bpmProcessId: 'p1', year: '2026' }), { wrapper: wrapper() });

    act(() => {
      result.current.createMutation.mutate({ period: '2027-Q1', result: 'Effective', isDraft: true });
    });

    await waitFor(() => expect(vi.mocked(toast.success)).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith({ queryKey: ['csa-list', 'p1', '2026'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['csa-worklist', '2026'] });
    // The old bug: a year-less bust-all key must never be issued again.
    const bareWorklist = spy.mock.calls.some(
      ([filters]) => JSON.stringify(filters?.queryKey) === JSON.stringify(['csa-worklist']),
    );
    expect(bareWorklist).toBe(false);
  });

  it('scopes the assessment list fetch to the working year', async () => {
    renderHook(() => useCSA({ bpmProcessId: 'p1', year: '2026' }), { wrapper: wrapper() });

    await waitFor(() => {
      const urls = vi.mocked(api).mock.calls.map(([url]) => String(url));
      expect(urls.some((url) => url.startsWith('/api/csa?') && url.includes('year=2026'))).toBe(true);
    });
  });

  it('surfaces a toast when deleting an assessment fails', async () => {
    mockApi((init) =>
      init?.method === 'DELETE' ? Promise.reject(new Error('Hapus gagal: nope')) : undefined,
    );

    const { result } = renderHook(() => useCSA({ bpmProcessId: 'p1', year: '2026' }), { wrapper: wrapper() });

    await act(async () => {
      await result.current.handleDelete('csa-1');
    });

    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
    expect(vi.mocked(toast.error).mock.calls[0][0]).toContain('nope');
  });

  it('compresses the evidence image exactly once through the shared guarded owner', async () => {
    mockApi((init) =>
      init?.method === 'POST' ? Promise.resolve({ url: 'https://cdn.example/evidence.jpg' }) : undefined,
    );

    const { result } = renderHook(() => useCSA({ bpmProcessId: 'p1', year: '2026' }), { wrapper: wrapper() });
    act(() => {
      result.current.form.setValue('samples', [{ controlResults: { C1: { implemented: true } } }]);
    });
    const file = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.uploadMutation.mutate({ sIdx: 0, cId: 'C1', file });
    });

    await waitFor(() => expect(vi.mocked(toast.success)).toHaveBeenCalled());
    expect(vi.mocked(compressEvidenceImage)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(compressEvidenceImage)).toHaveBeenCalledWith(file);
  });
});
