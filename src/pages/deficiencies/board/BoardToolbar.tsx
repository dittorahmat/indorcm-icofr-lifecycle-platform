import { useTranslation } from 'react-i18next';
import { CheckCircle2, Download, Layers, Loader2, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SOURCE_FILTERS } from './board-constants';

interface BoardToolbarProps {
  sourceFilter: string;
  isAggregateMode: boolean;
  selectedCount: number;
  isExportingExcel: boolean;
  canExport: boolean;
  viewMode: 'kanban' | 'table';
  onViewModeChange: (mode: 'kanban' | 'table') => void;
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
  viewMode,
  onViewModeChange,
  onSourceFilter,
  onExport,
  onEnterAggregateMode,
  onCancelAggregateMode,
  onEvaluateGroup,
}: BoardToolbarProps) {
  const { t } = useTranslation(['deficiency', 'workflow', 'common', 'reports']);

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
      <div className="flex min-w-0 max-w-full flex-col gap-3 sm:gap-4 w-full lg:flex-row lg:items-center lg:justify-between">
        {/* Source Filters Bar */}
        <div className="flex flex-col gap-1.5 min-w-0 max-w-full">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider ml-1">
            {t('sources.label', { defaultValue: 'Sumber Temuan Defisiensi' })}
          </span>
          <div className="flex gap-1 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain bg-slate-100/80 p-1 rounded-lg border border-slate-200">
            {SOURCE_FILTERS.map((s) => (
              <Button
                key={s.id}
                variant={sourceFilter === s.id ? 'default' : 'ghost'}
                size="sm"
                aria-pressed={sourceFilter === s.id}
                className={cn(
                  'h-11 sm:h-8 min-h-[44px] sm:min-h-0 shrink-0 text-xs font-bold uppercase tracking-wider px-3 rounded-md transition-all',
                  sourceFilter === s.id
                    ? 'bg-white text-primary shadow-xs border border-slate-200 hover:bg-white'
                    : 'text-slate-500 hover:text-slate-700',
                )}
                onClick={() => onSourceFilter(s.id)}
              >
                {t(s.labelKey, { defaultValue: s.fallback })}
              </Button>
            ))}
          </div>
        </div>

        {/* View Mode & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-stretch lg:self-end">
          {/* Kanban vs Table Toggle */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200">
            <Button
              type="button"
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('kanban')}
              className={cn(
                'h-11 sm:h-8 min-h-[44px] sm:min-h-0 text-xs font-bold gap-1.5 rounded-md transition-all',
                viewMode === 'kanban'
                  ? 'bg-white text-primary shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('table')}
              className={cn(
                'h-11 sm:h-8 min-h-[44px] sm:min-h-0 text-xs font-bold gap-1.5 rounded-md transition-all',
                viewMode === 'table'
                  ? 'bg-white text-primary shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>{t('toolbar.tableMode', { defaultValue: 'Tabel CAP' })}</span>
            </Button>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden min-[480px]:block" />

          {/* Export Button */}
          <Button
            variant="outline"
            onClick={onExport}
            disabled={isExportingExcel || !canExport}
            className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-center gap-2 border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-wider px-4 rounded-lg shadow-xs"
          >
            {isExportingExcel ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4 text-secondary" />
            )}
            {t('reports:findings.exportExcel', { defaultValue: 'Ekspor Excel' })}
          </Button>

          {/* Aggregate Mode Toggle / Actions */}
          {!isAggregateMode ? (
            <Button
              variant="outline"
              onClick={onEnterAggregateMode}
              className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-center gap-2 border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-wider px-4 rounded-lg shadow-xs"
            >
              <Layers className="h-4 w-4 text-primary" /> {t('board.aggregateAnalysis', { defaultValue: 'Analisis Agregasi' })}
            </Button>
          ) : (
            <div className="flex flex-col min-[420px]:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="ghost"
                onClick={onCancelAggregateMode}
                className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-center font-bold text-xs uppercase tracking-wider text-slate-500 hover:text-slate-700"
              >
                {t('board.cancel', { defaultValue: 'Batal' })}
              </Button>
              <Button
                onClick={onEvaluateGroup}
                className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary shadow-sm transition-all font-bold text-xs uppercase tracking-wider px-4 rounded-lg"
              >
                <CheckCircle2 className="h-4 w-4 text-secondary-fixed" />{' '}
                {t('board.evaluateGroup', { defaultValue: 'Evaluasi Grup ({{count}})', count: selectedCount })}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
