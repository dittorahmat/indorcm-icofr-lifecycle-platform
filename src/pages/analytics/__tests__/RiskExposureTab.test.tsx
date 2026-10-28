import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RiskExposureTab } from '../RiskExposureTab';
import { api } from '@/lib/api-client';
import { strictT } from '@/test/mock-i18n';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) => strictT(key, opts),
  }),
}));

describe('RiskExposureTab component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  it('renders bubble chart and risk summary table', async () => {
    vi.mocked(api).mockResolvedValue({
      success: true,
      data: [
        {
          id: 'R1',
          process: 'Revenue to Cash',
          name: 'Cut-off revenue fiktif',
          rating: 'High',
          x: 4.2,
          y: 4.5,
          z: 350,
        },
      ],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RiskExposureTab />
      </QueryClientProvider>
    );

    expect(await screen.findByText('Revenue to Cash')).toBeInTheDocument();
    expect(await screen.findByText('Cut-off revenue fiktif')).toBeInTheDocument();
    expect(await screen.findByText('L4.2')).toBeInTheDocument();
    expect(await screen.findByText('I4.5')).toBeInTheDocument();
  });
});
