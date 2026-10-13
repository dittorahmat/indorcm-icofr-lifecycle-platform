import { useTranslation } from 'react-i18next';
import { CheckCircle2, Download, Layers, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';
import { SOURCE_FILTERS } from './board-constants';

interface BoardToolbarProps {
  sourceFilter: string;
  isAggregateMode: boolean;
  selectedCount: number;
  isExportingExcel: boolean;
  canExport: boolean;
  onSourceFilter: (id: string) => void;
  onExport: () => void;
  onEnterAggregateMode: () => void;
  onCancelAggregateMode: () => void;
  onEvaluateGroup: () => void;
}

export function BoardToolbar({
  sourceFilter,
  isAggregateMode,
  selectedCount,
  isExportingExcel,
  canExport,
  onSourceFilter,
  onExport,
  onEnterAggregateMode,
  onCancelAggregateMode,
  onEvaluateGroup,
}: BoardToolbarProps) {
  const { t } = useTranslation(['deficiency', 'workflow', 'common', 'reports']);

  return (
    <PageHeader
      title={<span className="font-display tracking-tight">{t('title', 'Deficiency Board')}</span>}
      description={t('description', 'Track remediation and assess severity using the Degree of Deficiency (DoD) model.')}
      badge={
        isAggregateMode && (
          <Badge className="bg-rose-500 text-white border-none shadow-sm px-3 py-1 font-bold text-xs uppercase tracking-wider">
            {t('board.selectionModeActive', 'Selection Mode Active')}
          </Badge>
        )
      }
    >
      <div className="flex min-w-0 max-w-full flex-col gap-3 sm:gap-4 w-full lg:w-auto lg:flex-row lg:flex-wrap lg:items-center">
        <div className="flex flex-col gap-1.5 min-w-0 max-w-full">
          <span className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">
            {t('sources.label', 'Finding Source')}
          </span>
          <div className="flex gap-1 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
            {SOURCE_FILTERS.map((s) => (
              <Button
                key={s.id}
                variant={sourceFilter === s.id ? 'default' : 'ghost'}
                size="sm"
                aria-pressed={sourceFilter === s.id}
                className={cn(
                  'h-11 sm:h-8 min-h-[44px] sm:min-h-0 shrink-0 text-xs font-bold uppercase tracking-widest px-3 rounded-lg transition-all',
                  sourceFilter === s.id
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200 hover:bg-white'
                    : 'text-slate-400',
                )}
                onClick={() => onSourceFilter(s.id)}
              >
                {t(s.labelKey, s.fallback)}
              </Button>
            ))}
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block" />

        <Button
          variant="outline"
          onClick={onExport}
          disabled={isExportingExcel || !canExport}
          className="h-11 sm:h-10 min-h-[44px] w-full sm:w-auto justify-center gap-2 border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest px-5 rounded-lg shadow-sm self-stretch sm:self-end"
        >
          {isExportingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-emerald-600" />}
          {t('reports:findings.exportExcel', { defaultValue: 'Ekspor Excel' })}
        </Button>

        {!isAggregateMode ? (
          <Button
            variant="outline"
            onClick={onEnterAggregateMode}
            className="h-11 sm:h-10 min-h-[44px] w-full sm:w-auto justify-center gap-2 border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest px-5 rounded-lg shadow-sm self-stretch sm:self-end"
          >
            <Layers className="h-4 w-4 text-indigo-500" /> {t('board.aggregateAnalysis', 'Aggregate Analysis')}
          </Button>
        ) : (
          <div className="flex flex-col min-[420px]:flex-row gap-2 w-full sm:w-auto self-stretch sm:self-end">
            <Button
              variant="ghost"
              onClick={onCancelAggregateMode}
              className="h-11 sm:h-10 min-h-[44px] w-full sm:w-auto justify-center font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600"
            >
              {t('board.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={onEvaluateGroup}
              className="h-11 sm:h-10 min-h-[44px] w-full sm:w-auto justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all font-bold text-xs uppercase tracking-widest px-5 rounded-lg text-white"
            >
              <CheckCircle2 className="h-4 w-4" />{' '}
              {t('board.evaluateGroup', { defaultValue: 'Evaluate Group ({{count}})', count: selectedCount })}
            </Button>
          </div>
        )}
      </div>
    </PageHeader>
  );
}
