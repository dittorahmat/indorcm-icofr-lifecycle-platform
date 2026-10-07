import { useTranslation } from 'react-i18next';
import type { Edge, EdgeTypes, Node, NodeTypes } from 'reactflow';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { OcrEdgesTab } from './ocr/OcrEdgesTab';
import { OcrElementsTab } from './ocr/OcrElementsTab';
import { OcrReviewView } from './ocr/OcrReviewView';
import { OcrUploadView } from './ocr/OcrUploadView';
import { OcrImportModeSelector } from './ocr/OcrImportModeSelector';
import { useOcrStaging } from './ocr/useOcrStaging';
import type { OcrAppendDirection, OcrImportMode } from './ocr/ocr-types';

interface BPMOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (nodes: Node[], edges: Edge[], mode?: OcrImportMode, direction?: OcrAppendDirection) => void;
  nodeTypes: NodeTypes;
  edgeTypes: EdgeTypes;
  isDirty?: boolean;
  hasExistingNodes?: boolean;
}

export function BPMOcrModal({ isOpen, onClose, onApply, nodeTypes, edgeTypes, isDirty, hasExistingNodes = false }: BPMOcrModalProps) {
  const { t } = useTranslation(['bpm', 'common']);
  const staging = useOcrStaging({ isOpen, isDirty, hasExistingNodes, t, onClose, onApply });
  const { parsedDiagram, stagingNodes, stagingEdges, isProcessingOcr } = staging;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessingOcr && (!open ? onClose() : undefined)}>
      <DialogContent className={cn('w-[calc(100vw-2rem)] sm:max-w-md transition-all duration-300 p-4 sm:p-6', parsedDiagram && 'sm:max-w-6xl')}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Upload className="h-5 w-5 text-emerald-600" />
            {parsedDiagram ? t('bpm:ocr.reviewTitle') : t('bpm:ocr.importTitle')}
          </DialogTitle>
        </DialogHeader>

        {parsedDiagram ? (
          <OcrReviewView
            ocrPreviewUrl={staging.ocrPreviewUrl}
            stagingNodes={stagingNodes}
            stagingEdges={stagingEdges}
            stagingWarnings={staging.stagingWarnings}
            warningsDismissed={staging.warningsDismissed}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onDismissWarnings={() => staging.setWarningsDismissed(true)}
            onInitCanvas={(instance) => {
              staging.setStagingRfInstance(instance);
              setTimeout(() => instance.fitView({ padding: 0.15 }), 100);
            }}
            onNodesChange={staging.onStagingNodesChange}
            onEdgesChange={staging.onStagingEdgesChange}
            onNodesDelete={(deleted) => {
              const ids = new Set(deleted.map((d) => d.id));
              ids.forEach((id) => staging.removeNode(id));
            }}
            onEdgesDelete={(deleted) => {
              const ids = new Set(deleted.map((d) => d.id));
              ids.forEach((id) => staging.removeEdge(id));
            }}
            onConnect={staging.handleStagingConnect}
          >
            <Tabs defaultValue="elements" className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="px-3 pt-2 pb-0 border-b border-border bg-muted/10 shrink-0">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto min-h-8">
                  <TabsTrigger value="elements" className="text-xs">
                    {t('bpm:ocr.tabs.elements')} ({stagingNodes.length})
                  </TabsTrigger>
                  <TabsTrigger value="connections" className="text-xs">
                    {t('bpm:ocr.tabs.connections')} ({stagingEdges.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <OcrElementsTab
                stagingNodes={stagingNodes}
                onUpdateType={staging.updateNodeType}
                onUpdateLabel={staging.updateNodeLabel}
                onRemove={staging.removeNode}
              />
              <OcrEdgesTab
                stagingEdges={stagingEdges}
                onUpdateLabel={staging.updateEdgeLabel}
                onRemove={staging.removeEdge}
              />
            </Tabs>
          </OcrReviewView>
        ) : (
          <OcrUploadView
            isProcessingOcr={isProcessingOcr}
            ocrPreviewUrl={staging.ocrPreviewUrl}
            onFileChange={(e) => void staging.handleOcrFileChange(e)}
            onClearPreview={staging.resetStaging}
            onStartOcr={() => void staging.handleStartOcr()}
          />
        )}

        {parsedDiagram && hasExistingNodes && (
          <OcrImportModeSelector
            importMode={staging.importMode}
            appendDirection={staging.appendDirection}
            onImportModeChange={staging.setImportMode}
            onAppendDirectionChange={staging.setAppendDirection}
            hasExistingNodes={hasExistingNodes}
          />
        )}

        <DialogFooter className="mt-4 border-t pt-4 flex-col-reverse sm:flex-row pb-[env(safe-area-inset-bottom,0px)] sm:pb-0">
          <Button variant="outline" onClick={onClose} disabled={isProcessingOcr} className="rounded-md w-full sm:w-auto min-h-[44px] sm:min-h-0">
            {t('bpm:ocr.buttons.cancel')}
          </Button>
          {parsedDiagram && (
            <Button
              onClick={() => void staging.handleApply()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold uppercase tracking-wider w-full sm:w-auto min-h-[44px] sm:min-h-0"
            >
              {t('bpm:ocr.buttons.saveApply')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
