import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CSAHeatmapTab } from '../CSAHeatmapTab';
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

describe('CSAHeatmapTab component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  it('renders heatmap matrix and updates detail panel when control is selected', async () => {
    vi.mocked(api).mockResolvedValue({
      success: true,
      data: {
        matrix: {
          '1-5': [{ id: 'REV-01', code: 'CTRL-REV-01', title: 'Three-way match billing' }],
        },
        controls: {
          'REV-01': {
            id: 'REV-01',
            code: 'CTRL-REV-01',
            cycle: 'Revenue to Cash',
            impact: 'Skor 5 / 5',
            impactDesc: 'Pengakuan omset fiktif',
            csa: 'Desain: 5/5 | Operasi: 5/5',
            csaDesc: 'Kontrol otomatis ERP berhasil',
            status: 'Safe / Low Residual Risk',
            statusColor: 'text-emerald-700',
          },
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CSAHeatmapTab />
      </QueryClientProvider>
    );

    expect(await screen.findAllByText('CTRL-REV-01')).toHaveLength(2);
    expect(await screen.findByText('Revenue to Cash')).toBeInTheDocument();

    // Toggle list view
    const listBtn = screen.getByText('heatmap.viewList');
    fireEvent.click(listBtn);
    expect(screen.getByText('heatmap.viewMatrix')).toBeInTheDocument();
  });
});
