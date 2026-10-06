import { useTranslation } from 'react-i18next';
import { GitMerge, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiagramListToolbarProps {
  selectedCount: number;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onOpenMigrationModal: () => void;
}

export function DiagramListToolbar({ selectedCount, onExpandAll, onCollapseAll, onOpenMigrationModal }: DiagramListToolbarProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <div className="bg-slate-50/70 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onExpandAll}
          className="h-8 min-h-[44px] gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg"
        >
          <Maximize2 className="h-3.5 w-3.5 text-indigo-500" />
          {t('bpm:hierarchy.expandAll', 'Buka Semua')}
        </Button>
        <div className="h-4 w-px bg-slate-200" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCollapseAll}
          className="h-8 min-h-[44px] gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg"
        >
          <Minimize2 className="h-3.5 w-3.5 text-slate-400" />
          {t('bpm:hierarchy.collapseAll', 'Tutup Semua')}
        </Button>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2 bg-indigo-50/80 px-3 py-1 rounded-xl border border-indigo-200/60 shadow-sm animate-in fade-in">
          <span className="text-xs font-bold text-indigo-900">
            {t('bpm:migration.selectedCount', {
              count: selectedCount,
              defaultValue: `${selectedCount} item dipilih`,
            })}
          </span>
          <Button
            size="sm"
            onClick={onOpenMigrationModal}
            className="h-7 min-h-[44px] gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg px-2.5 shadow-sm"
          >
            <GitMerge className="h-3 w-3" />
            {t('bpm:migration.openModalButton', 'Atur Hierarki / Migrasi')}
          </Button>
        </div>
      )}
    </div>
  );
}
