import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomizableDashboard } from '../CustomizableDashboard';
import { defaultLayouts, type Layouts } from '../dashboard-layout';
import { strictT } from '../../../test/mock-i18n';

/**
 * The dashboard's two contracts with the server preference:
 *
 * 1. The draft IS the `['user-preferences']` cache entry — the write re-reads the
 *    cache when it fires, so the PUT body is the layout on screen, never a copy
 *    captured when the edit started. The old component mirrored the preference
 *    into `useState` through a `useEffect`; the second case below pins that seam
 *    by making the cache hold something the edit did NOT produce and requiring
 *    that value to be what gets sent.
 * 2. Exactly one query is issued. The mirror's `useEffect` also gated on
 *    `/api/user/me`, so a second query key means the role-driven seeding path is
 *    back.
 */

const store = vi.hoisted(() => {
  const row = { i: 'from-cache', x: 0, y: 0, w: 6, h: 3, dataSource: 'deficiencies-severity', vizType: 'bar' };
  const cacheLayout = { lg: [row], md: [row], sm: [row] };
  return {
    cacheLayout,
    queryKeys: new Array<string>(),
    setData: vi.fn(),
    getData: vi.fn(() => ({ layout: cacheLayout })),
    mutate: vi.fn(),
  };
});

vi.mock('@/hooks/use-organization-branding', () => ({
  useOrganizationBranding: () => ({ companyName: 'PT Contoh' }),
}));

vi.mock('@/lib/api-client', () => ({ api: vi.fn().mockResolvedValue({}) }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: strictT }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: { queryKey: readonly unknown[] }) => {
    store.queryKeys.push(String(options.queryKey[0]));
    return { data: { layout: store.cacheLayout }, isLoading: false };
  },
  useMutation: () => ({ mutate: store.mutate, isPending: false }),
  useQueryClient: () => ({
    setQueryData: store.setData,
    getQueryData: store.getData,
    invalidateQueries: vi.fn(),
  }),
}));

beforeEach(() => {
  store.queryKeys.length = 0;
  store.setData.mockClear();
  store.mutate.mockClear();
});

describe('CustomizableDashboard', () => {
  it('writes layout edits into the query cache', () => {
    render(<CustomizableDashboard isEffective={false} />);
    fireEvent.click(screen.getByRole('button', { name: /customizableDashboard\.resetLayout/i }));

    // The grid also reports its own layout on mount, so pick the write that
    // carries the reset rather than asserting a call count.
    const writes = store.setData.mock.calls as [unknown, (prev: { layout?: unknown }) => { layout: Layouts }][];
    const reset = writes.find(([, updater]) => {
      const next = updater({});
      return JSON.stringify(next.layout) === JSON.stringify(defaultLayouts());
    });
    expect(reset?.[0]).toEqual(['user-preferences']);
  });

  it('sends the cache contents at save time, not a copy captured by the edit', () => {
    render(<CustomizableDashboard isEffective={false} />);
    fireEvent.click(screen.getByRole('button', { name: /customizableDashboard\.resetLayout/i }));

    // The edit wrote the defaults into the cache spy, but the cache the hook
    // re-reads still holds `cacheLayout`: a sent body that came from the edit's
    // own variable would not match it.
    expect(store.mutate).toHaveBeenCalledTimes(1);
    expect(store.mutate.mock.calls[0][0]).toEqual(store.cacheLayout);
  });

  it('issues only the preferences query', () => {
    render(<CustomizableDashboard isEffective={false} />);
    expect([...new Set(store.queryKeys)]).toEqual(['user-preferences']);
  });

  it('renders the widget catalog from the bundle keys', () => {
    render(<CustomizableDashboard isEffective={false} />);
    fireEvent.click(screen.getByRole('button', { name: /customizableDashboard\.widgetCatalog/i }));
    expect(screen.getByText('customizableDashboard.widgets.kpiSummary')).toBeInTheDocument();
    expect(screen.getByText('customizableDashboard.widgets.cosoHeatmap')).toBeInTheDocument();
  });
});
