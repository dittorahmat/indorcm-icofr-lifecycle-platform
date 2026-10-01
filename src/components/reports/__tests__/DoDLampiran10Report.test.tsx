import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DoDLampiran10Report } from '../DoDLampiran10Report';
import type { Deficiency, Control } from '@shared/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dodReport.title': 'LAMPIRAN 10',
        'dodReport.subtitle': 'ILUSTRASI DOKUMENTASI KERTAS KERJA PENENTUAN TINGKAT DEFISIENSI PENGENDALIAN',
        'dodReport.regulationReference': 'Format Standar Berdasarkan SK-5/DKU.MBU/11/2024',
        'dodReport.exportCsv': 'Ekspor CSV',
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
    assertions: ['Accuracy', 'Completeness', 'Cut-off'],
    compensatingControlIds: [],
    flowchartPath: { 1: true, 2: true, 3: true, 4: true, 5: false, 6: true, 7: false },
    dodWorksheet: {
      deficiencyId: 'DEF-001',
      evaluatedAt: Date.now(),
      exposureValue: 12_500_000_000,
      ineffectivePeriod: 'Q1 - Q4 (12 Bulan)',
      isRemediated: false,
      assertions: ['Accuracy', 'Completeness', 'Cut-off'],
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
    assertions: ['Existence', 'Valuation'],
    compensatingControlIds: ['CTRL-COMP-01'],
    dodWorksheet: {
      deficiencyId: 'DEF-002',
      evaluatedAt: Date.now(),
      exposureValue: 800_000_000,
      ineffectivePeriod: 'Q2 (3 Bulan)',
      isRemediated: true,
      assertions: ['Existence', 'Valuation'],
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
    assertions: ['Existence', 'Valuation'],
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
    expect(screen.getByText('Kelemahan Material (MW)')).toBeInTheDocument();
    expect(screen.getByText('Defisiensi Signifikan (SD)')).toBeInTheDocument();

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

    expect(screen.getByText('DEF-001')).toBeInTheDocument();
    expect(screen.getByText('Persetujuan tender di atas ambang batas otorisasi tanpa tanda tangan Direktur.')).toBeInTheDocument();
    expect(screen.getByText('DEF-002')).toBeInTheDocument();
    expect(screen.getByText('Selisih perhitungan fisik batu bara tidak diverifikasi tepat waktu.')).toBeInTheDocument();

    // Assertion checkmarks rendered
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('filters rows when search query is entered', () => {
    render(<DoDLampiran10Report deficiencies={mockDeficiencies} controls={mockControls} />);

    const searchInput = screen.getByPlaceholderText('Cari referensi...');
    fireEvent.change(searchInput, { target: { value: 'Otorisasi' } });

    expect(screen.getByText('DEF-001')).toBeInTheDocument();
    expect(screen.queryByText('DEF-002')).not.toBeInTheDocument();
  });

  it('renders digital sign-off blocks', () => {
    render(<DoDLampiran10Report deficiencies={mockDeficiencies} controls={mockControls} />);

    expect(screen.getByText('Ketua Tim Audit Internal')).toBeInTheDocument();
    expect(screen.getByText('Ketua Komite Audit')).toBeInTheDocument();
    expect(screen.getAllByText('Tervalidasi Digital Sesuai SK-5/2024')).toHaveLength(2);
  });

  it('triggers CSV download when Export CSV button is clicked', () => {
    render(<DoDLampiran10Report deficiencies={mockDeficiencies} controls={mockControls} />);

    const createObjectURL = vi.fn();
    window.URL.createObjectURL = createObjectURL;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const exportBtn = screen.getByText('Ekspor CSV');
    fireEvent.click(exportBtn);

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
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
});
