import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { Deficiency } from '@shared/types';
import { summarizeEffectiveness } from '@/components/reports/regulatory/lampiran11-helpers';
import { findingRowId, formatExposureValue } from '@/components/reports/regulatory/findings-helpers';
import {
  createRegulatoryPdfDoc,
  drawRegulatoryHeader,
  drawSignoffBlock,
  drawRegulatoryTable,
  finalizeRunningHeaderFooter,
} from './regulatory-pdf-builder';

export interface Lampiran11PdfParams {
  deficiencies: Deficiency[];
  companyName?: string;
  fiscalYear?: number;
  isSigned?: boolean;
}

export function generateLampiran11Pdf({
  deficiencies,
  companyName = 'PT BATUBARA NUSANTARA SEJAHTERA (PERSERO)',
  fiscalYear = new Date().getFullYear(),
  isSigned = false,
}: Lampiran11PdfParams): jsPDF {
  const builder = createRegulatoryPdfDoc({
    orientation: 'portrait',
    format: 'a4',
    companyName,
  });

  const { doc, margin, contentWidth } = builder;
  const { mwCount, sdCount, cdCount, isEffective, significant, aggregateLine } = summarizeEffectiveness(deficiencies);

  const docNo = `DOC/SK5/LAMP11/${fiscalYear}/FINAL`;
  const periodStr = `Tahun Buku ${fiscalYear} | Status: ${isSigned ? 'FINAL & LOCKED' : 'DRAFT'}`;

  let y = drawRegulatoryHeader(builder, {
    lampiranCode: 'LAMPIRAN 11',
    title: 'ASESMEN MANAJEMEN ATAS PENGENDALIAN INTERNAL (ICOFR)',
    subTitle: 'Evaluasi Efektivitas Pelaporan Keuangan Sesuai SK-5/DKU.MBU/11/2024',
    documentNo: docNo,
    period: periodStr,
  });

  // Section I: Pernyataan Kesimpulan Manajemen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('I. KESIMPULAN FORMAL ASESMEN MANAJEMEN', margin, y);
  y += 4;

  const conclusionBg = isEffective ? [236, 253, 245] : [255, 241, 242]; // emerald-50 or rose-50
  doc.setFillColor(conclusionBg[0], conclusionBg[1], conclusionBg[2]);
  doc.rect(margin, y, contentWidth, 20, 'F');
  doc.setDrawColor(isEffective ? 16 : 225, isEffective ? 185 : 29, isEffective ? 129 : 72);
  doc.rect(margin, y, contentWidth, 20, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(isEffective ? 6 : 159, isEffective ? 95 : 18, isEffective ? 70 : 57);
  const conclusionTitle = isEffective
    ? 'KESIMPULAN: PENGENDALIAN INTERNAL ATAS PELAPORAN KEUANGAN ADALAH EFEKTIF'
    : 'KESIMPULAN: PENGENDALIAN INTERNAL ATAS PELAPORAN KEUANGAN TIDAK EFEKTIF';
  doc.text(conclusionTitle, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(aggregateLine, margin + 4, y + 12);
  const detailNote = `Kompensasi Pengendalian: ${mwCount} Kelemahan Material (MW), ${sdCount} Defisiensi Signifikan (SD), ${cdCount} Defisiensi Kontrol (CD).`;
  doc.text(detailNote, margin + 4, y + 16);

  y += 24;

  // Section II: Rekapitulasi Defisiensi Signifikan & Material Weakness
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('II. DAFTAR TEMUAN SIGNIFIKAN & KELEMAHAN MATERIAL (ESKALASI)', margin, y);
  y += 3;

  const columns = [
    { key: 'no', title: 'No', width: 12, align: 'center' as const },
    { key: 'ref', title: 'Ref. Temuan', width: 32 },
    { key: 'desc', title: 'Deskripsi Temuan Defisiensi', width: 68 },
    { key: 'severity', title: 'Tingkat Keparahan', width: 36, align: 'center' as const },
    { key: 'exposure', title: 'Nilai Eksposur', width: 34, align: 'right' as const },
  ];

  const rows = significant.length === 0
    ? [{ no: '1', ref: '-', desc: 'Tidak ada defisiensi signifikan atau kelemahan material pada periode ini.', severity: '-', exposure: '-' }]
    : significant.map((d, idx) => ({
        no: String(idx + 1),
        ref: findingRowId(d, idx),
        desc: d.description || '-',
        severity: d.severity || '-',
        exposure: formatExposureValue(d.exposureValue),
      }));

  y = drawRegulatoryTable(builder, {
    startY: y,
    columns,
    rows,
    rowHeight: 7,
  });

  y += 4;

  // Section III: Lembar Pengesahan Direksi & Lini 2
  const today = format(new Date(), 'dd MMMM yyyy');
  drawSignoffBlock(builder, {
    startY: y,
    signoffs: [
      {
        roleTitle: 'Dievaluasi Oleh (Lini 2 - Risk)',
        name: 'Siti Rahma, M.Ak',
        title: 'VP Internal Control & Risk Governance',
        date: today,
        isSigned: true,
      },
      {
        roleTitle: 'Disetujui Oleh (Direktur Keuangan / CFO)',
        name: 'Hendro Wijaya, S.E., Ak., CA',
        title: 'Chief Financial Officer',
        date: today,
        isSigned,
      },
    ],
  });

  finalizeRunningHeaderFooter(builder, {
    documentNo: docNo,
    lampiranCode: 'LAMPIRAN 11',
  });

  return doc;
}
