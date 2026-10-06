import * as React from 'react';
import { toast } from 'sonner';
import { addEdge, MarkerType, useEdgesState, useNodesState } from 'reactflow';
import type { Connection, Edge, Node } from 'reactflow';
import { api } from '@/lib/api-client';
import { useConfirm } from '@/hooks/use-confirm';
import {
  deriveLabelFromId,
  layoutOcrDiagram,
} from '@/utils/ocr-layout';
import type { OcrLayoutWarning, OcrRawEdge, OcrRawNode } from '@/utils/ocr-layout';
import type { TranslateFn } from './ocr-types';

export interface OcrParsedDiagram {
  nodes: OcrRawNode[];
  edges: OcrRawEdge[];
}

interface UseOcrStagingParams {
  isOpen: boolean;
  isDirty?: boolean;
  t: TranslateFn;
  onClose: () => void;
  onApply: (nodes: Node[], edges: Edge[]) => void;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function toStagingNodes(laidOut: ReturnType<typeof layoutOcrDiagram>): Node[] {
  return laidOut.nodes.map((n) => {
    const isSwimlane = n.type === 'swimlane';
    const resolvedDept = n.department?.trim() || n.label?.trim() || deriveLabelFromId(n.id);
    const resolvedLabel = n.label?.trim() || resolvedDept;
    return {
      id: n.id,
      type: n.type,
      position: { x: n.position.x, y: n.position.y },
      parentId: n.parentId,
      width: n.width,
      height: n.height,
      style: isSwimlane ? { width: n.width || 400, height: n.height || 1200 } : undefined,
      zIndex: isSwimlane ? -1 : 10,
      dragHandle: isSwimlane ? '.swimlane-drag-handle' : undefined,
      draggable: true,
      data: isSwimlane
        ? {
            label: resolvedLabel,
            department: resolvedDept,
            function: n.function?.trim() || '',
            isLocked: false,
          }
        : { label: n.label, type: n.type },
    };
  });
}

function toStagingEdges(edges: OcrRawEdge[]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    label: e.label || '',
    type: 'bridge',
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#0f172a' },
    style: { strokeWidth: 2, stroke: '#0f172a' },
  }));
}

function toFallbackNodes(nodes: OcrRawNode[]): Node[] {
  return nodes.map((n) => ({
    id: String(n.id),
    type: String(n.type || 'activity'),
    position: { x: Number(n.position?.x ?? 0), y: Number(n.position?.y ?? 0) },
    parentId: n.parentId,
    style: n.type === 'swimlane' ? { width: n.width || 400, height: n.height || 1000 } : undefined,
    zIndex: n.type === 'swimlane' ? -1 : 10,
    data: { label: n.label || '', type: n.type },
  }));
}

export function useOcrStaging({ isOpen, isDirty, t, onClose, onApply }: UseOcrStagingParams) {
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

  const initializeStagingFromParsed = React.useCallback(
    (parsed: OcrParsedDiagram) => {
      try {
        const result = layoutOcrDiagram(parsed);
        const actionableWarnings = (result.warnings || []).filter((w) => w.code !== 'missing-dims');
        setStagingWarnings(actionableWarnings);
        setWarningsDismissed(false);
        setStagingNodes(toStagingNodes(result));
        setStagingEdges(toStagingEdges(result.edges));
      } catch (err: unknown) {
        setStagingWarnings([{ code: 'unknown-parent', message: errorMessage(err) || 'Layout failed' }]);
        setStagingNodes(toFallbackNodes(parsed.nodes || []));
        setStagingEdges(toStagingEdges(parsed.edges || []));
      }
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

  const handleOcrFileChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setOcrFile(file);

      try {
        setIsProcessingOcr(true);
        let base64Image = '';
        if (file.type === 'application/pdf') {
          const { renderPdfPageToImage } = await import('@/utils/diagram-parser');
          base64Image = await renderPdfPageToImage(file, 1);
        } else {
          const { compressAndScaleImage } = await import('@/utils/diagram-parser');
          base64Image = await compressAndScaleImage(file, 2048);
        }
        setOcrPreviewUrl(base64Image);
      } catch (err: unknown) {
        toast.error(t('bpm:ocr.toast.fileError', { message: errorMessage(err) }));
      } finally {
        setIsProcessingOcr(false);
      }
    },
    [t],
  );

  const handleStartOcr = React.useCallback(async () => {
    if (!ocrPreviewUrl) return;

    try {
      setIsProcessingOcr(true);
      const res = await api<{ nodes: OcrRawNode[]; edges: OcrRawEdge[] }>('/api/bpm-diagrams/ocr', {
        method: 'POST',
        body: JSON.stringify({ image: ocrPreviewUrl }),
      });
      setParsedDiagram(res);
      toast.success(t('bpm:ocr.toast.ocrSuccess'));
    } catch (err: unknown) {
      toast.error(t('bpm:ocr.toast.ocrError', { message: errorMessage(err) }));
    } finally {
      setIsProcessingOcr(false);
    }
  }, [ocrPreviewUrl, t]);

  const resetStaging = React.useCallback(() => {
    setParsedDiagram(null);
    setOcrFile(null);
    setOcrPreviewUrl(null);
    setStagingWarnings([]);
    setWarningsDismissed(false);
  }, []);

  const handleApply = React.useCallback(async () => {
    if (stagingNodes.length === 0 && stagingEdges.length === 0 && !parsedDiagram) return;
    if (isDirty) {
      const ok = await confirm({
        title: t('common:unsavedChanges.title'),
        description: t('bpm:ocr.confirmOverwrite'),
        confirmText: t('common:unsavedChanges.discard'),
        cancelText: t('common:unsavedChanges.stay'),
        variant: 'destructive',
      });
      if (!ok) return;
    }
    onApply(stagingNodes, stagingEdges);
    resetStaging();
    onClose();
  }, [stagingNodes, stagingEdges, parsedDiagram, isDirty, confirm, t, onApply, resetStaging, onClose]);

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
    setWarningsDismissed,
    setStagingRfInstance,
    onStagingNodesChange,
    onStagingEdgesChange,
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
