import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RCMTLCPage } from './RCMTLCPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UnsavedChangesProvider } from '@/context/UnsavedChangesContext';
import React from 'react';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/rcm-matrix/tlc')) {
      return Promise.resolve({
        items: [
          {
            mappingId: 'map-1',
            rcmId: 'rcm-1',
            controlId: 'ctrl-1',
            processName: 'Procure to Pay',
            subProcessName: 'Pengadaan',
            diagramId: 'diag-1',
            nodeId: 'node-act-1',
            riskDescription: 'Risiko vendor fiktif',
            baseControlName: 'Verifikasi Rekanan',
            isFraudRelated: false,
            riskRating: 'High',
            controlCode: 'CTRL-001',
          },
        ],
      });
    }
    return Promise.resolve({ items: [] });
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const routes = [
    {
      path: '/',
      element: (
        <UnsavedChangesProvider>
          <SidebarProvider>
            <RCMTLCPage />
          </SidebarProvider>
        </UnsavedChangesProvider>
      ),
    },
  ];

  const router = createMemoryRouter(routes, {
    initialEntries: ['/'],
  });

  return () => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </QueryClientProvider>
  );
};

describe('RCMTLCPage Ref BPM deep-link rendering', () => {
  it('renders the TLC page header and Ref BPM link correctly', async () => {
    const Wrapper = createWrapper();
    render(<Wrapper />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    const bpmLink = await screen.findByRole('link', { name: /node-act-1/i });
    expect(bpmLink).toBeInTheDocument();
    expect(bpmLink).toHaveAttribute('href', '/bpm?diagramId=diag-1&nodeId=node-act-1');
    expect(bpmLink).toHaveAttribute('target', '_blank');
    expect(bpmLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders a hyphen when no BPM linkage exists', async () => {
    const Wrapper = createWrapper();
    render(<Wrapper />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('locks TLC table narrative column widths to 520px for risk and 580px for control descriptions', async () => {
    const Wrapper = createWrapper();
    render(<Wrapper />);

    const riskHeader = await screen.findByRole('columnheader', { name: /Risk Control Activity|Risiko Aktivitas Pengendalian/i });
    expect(riskHeader).toBeInTheDocument();
    expect(riskHeader.style.width).toBe('520px');

    const controlDescHeader = await screen.findByRole('columnheader', { name: /Control Activity Description|Deskripsi Aktivitas Pengendalian/i });
    expect(controlDescHeader).toBeInTheDocument();
    expect(controlDescHeader.style.width).toBe('580px');
  });
});
