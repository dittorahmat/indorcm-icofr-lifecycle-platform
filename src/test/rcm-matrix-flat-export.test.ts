import { describe, it, expect, vi } from 'vitest';
import { exportRCMToExcel } from '../lib/rcm-excel-export';
import * as XLSX from 'xlsx';

vi.mock('xlsx', () => {
  const sheetMock = {};
  const bookMock = { Sheets: {}, SheetNames: [] };
  return {
    utils: {
      json_to_sheet: vi.fn(() => sheetMock),
      aoa_to_sheet: vi.fn(() => sheetMock),
      book_new: vi.fn(() => ({ ...bookMock })),
      book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
  };
});

describe('RCM Excel Export Utility', () => {
  it('should export TLC matrix data with Parent-Child BPM and assertions correctly', () => {
    const mockTLCData = [
      {
        parentProcessName: 'Pengajuan Kredit Baru',
        parentBpmCode: 'BPM-FIN-01',
        subProcessName: 'Verifikasi Dokumen Debitur',
        fsliName: 'Piutang Pembiayaan',
        noGL: '18544-000318',
        companyName: 'PT Bank Keuangan',
        locationCode: '0101',
        riskDescription: 'Debitur tidak memiliki kemampuan bayar',
        isFraudRelated: true,
        riskRating: 'High',
        controlCode: 'CTL-TLC-01',
        mappedControlName: 'Verifikasi Slip Gaji dan BI Checking',
        mappedControlDescription: 'Petugas memverifikasi penghasilan dan rekam jejak kredit',
        supportingDocs: 'Formulir Aplikasi',
        isKeyControl: true,
        ipoC: 'Y',
        ipoA: 'Y',
        ipoV: 'N',
        ipoRa: 'N',
        assertionE: 'Y',
        assertionC: 'Y',
        assertionA: 'N',
        assertionCo: 'N',
        assertionRo: 'N',
        assertionVa: 'N',
        assertionPd: 'N',
        controlType: 'Preventif',
        controlNature: 'Manual',
        frequency: 'Harian',
        supportingApp: 'Core Banking',
        executingFunction: 'Credit Analyst',
        executorRole: 'Officer',
        affectedFsliItem: 'Piutang',
        effectivePeriod: '2026'
      }
    ];

    exportRCMToExcel(mockTLCData, { matrixType: 'TLC', filename: 'test_tlc.xlsx' });

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(1);
    const generatedRows = (XLSX.utils.json_to_sheet as any).mock.calls[0][0];
    expect(generatedRows).toHaveLength(1);
    expect(generatedRows[0]['Proses Bisnis (Parent)']).toBe('Pengajuan Kredit Baru [BPM-FIN-01]');
    expect(generatedRows[0]['Sub-Proses (Child)']).toBe('Verifikasi Dokumen Debitur');
    expect(generatedRows[0]['Fraud']).toBe('Y');
    expect(generatedRows[0]['Key Control']).toBe('Y');
    expect(generatedRows[0]['IPO - C']).toBe('Y');
    expect(generatedRows[0]['IPO - V']).toBe('N');
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'test_tlc.xlsx');
  });

  it('should export ELC and ITGC matrix data correctly', () => {
    const mockELCData = [
      {
        cosoComponent: 'Control Environment',
        cosoPrinciple: '1. Integrity and Ethical Values',
        code: 'CTL-ELC-01',
        name: 'Code of Conduct Signed Annually',
        isKeyControl: true,
      }
    ];

    exportRCMToExcel(mockELCData, { matrixType: 'ELC', filename: 'test_elc.xlsx' });
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'test_elc.xlsx');

    const mockITGCData = [
      {
        itgcDomain: 'Access to Program & Data',
        parentProcessName: 'Manajemen Akses User',
        subProcessName: 'Review Berkala Hak Akses',
        controlCode: 'CTL-ITGC-01',
        name: 'Periodic User Access Review',
        isKeyControl: true,
      }
    ];

    exportRCMToExcel(mockITGCData, { matrixType: 'ITGC', filename: 'test_itgc.xlsx' });
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'test_itgc.xlsx');
  });

  it('should include title, identity, and signoff blocks when configured', () => {
    const mockTLCData = [
      {
        parentProcessName: 'Pengajuan Kredit Baru',
        subProcessName: 'Verifikasi Dokumen Debitur',
        controlCode: 'CTL-TLC-01',
        mappedControlName: 'Verifikasi Slip Gaji',
      }
    ];

    exportRCMToExcel(mockTLCData, {
      matrixType: 'TLC',
      filename: 'test_tlc_signoff.xlsx',
      identityLines: ['PT Bukit Asam Tbk', 'Periode 2026'],
      signoffs: [
        { roleTitle: 'Pembuat (Lini 1)', name: 'Staff Analis', title: 'Officer', date: '2026-02-01', isSigned: true },
        { roleTitle: 'Pemeriksa (Lini 2)', name: 'Risk Manager', title: 'Manager', date: '2026-02-02', isSigned: true },
      ],
    });

    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
    const calls = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls;
    const generatedAoA = calls[0][0] as unknown[][];
    expect(generatedAoA[0]).toEqual(['LAMPIRAN 5B - RISK AND CONTROL MATRIX (TLC)']);
    const signoffRoleRow = generatedAoA.find((row) => Array.isArray(row) && row[0] === 'Pembuat (Lini 1)');
    expect(signoffRoleRow).toBeDefined();
    expect(signoffRoleRow?.[signoffRoleRow.length - 1]).toBe('Pemeriksa (Lini 2)');
    const signoffNameRow = generatedAoA.find((row) => Array.isArray(row) && row[0] === 'Staff Analis');
    expect(signoffNameRow).toBeDefined();
    expect(signoffNameRow?.[signoffNameRow.length - 1]).toBe('Risk Manager');
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'test_tlc_signoff.xlsx');
  });
});
