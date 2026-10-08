import * as React from 'react';
import { toast } from 'sonner';
import { addEdge, MarkerType, useEdgesState, useNodesState } from 'reactflow';
import type { Connection, Edge, Node } from 'reactflow';
import { api } from '@/lib/api-client';
import { useConfirm } from '@/hooks/use-confirm';
import { stageRawDiagram } from './ocr-node-normalize';
import type { OcrLayoutWarning, OcrRawEdge, OcrRawNode } from '@/utils/ocr-layout';
import type { OcrAppendDirection, OcrApplyRequest, OcrImportMode, TranslateFn } from './ocr-types';

export interface OcrParsedDiagram {
  nodes: OcrRawNode[];
  edges: OcrRawEdge[];
}

interface UseOcrStagingParams {
  isOpen: boolean;
  isDirty?: boolean;
  hasExistingNodes?: boolean;
  t: TranslateFn;
  onClose: () => void;
  onApply: (request: OcrApplyRequest) => void;
}


function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function useOcrStaging({ isOpen, isDirty, hasExistingNodes = false, t, onClose, onApply }: UseOcrStagingParams) {
  const confirm = useConfirm();
  const [ocrFile, setOcrFile] = React.useState<File | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = React.useState(false);
  const [ocrPreviewUrl, setOcrPreviewUrl] = React.useState<string | null>(null);
  const [parsedDiagram, setParsedDiagram] = React.useState<OcrParsedDiagram | null>(null);
  const [stagingWarnings, setStagingWarnings] = React.useState<OcrLayoutWarning[]>([]);
  const [warningsDismissed, setWarningsDismissed] = React.useState(false);
  const [stagingNodes, setStagingNodes, onStagingNodesChange] = useNodesState([]);
  const [stagingEdges, setStagingEdges, onStagingEdgesChange] = useEdgesState([]);
  const [stagingRfInstance, setStagingRfInstance] = React.useState<{ fitView: (opts?: { padding?: number }) => void } | null>(null);
  const [importMode, setImportMode] = React.useState<OcrImportMode>('overwrite');
  const [appendDirection, setAppendDirection] = React.useState<OcrAppendDirection>('below');

  const initializeStagingFromParsed = React.useCallback(
    (parsed: OcrParsedDiagram) => {
      const result = stageRawDiagram(parsed);
      const actionableWarnings = (result.warnings || []).filter((w) => w.code !== 'missing-dims');
      setStagingWarnings(actionableWarnings);
      setWarningsDismissed(false);
      setStagingNodes(result.nodes);
      setStagingEdges(result.edges);
    },
    [setStagingNodes, setStagingEdges],
  );

  React.useEffect(() => {
    if (parsedDiagram) {
      initializeStagingFromParsed(parsedDiagram);
      setTimeout(() => stagingRfInstance?.fitView?.({ padding: 0.15 }), 100);
    }
  }, [parsedDiagram, initializeStagingFromParsed, stagingRfInstance]);

  React.useEffect(() => {
    if (!isOpen) {
      setStagingWarnings([]);
      setWarningsDismissed(false);
    }
  }, [isOpen]);

  const [ocrPageImages, setOcrPageImages] = React.useState<string[]>([]);
  const [activeReviewPage, setActiveReviewPage] = React.useState<number>(1);
  const [parsedPages, setParsedPages] = React.useState<Map<number, { nodes: Node[]; edges: Edge[] }>>(new Map());
  const [ocrProgressText, setOcrProgressText] = React.useState<string>('');

  const handleOcrFileChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setOcrFile(file);
      setParsedPages(new Map());
      setActiveReviewPage(1);

      try {
        setIsProcessingOcr(true);
        if (file.type === 'application/pdf') {
          const { renderAllPdfPagesToImages } = await import('@/utils/diagram-parser');
          setOcrProgressText(t('bpm:ocr.progress.extractPdf'));
          const images = await renderAllPdfPagesToImages(file, (curr, tot) => {
            setOcrProgressText(t('bpm:ocr.progress.extractPage', { current: curr, total: tot }));
          });
          setOcrPageImages(images);
          setOcrPreviewUrl(images[0] || null);
          if (images.length > 1) {
            setImportMode('new_sheet');
          }
        } else {
          const { compressAndScaleImage } = await import('@/utils/diagram-parser');
          const base64Image = await compressAndScaleImage(file, 2048);
          setOcrPageImages([base64Image]);
          setOcrPreviewUrl(base64Image);
        }
      } catch (err: unknown) {
        toast.error(t('bpm:ocr.toast.fileError', { message: errorMessage(err) }));
      } finally {
        setIsProcessingOcr(false);
        setOcrProgressText('');
      }
    },
    [t],
  );

  const handleStartOcr = React.useCallback(async () => {
    if (ocrPageImages.length === 0) return;

    try {
      setIsProcessingOcr(true);
      const newParsedMap = new Map<number, { nodes: Node[]; edges: Edge[] }>();

      for (let i = 0; i < ocrPageImages.length; i++) {
        const pageNum = i + 1;
        setOcrProgressText(t('bpm:ocr.progress.analyzePage', { current: pageNum, total: ocrPageImages.length }));
        const res = await api<{ nodes: OcrRawNode[]; edges: OcrRawEdge[] }>('/api/bpm-diagrams/ocr', {
          method: 'POST',
          body: JSON.stringify({ image: ocrPageImages[i] }),
        });

        const staged = stageRawDiagram(res);
        newParsedMap.set(pageNum, {
          nodes: staged.nodes,
          edges: staged.edges,
        });

        // Set the primary parsed diagram to page 1 for initial review
        if (pageNum === 1) {
          setParsedDiagram(res);
          setStagingNodes(staged.nodes);
          setStagingEdges(staged.edges);
        }
      }

      setParsedPages(newParsedMap);
      toast.success(
        ocrPageImages.length > 1
          ? t('bpm:ocr.toast.multiPageSuccess', { count: ocrPageImages.length })
          : t('bpm:ocr.toast.ocrSuccess')
      );
    } catch (err: unknown) {
      toast.error(t('bpm:ocr.toast.ocrError', { message: errorMessage(err) }));
    } finally {
      setIsProcessingOcr(false);
      setOcrProgressText('');
    }
  }, [ocrPageImages, t, setStagingNodes, setStagingEdges]);

  // Switch reviewed page within OCR modal
  const handleSelectReviewPage = React.useCallback(
    (targetPage: number) => {
      if (targetPage === activeReviewPage) return;
      // 1. Save changes of current page
      setParsedPages((prev) => {
        const next = new Map(prev);
        next.set(activeReviewPage, { nodes: stagingNodes, edges: stagingEdges });
        return next;
      });

      // 2. Load target page
      const targetData = parsedPages.get(targetPage);
      if (targetData) {
        setStagingNodes(targetData.nodes);
        setStagingEdges(targetData.edges);
      }
      setActiveReviewPage(targetPage);
      setOcrPreviewUrl(ocrPageImages[targetPage - 1] || null);
    },
    [activeReviewPage, stagingNodes, stagingEdges, parsedPages, ocrPageImages, setStagingNodes, setStagingEdges]
  );


  const resetStaging = React.useCallback(() => {
    setParsedDiagram(null);
    setOcrFile(null);
    setOcrPreviewUrl(null);
    setStagingWarnings([]);
    setWarningsDismissed(false);
    setImportMode('overwrite');
    setAppendDirection('below');
  }, []);

  const handleApply = React.useCallback(async () => {
    if (stagingNodes.length === 0 && stagingEdges.length === 0 && !parsedDiagram) return;
    // Only prompt confirmation if overwriting an existing non-empty canvas or when dirty
    if (hasExistingNodes && importMode === 'overwrite' && isDirty) {
      const ok = await confirm({
        title: t('common:unsavedChanges.title'),
        description: t('bpm:ocr.confirmOverwrite'),
        confirmText: t('common:unsavedChanges.discard'),
        cancelText: t('common:unsavedChanges.stay'),
        variant: 'destructive',
      });
      if (!ok) return;
    }

    // Multi-page PDFs fan out to sheets inside the single import adapter,
    // which also flushes the review page under edit and pairs off-page links.
    onApply({
      nodes: stagingNodes,
      edges: stagingEdges,
      mode: importMode,
      direction: appendDirection,
      pages: parsedPages.size > 1 ? parsedPages : undefined,
      activePage: activeReviewPage,
      formatSheetName: (page) => t('bpm:ocr.sheetName', { page }),
    });

    resetStaging();
    onClose();
  }, [stagingNodes, stagingEdges, parsedDiagram, hasExistingNodes, importMode, isDirty, confirm, t, onApply, appendDirection, resetStaging, onClose, parsedPages, activeReviewPage]);


  const updateNodeType = React.useCallback(
    (id: string, type: string) => {
      setStagingNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, type, data: { ...n.data, type } } : n)),
      );
    },
    [setStagingNodes],
  );

  const updateNodeLabel = React.useCallback(
    (id: string, label: string) => {
      setStagingNodes((nds) =>
        nds.map((n) => {
          if (n.id !== id) return n;
          return {
            ...n,
            data: {
              ...n.data,
              label,
              ...(n.type === 'swimlane' ? { department: label } : {}),
            },
          };
        }),
      );
    },
    [setStagingNodes],
  );

  const removeNode = React.useCallback(
    (id: string) => {
      setStagingNodes((nds) => nds.filter((n) => n.id !== id));
    },
    [setStagingNodes],
  );

  const updateEdgeLabel = React.useCallback(
    (id: string, label: string) => {
      setStagingEdges((eds) => eds.map((e) => (e.id === id ? { ...e, label } : e)));
    },
    [setStagingEdges],
  );

  const removeEdge = React.useCallback(
    (id: string) => {
      setStagingEdges((eds) => eds.filter((e) => e.id !== id));
    },
    [setStagingEdges],
  );

  const handleStagingConnect = React.useCallback(
    (params: Connection) => {
      setStagingEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'bridge',
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#0f172a' },
            style: { strokeWidth: 2, stroke: '#0f172a' },
          },
          eds,
        ),
      );
    },
    [setStagingEdges],
  );

  return {
    ocrFile,
    isProcessingOcr,
    ocrPreviewUrl,
    parsedDiagram,
    stagingWarnings,
    warningsDismissed,
    stagingNodes,
    stagingEdges,
    importMode,
    appendDirection,
    setImportMode,
    setAppendDirection,
    setWarningsDismissed,
    setStagingRfInstance,
    onStagingNodesChange,
    onStagingEdgesChange,
    ocrPageImages,
    activeReviewPage,
    parsedPages,
    ocrProgressText,
    handleSelectReviewPage,
    handleOcrFileChange,

    handleStartOcr,
    handleApply,
    resetStaging,
    updateNodeType,
    updateNodeLabel,
    removeNode,
    updateEdgeLabel,
    removeEdge,
    handleStagingConnect,
  };
}

