import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { FormattedDoDRow } from '@/components/reports/dod/dod-types';
import { formatExposureValue } from '@/components/reports/regulatory/findings-helpers';
import {
  createRegulatoryPdfDoc,
  drawRegulatoryHeader,
  drawSignoffBlock,
  drawRegulatoryTable,
  finalizeRunningHeaderFooter,
} from './regulatory-pdf-builder';

export interface Lampiran10DoDPdfParams {
  rows: FormattedDoDRow[];
  fiscalYear?: number;
  companyName?: string;
}

export function generateLampiran10DoDPdf({
  rows,
  fiscalYear = new Date().getFullYear(),
  companyName = 'PT BATUBARA NUSANTARA SEJAHTERA (PERSERO)',
}: Lampiran10DoDPdfParams): jsPDF {
  const builder = createRegulatoryPdfDoc({
    orientation: 'landscape',
    format: 'a4',
    companyName,
  });

  const { doc, margin, contentWidth } = builder;
  const docNo = `DOC/SK5/LAMP10/${fiscalYear}`;
  const periodStr = `Tahun Buku ${fiscalYear} | Total Temuan Dievaluasi: ${rows.length}`;

  let y = drawRegulatoryHeader(builder, {
    lampiranCode: 'LAMPIRAN 10',
    title: 'KERTAS KERJA PENENTUAN TINGKAT KEPARAHAN DEFISIENSI (DEGREE OF DEFICIENCY / DOD)',
    subTitle: 'Evaluasi Agregat Defisiensi Pengendalian Sesuai Regulasi SK-5/DKU.MBU/11/2024',
    documentNo: docNo,
    period: periodStr,
  });

  // Summary Metrics Banner
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 10, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 10, margin + contentWidth, y + 10);

  const mwCount = rows.filter((r) => r.severity === 'Material Weakness').length;
  const sdCount = rows.filter((r) => r.severity === 'Significant Deficiency').length;
  const cdCount = rows.filter((r) => r.severity === 'Control Deficiency').length;
  const remCount = rows.filter((r) => r.isRemediated).length;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`REKAPITULASI DOD:  Kelemahan Material (MW): ${mwCount}  |  Defisiensi Signifikan (SD): ${sdCount}  |  Defisiensi Kontrol (CD): ${cdCount}  |  Teremediasi: ${remCount}`, margin + 4, y + 6.5);

  y += 14;

  const columns = [
    { key: 'no', title: 'No', width: 10, align: 'center' as const },
    { key: 'ref', title: 'Ref. Temuan', width: 28 },
    { key: 'desc', title: 'Deskripsi Defisiensi', width: 62 },
    { key: 'account', title: 'Akun Terdampak', width: 35 },
    { key: 'process', title: 'Proses Bisnis', width: 35 },
    { key: 'period', title: 'Periode Inefektif', width: 25, align: 'center' as const },
    { key: 'exposure', title: 'Nilai Eksposur', width: 30, align: 'right' as const },
    { key: 'severity', title: 'Tingkat (DoD)', width: 35, align: 'center' as const },
    { key: 'remediated', title: 'Remediasi?', width: 20, align: 'center' as const },
  ];

  const tableRows = rows.length === 0
    ? [{ no: '1', ref: '-', desc: 'Tidak ada baris defisiensi yang dievaluasi.', account: '-', process: '-', period: '-', exposure: '-', severity: '-', remediated: '-' }]
    : rows.map((r, idx) => ({
        no: String(idx + 1),
        ref: r.ref,
        desc: r.description,
        account: r.impactedAccount || '-',
        process: r.businessProcess || '-',
        period: r.ineffectivePeriod || '-',
        exposure: formatExposureValue(r.exposureValue),
        severity: r.severity,
        remediated: r.isRemediated ? 'Ya' : 'Tidak',
      }));

  y = drawRegulatoryTable(builder, {
    startY: y,
    columns,
    rows: tableRows,
    rowHeight: 6.5,
  });

  y += 4;

  const today = format(new Date(), 'dd MMMM yyyy');
  drawSignoffBlock(builder, {
    startY: y,
    signoffs: [
      {
        roleTitle: 'Dievaluasi Oleh (Tim Evaluator DoD)',
        name: 'Internal Control Specialist',
        title: 'Evaluator Kepatuhan',
        date: today,
        isSigned: true,
      },
      {
        roleTitle: 'Ditelaah Oleh (Lini 2 - Risk)',
        name: 'VP Risk Management',
        title: 'Risk Officer',
        date: today,
        isSigned: true,
      },
      {
        roleTitle: 'Disahkan Oleh (Direksi/CFO)',
        name: 'Chief Financial Officer',
        title: 'Komite Audit & Direksi',
        date: today,
        isSigned: true,
      },
    ],
  });

  finalizeRunningHeaderFooter(builder, {
    documentNo: docNo,
    lampiranCode: 'LAMPIRAN 10',
  });

  return doc;
}
