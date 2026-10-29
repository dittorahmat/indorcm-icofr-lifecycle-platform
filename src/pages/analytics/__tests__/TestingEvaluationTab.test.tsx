import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TestingEvaluationTab } from '../TestingEvaluationTab';
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

describe('TestingEvaluationTab component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  it('renders radar chart and testing classification breakdown', async () => {
    vi.mocked(api).mockResolvedValue({
      radarScores: [
        { pillar: 'Objective', score: 90, fullMark: 100 },
        { pillar: 'Timing & Frequency', score: 85, fullMark: 100 },
        { pillar: 'Authority & Segregation', score: 88, fullMark: 100 },
        { pillar: 'Reliability & Evidence', score: 75, fullMark: 100 },
        { pillar: 'Coverage & Sampling', score: 82, fullMark: 100 },
        { pillar: 'Continuous Monitoring', score: 80, fullMark: 100 },
      ],
      statusBreakdown: [
        { name: 'Effective (Pass)', value: 15 },
        { name: 'Design Deficiency', value: 2 },
        { name: 'Operating Deficiency', value: 3 },
      ],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TestingEvaluationTab />
      </QueryClientProvider>
    );

    expect(await screen.findByText('testing.title')).toBeInTheDocument();
    expect(await screen.findByText('testing.radarCardTitle')).toBeInTheDocument();
    expect(await screen.findByText('testing.statusCardTitle')).toBeInTheDocument();
  });
});
