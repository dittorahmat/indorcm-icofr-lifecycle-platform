import { describe, it, expect } from 'vitest';
import {
  createRegulatoryPdfDoc,
  drawRegulatoryHeader,
  drawSignoffBlock,
  drawRegulatoryTable,
  finalizeRunningHeaderFooter,
} from '../regulatory-pdf-builder';

describe('Regulatory PDF Builder (SK-5 Standards)', () => {
  it('initializes document with standard page dimensions and margins', () => {
    const builder = createRegulatoryPdfDoc({
      orientation: 'landscape',
      format: 'a4',
      companyName: 'PT Batubara Nusantara Sejahtera',
      regulationRef: 'Regulasi BUMN SK-5/DKU.MBU/11/2024',
    });

    expect(builder.doc).toBeDefined();
    expect(builder.pageWidth).toBeGreaterThan(builder.pageHeight);
    expect(builder.margin).toBe(14);
  });

  it('draws regulatory header with company name, title, and lampiran badge', () => {
    const builder = createRegulatoryPdfDoc({
      orientation: 'portrait',
      format: 'a4',
      companyName: 'PT Batubara Nusantara Sejahtera',
    });

    const nextY = drawRegulatoryHeader(builder, {
      lampiranCode: 'LAMPIRAN 11',
      title: 'ASESMEN MANAJEMEN ATAS PENGENDALIAN INTERNAL',
      subTitle: 'Evaluasi Kesimpulan Efektivitas Siklus 2026',
      documentNo: 'DOC/SK5/LAMP11/2026',
      period: 'Tahun Buku 2026',
    });

    expect(nextY).toBeGreaterThan(builder.margin);
    expect(nextY).toBeLessThan(80);
  });

  it('renders signoff block with 3-tier hierarchy (Lini 1, Lini 2, Direksi)', () => {
    const builder = createRegulatoryPdfDoc({
      orientation: 'landscape',
      format: 'a4',
    });

    const endY = drawSignoffBlock(builder, {
      startY: 120,
      signoffs: [
        { roleTitle: 'Disusun Oleh (Lini 1)', name: 'Budi Santoso', title: 'Control Owner', date: '2026-10-27', isSigned: true },
        { roleTitle: 'Ditelaah Oleh (Lini 2)', name: 'Siti Rahma', title: 'Risk Officer', date: '2026-10-27', isSigned: true },
        { roleTitle: 'Disetujui Oleh (Direksi/CFO)', name: 'Hendro Wijaya', title: 'Chief Financial Officer', date: '2026-10-27', isSigned: true },
      ],
    });

    expect(endY).toBeGreaterThan(120);
  });

  it('draws regulatory table with multi-page pagination', () => {
    const builder = createRegulatoryPdfDoc({
      orientation: 'portrait',
      format: 'a4',
    });

    const headers = [
      { key: 'no', title: 'No', width: 15 },
      { key: 'desc', title: 'Deskripsi', width: 100 },
      { key: 'status', title: 'Status', width: 40 },
    ];

    const rows = Array.from({ length: 40 }, (_, i) => ({
      no: `${i + 1}`,
      desc: `Deskripsi temuan atau pengendalian baris ke-${i + 1}`,
      status: i % 2 === 0 ? 'Efektif' : 'Defisiensi',
    }));

    const finalY = drawRegulatoryTable(builder, {
      startY: 50,
      columns: headers,
      rows,
    });

    expect(finalY).toBeGreaterThan(0);
    expect(builder.doc.getNumberOfPages()).toBeGreaterThan(1);
  });

  it('applies running headers, footers and page count to all pages', () => {
    const builder = createRegulatoryPdfDoc({
      orientation: 'portrait',
      format: 'a4',
    });

    builder.doc.addPage();
    builder.doc.addPage();
    expect(builder.doc.getNumberOfPages()).toBe(3);

    finalizeRunningHeaderFooter(builder, {
      documentNo: 'DOC/SK5/TEST',
      lampiranCode: 'LAMPIRAN 7',
    });

    // Verification that finalize completes without throwing
    expect(builder.doc.getNumberOfPages()).toBe(3);
  });
});
