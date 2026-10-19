import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DoDLampiran10Report } from '../DoDLampiran10Report';
import { exportRegulatoryTableToExcel } from '@/lib/rcm-excel-export';
import type { Deficiency, Control } from '@shared/types';

vi.mock('@/lib/rcm-excel-export', () => ({
  exportRegulatoryTableToExcel: vi.fn(),
}));

import { validateI18nKey } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      validateI18nKey(key);
      const translations: Record<string, string> = {
        'dodReport.title': 'LAMPIRAN 10',
        'dodReport.subtitle': 'ILUSTRASI DOKUMENTASI KERTAS KERJA PENENTUAN TINGKAT DEFISIENSI PENGENDALIAN',
        'dodReport.regulationReference': 'Format Standar Berdasarkan SK-5/DKU.MBU/11/2024',
        'dodReport.exportCsv': 'Ekspor CSV',
        'dodReport.exportExcel': 'Ekspor Excel Lampiran 10',
        'dodReport.period': 'Periode 2025',
        'common:yes': 'Ya',
        'common:no': 'Tidak',
        'dodReport.printA4': 'Cetak Laporan',
        'dodReport.empty': 'Belum ada data evaluasi defisiensi pengendalian',
        'dodReport.summary.totalEvaluated': 'Total Evaluasi DoD',
        'dodReport.summary.materialWeakness': 'Kelemahan Material (MW)',
        'dodReport.summary.significantDeficiency': 'Defisiensi Signifikan (SD)',
        'dodReport.summary.controlDeficiency': 'Defisiensi Pengendalian (CD)',
        'dodReport.summary.remediatedCount': 'Telah Diremediasi',
        'dodReport.filters.searchPlaceholder': 'Cari referensi...',
        'dodReport.filters.allSeverities': 'Semua Tingkat',
        'dodReport.filters.materialWeakness': 'Kelemahan Material',
        'dodReport.filters.significantDeficiency': 'Defisiensi Signifikan',
        'dodReport.filters.controlDeficiency': 'Defisiensi Pengendalian',
        'dodReport.filters.allRemediation': 'Semua Status',
        'dodReport.filters.remediated': 'Telah Diremediasi',
        'dodReport.filters.notRemediated': 'Belum Diremediasi',
        'dodReport.table.groupFinding': 'Data Defisiensi Pengendalian',
        'dodReport.table.groupAggregation': 'Klasifikasi Agregasi',
        'dodReport.table.groupAssertions': 'Asersi Laporan Keuangan',
        'dodReport.table.groupDecisionTree': 'Pohon Keputusan Evaluasi DoD',
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
        'dodReport.signatures.preparerTitle': 'Disiapkan oleh:',
        'dodReport.signatures.preparerRole': 'Lini Ketiga',
        'dodReport.signatures.approverTitle': 'Diketahui oleh:',
        'dodReport.signatures.approverRole': 'Komite Audit',
        'dodReport.signatures.verifiedDigital': 'Tervalidasi Digital Sesuai SK-5/2024',
      };
      return translations[key] || key;
    },
  }),
}));

