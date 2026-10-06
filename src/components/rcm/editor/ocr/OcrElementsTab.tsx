import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { OCR_NODE_TYPE_OPTIONS, getOcrOptionLabelKey, getOcrShapeBadge } from './ocr-shape-badges';
import type { useOcrStaging } from './useOcrStaging';

type Staging = ReturnType<typeof useOcrStaging>;

interface OcrElementsTabProps {
  stagingNodes: Staging['stagingNodes'];
  onUpdateType: Staging['updateNodeType'];
  onUpdateLabel: Staging['updateNodeLabel'];
  onRemove: Staging['removeNode'];
}

function nodeGlyph(nodeType: string | undefined): string {
  if (nodeType === 'decision') return 'DEC';
  if (nodeType === 'archive') return 'ARS';
  if (nodeType === 'swimlane') return 'LANE';
  return (nodeType ?? '').substring(0, 3);
}

export function OcrElementsTab({ stagingNodes, onUpdateType, onUpdateLabel, onRemove }: OcrElementsTabProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <TabsContent value="elements" className="flex-1 min-h-0 m-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
        <p className="text-xs text-muted-foreground">{t('bpm:ocr.adjustmentInstructions')}</p>
        <div className="space-y-3">
          {stagingNodes.map((node) => {
            const badge = getOcrShapeBadge(node.type);
            const shapeName = t(badge.labelKey);
            return (
              <div key={node.id} className="flex items-center gap-3 rounded-xl border border-border p-3 transition-all hover:bg-muted/50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  <div
                    className={cn(
                      'flex h-full w-full items-center justify-center border-2 text-xs font-bold uppercase tracking-tighter shadow-sm',
                      badge.iconBg,
                    )}
                  >
                    {node.type === 'decision' || node.type === 'archive' || node.type === 'swimlane' ? (
                      <span className={node.type === 'decision' ? '-rotate-45' : 'text-xs'}>{nodeGlyph(node.type)}</span>
                    ) : (
                      nodeGlyph(node.type)
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{shapeName}</span>
                    <div className="flex items-center gap-1">
                      <select
                        value={node.type}
                        onChange={(e) => onUpdateType(node.id, e.target.value)}
                        className="rounded border border-border bg-white px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
                      >
                        {OCR_NODE_TYPE_OPTIONS.map((type) => (
                          <option key={type} value={type}>
                            {t(getOcrOptionLabelKey(type))}
                          </option>
                        ))}
                      </select>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemove(node.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Input
                    value={typeof node.data?.label === 'string' ? node.data.label : ''}
                    onChange={(e) => onUpdateLabel(node.id, e.target.value)}
                    className="h-8 text-xs font-semibold focus-visible:ring-1"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TabsContent>
  );
}
