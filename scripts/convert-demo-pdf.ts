import fs from 'node:fs';
import path from 'node:path';
import { jsPDF } from 'jspdf';

const mdPath = path.resolve(process.cwd(), 'docs/DEMO_SCENARIO_E2E.md');
const pdfPath = path.resolve(process.cwd(), 'docs/DEMO_SCENARIO_E2E.pdf');

const content = fs.readFileSync(mdPath, 'utf8');
const lines = content.split('\n');

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
});

const pageWidth = 210;
const pageHeight = 297;
const margin = 15;
const maxWidth = pageWidth - (margin * 2);

let y = margin;

const checkPageBreak = (neededHeight: number) => {
  if (y + neededHeight > pageHeight - margin) {
    doc.addPage();
    y = margin;
  }
};

for (const rawLine of lines) {
  const line = rawLine.trimEnd();

  if (line.startsWith('# ')) {
    checkPageBreak(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(line.replace('# ', ''), margin, y);
    y += 8;
  } else if (line.startsWith('## ')) {
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(line.replace('## ', ''), margin, y);
    y += 7;
  } else if (line.startsWith('### ')) {
    checkPageBreak(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(line.replace('### ', ''), margin, y);
    y += 6;
  } else if (line.startsWith('---')) {
    checkPageBreak(6);
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  } else if (line.startsWith('|')) {
    // Table line: render cleanly as monospace compact text
    checkPageBreak(5);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(line, margin, y);
    y += 4.5;
  } else if (line.startsWith('* ') || line.startsWith('- ')) {
    const bulletText = line.replace(/^[*\\-]\\s+/, '');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const wrapped = doc.splitTextToSize(`• ${bulletText}`, maxWidth);
    checkPageBreak(wrapped.length * 4.5);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 4.5;
  } else if (line.trim() === '') {
    y += 2.5;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const wrapped = doc.splitTextToSize(line, maxWidth);
    checkPageBreak(wrapped.length * 4.5);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 4.5;
  }
}

// Add page numbering footer
const totalPages = doc.getNumberOfPages();
for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `IndoGRC Pro — ICOFR Lifecycle Demo Playbook (Regulation SK-5/DKU.MBU/11/2024) | Halaman ${i} dari ${totalPages}`,
    margin,
    pageHeight - 8
  );
}

const buffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(pdfPath, buffer);
console.log(`✅ PDF generated successfully: ${pdfPath} (${buffer.length} bytes, ${totalPages} pages)`);
