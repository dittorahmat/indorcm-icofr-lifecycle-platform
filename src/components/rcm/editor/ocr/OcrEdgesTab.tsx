import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import type { useOcrStaging } from './useOcrStaging';

type Staging = ReturnType<typeof useOcrStaging>;

interface OcrEdgesTabProps {
  stagingEdges: Staging['stagingEdges'];
  onUpdateLabel: Staging['updateEdgeLabel'];
  onRemove: Staging['removeEdge'];
}

export function OcrEdgesTab({ stagingEdges, onUpdateLabel, onRemove }: OcrEdgesTabProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <TabsContent value="connections" className="flex-1 min-h-0 m-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
      <div className="p-3 border-b border-border bg-muted/20 shrink-0">
        <p className="text-xs text-muted-foreground">{t('bpm:ocr.staging.edgeHint')}</p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {stagingEdges.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">{t('bpm:ocr.edgeList.empty')}</p>
        ) : (
          <div className="space-y-2">
            {stagingEdges.map((edge) => (
              <div key={edge.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-2">
                <span className="flex-1 truncate font-mono text-xs">
                  {String(edge.source)} → {String(edge.target)}
                </span>
                <Input
                  value={typeof edge.label === 'string' ? edge.label : ''}
                  placeholder={t('bpm:ocr.edgeList.labelPlaceholder')}
                  onChange={(e) => onUpdateLabel(edge.id, e.target.value)}
                  className="h-7 w-32 text-xs"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemove(edge.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
