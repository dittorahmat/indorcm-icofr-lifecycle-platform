import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  addEdge,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload, RefreshCw, AlertTriangle, X, Trash2 } from 'lucide-react';
import { layoutOcrDiagram, deriveLabelFromId, type OcrLayoutWarning } from '@/utils/ocr-layout';
import { useConfirm } from '@/hooks/use-confirm';

interface BPMOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (nodes: any[], edges: any[]) => void;
  nodeTypes: any;
  edgeTypes: any;
  isDirty?: boolean;
}

export const BPMOcrModal: React.FC<BPMOcrModalProps> = ({
  isOpen,
  onClose,
  onApply,
  nodeTypes,
  edgeTypes,
  isDirty,
}) => {
  const { t } = useTranslation(['bpm', 'common']);
  const confirm = useConfirm();
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [parsedDiagram, setParsedDiagram] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [stagingWarnings, setStagingWarnings] = useState<OcrLayoutWarning[]>([]);
  const [warningsDismissed, setWarningsDismissed] = useState(false);
  const [stagingNodes, setStagingNodes, onStagingNodesChange] = useNodesState([]);
  const [stagingEdges, setStagingEdges, onStagingEdgesChange] = useEdgesState([]);
  const [stagingRfInstance, setStagingRfInstance] = useState<any>(null);

  const initializeStagingFromParsed = useCallback((parsed: { nodes: any[]; edges: any[] }) => {
    try {
      const result = layoutOcrDiagram(parsed);
      const actionableWarnings = (result.warnings || []).filter((w) => w.code !== 'missing-dims');
      setStagingWarnings(actionableWarnings);
      setWarningsDismissed(false);
      const rfNodes = result.nodes.map((n) => {
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
      const rfEdges = result.edges.map((e) => ({
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
      setStagingNodes(rfNodes);
      setStagingEdges(rfEdges);
    } catch (err: any) {
      setStagingWarnings([{ code: 'unknown-parent', message: err?.message || 'Layout failed' }]);
      setStagingNodes(
        (parsed.nodes || []).map((n: any) => ({
          id: String(n.id),
          type: String(n.type || 'activity'),
          position: { x: Number(n.position?.x ?? 0), y: Number(n.position?.y ?? 0) },
          parentId: n.parentId,
          style: n.type === 'swimlane' ? { width: n.width || 400, height: n.height || 1000 } : undefined,
          zIndex: n.type === 'swimlane' ? -1 : 10,
          data: { label: n.label || '', type: n.type },
        }))
      );
      setStagingEdges(
        (parsed.edges || []).map((e: any) => ({
          id: String(e.id),
          source: String(e.source),
          target: String(e.target),
          label: e.label || '',
          type: 'bridge',
          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#0f172a' },
          style: { strokeWidth: 2, stroke: '#0f172a' },
        }))
      );
    }
  }, [setStagingNodes, setStagingEdges]);

  useEffect(() => {
    if (parsedDiagram) {
      initializeStagingFromParsed(parsedDiagram);
      setTimeout(() => stagingRfInstance?.fitView?.({ padding: 0.15 }), 100);
    }
  }, [parsedDiagram, initializeStagingFromParsed, stagingRfInstance]);

  useEffect(() => {
    if (!isOpen) {
      setStagingWarnings([]);
      setWarningsDismissed(false);
    }
  }, [isOpen]);

  const handleOcrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    } catch (err: any) {
      toast.error(t('bpm:ocr.toast.fileError', { message: err.message }));
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleStartOcr = async () => {
    if (!ocrPreviewUrl) return;

    try {
      setIsProcessingOcr(true);
      const res = await api<{ nodes: any[]; edges: any[] }>('/api/bpm-diagrams/ocr', {
        method: 'POST',
        body: JSON.stringify({ image: ocrPreviewUrl }),
      });
      setParsedDiagram(res);
      toast.success(t('bpm:ocr.toast.ocrSuccess'));
    } catch (err: any) {
      toast.error(t('bpm:ocr.toast.ocrError', { message: err.message }));
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleApply = async () => {
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
    setParsedDiagram(null);
    setOcrFile(null);
    setOcrPreviewUrl(null);
    setStagingWarnings([]);
    setWarningsDismissed(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessingOcr && (!open ? onClose() : undefined)}>
      <DialogContent className={cn('max-w-md transition-all duration-300', parsedDiagram && 'max-w-6xl')}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Upload className="h-5 w-5 text-emerald-600" />
            {parsedDiagram ? t('bpm:ocr.reviewTitle') : t('bpm:ocr.importTitle')}
          </DialogTitle>
        </DialogHeader>

        {parsedDiagram ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 lg:h-[640px] mt-4">
            {/* Left Column: Source image preview */}
            <div className="border border-border rounded-xl overflow-hidden bg-muted/30 flex flex-col p-3 gap-3 min-h-[280px] lg:min-h-0">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t('bpm:ocr.originalImage')}
              </span>
              <div className="flex-1 flex items-center justify-center rounded-lg border border-border bg-white p-2 overflow-hidden">
                <img
                  src={ocrPreviewUrl || ''}
                  className="max-h-full max-w-full object-contain shadow-sm rounded-lg"
                  alt="Source Diagram"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('bpm:ocr.staging.thumbnailHint')}</p>
            </div>

            {/* Right Column: staging mini-canvas + edge list + node edits */}
            <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center flex-wrap gap-2">
                <span className="text-xs font-black text-foreground uppercase tracking-wider">
                  {t('bpm:ocr.shapeDetection')}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {t('bpm:ocr.nodesCount', { count: stagingNodes.length })} •{' '}
                  {t('bpm:ocr.edgesCount', { count: stagingEdges.length })}
                </span>
              </div>

              {stagingWarnings.length > 0 && !warningsDismissed && (
                <div className="mx-3 mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest">{t('bpm:ocr.warnings.title')}</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {stagingWarnings.map((w, idx) => (
                        <li key={`${w.code}-${idx}`} className="text-xs leading-snug">
                          {w.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => setWarningsDismissed(true)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              <div className="h-[230px] border-b border-border relative bg-white mt-3 mx-3 rounded-lg overflow-hidden shrink-0">
                <ReactFlow
                  nodes={stagingNodes}
                  edges={stagingEdges}
                  onNodesChange={onStagingNodesChange}
                  onEdgesChange={onStagingEdgesChange}
                  onNodesDelete={(deleted) => {
                    const ids = new Set(deleted.map((d) => d.id));
                    setStagingNodes((nds) => nds.filter((n) => !ids.has(n.id)));
                  }}
                  onEdgesDelete={(deleted) => {
                    const ids = new Set(deleted.map((d) => d.id));
                    setStagingEdges((eds) => eds.filter((e) => !ids.has(e.id)));
                  }}
                  onConnect={(params) =>
                    setStagingEdges((eds) =>
                      addEdge(
                        {
                          ...params,
                          type: 'bridge',
                          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#0f172a' },
                          style: { strokeWidth: 2, stroke: '#0f172a' },
                        },
                        eds
                      )
                    )
                  }
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  fitView
                  onInit={(instance) => {
                    setStagingRfInstance(instance);
                    setTimeout(() => instance.fitView({ padding: 0.15 }), 100);
                  }}
                  className="bg-white"
                >
                  <Background variant={BackgroundVariant.Dots} gap={16} color="hsl(var(--muted))" />
                  <Controls className="scale-75" />
                </ReactFlow>
                <p className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-border bg-white/90 px-2 py-0.5 text-xs text-muted-foreground shadow-sm">
                  {t('bpm:ocr.staging.canvasHint')}
                </p>
              </div>

              {/* Tabbed Inspector: Elements vs Connections */}
              <Tabs defaultValue="elements" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="px-3 pt-2 pb-0 border-b border-border bg-muted/10 shrink-0">
                  <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-8">
                    <TabsTrigger value="elements" className="text-xs">
                      {t('bpm:ocr.tabs.elements')} ({stagingNodes.length})
                    </TabsTrigger>
                    <TabsTrigger value="connections" className="text-xs">
                      {t('bpm:ocr.tabs.connections')} ({stagingEdges.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent
                  value="elements"
                  className="flex-1 min-h-0 m-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
                    <p className="text-xs text-muted-foreground">{t('bpm:ocr.adjustmentInstructions')}</p>
                    <div className="space-y-3">
                      {stagingNodes.map((node) => {
                        let shapeName = t('bpm:ocr.shapes.activity');
                        let iconBg = 'bg-slate-50 border-slate-300 text-slate-700 rounded-md';
                        if (node.type === 'start') {
                          shapeName = t('bpm:ocr.shapes.start');
                          iconBg = 'bg-emerald-50 border-emerald-300 text-emerald-700 rounded-full';
                        } else if (node.type === 'end') {
                          shapeName = t('bpm:ocr.shapes.end');
                          iconBg = 'bg-rose-50 border-rose-300 text-rose-700 rounded-full';
                        } else if (node.type === 'automated-activity') {
                          shapeName = t('bpm:ocr.shapes.system');
                          iconBg = 'bg-blue-50 border-blue-300 text-blue-700 rounded-md';
                        } else if (node.type === 'decision') {
                          shapeName = t('bpm:ocr.shapes.decision');
                          iconBg = 'bg-amber-50 border-amber-300 text-amber-700 rotate-45 transform w-7 h-7';
                        } else if (node.type === 'archive') {
                          shapeName = t('bpm:ocr.shapes.archive');
                          iconBg =
                            'bg-slate-50 border-slate-800 text-slate-700 [clip-path:polygon(0%_0%,100%_0%,50%_100%)] w-8 h-8';
                        } else if (node.type === 'data-media') {
                          shapeName = t('bpm:ocr.shapes.dataMedia');
                          iconBg = 'bg-sky-50 border-sky-300 text-sky-700 rounded-t-lg rounded-b-lg';
                        } else if (node.type === 'document') {
                          shapeName = t('bpm:ocr.shapes.document');
                          iconBg = 'bg-slate-50 border-slate-400 text-slate-600 rounded-b-xl';
                        } else if (node.type === 'alternate-process') {
                          shapeName = t('bpm:ocr.shapes.alternateProcess');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700 rounded-lg';
                        } else if (node.type === 'data') {
                          shapeName = t('bpm:ocr.shapes.data');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700 rounded-sm';
                        } else if (node.type === 'predefined-process') {
                          shapeName = t('bpm:ocr.shapes.predefinedProcess');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700 border-l-4 border-r-4';
                        } else if (node.type === 'internal-storage') {
                          shapeName = t('bpm:ocr.shapes.internalStorage');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700';
                        } else if (node.type === 'multi-document') {
                          shapeName = t('bpm:ocr.shapes.multiDocument');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700 shadow-sm';
                        } else if (node.type === 'preparation') {
                          shapeName = t('bpm:ocr.shapes.preparation');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700 rounded-[50%]';
                        } else if (node.type === 'manual-operation') {
                          shapeName = t('bpm:ocr.shapes.manualOperation');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700';
                        } else if (node.type === 'card') {
                          shapeName = t('bpm:ocr.shapes.card');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700 rounded-tl-none';
                        } else if (node.type === 'punched-tape') {
                          shapeName = t('bpm:ocr.shapes.punchedTape');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700';
                        } else if (node.type === 'summing-junction') {
                          shapeName = t('bpm:ocr.shapes.summingJunction');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700 rounded-full';
                        } else if (node.type === 'or') {
                          shapeName = t('bpm:ocr.shapes.or');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700 rounded-full';
                        } else if (node.type === 'collate') {
                          shapeName = t('bpm:ocr.shapes.collate');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700';
                        } else if (node.type === 'sort') {
                          shapeName = t('bpm:ocr.shapes.sort');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700';
                        } else if (node.type === 'extract') {
                          shapeName = t('bpm:ocr.shapes.extract');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700';
                        } else if (node.type === 'merge') {
                          shapeName = t('bpm:ocr.shapes.merge');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700';
                        } else if (node.type === 'stored-data') {
                          shapeName = t('bpm:ocr.shapes.storedData');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700 rounded-r-full';
                        } else if (node.type === 'delay') {
                          shapeName = t('bpm:ocr.shapes.delay');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700 rounded-r-full';
                        } else if (node.type === 'sequential-access') {
                          shapeName = t('bpm:ocr.shapes.sequentialAccess');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700 rounded-full';
                        } else if (node.type === 'direct-access') {
                          shapeName = t('bpm:ocr.shapes.directAccess');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700 rounded-r-full';
                        } else if (node.type === 'display') {
                          shapeName = t('bpm:ocr.shapes.display');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700 rounded-l-full';
                        } else if (node.type === 'loop-limit') {
                          shapeName = t('bpm:ocr.shapes.loopLimit');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700';
                        } else if (node.type === 'annotation') {
                          shapeName = t('bpm:ocr.shapes.annotation');
                          iconBg = 'bg-slate-50 border-slate-300 text-slate-700 border-dashed';
                        } else if (node.type === 'swimlane') {
                          shapeName = t('bpm:editor.nodes.swimlane');
                          iconBg = 'bg-indigo-50 border-indigo-300 text-indigo-700 rounded-md';
                        }
                        return (
                          <div
                            key={node.id}
                            className="flex items-center gap-3 rounded-xl border border-border p-3 transition-all hover:bg-muted/50"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                              <div
                                className={cn(
                                  'flex h-full w-full items-center justify-center border-2 text-xs font-bold uppercase tracking-tighter shadow-sm',
                                  iconBg
                                )}
                              >
                                {node.type === 'decision' ? (
                                  <span className="-rotate-45">DEC</span>
                                ) : node.type === 'archive' ? (
                                  <span className="text-xs">ARS</span>
                                ) : node.type === 'swimlane' ? (
                                  <span className="text-xs">LANE</span>
                                ) : (
                                  node.type.substring(0, 3)
                                )}
                              </div>
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                  {shapeName}
                                </span>
                                <div className="flex items-center gap-1">
                                  <select
                                    value={node.type}
                                    onChange={(e) =>
                                      setStagingNodes((nds) =>
                                        nds.map((n) =>
                                          n.id === node.id
                                            ? { ...n, type: e.target.value, data: { ...n.data, type: e.target.value } }
                                            : n
                                        )
                                      )
                                    }
                                    className="rounded border border-border bg-white px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
                                  >
                                    <option value="start">{t('bpm:ocr.options.start')}</option>
                                    <option value="end">{t('bpm:ocr.options.end')}</option>
                                    <option value="activity">{t('bpm:ocr.options.activity')}</option>
                                    <option value="automated-activity">{t('bpm:ocr.options.system')}</option>
                                    <option value="decision">{t('bpm:ocr.options.decision')}</option>
                                    <option value="archive">{t('bpm:ocr.options.archive')}</option>
                                    <option value="data-media">{t('bpm:ocr.options.dataMedia')}</option>
                                    <option value="document">{t('bpm:ocr.options.document')}</option>
                                    <option value="swimlane">{t('bpm:editor.nodes.swimlane')}</option>
                                    <option value="alternate-process">{t('bpm:ocr.options.alternate-process')}</option>
                                    <option value="data">{t('bpm:ocr.options.data')}</option>
                                    <option value="predefined-process">{t('bpm:ocr.options.predefined-process')}</option>
                                    <option value="internal-storage">{t('bpm:ocr.options.internal-storage')}</option>
                                    <option value="multi-document">{t('bpm:ocr.options.multi-document')}</option>
                                    <option value="preparation">{t('bpm:ocr.options.preparation')}</option>
                                    <option value="manual-operation">{t('bpm:ocr.options.manual-operation')}</option>
                                    <option value="card">{t('bpm:ocr.options.card')}</option>
                                    <option value="punched-tape">{t('bpm:ocr.options.punched-tape')}</option>
                                    <option value="summing-junction">{t('bpm:ocr.options.summing-junction')}</option>
                                    <option value="or">{t('bpm:ocr.options.or')}</option>
                                    <option value="collate">{t('bpm:ocr.options.collate')}</option>
                                    <option value="sort">{t('bpm:ocr.options.sort')}</option>
                                    <option value="extract">{t('bpm:ocr.options.extract')}</option>
                                    <option value="merge">{t('bpm:ocr.options.merge')}</option>
                                    <option value="stored-data">{t('bpm:ocr.options.stored-data')}</option>
                                    <option value="delay">{t('bpm:ocr.options.delay')}</option>
                                    <option value="sequential-access">{t('bpm:ocr.options.sequential-access')}</option>
                                    <option value="direct-access">{t('bpm:ocr.options.direct-access')}</option>
                                    <option value="display">{t('bpm:ocr.options.display')}</option>
                                    <option value="loop-limit">{t('bpm:ocr.options.loop-limit')}</option>
                                    <option value="annotation">{t('bpm:ocr.options.annotation')}</option>
                                  </select>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0"
                                    onClick={() => setStagingNodes((nds) => nds.filter((n) => n.id !== node.id))}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              <Input
                                value={(node.data?.label as string) || ''}
                                onChange={(e) =>
                                  setStagingNodes((nds) =>
                                    nds.map((n) => {
                                      if (n.id !== node.id) return n;
                                      const nextLabel = e.target.value;
                                      return {
                                        ...n,
                                        data: {
                                          ...n.data,
                                          label: nextLabel,
                                          ...(n.type === 'swimlane' ? { department: nextLabel } : {}),
                                        },
                                      };
                                    })
                                  )
                                }
                                className="h-8 text-xs font-semibold focus-visible:ring-1"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent
                  value="connections"
                  className="flex-1 min-h-0 m-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <div className="p-3 border-b border-border bg-muted/20 shrink-0">
                    <p className="text-xs text-muted-foreground">{t('bpm:ocr.staging.edgeHint')}</p>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto p-3">
                    {stagingEdges.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        {t('bpm:ocr.edgeList.empty')}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {stagingEdges.map((edge) => (
                          <div
                            key={edge.id}
                            className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-2"
                          >
                            <span className="flex-1 truncate font-mono text-xs">
                              {String(edge.source)} → {String(edge.target)}
                            </span>
                            <Input
                              value={(edge.label as string) || ''}
                              placeholder={t('bpm:ocr.edgeList.labelPlaceholder')}
                              onChange={(e) =>
                                setStagingEdges((eds) =>
                                  eds.map((en) => (en.id === edge.id ? { ...en, label: e.target.value } : en))
                                )
                              }
                              className="h-7 w-32 text-xs"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => setStagingEdges((eds) => eds.filter((en) => en.id !== edge.id))}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-10 bg-slate-50/50 hover:bg-slate-50/80 transition-all gap-4 min-h-[300px] relative mt-4">
            {isProcessingOcr ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="h-10 w-10 text-emerald-500 animate-spin" />
                <p className="text-sm font-bold text-slate-700">{t('bpm:ocr.analyzing')}</p>
                <p className="text-xs text-slate-400">{t('bpm:ocr.aiMapping')}</p>
              </div>
            ) : ocrPreviewUrl ? (
              <div className="flex flex-col items-center w-full gap-4">
                <div className="border border-slate-200 rounded-xl p-2 max-w-md bg-white shadow-sm overflow-hidden flex justify-center items-center h-48 w-full">
                  <img src={ocrPreviewUrl} className="max-h-full max-w-full object-contain rounded" alt="Preview" />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOcrFile(null);
                      setOcrPreviewUrl(null);
                    }}
                    className="rounded-xl"
                  >
                    {t('bpm:ocr.buttons.retry')}
                  </Button>
                  <Button
                    onClick={handleStartOcr}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold text-xs uppercase tracking-wider"
                  >
                    <RefreshCw className="h-4 w-4" /> {t('bpm:ocr.buttons.process')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center shadow-inner">
                  <Upload className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-bold text-slate-800 text-sm">{t('bpm:ocr.uploadTitle')}</h3>
                  <p className="text-xs text-slate-400 max-w-sm">{t('bpm:ocr.uploadDesc')}</p>
                </div>
                <label className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-all uppercase tracking-wider shadow-sm">
                  {t('bpm:ocr.buttons.chooseFile')}
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleOcrFileChange} />
                </label>
              </>
            )}
          </div>
        )}

        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isProcessingOcr} className="rounded-xl">
            {t('bpm:ocr.buttons.cancel')}
          </Button>
          {parsedDiagram && (
            <Button
              onClick={handleApply}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider"
            >
              {t('bpm:ocr.buttons.saveApply')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
