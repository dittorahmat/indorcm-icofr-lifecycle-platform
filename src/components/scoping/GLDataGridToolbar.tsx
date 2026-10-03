import React from 'react';
import { Button } from '@/components/ui/button';
import { Info, FileSpreadsheet, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GLDataGridToolbarProps {
  onExportExcel: () => void;
  onOpenWorkflow?: () => void;
}

export const GLDataGridToolbar: React.FC<GLDataGridToolbarProps> = React.memo(function GLDataGridToolbar({
  onExportExcel,
  onOpenWorkflow
}) {
  const { t } = useTranslation('scoping');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 bg-white p-2.5 sm:p-2.5 rounded-lg border border-slate-100 shadow-sm w-full max-w-full">
      <div className="flex-1 min-w-0 flex gap-2 items-center text-xs text-muted-foreground font-medium bg-slate-50 px-2.5 py-2 sm:py-1.5 rounded-md border border-slate-200/50">
        <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
        <span className="truncate leading-tight">{t('grid.fsliGuidance')}</span>
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:items-center shrink-0 w-full sm:w-auto">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onExportExcel}
          className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-2 text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200 text-xs font-bold uppercase tracking-wider shadow-sm w-full sm:w-auto justify-center"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" /> {t('grid.exportExcel')}
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={onOpenWorkflow}
          className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-100 uppercase tracking-widest font-black text-xs px-4 w-full sm:w-auto justify-center"
        >
          <Send className="h-3.5 w-3.5" /> {t('grid.submitForReview')}
        </Button>
      </div>
    </div>
  );
});
