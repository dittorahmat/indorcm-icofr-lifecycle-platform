import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Info, Loader2, Map, Workflow } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BPMProcessWithChildren } from '@shared/types';
import type { BPMDiagramListProps, RowCallbacks } from './diagram-list-types';

interface DiagramListCardsProps {
  props: BPMDiagramListProps;
  callbacks: RowCallbacks;
  onOpenDiagramFor: (proc: BPMProcessWithChildren) => void;
}

export function DiagramListCards({ props, callbacks, onOpenDiagramFor }: DiagramListCardsProps) {
  const { t } = useTranslation(['bpm', 'common']);
  const { bpmLoading, hierarchicalProcesses, searchTerm, expandedProcessIds } = props;

  return (
    <div className="md:hidden p-3 space-y-3 max-h-[70dvh] sm:max-h-[70vh] overflow-y-auto" data-testid="bpm-diagram-mobile-cards">
      {bpmLoading ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('bpm:loading')}</p>
        </div>
      ) : hierarchicalProcesses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="h-12 w-12 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
            <Info className="h-6 w-6 text-slate-300" />
          </div>
          <p className="text-xs font-medium text-slate-400">
            {searchTerm ? t('bpm:noProcessesFound', 'Tidak ada proses yang sesuai dengan pencarian') : t('bpm:noSubProcesses')}
          </p>
        </div>
      ) : (
        hierarchicalProcesses.map((process) => {
          const children = process.children ?? [];
          const hasChildren = children.length > 0;
          const isExpanded = expandedProcessIds.has(process.id);
          return (
            <div
              key={process.id}
              className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 shadow-sm"
              onClick={() => callbacks.onSelectProcess?.(process)}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{process.name}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {process.bpmCode && (
                      <Badge className="text-xs bg-indigo-100 text-indigo-800 border-none font-bold tracking-widest rounded-md shrink-0">
                        {process.bpmCode}
                      </Badge>
                    )}
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">ID: {process.id.substring(0, 8)}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-bold uppercase px-2 py-0.5 rounded-md border-slate-200 text-slate-500 shrink-0">
                  {process.workflowStatus || 'Draft'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-orange-100 text-orange-700 border-none font-bold text-xs px-2.5 py-0.5 rounded-lg">
                  {process.riskCount || 0} {t('bpm:mobile.risks', { defaultValue: 'Risiko' })}
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-xs px-2.5 py-0.5 rounded-lg">
                  {process.controlCount || 0} {t('bpm:mobile.controls', { defaultValue: 'Kontrol' })}
                </Badge>
                {hasChildren && (
                  <span className="text-xs text-indigo-600 font-bold">
                    • {children.length} {t('bpm:hierarchy.subProcessesCount', 'sub-proses')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {hasChildren && (
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={isExpanded ? t('bpm:mobile.collapse', { defaultValue: 'Tutup sub-proses' }) : t('bpm:mobile.expand', { defaultValue: 'Tampilkan sub-proses' })}
                    aria-expanded={isExpanded}
                    onClick={(e) => {
                      e.stopPropagation();
                      callbacks.onToggleExpand(process.id);
                    }}
                    className="min-h-[44px] min-w-[44px] shrink-0"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDiagramFor(process);
                  }}
                  className="flex-1 min-h-[44px] text-xs font-bold gap-2"
                >
                  <Workflow className="h-4 w-4" />
                  {t('bpm:mobile.viewDiagram', { defaultValue: 'Lihat Diagram' })}
                </Button>
              </div>

              {hasChildren && isExpanded && (
                <div className="space-y-2 pl-2 border-l-2 border-slate-100">
                  {children.map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        callbacks.onSelectProcess?.(sub);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="text-xs font-bold text-slate-800 min-w-0">{sub.name}</p>
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 rounded text-slate-400 border-slate-200 shrink-0">
                          {sub.workflowStatus || 'Draft'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className="text-orange-600">
                          {sub.riskCount || 0} {t('bpm:mobile.risks', { defaultValue: 'Risiko' })}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-600">
                          {sub.controlCount || 0} {t('bpm:mobile.controls', { defaultValue: 'Kontrol' })}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDiagramFor(sub);
                        }}
                        className="w-full min-h-[44px] text-xs font-bold gap-2 bg-white"
                      >
                        <Map className="h-4 w-4" />
                        {t('bpm:mobile.viewDiagram', { defaultValue: 'Lihat Diagram' })}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
