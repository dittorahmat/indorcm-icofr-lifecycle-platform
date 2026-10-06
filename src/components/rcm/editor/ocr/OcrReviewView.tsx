import { useTranslation } from 'react-i18next';
import ReactFlow, { Background, BackgroundVariant, Controls } from 'reactflow';
import type { Connection, Edge, EdgeChange, EdgeTypes, Node, NodeChange, NodeTypes } from 'reactflow';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OcrLayoutWarning } from '@/utils/ocr-layout';

interface OcrReviewViewProps {
  ocrPreviewUrl: string | null;
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 lg:h-[640px] mt-4">
      <div className="border border-border rounded-xl overflow-hidden bg-muted/30 flex flex-col p-3 gap-3 min-h-[280px] lg:min-h-0 overflow-y-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {t('bpm:ocr.originalImage')}
        </span>
        <div className="flex-1 flex items-center justify-center rounded-lg border border-border bg-white p-2 overflow-hidden">
          <img src={ocrPreviewUrl || ''} className="max-h-full max-w-full object-contain shadow-sm rounded-lg" alt="Source Diagram" />
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

        <div className="h-[200px] sm:h-[230px] border-b border-border relative bg-white mt-3 mx-3 rounded-lg overflow-hidden shrink-0">
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
  );
}
