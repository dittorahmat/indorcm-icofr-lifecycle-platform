import { format } from 'date-fns';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { api } from '@/lib/api-client';

interface ExportBpmPdfParams {
  rfInstance: any;
  subProcess: string;
  diagram: any;
  diagramId: string;
  t: (key: string, options?: any) => string;
  onStart: () => void;
  onFinish: () => void;
  onLogExport: (filename: string) => Promise<any>;
}

export async function exportBpmToPdf({
  rfInstance,
  subProcess,
  diagram,
  diagramId,
  t,
  onStart,
  onFinish,
  onLogExport,
}: ExportBpmPdfParams): Promise<void> {
  if (!rfInstance) return;

  const element = document.getElementById('bpm-document-canvas') as HTMLElement;
  if (!element) return;

  onStart();

  try {
    // 1. Force immediate fitView to ensure all nodes are within the diagram div bounds
    rfInstance.fitView({ padding: 0.15, duration: 0 });

    // Wait for React Flow and potential logo images to be ready
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 2. Capture snapshot with FULL scroll dimensions
    const width = element.scrollWidth;
    const height = element.scrollHeight;

    const dataUrl = await toPng(element, {
      backgroundColor: '#ffffff',
      quality: 1.0,
      pixelRatio: 2,
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: 'none',
        margin: '0',
        padding: '0',
      },
    });

    // 3. Prepare PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const imgProps = pdf.getImageProperties(dataUrl);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);

    const pdfWidth = imgProps.width * ratio;
    const pdfHeight = imgProps.height * ratio;

    const xPos = (pageWidth - pdfWidth) / 2;
    const yPos = (pageHeight - pdfHeight) / 2;

    pdf.addImage(dataUrl, 'PNG', xPos, yPos, pdfWidth, pdfHeight, undefined, 'FAST');

    const filename = `BPM_${subProcess.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    pdf.save(filename);

    // 4. Audit Log
    await onLogExport(filename);

    // 5. Global Notification
    if (diagram) {
      await api('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: diagram.organizationId,
          userId: diagram.createdBy,
          message: `BPM Exported: ${filename}`,
          type: 'success',
        }),
      });
    }
  } finally {
    onFinish();
  }
}
