import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

interface CsaRecordInput {
  id?: string | null;
  controlId?: string | null;
  period?: string | null;
  assessmentDate?: string | number | Date | null;
  isBpmConfirmed?: boolean | null;
  assessedBy?: string | null;
  samplingMethodology?: string | null;
  documentList?: string | null;
  comments?: string | null;
  hash?: string | null;
  result?: string | null;
}

interface ControlInput {
  code?: string;
  name?: string;
  description?: string | null;
}

interface ProcessControlInput {
  code?: string;
  name?: string;
  description?: string | null;
}

interface SampleInput {
  sampleRef?: string | null;
  attrA?: boolean | null;
  attrB?: boolean | null;
  attrC?: boolean | null;
  attrD?: boolean | null;
  itacMatch?: boolean | null;
  itacActualResult?: string | null;
}

export async function generateCsaPdf(
  record: CsaRecordInput,
  control: ControlInput | undefined,
  samplesData: SampleInput[],
  processControls?: ProcessControlInput[]
): Promise<ArrayBuffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 14;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  // Header formal SK-5
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('STANDAR DOKUMEN REGULASI BUMN SK-5/DKU.MBU/11/2024', margin, y);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('LAMPIRAN 7', margin + contentWidth, y, { align: 'right' });

  y += 5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('PT BATUBARA NUSANTARA SEJAHTERA (PERSERO)', margin, y);

  y += 6;
  doc.setFontSize(13);
  doc.text('KERTAS KERJA EVALUASI PENGENDALIAN MANDIRI (CSA)', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const scopeLabel = record.controlId ? 'Kontrol' : 'Proses';
  doc.text(`Periode: ${record.period || '2026'} | ${scopeLabel}: ${control?.code || 'N/A'} - ${control?.name || '-'}`, margin, y);

  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`No. Dokumen: APP7/REC/${record.id ? record.id.substring(0, 8).toUpperCase() : 'EXPORT'}  [CONTROLLED COPY - AUDIT READY]`, margin, y);

  y += 4;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(margin, y, margin + contentWidth, y);

  y += 7;

  // Section I: Informasi Umum
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('I. INFORMASI PENGUJIAN & PELAKSANA KONTROL', margin, y);
  y += 4;

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 18, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 18, margin + contentWidth, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  const evalDate = record.assessmentDate ? format(new Date(record.assessmentDate), 'dd MMMM yyyy') : '-';
  doc.text(`Pelaksana Asesmen: ${record.assessedBy || 'Control Owner / Lini 1'}`, margin + 3, y + 5);
  doc.text(`Tanggal Asesmen: ${evalDate}`, margin + 80, y + 5);
  doc.text(`Konfirmasi BPM: ${record.isBpmConfirmed ? 'Ya (Sesuai)' : 'Tidak'}`, margin + 140, y + 5);

  const meth = `Metodologi: ${record.samplingMethodology || 'Sampling atribut berbasis transaksi operasional'}`;
  doc.text(meth, margin + 3, y + 10, { maxWidth: contentWidth - 6 });

  const docs = `Daftar Dokumen: ${record.documentList || 'SOP, Berita Acara Rekonsiliasi, Log Transaksi ERP'}`;
  doc.text(docs, margin + 3, y + 15, { maxWidth: contentWidth - 6 });

  if (processControls && processControls.length > 0) {
    const ctrlList = `Lingkup Kontrol Terkait: ${processControls.map((pc) => pc.code ? `${pc.code} (${pc.name || '-'})` : (pc.name || '-')).join(', ')}`;
    doc.text(ctrlList, margin + 3, y + 19, { maxWidth: contentWidth - 6 });
  }

  y += processControls && processControls.length > 0 ? 28 : 24;

  // Section II: Tabel Sampel & Atribut IPO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('II. HASIL PENGUJIAN ATRIBUT SAMPEL (IPO A, B, C, D)', margin, y);
  y += 4;

  // Table header
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  doc.text('NO', margin + 2, y + 4.5);
  doc.text('REFERENSI SAMPEL', margin + 12, y + 4.5);
  doc.text('A (VAL)', margin + 70, y + 4.5, { align: 'center' });
  doc.text('B (ACC)', margin + 88, y + 4.5, { align: 'center' });
  doc.text('C (AUT)', margin + 106, y + 4.5, { align: 'center' });
  doc.text('D (EVI)', margin + 124, y + 4.5, { align: 'center' });
  doc.text('DEFISIENSI?', margin + 145, y + 4.5, { align: 'center' });
  doc.text('STATUS ITAC / KET', margin + 162, y + 4.5);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  samplesData.forEach((s, i) => {
    if (y > 250) {
      doc.addPage();
      y = margin + 10;
    }

    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 6.5, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 6.5, margin + contentWidth, y + 6.5);

    const hasDeficiency = !(s.attrA && s.attrB && s.attrC && s.attrD);
    doc.setTextColor(15, 23, 42);

    doc.text(String(i + 1), margin + 2, y + 4.5);
    doc.text(s.sampleRef || '-', margin + 12, y + 4.5, { maxWidth: 54 });
    doc.text(s.attrA ? 'Y' : 'T', margin + 70, y + 4.5, { align: 'center' });
    doc.text(s.attrB ? 'Y' : 'T', margin + 88, y + 4.5, { align: 'center' });
    doc.text(s.attrC ? 'Y' : 'T', margin + 106, y + 4.5, { align: 'center' });
    doc.text(s.attrD ? 'Y' : 'T', margin + 124, y + 4.5, { align: 'center' });

    doc.setTextColor(hasDeficiency ? 225 : 16, hasDeficiency ? 29 : 185, hasDeficiency ? 72 : 129);
    doc.text(hasDeficiency ? 'YA' : 'TIDAK', margin + 145, y + 4.5, { align: 'center' });

    doc.setTextColor(71, 85, 105);
    const remark = s.itacMatch ? 'ITAC: Match' : (s.itacActualResult ? `ITAC: ${s.itacActualResult}` : 'OK');
    doc.text(remark, margin + 162, y + 4.5, { maxWidth: contentWidth - 164 });

    y += 6.5;
  });

  y += 6;

  // Section III: Lembar Pengesahan
  if (y > 230) {
    doc.addPage();
    y = margin + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('III. SIMPULAN & LEMBAR PENGESAHAN DIGITAL', margin, y);
  y += 4;

  const boxWidth = (contentWidth - 4) / 2;
  const boxHeight = 26;

  // Lini 1
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, boxWidth, boxHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Disusun Oleh (Lini 1 - Control Owner)', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(16, 185, 129);
  doc.text('TANDA TANGAN DIGITAL TERVERIFIKASI', margin + 3, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(record.assessedBy || 'Control Owner', margin + 3, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Hash: ${record.hash ? record.hash.substring(0, 16) : 'VERIFIED'}`, margin + 3, y + 23);

  // Lini 2
  const x2 = margin + boxWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.rect(x2, y, boxWidth, boxHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Divalidasi Oleh (Lini 2 - Risk Governance)', x2 + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(16, 185, 129);
  doc.text('DISETUJUI & TERTELAAH SIKLUS ICOFR', x2 + 3, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Risk Management Officer', x2 + 3, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tanggal: ${evalDate}`, x2 + 3, y + 23);

  // Running Footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const footerY = doc.internal.pageSize.getHeight() - margin + 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY - 2, margin + contentWidth, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('IndoGRC Pro - Platform Siklus ICOFR Terpadu BUMN (SK-5 Compliance)', margin, footerY + 2);
    doc.text(`Halaman ${p} dari ${totalPages}`, margin + contentWidth, footerY + 2, { align: 'right' });
  }

  return doc.output('arraybuffer');
}
