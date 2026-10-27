import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { ChangeLog } from '@shared/types';
import type { FindingExportRow } from '@/lib/findings-excel-export';
import { formatExposureValue } from '@/components/reports/regulatory/findings-helpers';
import { changeLogRowMeta } from '@/components/reports/regulatory/changelog-helpers';
import {
  createRegulatoryPdfDoc,
  drawRegulatoryHeader,
  drawSignoffBlock,
  drawRegulatoryTable,
  finalizeRunningHeaderFooter,
  DEFAULT_REGULATORY_COMPANY,
} from './regulatory-pdf-builder';

export interface Lampiran6PdfParams {
  logs: ChangeLog[];
  fiscalYear?: number;
  companyName?: string;
  getUserName?: (id?: string) => string;
}

export interface Lampiran9PdfParams {
  findings: FindingExportRow[];
  fiscalYear?: number;
  companyName?: string;
}

export function generateLampiran6Pdf({
  logs,
  fiscalYear = new Date().getFullYear(),
  companyName = DEFAULT_REGULATORY_COMPANY,
  getUserName,
}: Lampiran6PdfParams): jsPDF {
  const builder = createRegulatoryPdfDoc({
    orientation: 'landscape',
    format: 'a4',
    companyName,
  });

  const docNo = `DOC/SK5/LAMP6/${fiscalYear}`;
  const periodStr = `Tahun Buku ${fiscalYear} | Total Perubahan Regulasi: ${logs.length}`;

  let y = drawRegulatoryHeader(builder, {
    lampiranCode: 'LAMPIRAN 6',
    title: 'FORMULIR CATATAN PERUBAHAN PENGENDALIAN INTERNAL (CHANGE LOG)',
    subTitle: 'Dokumentasi Formal Modifikasi RCM & Kebijakan Sesuai SK-5/DKU.MBU/11/2024',
    documentNo: docNo,
    period: periodStr,
  });

  const columns = [
    { key: 'no', title: 'No (i)', width: 10, align: 'center' as const },
    { key: 'process', title: 'Proses Bisnis (iii)', width: 35 },
    { key: 'subProcess', title: 'Sub-Proses (iv)', width: 35 },
    { key: 'reportDate', title: 'Tgl Laporan (v)', width: 22, align: 'center' as const },
    { key: 'owner', title: 'Pemilik Kontrol (vi)', width: 32 },
    { key: 'descBefore', title: 'Deskripsi Sebelum (vii)', width: 45 },
    { key: 'descAfter', title: 'Deskripsi Setelah (viii)', width: 45 },
    { key: 'refBefore', title: 'Ref Sebelum (ix)', width: 22 },
    { key: 'refAfter', title: 'Ref Setelah (x)', width: 23 },
  ];

  const rows = logs.length === 0
    ? [{ no: '1', process: '-', subProcess: '-', reportDate: '-', owner: '-', descBefore: 'Tidak ada perubahan pengendalian pada periode ini.', descAfter: '-', refBefore: '-', refAfter: '-' }]
    : logs.map((log, idx) => {
        const meta = changeLogRowMeta(log);
        return {
          no: String(idx + 1),
          process: meta.process,
          subProcess: meta.subProcess,
          reportDate: log.timestamp ? format(new Date(log.timestamp), 'dd/MM/yyyy') : '-',
          owner: getUserName ? getUserName(meta.owner) : meta.owner,
          descBefore: meta.descBefore,
          descAfter: meta.descAfter,
          refBefore: meta.refBefore,
          refAfter: meta.refAfter,
        };
      });

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
        roleTitle: 'Diusulkan Oleh (Lini 1)',
        name: 'Process Owner',
        title: 'Pemilik Pengendalian',
        date: today,
        isSigned: true,
      },
      {
        roleTitle: 'Ditelaah Oleh (Lini 2)',
        name: 'Risk Officer',
        title: 'Risk & Compliance',
        date: today,
        isSigned: true,
      },
      {
        roleTitle: 'Disetujui Oleh (Komite / Lini 2 Lead)',
        name: 'Head of Internal Control',
        title: 'Persetujuan Regulasi',
        date: today,
        isSigned: true,
      },
    ],
  });

  finalizeRunningHeaderFooter(builder, {
    documentNo: docNo,
    lampiranCode: 'LAMPIRAN 6',
  });

  return builder.doc;
}

export function generateLampiran9Pdf({
  findings,
  fiscalYear = new Date().getFullYear(),
  companyName = DEFAULT_REGULATORY_COMPANY,
}: Lampiran9PdfParams): jsPDF {
  const builder = createRegulatoryPdfDoc({
    orientation: 'landscape',
    format: 'a4',
    companyName,
  });

  const docNo = `DOC/SK5/LAMP9/${fiscalYear}`;
  const periodStr = `Tahun Buku ${fiscalYear} | Total Temuan Tercatat: ${findings.length}`;

  let y = drawRegulatoryHeader(builder, {
    lampiranCode: 'LAMPIRAN 9',
    title: 'DAFTAR TEMUAN DAN DEFISIENSI PENGENDALIAN INTERNAL (FINDINGS REGISTER)',
    subTitle: 'Registrasi Komprehensif Temuan Pengujian TOD & TOE Sesuai SK-5/DKU.MBU/11/2024',
    documentNo: docNo,
    period: periodStr,
  });

  const columns = [
    { key: 'no', title: 'No', width: 10, align: 'center' as const },
    { key: 'ref', title: 'Ref. Temuan', width: 28 },
    { key: 'desc', title: 'Deskripsi Temuan', width: 68 },
    { key: 'control', title: 'Kontrol Terkait', width: 45 },
    { key: 'severity', title: 'Tingkat Keparahan', width: 32, align: 'center' as const },
    { key: 'exposure', title: 'Nilai Eksposur', width: 28, align: 'right' as const },
    { key: 'source', title: 'Sumber', width: 18, align: 'center' as const },
    { key: 'status', title: 'Status', width: 22, align: 'center' as const },
    { key: 'identifiedDate', title: 'Tgl Temuan', width: 18, align: 'center' as const },
  ];

  const rows = findings.length === 0
    ? [{ no: '1', ref: '-', desc: 'Tidak ada temuan defisiensi pada periode ini.', control: '-', severity: '-', exposure: '-', source: '-', status: '-', identifiedDate: '-' }]
    : findings.map((f, idx) => ({
        no: String(idx + 1),
        ref: f.id || `FIND-${idx + 1}`,
        desc: f.description || '-',
        control: f.controlName || f.controlCode || f.controlId || '-',
        severity: f.severity || '-',
        exposure: formatExposureValue(f.exposureValue),
        source: f.source || '-',
        status: f.status || '-',
        identifiedDate: f.identifiedDate ? format(new Date(f.identifiedDate), 'dd/MM/yy') : '-',
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
        roleTitle: 'Diidentifikasi Oleh (Penguji)',
        name: 'Internal Auditor / Tester',
        title: 'Pelaksana Pengujian',
        date: today,
        isSigned: true,
      },
      {
        roleTitle: 'Divalidasi Oleh (Lini 2)',
        name: 'Risk Officer',
        title: 'Verifikator Kepatuhan',
        date: today,
        isSigned: true,
      },
    ],
  });

  finalizeRunningHeaderFooter(builder, {
    documentNo: docNo,
    lampiranCode: 'LAMPIRAN 9',
  });

  return builder.doc;
}
