import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Search, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BpmProcessToolbarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  departmentName: string;
  onCreateProcess: () => void;
}

/** Search field, owning department, and the create-process call to action. */
export function BpmProcessToolbar({
  searchTerm,
  onSearchTermChange,
  departmentName,
  onCreateProcess,
}: BpmProcessToolbarProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap min-w-0 bg-white p-4 rounded-lg border border-slate-200 shadow-sm max-w-full">
      <div className="flex-1 w-full md:max-w-md relative group">
        <Label htmlFor="bpm-search" className="sr-only">
          {t('searchLabel')}
        </Label>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <Input
          id="bpm-search"
          placeholder={t('searchPlaceholder')}
          className="pl-10 h-11 sm:h-10 min-h-[44px] sm:min-h-0 bg-slate-50 border-slate-200 text-base sm:text-sm font-medium rounded-lg focus:bg-white transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
        <div className="hidden md:block text-right">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">{t('modal.owner')}</p>
          <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 justify-end">
            <Target className="h-3 w-3 text-indigo-500" />
            {departmentName}
          </p>
        </div>
        <div className="h-8 w-px bg-slate-100 hidden sm:block" />
        <Button
          onClick={onCreateProcess}
          className="h-10 min-h-[44px] sm:min-h-0 gap-2 bg-mancity-pattern hover:opacity-90 text-primary-foreground shadow-sm transition-all font-bold text-xs uppercase tracking-widest px-6 rounded-lg w-full sm:w-auto justify-center"
        >
          <PlusCircle className="h-3.5 w-3.5" /> {t('createProcessButton')}
        </Button>
      </div>
    </div>
  );
}
