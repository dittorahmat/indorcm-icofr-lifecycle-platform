import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useRcmMatrixLifecycle } from '../useRcmMatrixLifecycle';

import { strictT } from '@/test/mock-i18n';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
}

describe('useRcmMatrixLifecycle', () => {
  it('initializes with default search term and dialog states', () => {
    const { result } = renderHook(
      () => useRcmMatrixLifecycle({ tier: 'TLC', workingYear: '2025' }),
      { wrapper: createWrapper() }
    );

    expect(result.current.searchTerm).toBe('');
    expect(result.current.editingItem).toBeNull();
    expect(result.current.isRolloverOpen).toBe(false);
    expect(result.current.isImportModalOpen).toBe(false);
  });

  it('updates search term and editing item state', () => {
    const { result } = renderHook(
      () => useRcmMatrixLifecycle({ tier: 'ITGC', workingYear: '2025' }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.setSearchTerm('access control');
      result.current.setEditingItem({ id: '123', name: 'Test' });
    });

    expect(result.current.searchTerm).toBe('access control');
    expect(result.current.editingItem).toEqual({ id: '123', name: 'Test' });
  });
});
