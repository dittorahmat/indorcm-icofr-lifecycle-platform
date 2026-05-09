import { jsPDF } from 'jspdf';
import { ok, bad, notFound } from './utils';

export async function generateCsaPdf(record: any, control: any, samplesData: any[]) {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text('CONTROL SELF-ASSESSMENT (CSA)', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Regulasi BUMN SK-5/DKU.MBU/11/2024 - Lampiran 7', 105, 27, { align: 'center' });

    doc.line(10, 35, 200, 35);

    // Section I: General Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('I. INFORMASI UMUM', 10, 45);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Key Control No: ${control?.code || 'N/A'}`, 15, 52);
    doc.text(`Nama Aktivitas: ${control?.name || 'N/A'}`, 15, 58);
    doc.text(`Periode Pengujian: ${record.period}`, 15, 64);
    doc.text(`Tanggal Asesmen: ${new Date(record.assessmentDate).toLocaleDateString()}`, 15, 70);
    doc.text(`Konfirmasi BPM: ${record.isBpmConfirmed ? 'Ya (Sesuai)' : 'Tidak (Perlu Update)'}`, 15, 76);

    // Personnel Table
    let y = 84;
    doc.setFont('helvetica', 'bold');
    doc.text('Kontak Informasi Pelaksana Pengendalian:', 15, y);
    y += 5;
    doc.rect(15, y, 180, 15);
    doc.line(15, y + 7, 195, y + 7);
    doc.line(105, y, 105, y + 15);
    doc.setFontSize(9);
    doc.text('Nama', 20, y + 5);
    doc.text('Posisi', 110, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(record.assessedBy || 'N/A', 20, y + 12);
    doc.text('Control Owner / Lini 1', 110, y + 12);

    // Section II: Procedure
    y = 105;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('II. PROSEDUR PENGUJIAN', 10, y);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Penentuan & Pengambilan Sampel: ${record.samplingMethodology || '-'}`, 15, y + 8, { maxWidth: 180 });
    doc.text(`Daftar Dokumen: ${record.documentList || '-'}`, 15, y + 15, { maxWidth: 180 });

    y += 25;
    doc.setFont('helvetica', 'bold');
    doc.text('Atribut Pengujian:', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const labels = (control?.attributeQuestions as any) || {
      A: "Tujuan Kontrol Tercapai?",
      B: "Konsisten dengan Kebijakan?",
      C: "Personel Berwenang?",
      D: "Bukti Mencukupi?"
    };

    doc.text(`A: ${labels.A} | B: ${labels.B}`, 15, y + 5);
    doc.text(`C: ${labels.C} | D: ${labels.D}`, 15, y + 10);

    // Section III: Testing Table
    y += 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('III. HASIL PENGUJIAN SAMPEL', 10, y);

    // Table Header
    y += 8;
    doc.setFontSize(8);
    doc.rect(10, y-5, 190, 8, 'S');
    doc.text('No', 12, y);
    doc.text('Referensi Sampel', 22, y);
    doc.text('A', 85, y);
    doc.text('B', 95, y);
    doc.text('C', 105, y);
    doc.text('D', 115, y);
    doc.text('Defisiensi', 125, y);
    doc.text('Keterangan / ITAC Result', 145, y);

    y += 10;
    samplesData.forEach((s: any, i: number) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const hasDeficiency = !(s.attrA && s.attrB && s.attrC && s.attrD);
      doc.text(`${i + 1}`, 12, y);
      doc.text(`${s.sampleRef || '-'}`, 22, y, { maxWidth: 60 });
      doc.text(`${s.attrA ? 'Y' : 'T'}`, 85, y);
      doc.text(`${s.attrB ? 'Y' : 'T'}`, 95, y);
      doc.text(`${s.attrC ? 'Y' : 'T'}`, 105, y);
      doc.text(`${s.attrD ? 'Y' : 'T'}`, 115, y);
      doc.text(`${hasDeficiency ? 'Ya' : 'Tidak'}`, 125, y);

      let remark = s.itacMatch ? 'ITAC: Match' : (s.itacActualResult ? `ITAC: ${s.itacActualResult}` : '-');
      doc.text(remark, 145, y, { maxWidth: 50 });
      y += 8;
    });

    // Section IV: Sign-off
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('IV. KESIMPULAN & SIGN-OFF', 10, y + 10);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Komentar: ${record.comments || 'Tidak ada komentar.'}`, 15, y + 18, { maxWidth: 180 });

    y += 40;
    doc.text('Disertifikasi Oleh (Lini Pertama):', 150, y, { align: 'center' });
    doc.setFontSize(8);
    doc.text('(Digitally Signed via IndoGRC Pro)', 150, y + 5, { align: 'center' });
    doc.text(`Hash: ${record.hash || 'N/A'}`, 150, y + 10, { align: 'center' });

    return doc.output('arraybuffer');
}
