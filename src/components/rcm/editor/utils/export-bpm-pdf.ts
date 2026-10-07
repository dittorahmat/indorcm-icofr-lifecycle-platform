import { format } from 'date-fns';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { BPMDiagramSheet } from '../../../../../shared/types/rcm-bpm';

interface ExportBpmPdfParams {
  rfInstance: any;
  subProcess: string;
  diagram: any;
  diagramId: string;
  sheets?: BPMDiagramSheet[];
  t: (key: string, options?: any) => string;
  onStart: () => void;
  onFinish: () => void;
  onLogExport: (filename: string) => Promise<any>;
}

export interface OffPageLinkAnnotation {
  nodeId: string;
  targetPageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates PDF coordinates for off-page reference nodes given container dimensions
 */
export function calculatePdfNodeLinks(
  nodes: any[],
  sheets: BPMDiagramSheet[],
  containerWidth: number,
  containerHeight: number,
  pdfXPos: number,
  pdfYPos: number,
  pdfRenderWidth: number,
  pdfRenderHeight: number
): OffPageLinkAnnotation[] {
  if (!Array.isArray(nodes) || containerWidth <= 0 || containerHeight <= 0) return [];

  const scaleX = pdfRenderWidth / containerWidth;
  const scaleY = pdfRenderHeight / containerHeight;
  const links: OffPageLinkAnnotation[] = [];

  nodes.forEach((node) => {
    if (node.type !== 'off-page-ref') return;
    const targetSheetId = node.data?.targetSheetId || node.data?.targetSheetName;
    if (!targetSheetId) return;

    // Find target page number (1-indexed)
    const targetIdx = sheets.findIndex(
      (s, idx) => s.id === targetSheetId || s.name === targetSheetId || `Sheet ${idx + 1}` === targetSheetId
    );
    if (targetIdx === -1) return;

    const targetPageNumber = targetIdx + 1;
    const nodeX = node.position?.x ?? 0;
    const nodeY = node.position?.y ?? 0;
    const nodeW = node.width ?? 56;
    const nodeH = node.height ?? 56;

    links.push({
      nodeId: node.id,
      targetPageNumber,
      x: pdfXPos + nodeX * scaleX,
      y: pdfYPos + nodeY * scaleY,
      width: nodeW * scaleX,
      height: nodeH * scaleY,
    });
  });

  return links;
}

export async function exportBpmToPdf({
  rfInstance,
  subProcess,
  diagram,
  diagramId,
  sheets,
  t,
  onStart,
  onFinish,
  onLogExport,
}: ExportBpmPdfParams): Promise<void> {
  if (!rfInstance) return;

  const element = document.getElementById('bpm-document-canvas') as HTMLElement;
  if (!element) return;

  onStart();
  const loadingToast = toast.loading(t('bpm:export.preparingPdf', { defaultValue: 'Mempersiapkan dokumen PDF...' }));

  try {
    // 1. Force immediate fitView to ensure all nodes are within bounds
    rfInstance.fitView({ padding: 0.15, duration: 0 });
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 2. Capture canvas snapshot
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

    // 4. Attach internal link annotations if multi-sheet metadata exists
    if (sheets && sheets.length > 1) {
      const currentNodes = rfInstance.getNodes ? rfInstance.getNodes() : [];
      const linkAnnotations = calculatePdfNodeLinks(
        currentNodes,
        sheets,
        width,
        height,
        xPos,
        yPos,
        pdfWidth,
        pdfHeight
      );

      linkAnnotations.forEach((link) => {
        pdf.link(link.x, link.y, link.width, link.height, {
          pageNumber: link.targetPageNumber,
        });
      });
    }

    const filename = `BPM_${subProcess.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    pdf.save(filename);

    toast.success(t('bpm:export.success', { defaultValue: 'Dokumen PDF berhasil diekspor' }), {
      id: loadingToast,
    });

    // 5. Audit Log
    await onLogExport(filename);

    // 6. Global Notification
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
  } catch (err) {
    toast.error(t('bpm:export.error', { defaultValue: 'Gagal mengekspor PDF' }), { id: loadingToast });
    throw err;
  } finally {
    onFinish();
  }
}
