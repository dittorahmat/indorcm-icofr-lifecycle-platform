import { jsPDF } from 'jspdf';

export interface RegulatoryPdfOptions {
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'a3';
  companyName?: string;
  regulationRef?: string;
}

export interface RegulatoryPdfBuilder {
  doc: jsPDF;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  companyName: string;
  regulationRef: string;
}

export interface RegulatoryHeaderOptions {
  lampiranCode: string;
  title: string;
  subTitle?: string;
  documentNo?: string;
  period?: string;
}

export interface SignoffItem {
  roleTitle: string;
  name: string;
  title: string;
  date?: string;
  isSigned?: boolean;
}

export interface SignoffOptions {
  startY: number;
  signoffs: SignoffItem[];
}

export interface TableColumn {
  key: string;
  title: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

export interface TableOptions {
  startY: number;
  columns: TableColumn[];
  rows: Record<string, string | number | boolean | undefined>[];
  rowHeight?: number;
}

export interface RunningOptions {
  documentNo?: string;
  lampiranCode?: string;
}

export const DEFAULT_REGULATORY_COMPANY = 'PT BATUBARA NUSANTARA SEJAHTERA (PERSERO)';
export const DEFAULT_REGULATION_REF = 'STANDAR DOKUMEN REGULASI BUMN SK-5/DKU.MBU/11/2024';

export function createRegulatoryPdfDoc(options: RegulatoryPdfOptions = {}): RegulatoryPdfBuilder {
  const orientation = options.orientation || 'portrait';
  const format = options.format || 'a4';
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  return {
    doc,
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
    companyName: options.companyName || DEFAULT_REGULATORY_COMPANY,
    regulationRef: options.regulationRef || DEFAULT_REGULATION_REF,
  };
}

export function drawRegulatoryHeader(builder: RegulatoryPdfBuilder, opts: RegulatoryHeaderOptions): number {
  const { doc, margin, contentWidth, companyName, regulationRef } = builder;
  let y = margin;

  // Top bar metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(regulationRef.toUpperCase(), margin, y);

  // Lampiran badge (Right aligned)
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(opts.lampiranCode.toUpperCase(), margin + contentWidth, y, { align: 'right' });

  y += 5;
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);

  y += 6;
  // Company Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(companyName.toUpperCase(), margin, y);

  // Document Title
  y += 6;
  doc.setFontSize(13);
  doc.text(opts.title.toUpperCase(), margin, y);

  // Subtitle / Period
  if (opts.subTitle || opts.period) {
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const sub = [opts.subTitle, opts.period].filter(Boolean).join(' | ');
    doc.text(sub, margin, y);
  }

  // Document Number & Controlled Copy Stamp
  if (opts.documentNo) {
    y += 4;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`No. Dokumen: ${opts.documentNo}  [CONTROLLED COPY - AUDIT READY]`, margin, y);
  }

  y += 4;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(margin, y, margin + contentWidth, y);

  return y + 6;
}

export function drawControlledCopyWatermark(builder: RegulatoryPdfBuilder) {
  const { doc, pageWidth, pageHeight } = builder;
  doc.saveGraphicsState();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(40);
  doc.setTextColor(241, 245, 249); // slate-100 very subtle
  doc.text('SK-5 COMPLIANT - INDOGRC', pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 45,
  });
  doc.restoreGraphicsState();
}

export function drawSignoffBlock(builder: RegulatoryPdfBuilder, opts: SignoffOptions): number {
  const { doc, margin, contentWidth, pageHeight } = builder;
  const count = opts.signoffs.length;
  if (count === 0) return opts.startY;

  let y = opts.startY;
  const boxHeight = 28;
  const boxWidth = (contentWidth - (count - 1) * 4) / count;

  if (y + boxHeight > pageHeight - margin - 15) {
    doc.addPage();
    y = margin + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('LEMBAR PENGESAHAN DAN OTORISASI SIKLUS ICOFR', margin, y);
  y += 4;

  opts.signoffs.forEach((sign, idx) => {
    const x = margin + idx * (boxWidth + 4);

    // Box border
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(x, y, boxWidth, boxHeight, 'FD');

    // Role Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(sign.roleTitle, x + 3, y + 5);

    // Digital Signature stamp
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(sign.isSigned ? 16 : 148, sign.isSigned ? 185 : 163, sign.isSigned ? 129 : 184); // emerald or slate
    doc.text(sign.isSigned ? 'TANDA TANGAN DIGITAL TERVERIFIKASI' : 'BELUM DITANDATANGANI', x + 3, y + 14);

    // Name & Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(sign.name, x + 3, y + 21, { maxWidth: boxWidth - 6 });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    const dateStr = sign.date ? `Tanggal: ${sign.date}` : sign.title;
    doc.text(dateStr, x + 3, y + 25, { maxWidth: boxWidth - 6 });
  });

  return y + boxHeight + 6;
}

export function drawRegulatoryTable(builder: RegulatoryPdfBuilder, opts: TableOptions): number {
  const { doc, margin, pageHeight } = builder;
  const rowHeight = opts.rowHeight || 7;
  let y = opts.startY;

  const renderTableHeader = (currentY: number): number => {
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, currentY, builder.contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let currentX = margin;
    opts.columns.forEach((col) => {
      const align = col.align || 'left';
      let textX = currentX + 2;
      if (align === 'center') textX = currentX + col.width / 2;
      if (align === 'right') textX = currentX + col.width - 2;

      doc.text(col.title.toUpperCase(), textX, currentY + 4.5, { align });
      currentX += col.width;
    });

    return currentY + 7;
  };

  y = renderTableHeader(y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  opts.rows.forEach((row, rowIndex) => {
    if (y + rowHeight > pageHeight - margin - 15) {
      doc.addPage();
      y = margin + 10;
      y = renderTableHeader(y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
    }

    // Zebra striping
    if (rowIndex % 2 === 1) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(margin, y, builder.contentWidth, rowHeight, 'F');
    }

    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(margin, y + rowHeight, margin + builder.contentWidth, y + rowHeight);

    doc.setTextColor(15, 23, 42);
    let cellX = margin;
    opts.columns.forEach((col) => {
      const val = row[col.key] !== undefined ? String(row[col.key]) : '-';
      const align = col.align || 'left';
      let textX = cellX + 2;
      if (align === 'center') textX = cellX + col.width / 2;
      if (align === 'right') textX = cellX + col.width - 2;

      doc.text(val, textX, y + rowHeight / 2 + 1.2, { align, maxWidth: col.width - 4 });
      cellX += col.width;
    });

    y += rowHeight;
  });

  return y + 4;
}

export function finalizeRunningHeaderFooter(builder: RegulatoryPdfBuilder, opts: RunningOptions = {}) {
  const { doc, margin, pageHeight, contentWidth } = builder;
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running Header (from page 2 onwards)
    if (i > 1 && opts.lampiranCode) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(opts.lampiranCode.toUpperCase(), margin, margin - 4);
      if (opts.documentNo) {
        doc.text(opts.documentNo, margin + contentWidth, margin - 4, { align: 'right' });
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, margin - 2, margin + contentWidth, margin - 2);
    }

    // Running Footer (on all pages)
    const footerY = pageHeight - margin + 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY - 2, margin + contentWidth, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('IndoGRC Pro - Platform Siklus ICOFR Terpadu BUMN', margin, footerY + 2);

    const pageStr = `Halaman ${i} dari ${totalPages}`;
    doc.text(pageStr, margin + contentWidth, footerY + 2, { align: 'right' });
  }
}
