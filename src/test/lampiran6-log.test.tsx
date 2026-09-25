import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Lampiran6LogView } from '../components/bpm/Lampiran6LogView';
import * as apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === 'logView.empty') return 'Belum ada riwayat perubahan yang disetujui (Lampiran 6) untuk sub-proses ini.';
      if (key === 'logView.title') return 'Lampiran 6: Log Perubahan BPM & RCM';
      if (key === 'logView.subtitle') return 'Histori Persetujuan & Modifikasi Pengendalian';
      if (key === 'logView.entriesCount') return `${options?.count || 0} Catatan`;
      return key;
    },
    i18n: { language: 'id' },
  }),
}));

describe('Lampiran6LogView Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderComponent = (props: any) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Lampiran6LogView {...props} />
      </QueryClientProvider>
    );
  };

  it('renders matching logs by subProcessName and bpmProcessId', async () => {
    vi.mocked(apiClient.api).mockImplementation(async (url: string) => {
      if (url === '/api/change-logs') {
        return {
          items: [
            {
              id: 'log-1',
              timestamp: 1716500000000,
              entityId: 'CTRL-001',
              action: 'APPROVE_CHANGE',
              dataBefore: { subProcess: 'Pengelolaan Kas', controlId: 'CTRL-001' },
              dataAfter: { subProcess: 'Pengelolaan Kas', controlId: 'CTRL-001', bpmProcessId: 'proc-1', businessProcess: 'Treasury' },
              effectiveDate: 1716600000000,
            },
            {
              id: 'log-2',
              timestamp: 1716500000000,
              entityId: 'CTRL-002',
              action: 'APPROVE_CHANGE',
              dataBefore: { subProcess: 'Pengadaan Barang', controlId: 'CTRL-002' },
              dataAfter: { subProcess: 'Pengadaan Barang', controlId: 'CTRL-002', bpmProcessId: 'proc-2', businessProcess: 'Procurement' },
              effectiveDate: 1716600000000,
            }
          ]
        };
      }
      if (url === '/api/users') {
        return { items: [] };
      }
      return {} as any;
    });

    renderComponent({
      subProcessName: 'Pengelolaan Kas',
      bpmProcessId: 'proc-1',
    });

    await waitFor(() => {
      expect(screen.getByText('Treasury')).toBeInTheDocument();
      expect(screen.getByText('Pengelolaan Kas')).toBeInTheDocument();
      expect(screen.queryByText('Pengadaan Barang')).not.toBeInTheDocument();
    });
  });

  it('renders empty state when no matching logs exist for sub-process', async () => {
    vi.mocked(apiClient.api).mockImplementation(async (url: string) => {
      if (url === '/api/change-logs') {
        return { items: [] };
      }
      if (url === '/api/users') {
        return { items: [] };
      }
      return {} as any;
    });

    renderComponent({
      subProcessName: 'Non-Existent SubProcess',
    });

    await waitFor(() => {
      expect(screen.getByText(/Belum ada riwayat perubahan yang disetujui/i)).toBeInTheDocument();
    });
  });
});
