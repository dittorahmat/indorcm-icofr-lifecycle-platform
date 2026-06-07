import React from 'react';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';

export function FiscalYearSelector() {
  const { workingYear, setWorkingYear } = useFiscalYearStore();
  const { isDirty } = useUnsavedChangesContext();
  const { t: translate } = useTranslation(['common', 'bpm']);
  const { isDark } = useTheme();

  const currentYear = new Date().getFullYear();
  const years = React.useMemo(() => {
    const list = [];
    for (let i = currentYear - 3; i <= currentYear + 1; i++) {
      list.push(i.toString());
    }
    return list;
  }, [currentYear]);

  return (
    <div className="flex items-center gap-2 mr-2">
      <Select 
        value={workingYear} 
        onValueChange={(val) => {
          if (isDirty && !window.confirm(translate('bpm:unsavedChanges.description'))) return;
          setWorkingYear(val);
        }}
      >
        <SelectTrigger className={cn(
          "h-9 w-[110px] rounded-lg border-none font-bold text-xs shadow-sm transition-all",
          isDark 
            ? "bg-slate-800 text-slate-100 hover:bg-slate-700" 
            : "bg-white/10 text-white hover:bg-white/20"
        )}>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 opacity-70" />
            <SelectValue placeholder="Year" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-200">
          {years.map((y) => (
            <SelectItem key={y} value={y} className="text-xs font-bold uppercase">
              {translate('common:cycles.yearCycle', { year: y })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