const mockDeficiencies: any[] = [
  {
    id: 'DEF-001',
    controlId: 'CTRL-001',
    controlCode: 'PRC-001',
    severity: 'Material Weakness',
    description: 'Persetujuan tender di atas ambang batas otorisasi tanpa tanda tangan Direktur.',
    status: 'Open',
    source: 'Lini 3 - Audit',
    exposureValue: 12_500_000_000,
    assertions: ['Accuracy', 'Completeness', 'Cut-Off'],
    compensatingControlIds: [],
    flowchartPath: { 1: true, 2: true, 3: true, 4: true, 5: false, 6: true, 7: false },
    dodWorksheet: {
      deficiencyId: 'DEF-001',
      evaluatedAt: Date.now(),
      exposureValue: 12_500_000_000,
      ineffectivePeriod: 'Q1 - Q4 (12 Bulan)',
      isRemediated: false,
      assertions: ['Accuracy', 'Completeness', 'Cut-Off'],
      cosoComponent: 'Control Activities',
      boxes: {
        box1: { answer: true, justification: 'Terkait langsung dengan asersi Akurasi dan Kelengkapan' },
        box2: { answer: true, justification: 'Kemungkinan salah saji tinggi' },
        box3: { answer: true, justification: 'Eksposur melampaui PM' },
        box4: { answer: true, justification: 'Mendapat perhatian Komite Audit' },
        box5: { answer: false, justification: 'Tidak ada kontrol kompensasi efektif' },
        box6: { answer: true, justification: 'Prudent official menyimpulkan MW' },
        box7: { answer: false, justification: 'Tidak ada defisiensi kombinasi' },
      },
      finalSeverity: 'Material Weakness',
      governanceRouting: ['CEO', 'Direksi', 'Komite Audit'],
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'DEF-002',
    controlId: 'CTRL-002',
    controlCode: 'INV-002',
    severity: 'Significant Deficiency',
    description: 'Selisih perhitungan fisik batu bara tidak diverifikasi tepat waktu.',
    status: 'Remediated',
    source: 'Lini 2 - CSA Review',
    exposureValue: 800_000_000,
    assertions: ['Existence/Occurrence', 'Valuation and Allocation'],
    compensatingControlIds: ['CTRL-COMP-01'],
    dodWorksheet: {
      deficiencyId: 'DEF-002',
      evaluatedAt: Date.now(),
      exposureValue: 800_000_000,
      ineffectivePeriod: 'Q2 (3 Bulan)',
      isRemediated: true,
      assertions: ['Existence/Occurrence', 'Valuation and Allocation'],
      cosoComponent: 'Monitoring Activities',
      boxes: {
        box1: { answer: true, justification: 'Terkait asersi E/O dan V/A' },
        box2: { answer: true, justification: 'Kemungkinan salah saji sedang' },
        box3: { answer: false, justification: 'Eksposur di bawah PM' },
        box4: { answer: true, justification: 'Mendapat perhatian pengawas' },
        box5: { answer: true, justification: 'Ada kontrol kompensasi' },
        box6: { answer: false, justification: 'Bukan MW' },
        box7: { answer: false, justification: 'Evaluasi selesai' },
      },
      finalSeverity: 'Significant Deficiency',
      governanceRouting: ['CEO', 'Direksi'],
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const mockControls: any[] = [
  {
    id: 'CTRL-001',
    code: 'PRC-001',
    name: 'Otorisasi Tender',
    description: 'Persetujuan tender pengadaan barang dan jasa',
    businessProcess: 'Pengadaan Barang & Jasa',
    subProcess: 'Tender Evaluation',
    location: 'Divisi SCM',
    fsliCodes: ['Beban Pokok Pendapatan (COGS)'],
    assertions: ['Accuracy', 'Completeness'],
    level: 'TLC',
    nature: 'Manual',
    frequency: 'Ad-hoc',
    ownerId: 'usr-scm',
    isKeyControl: true,
    riskRating: 'High',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'CTRL-002',
    code: 'INV-002',
    name: 'Stock Opname Bulanan',
    description: 'Rekonsiliasi volume fisik batu bara stockpile',
    businessProcess: 'Manajemen Persediaan',
    subProcess: 'Stock Taking',
    location: 'Divisi Operasi Tambang',
    fsliCodes: ['Persediaan'],
    assertions: ['Existence/Occurrence', 'Valuation and Allocation'],
    level: 'TLC',
    nature: 'Manual',
    frequency: 'Monthly',
    ownerId: 'usr-ktt',
    isKeyControl: true,
    riskRating: 'Medium',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

describe('DoDLampiran10Report Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders regulatory title and subtitle', () => {
    render(<DoDLampiran10Report deficiencies={mockDeficiencies} controls={mockControls} />);

    expect(screen.getByText('LAMPIRAN 10')).toBeInTheDocument();
    expect(screen.getByText('ILUSTRASI DOKUMENTASI KERTAS KERJA PENENTUAN TINGKAT DEFISIENSI PENGENDALIAN')).toBeInTheDocument();
  });

  it('renders summary KPI counters correctly', () => {
    render(<DoDLampiran10Report deficiencies={mockDeficiencies} controls={mockControls} />);

    expect(screen.getByText('Total Evaluasi DoD')).toBeInTheDocument();
    // Since #99 the table's severity cell resolves the same `dodReport.summary.*`
    // key as this KPI card, where it used to print its own `MW (Kelemahan
    // Material)` order — so the label is now expected in more than one place.
    expect(screen.getAllByText('Kelemahan Material (MW)').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Defisiensi Signifikan (SD)').length).toBeGreaterThanOrEqual(2);

    // MW count: 1, SD count: 1, Remediated count: 1, Total: 2
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2);
  });

  it('renders all table headers including 24 numbered columns', () => {
    render(<DoDLampiran10Report deficiencies={mockDeficiencies} controls={mockControls} />);

    expect(screen.getByText('Ref. Defisiensi (i)')).toBeInTheDocument();
    expect(screen.getByText('Deskripsi Defisiensi (ii)')).toBeInTheDocument();
    expect(screen.getByText('Telah Diremediasi (iii)')).toBeInTheDocument();
    expect(screen.getByText('Periode Tidak Efektif (iv)')).toBeInTheDocument();
    expect(screen.getByText('Nilai Eksposur Defisiensi (v)')).toBeInTheDocument();
    expect(screen.getByText('Kesimpulan Akhir (vi)')).toBeInTheDocument();
    expect(screen.getByText('Akun/Pengungkapan Terdampak (vii)')).toBeInTheDocument();
    expect(screen.getByText('Komponen COSO (viii)')).toBeInTheDocument();
    expect(screen.getByText('Proses Bisnis (ix)')).toBeInTheDocument();
    expect(screen.getByText('Unit Bisnis (x)')).toBeInTheDocument();

    // AS 2201 Decision Tree column headers
    expect(screen.getByText('B1 (xviii)')).toBeInTheDocument();
    expect(screen.getByText('B2 (xix)')).toBeInTheDocument();
    expect(screen.getByText('B3 (xx)')).toBeInTheDocument();
    expect(screen.getByText('B4 (xxi)')).toBeInTheDocument();
    expect(screen.getByText('B5 (xxii)')).toBeInTheDocument();
    expect(screen.getByText('B6 (xxiii)')).toBeInTheDocument();
    expect(screen.getByText('B7 (xxiv)')).toBeInTheDocument();
  });

  it('displays deficiency items and their mapped data rows', () => {
    render(<DoDLampiran10Report deficiencies={mockDeficiencies} controls={mockControls} />);

    // Dual-render: mobile cards (block md:hidden) + desktop table (hidden md:block) both mount in jsdom
    expect(screen.getAllByText('DEF-001')).toHaveLength(2);
    expect(screen.getAllByText('Persetujuan tender di atas ambang batas otorisasi tanpa tanda tangan Direktur.')).toHaveLength(2);
    expect(screen.getAllByText('DEF-002')).toHaveLength(2);
    expect(screen.getAllByText('Selisih perhitungan fisik batu bara tidak diverifikasi tepat waktu.')).toHaveLength(2);

    // Scroll container assertion via closest() so responsive wrapper refactors don't break the suite
    const tableEl = screen.getAllByText('DEF-001')[1].closest('div.overflow-x-auto');
    expect(tableEl).not.toBeNull();

    // Assertion checkmarks rendered
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('filters rows when search query is entered', () => {
    render(<DoDLampiran10Report deficiencies={mockDeficiencies} controls={mockControls} />);

    const searchInput = screen.getByPlaceholderText('Cari referensi...');
    fireEvent.change(searchInput, { target: { value: 'Otorisasi' } });

    expect(screen.getAllByText('DEF-001')).toHaveLength(2);
    expect(screen.queryAllByText('DEF-002')).toHaveLength(0);
  });

  it('renders digital sign-off blocks', () => {
    render(<DoDLampiran10Report deficiencies={mockDeficiencies} controls={mockControls} />);

    expect(screen.getByText('Ketua Tim Audit Internal')).toBeInTheDocument();
    expect(screen.getByText('Ketua Komite Audit')).toBeInTheDocument();
    expect(screen.getAllByText('Tervalidasi Digital Sesuai SK-5/2024')).toHaveLength(2);
  });

  it('exports filtered rows to Excel when Export Excel button is clicked', async () => {
    const mockedExport = vi.mocked(exportRegulatoryTableToExcel);
    mockedExport.mockClear();
    render(<DoDLampiran10Report deficiencies={mockDeficiencies} controls={mockControls} />);

    // Apply MW filter so only DEF-001 remains
    const mwCard = screen.getByRole('button', { name: /Kelemahan Material \(MW\)/i });
    fireEvent.click(mwCard);

    const exportBtn = screen.getByText('Ekspor Excel Lampiran 10');
    fireEvent.click(exportBtn);

    await waitFor(() => expect(mockedExport).toHaveBeenCalledTimes(1));
    const [rows, options] = mockedExport.mock.calls[0] as unknown as [any[], any];
    expect(rows).toHaveLength(1);
    expect(rows[0].ref).toBe('DEF-001');
    expect(rows[0].exposure).toBe(12_500_000_000);
    expect(options.columns).toHaveLength(24);
    expect(options.filename).toContain('Lampiran_10_Kertas_Kerja_DoD_');
    expect(options.filename.endsWith('.xlsx')).toBe(true);
  });

  it('triggers print when Print button is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<DoDLampiran10Report deficiencies={mockDeficiencies} controls={mockControls} />);

    const printBtn = screen.getByText('Cetak Laporan');
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('renders tooltips for assertions and decision tree box headers', () => {
    render(<DoDLampiran10Report deficiencies={mockDeficiencies} controls={mockControls} />);

    // Check assertion acronym triggers
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('E/O')).toBeInTheDocument();
    expect(screen.getByText('CO')).toBeInTheDocument();
    expect(screen.getByText('R&O')).toBeInTheDocument();
    expect(screen.getByText('V/A')).toBeInTheDocument();
    expect(screen.getByText('PD')).toBeInTheDocument();

    // Check decision tree box acronym triggers
    expect(screen.getByText('B1 (xviii)')).toBeInTheDocument();
    expect(screen.getByText('B2 (xix)')).toBeInTheDocument();
    expect(screen.getByText('B3 (xx)')).toBeInTheDocument();
    expect(screen.getByText('B4 (xxi)')).toBeInTheDocument();
    expect(screen.getByText('B5 (xxii)')).toBeInTheDocument();
    expect(screen.getByText('B6 (xxiii)')).toBeInTheDocument();
    expect(screen.getByText('B7 (xxiv)')).toBeInTheDocument();
  });

  it('filters table rows when KPI counter cards are clicked', () => {
    render(<DoDLampiran10Report deficiencies={mockDeficiencies} controls={mockControls} />);

    // Initially both deficiencies DEF-001 (MW) and DEF-002 (CD) are shown in both views
    expect(screen.getAllByText('DEF-001')).toHaveLength(2);
    expect(screen.getAllByText('DEF-002')).toHaveLength(2);

    // Click Material Weakness card
    const mwCard = screen.getByRole('button', { name: /Kelemahan Material \(MW\)/i });
    fireEvent.click(mwCard);

    // Only DEF-001 should remain (both views)
    expect(screen.getAllByText('DEF-001')).toHaveLength(2);
    expect(screen.queryAllByText('DEF-002')).toHaveLength(0);

    // Click Total card to reset filter
    const totalCard = screen.getByRole('button', { name: /Total Evaluasi DoD/i });
    fireEvent.click(totalCard);

    // Both should appear again
    expect(screen.getAllByText('DEF-001')).toHaveLength(2);
    expect(screen.getAllByText('DEF-002')).toHaveLength(2);

    // Click Remediated card
    const remediatedCard = screen.getByRole('button', { name: /Telah Diremediasi/i });
    fireEvent.click(remediatedCard);

    // DEF-002 is remediated, DEF-001 is open
    expect(screen.queryAllByText('DEF-001')).toHaveLength(0);
    expect(screen.getAllByText('DEF-002')).toHaveLength(2);
  });
});
