import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfirmProvider } from '@/components/providers/ConfirmProvider';
import { SimulationListTable } from '@/components/scoping/SimulationListTable';
import * as apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultOrOptions?: any) => {
      if (typeof defaultOrOptions === 'string') return defaultOrOptions;
      if (defaultOrOptions && typeof defaultOrOptions === 'object' && defaultOrOptions.defaultValue) {
        return defaultOrOptions.defaultValue;
      }
      return key;
    },
    i18n: { language: 'id' },
  }),
}));

describe('Unified Maker-Checker Deletion & Confirmation Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const mockSimulations: any[] = [
    {
      id: 'sim-approved-1',
      name: 'Simulasi Baseline Disetujui 2026',
      year: 2026,
      status: 'Approved',
      version: 1,
      om: 1000000000,
      pm: 750000000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      notes: 'Final Approved Simulation',
    },
    {
      id: 'sim-draft-2',
      name: 'Simulasi Draft Sementara 2026',
      year: 2026,
      status: 'Draft',
      version: 2,
      om: 500000000,
      pm: 375000000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      notes: 'Work in progress',
    },
    {
      id: 'sim-pending-del-3',
      name: 'Simulasi Menunggu Penghapusan',
      year: 2026,
      status: 'Pending Deletion Approval',
      version: 3,
      om: 200000000,
      pm: 150000000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      notes: 'Pending deletion',
    },
  ];

  it('renders simulation table with correct deletion action tooltips and disables pending deletion buttons', () => {
    const onDeleteMock = vi.fn();
    const onSelectMock = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
          <SimulationListTable
            data={mockSimulations}
            onSelect={onSelectMock}
            onDelete={onDeleteMock}
          />
        </ConfirmProvider>
      </QueryClientProvider>
    );

    // Verify Approved simulation has "Request Deletion" title
    // Dual-render: mobile cards + desktop table both mount in jsdom (3 sims x 2 views)
    const deleteButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('svg.lucide-trash-2'));
    expect(deleteButtons).toHaveLength(6);

    // Button 1 (Approved, mobile) -> Request Deletion
    expect(deleteButtons[0]).toHaveAttribute('title', 'Request Deletion');
    expect(deleteButtons[0]).not.toBeDisabled();

    // Button 2 (Draft, mobile) -> Delete
    expect(deleteButtons[1]).toHaveAttribute('title', 'Delete');
    expect(deleteButtons[1]).not.toBeDisabled();

    // Button 3 (Pending Deletion Approval, mobile) -> Disabled to prevent duplicate requests
    expect(deleteButtons[2]).toBeDisabled();

    // Desktop duplicates mirror the same states
    expect(deleteButtons[3]).toHaveAttribute('title', 'Request Deletion');
    expect(deleteButtons[4]).toHaveAttribute('title', 'Delete');
    expect(deleteButtons[5]).toBeDisabled();
  });

  it('triggers onDelete callback when action button is clicked', () => {
    const onDeleteMock = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
          <SimulationListTable
            data={mockSimulations}
            onSelect={vi.fn()}
            onDelete={onDeleteMock}
          />
        </ConfirmProvider>
      </QueryClientProvider>
    );

    const deleteButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('svg.lucide-trash-2'));
    fireEvent.click(deleteButtons[0]);
    expect(onDeleteMock).toHaveBeenCalledWith('sim-approved-1');

    fireEvent.click(deleteButtons[1]);
    expect(onDeleteMock).toHaveBeenCalledWith('sim-draft-2');
  });

  it('prompts useConfirm modal and responds to user action before proceeding', async () => {
    const TestConsumer = () => {
      const confirm = (window as any).useConfirmHook();
      const [status, setStatus] = React.useState('idle');

      const handleAction = async () => {
        const approved = await confirm({
          title: 'Hapus Rekaman?',
          description: 'Aksi ini akan menghapus data secara permanen.',
          variant: 'destructive',
          confirmText: 'Ya, Hapus',
        });
        setStatus(approved ? 'confirmed' : 'cancelled');
      };

      return (
        <div>
          <button data-testid="trigger-btn" onClick={handleAction}>
            Trigger Delete
          </button>
          <span data-testid="result-status">{status}</span>
        </div>
      );
    };

    const { useConfirm } = await import('@/hooks/use-confirm');
    (window as any).useConfirmHook = useConfirm;

    render(
      <ConfirmProvider>
        <TestConsumer />
      </ConfirmProvider>
    );

    // Initial state
    expect(screen.getByTestId('result-status')).toHaveTextContent('idle');

    // Trigger action
    fireEvent.click(screen.getByTestId('trigger-btn'));

    // Modal should be open
    expect(await screen.findByText('Hapus Rekaman?')).toBeInTheDocument();
    expect(screen.getByText('Aksi ini akan menghapus data secara permanen.')).toBeInTheDocument();

    // Click confirm
    fireEvent.click(screen.getByText('Ya, Hapus'));

    // Status updated to confirmed
    await waitFor(() => {
      expect(screen.getByTestId('result-status')).toHaveTextContent('confirmed');
    });
  });
});

