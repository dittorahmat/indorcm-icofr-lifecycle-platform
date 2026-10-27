import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { CSARecord } from '@shared/types';
import { aggregateCsaControls } from '../csa-excel-export';
import {
  createRegulatoryPdfDoc,
  drawRegulatoryHeader,
  drawSignoffBlock,
  drawRegulatoryTable,
  finalizeRunningHeaderFooter,
} from './regulatory-pdf-builder';

export interface CsaPdfExportParams {
  record: CSARecord;
  mode: 'detailed' | 'summary';
  processName?: string;
  noGL?: string;
  companyName?: string;
}

export function generateCsaLampiran7Pdf({
  record,
  mode,
  processName = 'Proses Bisnis Terkait',
  noGL = '-',
  companyName,
}: CsaPdfExportParams): jsPDF {
  const isDetailed = mode === 'detailed';
  const orientation = isDetailed ? 'landscape' : 'portrait';

  const builder = createRegulatoryPdfDoc({
    orientation,
    format: 'a4',
    companyName,
  });

  const { doc, margin, contentWidth } = builder;
  const lampiranTitle = isDetailed
    ? 'KERTAS KERJA EVALUASI PENGENDALIAN MANDIRI (CSA) - RINCIAN SAMPEL'
    : 'REKAPITULASI EVALUASI PENGENDALIAN MANDIRI (CSA) - RINGKASAN KONTROL';

  const docNo = `APP7A/${isDetailed ? 'DET' : 'SUM'}/${record.id.substring(0, 8).toUpperCase()}`;
  const periodStr = `Periode: ${record.period} | Akun GL: ${noGL}`;

  let y = drawRegulatoryHeader(builder, {
    lampiranCode: 'LAMPIRAN 7A',
    title: lampiranTitle,
    subTitle: `Sub-Proses: ${processName}`,
    documentNo: docNo,
    period: periodStr,
  });

  // Section I: Informasi Umum
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('I. INFORMASI PENGUJIAN & METODOLOGI SAMPLING', margin, y);
  y += 4;

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 14, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 14, margin + contentWidth, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  const evalDate = format(new Date(record.assessmentDate), 'dd MMMM yyyy');
  doc.text(`Pelaksana Asesmen: ${record.assessedBy || '-'}`, margin + 3, y + 4.5);
  doc.text(`Tanggal Pengujian: ${evalDate}`, margin + 80, y + 4.5);
  doc.text(`Kesimpulan: ${record.result || 'Pending'}`, margin + 150, y + 4.5);

  const meth = `Metodologi: ${record.samplingMethodology || 'Sampling atribut operasional'}`;
  doc.text(meth, margin + 3, y + 10, { maxWidth: contentWidth - 6 });

  y += 18;

  // Section II: Tabel Data
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(isDetailed ? 'II. MATRIKS EVALUASI ATRIBUT PENGUJIAN SAMPEL' : 'II. REKAPITULASI EFEKTIVITAS PENGENDALIAN', margin, y);
  y += 3;

  if (isDetailed) {
    const columns = [
      { key: 'no', title: 'No', width: 12, align: 'center' as const },
      { key: 'sampleRef', title: 'Referensi Dokumen / Sampel', width: 60 },
      { key: 'controlCode', title: 'Kode Kontrol', width: 35 },
      { key: 'controlName', title: 'Aktivitas Kontrol', width: 75 },
      { key: 'status', title: 'Hasil Pengujian', width: 30, align: 'center' as const },
      { key: 'evidence', title: 'Bukti Pendukung', width: 55 },
    ];

    const rows: Record<string, string>[] = [];
    let rowIdx = 1;
    (record.samples ?? []).forEach((sample) => {
      const results = sample.controlResults ?? {};
      const entries = Object.entries(results);
      if (entries.length === 0) {
        rows.push({
          no: String(rowIdx++),
          sampleRef: sample.sampleRef,
          controlCode: '-',
          controlName: '-',
          status: 'N/A',
          evidence: '-',
        });
      } else {
        entries.forEach(([cId, res]) => {
          const r = res as { code?: string; controlName?: string; implemented?: boolean; evidenceUrl?: string } | undefined;
          rows.push({
            no: String(rowIdx++),
            sampleRef: sample.sampleRef,
            controlCode: r?.code || cId,
            controlName: r?.controlName || '-',
            status: r?.implemented ? 'LOLOS (PASS)' : 'DEFISIENSI (FAIL)',
            evidence: r?.evidenceUrl ? 'Tersedia (Terverifikasi)' : 'Tidak Ada Bukti',
          });
        });
      }
    });

    y = drawRegulatoryTable(builder, {
      startY: y,
      columns,
      rows,
      rowHeight: 6.5,
    });
  } else {
    const aggregates = aggregateCsaControls(record);
    const columns = [
      { key: 'no', title: 'No', width: 12, align: 'center' as const },
      { key: 'code', title: 'Kode Kontrol', width: 35 },
      { key: 'name', title: 'Nama Kontrol', width: 70 },
      { key: 'total', title: 'Total Sampel', width: 22, align: 'center' as const },
      { key: 'pass', title: 'Lolos', width: 18, align: 'center' as const },
      { key: 'fail', title: 'Gagal', width: 18, align: 'center' as const },
      { key: 'status', title: 'Status Efektivitas', width: 30, align: 'center' as const },
    ];

    const rows = aggregates.map((agg, idx) => ({
      no: String(idx + 1),
      code: agg.id,
      name: agg.name,
      total: String(agg.total),
      pass: String(agg.pass),
      fail: String(agg.fail),
      status: agg.fail === 0 ? 'EFEKTIF' : 'TIDAK EFEKTIF',
    }));

    y = drawRegulatoryTable(builder, {
      startY: y,
      columns,
      rows,
      rowHeight: 6.5,
    });
  }

  y += 4;

  // Section III: Lembar Pengesahan
  drawSignoffBlock(builder, {
    startY: y,
    signoffs: [
      {
        roleTitle: 'Disusun Oleh (Lini 1)',
        name: record.assessedBy || 'Control Owner',
        title: 'Pelaksana Asesmen',
        date: evalDate,
        isSigned: true,
      },
      {
        roleTitle: 'Direviu Oleh (Lini 2)',
        name: 'Risk Management Officer',
        title: 'Verifikator Kepatuhan',
        date: evalDate,
        isSigned: record.line2Status === 'Validated' || !record.isDraft,
      },
    ],
  });

  finalizeRunningHeaderFooter(builder, {
    documentNo: docNo,
    lampiranCode: 'LAMPIRAN 7A',
  });

  return doc;
}
