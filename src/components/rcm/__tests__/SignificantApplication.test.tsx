import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { SignificantApplicationCombobox } from '../SignificantApplicationCombobox';
import { ApplicationDetailDialog } from '../ApplicationDetailDialog';
import { api } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

const mockApplications = [
  {
    id: 'app-1',
    name: 'SAP S/4HANA',
    description: 'Enterprise ERP System',
    criticality: 'High',
    isSignificant: true,
    itgcAreas: ['Access to Program and Data', 'Program Changes'],
    businessOwners: ['Finance Dept'],
    applicationOwners: ['IT Ops'],
  },
  {
    id: 'app-2',
    name: 'Core Banking',
    description: 'Main Transaction Engine',
    criticality: 'High',
    isSignificant: true,
    itgcAreas: ['Access to Program and Data', 'Computer Operations'],
  },
];

const mockControlsResponse = {
  application: mockApplications[0],
  tlcControls: [
    {
      id: 'ctrl-1',
      code: 'TLC-FIN-001',
      name: 'Automated 3-Way Matching',
      description: 'System automatically matches PO, GR, and Invoice',
      type: 'Preventive',
      nature: 'Automated',
      frequency: 'Real-time',
      isKeyControl: true,
      applicationId: 'app-1',
    },
  ],
  itgcControls: [
    {
      id: 'ctrl-2',
      code: 'ITGC-AC-01',
      name: 'User Provisioning Control',
      description: 'User access requests require dual authorization',
      type: 'Preventive',
      nature: 'Manual',
      frequency: 'Monthly',
      isKeyControl: true,
      itgcDomain: 'Access to Program and Data',
      applicationId: 'app-1',
    },
  ],
  totalControls: 2,
};

const mockDocumentsResponse = {
  items: [
    {
      id: 'doc-1',
      applicationId: 'app-1',
      itgcArea: 'Access to Program and Data',
      fileName: 'User_Access_Matrix_2026.pdf',
      fileUrl: '/api/files/applications/app-1/Access/doc-1-User_Access_Matrix_2026.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      uploadedByName: 'Auditor User',
      uploadedAt: new Date('2026-08-25T10:00:00Z').getTime(),
      notes: 'Approved User Matrix Q3',
    },
  ],
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        {ui}
      </I18nextProvider>
    </QueryClientProvider>
  );
}

describe('SignificantApplicationCombobox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api as any).mockImplementation((url: string) => {
      if (url === '/api/applications') {
        return Promise.resolve({ items: mockApplications });
      }
      return Promise.resolve({});
    });
  });

  it('renders correctly with placeholder when no value is selected', async () => {
    renderWithProviders(
      <SignificantApplicationCombobox
        value={null}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays selected application name when value matches', async () => {
    renderWithProviders(
      <SignificantApplicationCombobox
        value="app-1"
        onChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('SAP S/4HANA')).toBeInTheDocument();
    });
  });
});

describe('ApplicationDetailDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api as any).mockImplementation((url: string) => {
      if (url.includes('/controls')) {
        return Promise.resolve(mockControlsResponse);
      }
      if (url.includes('/documents')) {
        return Promise.resolve(mockDocumentsResponse);
      }
      return Promise.resolve({});
    });
  });

  it('renders application header and all 6 tabs', async () => {
    renderWithProviders(
      <ApplicationDetailDialog
        application={mockApplications[0] as any}
        isOpen={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('SAP S/4HANA')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /RCM TLC/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /RCM ITGC/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Access to Program & Data/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Program Changes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Program Development/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Computer Operations/i })).toBeInTheDocument();
  });

  it('displays TLC controls inside the TLC tab', async () => {
    renderWithProviders(
      <ApplicationDetailDialog
        application={mockApplications[0] as any}
        isOpen={true}
        onOpenChange={vi.fn()}
        defaultTab="tlc"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('TLC-FIN-001')).toBeInTheDocument();
      expect(screen.getByText('Automated 3-Way Matching')).toBeInTheDocument();
    });

    const ths = screen.getAllByRole('columnheader');
    const nameHeader = ths.find((th) => th.textContent?.includes('Control Name & Description'));
    expect(nameHeader).toHaveClass('min-w-[280px]');
  });
});
