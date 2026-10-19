import { FileSpreadsheet, Loader2, PlusCircle, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface BPMWorksheetToolbarProps {
  /** Sub-process or business-process name the worksheet belongs to. */
  scopeName: string;
  noGL: string;
  isProcedureOpen: boolean;
  onToggleProcedure: () => void;
  onAddRow: () => void;
  isAddingRow: boolean;
}

/** Worksheet title block plus the procedure toggle and the add-row action. */
export function BPMWorksheetToolbar({
  scopeName,
  noGL,
  isProcedureOpen,
  onToggleProcedure,
  onAddRow,
  isAddingRow,
}: BPMWorksheetToolbarProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 p-4 border-b shrink-0 flex-wrap gap-3 min-w-0 max-w-full">
      <div className="space-y-0.5 min-w-0">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 min-w-0">
          <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">
            {t('worksheet.title')} - {scopeName} ({noGL})
          </span>
        </h4>
        <p className="text-xs text-slate-500">{t('worksheet.description')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full min-[480px]:w-auto">
        <Button
          onClick={onToggleProcedure}
          variant="outline"
          size="sm"
          className="h-9 min-h-[44px] min-[480px]:min-h-0 gap-2 border-slate-200 text-slate-900 font-bold flex-1 min-[480px]:flex-none justify-center"
        >
          <Shield className="h-4 w-4" />
          {isProcedureOpen ? t('worksheet.hideProcedure') : t('worksheet.setProcedure')}
        </Button>
        <Button
          onClick={onAddRow}
          variant="default"
          size="sm"
          className="bg-slate-900 hover:bg-slate-800 font-bold gap-2 shadow-md px-4 h-9 min-h-[44px] min-[480px]:min-h-0 flex-1 min-[480px]:flex-none justify-center"
          disabled={isAddingRow}
        >
          {isAddingRow ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
          {t('worksheet.addRow')}
        </Button>
      </div>
    </div>
  );
}
