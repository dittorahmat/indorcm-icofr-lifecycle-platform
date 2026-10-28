import { describe, it, expect, vi } from 'vitest';
import { buildRegulatoryAoA, exportRegulatoryTableToExcel } from '../lib/rcm-excel-export';
import * as XLSX from 'xlsx';

vi.mock('xlsx', () => {
  const sheetMock = {};
  const bookMock = { Sheets: {}, SheetNames: [] as string[] };
  return {
    utils: {
      json_to_sheet: vi.fn(() => sheetMock),
      aoa_to_sheet: vi.fn(() => sheetMock),
      book_new: vi.fn(() => ({ ...bookMock, SheetNames: [] as string[] })),
      book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
  };
});

const columns = [
  { key: 'ref', header: 'Ref. Defisiensi (i)' },
  { key: 'exposure', header: 'Nilai Eksposur (v)', numeric: true },
  { key: 'box1', header: 'Kotak 1 (xviii)' },
];

const options = {
  title: 'LAMPIRAN 10',
  subtitle: 'Kertas Kerja DoD',
  identityLines: ['PT Bukit Asam Tbk', 'Periode 2025'],
  groups: [
    { label: 'Temuan (i - vi)', span: 2 },
    { label: 'Decision Tree (xviii - xxiv)', span: 1 },
  ],
  columns,
  filename: 'Lampiran_10_Kertas_Kerja_DoD_2025.xlsx',
};

describe('Regulatory Excel Export Builder', () => {
  it('builds title, identity, group, header, and data rows in order', () => {
    const aoa = buildRegulatoryAoA(
      [{ ref: 'DEF-001', exposure: 5000000000, box1: 'Ya' }],
      options,
    );

    expect(aoa[0]).toEqual(['LAMPIRAN 10']);
    expect(aoa[1]).toEqual(['Kertas Kerja DoD']);
    expect(aoa[2]).toEqual(['PT Bukit Asam Tbk']);
    expect(aoa[3]).toEqual(['Periode 2025']);
    expect(aoa[4]).toEqual([]);
    expect(aoa[5]).toEqual(['Temuan (i - vi)', '', 'Decision Tree (xviii - xxiv)']);
    expect(aoa[6]).toEqual(['Ref. Defisiensi (i)', 'Nilai Eksposur (v)', 'Kotak 1 (xviii)']);
    expect(aoa[7]).toEqual(['DEF-001', 5000000000, 'Ya']);
    expect(aoa).toHaveLength(8);
  });

  it('keeps numerics as numbers and renders empty cells as dashes', () => {
    const aoa = buildRegulatoryAoA(
      [{ ref: 'DEF-002', exposure: null, box1: '' }],
      options,
    );
    const dataRow = aoa[aoa.length - 1];
    expect(dataRow).toEqual(['DEF-002', '-', '-']);
  });

  it('renders signoff blocks at the bottom when signoffs option is provided', () => {
    const aoa = buildRegulatoryAoA(
      [{ ref: 'DEF-001', exposure: 1000, box1: 'Ya' }],
      {
        ...options,
        signoffs: [
          { roleTitle: 'Disusun Oleh (Lini 1)', name: 'Budi Santoso', title: 'Officer ICOFR', date: '2025-10-15', isSigned: true },
          { roleTitle: 'Direviu Oleh (Lini 2)', name: 'Siti Rahma', title: 'Risk Head', date: '2025-10-16', isSigned: true },
        ],
      },
    );

    expect(aoa).toContainEqual(['Disusun Oleh (Lini 1)', '', 'Direviu Oleh (Lini 2)']);
    expect(aoa).toContainEqual(['Budi Santoso', '', 'Siti Rahma']);
    expect(aoa).toContainEqual(['Officer ICOFR', '', 'Risk Head']);
    expect(aoa).toContainEqual(['Tanggal: 2025-10-15', '', 'Tanggal: 2025-10-16']);
    expect(aoa).toContainEqual(['Status: TERVERIFIKASI DIGITAL', '', 'Status: TERVERIFIKASI DIGITAL']);
  });

  it('still emits headers when there are no data rows', () => {
    const aoa = buildRegulatoryAoA([], options);
    expect(aoa[aoa.length - 1]).toEqual(['Ref. Defisiensi (i)', 'Nilai Eksposur (v)', 'Kotak 1 (xviii)']);
  });

  it('writes exactly one sheet with the requested filename', async () => {
    await exportRegulatoryTableToExcel([{ ref: 'DEF-001', exposure: 1, box1: 'Ya' }], options);

    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledTimes(1);
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(1);
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'Lampiran_10_Kertas_Kerja_DoD_2025.xlsx');
  });
});
