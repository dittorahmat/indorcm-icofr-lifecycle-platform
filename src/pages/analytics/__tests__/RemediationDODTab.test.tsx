import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RemediationDODTab } from '../RemediationDODTab';
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

describe('RemediationDODTab component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  it('renders remediation donut chart and severity breakdown bar chart', async () => {
    vi.mocked(api).mockResolvedValue({
      success: true,
      data: {
        remediationStatus: [
          { name: 'In Progress (CAP)', value: 5 },
          { name: 'Implemented & Verified', value: 8 },
        ],
        severityBreakdown: [
          { name: 'Material Weakness (MW)', value: 0 },
          { name: 'Significant Deficiency (SD)', value: 2 },
          { name: 'Control Deficiency (CD)', value: 4 },
        ],
        slaComplianceRate: 88.0,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RemediationDODTab />
      </QueryClientProvider>
    );

    expect(await screen.findByText('remediation.title')).toBeInTheDocument();
    expect(await screen.findByText('remediation.remediationCardTitle')).toBeInTheDocument();
    expect(await screen.findByText('remediation.severityCardTitle')).toBeInTheDocument();
    expect(await screen.findByText('88%')).toBeInTheDocument();
  });
});
