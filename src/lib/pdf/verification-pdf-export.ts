import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { VerificationMatrixItem } from '@/pages/rcm/verification-design-columns';
import {
  createRegulatoryPdfDoc,
  drawRegulatoryHeader,
  drawSignoffBlock,
  drawRegulatoryTable,
  finalizeRunningHeaderFooter,
  DEFAULT_REGULATORY_COMPANY,
} from './regulatory-pdf-builder';

export interface VerificationPdfParams {
  items: VerificationMatrixItem[];
  fiscalYear?: number;
  companyName?: string;
}

export function generateVerificationDesignPdf({
  items,
  fiscalYear = new Date().getFullYear(),
  companyName = DEFAULT_REGULATORY_COMPANY,
}: VerificationPdfParams): jsPDF {
  const builder = createRegulatoryPdfDoc({
    orientation: 'landscape',
    format: 'a4',
    companyName,
  });

  const docNo = `DOC/SK5/VERIF/${fiscalYear}`;
  const periodStr = `Tahun Buku ${fiscalYear} | Total Kontrol Terverifikasi: ${items.length}`;

  let y = drawRegulatoryHeader(builder, {
    lampiranCode: 'LAMPIRAN 8',
    title: 'LEMBAR KERJA VERIFIKASI DESAIN PENGENDALIAN (TOD - 6 PILAR)',
    subTitle: 'Evaluasi Kecukupan Rancang Bangun Pengendalian Internal Sesuai SK-5/DKU.MBU/11/2024',
    documentNo: docNo,
    period: periodStr,
  });

  const columns = [
    { key: 'no', title: 'No', width: 10, align: 'center' as const },
    { key: 'code', title: 'Kode Kontrol', width: 35 },
    { key: 'name', title: 'Nama Kontrol / Aktivitas', width: 75 },
    { key: 'company', title: 'Entitas', width: 45 },
    { key: 'location', title: 'Lokasi', width: 25, align: 'center' as const },
    { key: 'conclusion', title: 'Kesimpulan Desain', width: 35, align: 'center' as const },
    { key: 'notes', title: 'Catatan Evaluasi 6 Pilar', width: 45 },
  ];

  const rows = items.length === 0
    ? [{ no: '1', code: '-', name: 'Tidak ada data verifikasi desain.', company: '-', location: '-', conclusion: '-', notes: '-' }]
    : items.map((item, idx) => ({
        no: String(idx + 1),
        code: item.controlCode || item.controlId || '-',
        name: item.controlName || '-',
        company: item.companyName || '-',
        location: item.locationCode || '-',
        conclusion: item.conclusion === 'Effective' ? 'EFEKTIF' : (item.conclusion || 'DITELAAH'),
        notes: item.comment || `Obj: ${item.pilarObjective || '-'}, Cov: ${item.pilarCoverage || '-'}`,
      }));

  y = drawRegulatoryTable(builder, {
    startY: y,
    columns,
    rows,
    rowHeight: 6.5,
  });

  y += 4;

  const today = format(new Date(), 'dd MMMM yyyy');
  drawSignoffBlock(builder, {
    startY: y,
    signoffs: [
      {
        roleTitle: 'Diverifikasi Oleh (Lini 2 - Evaluator)',
        name: 'Internal Control Specialist',
        title: 'Evaluator Desain Kontrol',
        date: today,
        isSigned: true,
      },
      {
        roleTitle: 'Disetujui Oleh (Lini 2 Lead)',
        name: 'VP Risk & Compliance',
        title: 'Verifikator Regulasi',
        date: today,
        isSigned: true,
      },
    ],
  });

  finalizeRunningHeaderFooter(builder, {
    documentNo: docNo,
    lampiranCode: 'LAMPIRAN 8',
  });

  return builder.doc;
}
