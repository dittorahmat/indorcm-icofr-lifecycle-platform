import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnalyticsPage } from '../AnalyticsPage';
import { api } from '@/lib/api-client';
import { strictT } from '@/test/mock-i18n';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) => strictT(key, opts),
  }),
}));

describe('AnalyticsPage component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  it('renders executive KPI cards and charts when data is loaded', async () => {
    vi.mocked(api).mockResolvedValue({
      totalRisks: 12,
      totalControls: 24,
      toePassRate: 85.5,
      csaHealthScore: 4.2,
      openDeficiencies: 3,
      materialWeaknesses: 0,
      complianceRate: 88.5,
      mitigationProgress: 72.0,
      controlsByEffectiveness: [
        { name: 'Effective', value: 21 },
        { name: 'Deficient', value: 3 },
      ],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/analytics?tab=analytics-overview']}>
          <AnalyticsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText('title')).toBeInTheDocument();
    expect(await screen.findByText('kpi.totalRisk')).toBeInTheDocument();
    expect(await screen.findByText('kpi.toePassRate')).toBeInTheDocument();
    expect(await screen.findByText('85.5%')).toBeInTheDocument();
  });
});
