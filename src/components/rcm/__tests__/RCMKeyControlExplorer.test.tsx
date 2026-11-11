import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { RCMKeyControlExplorer } from '../key-controls/RCMKeyControlExplorer';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

import { api } from '@/lib/api-client';

const mockControls = [
  {
    mappingId: 'map-1',
    rcmId: 'R-R2R-01',
    processName: 'Record to Report',
    subProcessName: 'ECL Model Valuation',
    bpmCode: 'BPM-R2R-01',
    fsliName: 'Piutang Usaha',
    noGL: '110200',
    riskDescription: 'Salah saji pengakuan estimasi penurunan nilai piutang (ECL)',
    riskRating: 'High',
    isFraudRelated: false,
    controlCode: 'C-R2R-01.01',
    baseControlName: 'Review ECL IFRS 9',
    baseControlDescription: 'Pengecekan konsistensi PD dan LGD oleh VP Accounting',
    mappedControlName: 'Review ECL IFRS 9',
    mappedControlDescription: 'Pengecekan konsistensi PD dan LGD oleh VP Accounting',
    controlType: 'Preventive',
    controlNature: 'Manual',
    frequency: 'Monthly',
    isKeyControl: true,
    supportingApp: 'SAP FI-CO',
    executorRole: 'VP Accounting',
    diagramId: 'diag-1',
    nodeId: 'node-act-1',
    conclusion: 'Effective',
    pilarObjective: 'Memastikan nilai tercatat piutang wajar',
    pilarTiming: 'Setiap akhir bulan sebelum tutup buku',
    pilarAuthority: 'VP Accounting memiliki SK Otoritas',
    pilarReliability: 'Menggunakan data historis terverifikasi',
    pilarCoverage: '100% saldo piutang holding & anak',
    pilarEvidence: 'Lembar persetujuan ditandatangani digital',
  },
  {
    mappingId: 'map-2',
    rcmId: 'R-P2P-01',
    processName: 'Procure to Pay',
    subProcessName: 'Vendor Invoice Verification',
    bpmCode: 'BPM-P2P-02',
    fsliName: 'Hutang Usaha',
    noGL: '210100',
    riskDescription: 'Pembayaran ganda atau tagihan fiktif vendor',
    riskRating: 'Medium',
    isFraudRelated: true,
    controlCode: 'C-P2P-02.01',
    baseControlName: 'Three-Way Matching ERP',
    baseControlDescription: 'Pencocokan otomatis PO, GRN, dan Invoice',
    mappedControlName: 'Three-Way Matching ERP',
    mappedControlDescription: 'Pencocokan otomatis PO, GRN, dan Invoice',
    controlType: 'Detective',
    controlNature: 'Automated',
    automatedSubNature: 'Automated Matching',
    frequency: 'Transactional',
    isKeyControl: false,
    supportingApp: 'SAP S/4HANA',
    executorRole: 'Finance Staff',
    diagramId: 'diag-2',
    nodeId: 'node-act-2',
    conclusion: 'Effective',
  },
];

describe('RCM Key Control Explorer & Sovereign Governance Components', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    await i18n.changeLanguage('id');
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    vi.mocked(api).mockImplementation((url: string) => {
      if (url.includes('/api/rcm-matrix/tlc')) {
        return Promise.resolve({ items: mockControls });
      }
      return Promise.resolve({ items: [] });
    });
  });

  const renderExplorer = () =>
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <RCMKeyControlExplorer workingYear="2024" />
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>
    );

  it('renders sovereign governance banner and 11 BUMN cluster selectors', async () => {
    renderExplorer();

    // Banner headline
    expect(
      await screen.findByText('Risk & Control Matrix (RCM) Key Control Explorer')
    ).toBeInTheDocument();

    // BUMN Clusters
    expect(screen.getByText('Industri Energi & Migas')).toBeInTheDocument();
    expect(screen.getByText('Industri Mineral & Batubara')).toBeInTheDocument();
    expect(screen.getByText('Jasa Keuangan & Perbankan')).toBeInTheDocument();
  });

  it('renders business cycle tabs and summary metrics', async () => {
    renderExplorer();

    // Cycle cards
    expect(await screen.findByText('O2C')).toBeInTheDocument();
    expect(screen.getByText('P2P')).toBeInTheDocument();
    expect(screen.getByText('R2R')).toBeInTheDocument();
    expect(screen.getByText('FAM')).toBeInTheDocument();
    expect(screen.getByText('ITGC')).toBeInTheDocument();

    // Stats
    expect(screen.getByText('Key Controls (KC)')).toBeInTheDocument();
    expect(screen.getByText('Total Kontrol')).toBeInTheDocument();
  });

  it('renders table columns with Key Control badge, BPM node link, and FSLI account', async () => {
    renderExplorer();

    // Wait for row
    expect(await screen.findByText('C-R2R-01.01')).toBeInTheDocument();
    expect(screen.getByText('KEY CONTROL')).toBeInTheDocument();
    expect(screen.getByText('Piutang Usaha')).toBeInTheDocument();
    expect(screen.getByText('SAP FI-CO')).toBeInTheDocument();

    // BPM node link
    const bpmLinks = screen.getAllByTitle('Buka Simpul BPM');
    expect(bpmLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('filters table by priority (Key Control only)', async () => {
    renderExplorer();

    expect(await screen.findByText('C-R2R-01.01')).toBeInTheDocument();
    expect(screen.getByText('C-P2P-02.01')).toBeInTheDocument();

    // Filter by priority
    const prioritySelect = screen.getByDisplayValue('Semua Tipe');
    fireEvent.change(prioritySelect, { target: { value: 'KEY' } });

    await waitFor(() => {
      expect(screen.getByText('C-R2R-01.01')).toBeInTheDocument();
      expect(screen.queryByText('C-P2P-02.01')).not.toBeInTheDocument();
    });
  });

  it('opens control detail modal with 6-pillar TOD evaluation on click', async () => {
    renderExplorer();

    expect(await screen.findByText('C-R2R-01.01')).toBeInTheDocument();

    const viewButtons = screen.getAllByTitle('Lihat Detail & Audit Trail');
    fireEvent.click(viewButtons[0]);

    // Check modal contents
    await waitFor(() => {
      expect(screen.getByText('Evaluasi 6 Pilar TOD (Lampiran 8)')).toBeInTheDocument();
    });
    const objPillars = screen.getAllByText('Pencapaian Objektif');
    expect(objPillars.length).toBeGreaterThanOrEqual(1);
  });
});
