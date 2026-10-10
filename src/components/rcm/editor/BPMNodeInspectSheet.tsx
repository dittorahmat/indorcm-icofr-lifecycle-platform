import React, { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { regulatoryPairsOf } from './utils/bpm-control-linkage';

interface InspectNode {
  id: string;
  type?: string | null;
  data?: any;
}

interface BPMNodeInspectSheetProps {
  node: InspectNode | null;
  onClose: () => void;
}

export function BPMNodeInspectSheet({ node, onClose }: BPMNodeInspectSheetProps) {
  const { t } = useTranslation(['bpm', 'common']);

  const pairs = useMemo(() => {
    if (!node?.data) return [];
    return regulatoryPairsOf(node.data);
  }, [node]);

  const groupedRisks = useMemo(() => {
    const groups: Record<string, { risk: any; controls: any[] }> = {};
    pairs.forEach((p: any, index: number) => {
      const rId = p._tempRiskId || p.riskId || `R-GROUP-${index}`;
      if (!groups[rId]) groups[rId] = { risk: p, controls: [] };
      groups[rId].controls.push(p);
    });
    return Object.values(groups);
  }, [pairs]);

  return (
    <Sheet open={!!node} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        aria-label={t('bpm:mobile.nodeDetail', { defaultValue: 'Detail Node' })}
        className="max-h-[85vh] rounded-t-lg p-0 flex flex-col"
      >
        {node && (
          <>
            <SheetHeader className="p-4 pb-3 border-b border-slate-100 text-left shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {t('bpm:mobile.viewMode', { defaultValue: 'Mode Lihat' })}
                </span>
                {node.type && (
                  <Badge variant="outline" className="text-xs font-bold uppercase ml-auto shrink-0">
                    {node.type}
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-sm font-bold text-slate-900 mt-1">
                {node.data?.label || node.id}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {t('bpm:mobile.nodeDetailHint', { defaultValue: 'Read-only detail of the selected BPM node.' })}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {node.data?.description && (
                <p className="text-xs text-slate-600 leading-relaxed">{node.data.description}</p>
              )}

              {groupedRisks.length === 0 ? (
                <p className="text-xs text-slate-400">
                  {t('bpm:mobile.noPairs', { defaultValue: 'Tidak ada data risiko/kontrol pada node ini.' })}
                </p>
              ) : (
                groupedRisks.map((group, gIdx) => (
                  <div key={group.risk.riskId || group.risk._tempRiskId || `g-${gIdx}`} className="rounded-lg border border-red-100 bg-red-50/40 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Badge className="text-xs font-mono font-bold bg-white border border-red-200 text-red-700">
                        {group.risk.riskId || group.risk._tempRiskId || `R-${gIdx + 1}`}
                      </Badge>
                      {group.risk.riskRating && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-black uppercase",
                            group.risk.riskRating === 'High' && "text-red-700 border-red-200",
                            group.risk.riskRating === 'Medium' && "text-amber-700 border-amber-200",
                            group.risk.riskRating === 'Low' && "text-emerald-700 border-emerald-200"
                          )}
                        >
                          {group.risk.riskRating}
                        </Badge>
                      )}
                    </div>
                    {group.risk.riskDescription && (
                      <p className="text-xs text-slate-700 leading-relaxed">{group.risk.riskDescription}</p>
                    )}
                    {group.risk.isFraudRelated && (
                      <Badge variant="outline" className="text-xs font-bold uppercase text-red-700 border-red-200">
                        {t('bpm:mobile.fraudRelated', { defaultValue: 'Terkait Fraud' })}
                      </Badge>
                    )}

                    <div className="space-y-2 pt-1">
                      {group.controls.map((c: any, cIdx: number) => (
                        <div key={c.controlId || c._tempControlId || `c-${cIdx}`} className="rounded-md border border-emerald-100 bg-white p-3 space-y-1.5">
                          <Badge className="text-xs font-mono font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                            {c.controlId || c._tempControlId || `C-${cIdx + 1}`}
                          </Badge>
                          {c.controlDescription && (
                            <p className="text-xs text-slate-700 leading-relaxed">{c.controlDescription}</p>
                          )}
                          {Array.isArray(c.assertions) && c.assertions.length > 0 && (
                            <p className="text-xs text-slate-500">
                              <span className="font-bold uppercase tracking-wider">
                                {t('bpm:mobile.assertions', { defaultValue: 'Asersi' })}:
                              </span>{' '}
                              {c.assertions.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}

              <p className="text-xs text-slate-400">
                {t('bpm:mobile.editOnDesktop', { defaultValue: 'Untuk menyunting, buka diagram ini di desktop.' })}
              </p>
            </div>

            <div className="p-4 pt-3 border-t border-slate-100 shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full min-h-[44px] text-xs font-bold"
              >
                {t('common:actions.close', { defaultValue: 'Tutup' })}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
