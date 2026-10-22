import { useTranslation } from 'react-i18next';
import ReactFlow, { Background, BackgroundVariant, Controls } from 'reactflow';
import type { Connection, Edge, EdgeChange, EdgeTypes, Node, NodeChange, NodeTypes } from 'reactflow';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { OcrLayoutWarning } from '@/utils/ocr-layout';

interface OcrReviewViewProps {
  ocrPreviewUrl: string | null;
  totalPages?: number;
  activePage?: number;
  onSelectPage?: (page: number) => void;
  stagingNodes: Node[];
  stagingEdges: Edge[];
  stagingWarnings: OcrLayoutWarning[];
  warningsDismissed: boolean;
  nodeTypes: NodeTypes;
  edgeTypes: EdgeTypes;
  onDismissWarnings: () => void;
  onInitCanvas: (instance: { fitView: (opts?: { padding?: number }) => void }) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onNodesDelete: (deleted: Node[]) => void;
  onEdgesDelete: (deleted: Edge[]) => void;
  onConnect: (params: Connection) => void;
  children: React.ReactNode;
}

export function OcrReviewView({
  ocrPreviewUrl,
  totalPages = 1,
  activePage = 1,
  onSelectPage,
  stagingNodes,
  stagingEdges,
  stagingWarnings,
  warningsDismissed,
  nodeTypes,
  edgeTypes,
  onDismissWarnings,
  onInitCanvas,
  onNodesChange,
  onEdgesChange,
  onNodesDelete,
  onEdgesDelete,
  onConnect,
  children,
}: OcrReviewViewProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <div className="flex flex-col gap-3 mt-2">
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-lg overflow-x-auto">
          <span className="text-xs font-bold text-slate-700 px-2 shrink-0">{t('bpm:ocr.pageLabel')}</span>
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            const isSelected = pageNum === activePage;
            return (
              <Button
                key={pageNum}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onSelectPage?.(pageNum)}
                className={cn("h-7 px-2.5 text-xs font-semibold", isSelected && "bg-emerald-600 hover:bg-emerald-700 text-white")}
              >
                {t('bpm:ocr.pageNumber', { page: pageNum })}
              </Button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 lg:h-[640px]">
        <div className="border border-border rounded-xl overflow-hidden bg-muted/30 flex flex-col p-3 gap-3 min-h-[280px] lg:min-h-0 overflow-y-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t('bpm:ocr.originalImage')} {totalPages > 1 ? `(${t('bpm:ocr.pageNumber', { page: activePage })})` : ''}
          </span>
          <div className="flex-1 flex items-center justify-center rounded-lg border border-border bg-white p-2 overflow-hidden">
            <img src={ocrPreviewUrl || ''} className="max-h-full max-w-full object-contain shadow-sm rounded-lg" alt={t('bpm:ocr.sourceAlt')} />
          </div>
          <p className="text-xs text-muted-foreground">{t('bpm:ocr.staging.thumbnailHint')}</p>
        </div>

        <div className="flex flex-col border border-border rounded-xl overflow-y-auto lg:overflow-hidden bg-card shadow-sm min-h-0">
          <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center flex-wrap gap-2">
            <span className="text-xs font-black text-foreground uppercase tracking-wider">{t('bpm:ocr.shapeDetection')}</span>

          <span className="text-xs text-muted-foreground font-mono">
            {t('bpm:ocr.nodesCount', { count: stagingNodes.length })} • {t('bpm:ocr.edgesCount', { count: stagingEdges.length })}
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
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onDismissWarnings}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <div className="h-[320px] sm:h-[360px] lg:h-[420px] border-b border-border relative bg-white mt-3 mx-3 rounded-lg overflow-hidden shrink-0">
          <ReactFlow
            nodes={stagingNodes}
            edges={stagingEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ minZoom: 0.5 }}
            onInit={onInitCanvas}
            className="bg-white"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} color="hsl(var(--muted))" />
            <Controls className="scale-75" />
          </ReactFlow>
          <p className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-border bg-white/90 px-2 py-0.5 text-xs text-muted-foreground shadow-sm">
            {t('bpm:ocr.staging.canvasHint')}
          </p>
        </div>

        {children}
      </div>
    </div>
  </div>
  );
}

