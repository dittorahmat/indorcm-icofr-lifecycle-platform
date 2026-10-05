import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Appendix10Page } from '@/pages/reports/Appendix10Page';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('@/components/layout/PageHeader', () => ({
  PageHeader: ({ title, description }: { title: React.ReactNode; description?: string }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}));

vi.mock('@/lib/rcm-excel-export', () => ({
  exportRegulatoryTableToExcel: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'dodReport.title': 'LAMPIRAN 10',
        'dodReport.subtitle': 'ILUSTRASI DOKUMENTASI KERTAS KERJA PENENTUAN TINGKAT DEFISIENSI PENGENDALIAN (DEGREE OF DEFICIENCY - DoD)',
        'dodReport.loading': 'Memuat Kertas Kerja DoD Lampiran 10...',
        'dodReport.table.col1': 'Ref. Defisiensi (i)',
        'dodReport.table.col2': 'Deskripsi Defisiensi (ii)',
        'dodReport.table.col3': 'Telah Diremediasi (iii)',
        'dodReport.table.col4': 'Periode Tidak Efektif (iv)',
        'dodReport.table.col5': 'Nilai Eksposur Defisiensi (v)',
        'dodReport.table.col6': 'Kesimpulan Akhir (vi)',
        'dodReport.table.col7': 'Akun/Pengungkapan Terdampak (vii)',
        'dodReport.table.col8': 'Komponen COSO (viii)',
        'dodReport.table.col9': 'Proses Bisnis (ix)',
        'dodReport.table.col10': 'Unit Bisnis (x)',
        'dodReport.table.groupFinding': 'Data Defisiensi Pengendalian',
        'dodReport.table.groupAggregation': 'Klasifikasi Agregasi',
        'dodReport.table.groupAssertions': 'Asersi Laporan Keuangan',
        'dodReport.table.groupDecisionTree': 'Pohon Keputusan Evaluasi DoD',
        'dodReport.summary.totalEvaluated': 'Total Evaluasi DoD',
        'dodReport.summary.materialWeakness': 'Kelemahan Material (MW)',
        'dodReport.summary.significantDeficiency': 'Defisiensi Signifikan (SD)',
        'dodReport.summary.controlDeficiency': 'Defisiensi Pengendalian (CD)',
        'dodReport.summary.remediatedCount': 'Telah Diremediasi',
        'dodReport.filters.searchPlaceholder': 'Cari referensi...',
        'dodReport.filters.allSeverities': 'Semua Tingkat',
        'dodReport.filters.allRemediation': 'Semua Status',
        'dodReport.exportExcel': 'Ekspor Excel Lampiran 10',
        'dodReport.period': 'Periode 2026',
        'common:yes': 'Ya',
        'common:no': 'Tidak',
        'dodReport.printA4': 'Cetak Laporan (A4/A3)',
      };
      return translations[key] || options?.defaultValue || key;
    },
  }),
}));

const mockDeficiencies = [
  {
    id: 'DEF-001',
    controlId: 'CTRL-001',
    controlCode: 'PRC-001',
    severity: 'Material Weakness',
    description: 'Segregation of duties deficiency in GL posting',
    status: 'Open',
    exposureValue: 12_500_000_000,
    impactedAccount: 'Kas dan Setara Kas',
    cosoComponent: 'Control Activities',
    businessProcess: 'Perbendaharaan',
    businessUnit: 'Head Office',
    assertions: ['Accuracy', 'Completeness', 'Existence'],
    flowchartPath: { 1: true, 2: true, 3: true, 4: true, 5: false, 6: true, 7: false },
  },
];

const mockControls = [
  {
    id: 'CTRL-001',
    code: 'PRC-001',
    name: 'Pemisahan tugas posting jurnal kas',
    assertions: ['Accuracy', 'Completeness'],
  },
];

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockImplementation(({ queryKey }: { queryKey: any[] }) => {
    if (queryKey[0] === 'deficiencies') {
      return { data: { items: mockDeficiencies }, isLoading: false };
    }
    if (queryKey[0] === 'controls') {
      return { data: { items: mockControls }, isLoading: false };
    }
    return { data: { items: [] }, isLoading: false };
  }),
}));

vi.mock('@/store/useFiscalYearStore', () => ({
  useFiscalYearStore: () => ({ workingYear: '2026' }),
}));

describe('Appendix10Page (Lampiran 10 Dedicated Route)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header with correct regulatory Lampiran 10 title', () => {
    render(
      <MemoryRouter>
        <Appendix10Page />
      </MemoryRouter>
    );

    expect(screen.getAllByText('LAMPIRAN 10')).toHaveLength(2);
    expect(screen.getAllByText(/ILUSTRASI DOKUMENTASI KERTAS KERJA PENENTUAN TINGKAT DEFISIENSI PENGENDALIAN/i)[0]).toBeInTheDocument();
  });

  it('renders the 24-column DoD evaluation table with deficiency rows', () => {
    render(
      <MemoryRouter>
        <Appendix10Page />
      </MemoryRouter>
    );

    expect(screen.getAllByText('DEF-001')).toHaveLength(2);
    expect(screen.getAllByText('Segregation of duties deficiency in GL posting')).toHaveLength(2);
    expect(screen.getByText('Beban Operasional / Kas & Bank')).toBeInTheDocument();
    expect(screen.getByText('Ekspor Excel Lampiran 10')).toBeInTheDocument();
  });
});
