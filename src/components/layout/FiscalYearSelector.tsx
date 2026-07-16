import React, { useState } from 'react';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';

export function FiscalYearSelector() {
  const { workingYear, setWorkingYear, customYears, addCustomYear } = useFiscalYearStore();
  const { isDirty } = useUnsavedChangesContext();
  const { t: translate } = useTranslation(['common', 'bpm']);
  const { isDark } = useTheme();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const currentYear = new Date().getFullYear();
  const years = React.useMemo(() => {
    const list = [];
    for (let i = currentYear - 3; i <= currentYear + 1; i++) {
      list.push(i.toString());
    }
    // Merge custom years that are not already in the list
    if (customYears) {
      customYears.forEach((y) => {
        if (!list.includes(y)) {
          list.push(y);
        }
      });
    }
    return list.sort((a, b) => parseInt(a) - parseInt(b));
  }, [currentYear, customYears]);

  const handleOpenDialog = () => {
    // Propose the next logical year
    const maxYear = years.length > 0 ? Math.max(...years.map(y => parseInt(y))) : currentYear;
    setNewYearInput((maxYear + 1).toString());
    setErrorMessage('');
    setIsDialogOpen(true);
  };

  const handleAddYear = () => {
    // Validate year format
    const yearNum = parseInt(newYearInput, 10);
    if (isNaN(yearNum) || newYearInput.trim().length !== 4 || !/^\d{4}$/.test(newYearInput.trim())) {
      setErrorMessage(translate('common:cycles.errorInvalidYear'));
      return;
    }

    const yearStr = yearNum.toString();
    if (years.includes(yearStr)) {
      setErrorMessage(translate('common:cycles.errorDuplicateYear'));
      return;
    }

    // Success: add custom year and switch to it
    addCustomYear(yearStr);
    setWorkingYear(yearStr);
    setIsDialogOpen(false);
    setNewYearInput('');
    setErrorMessage('');
  };

  return (
    <div className="flex items-center gap-2 mr-2">
      <Select 
        value={workingYear} 
        onValueChange={(val) => {
          if (val === 'add-new-year') {
            handleOpenDialog();
            return;
          }
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
          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          <SelectItem value="add-new-year" className="text-xs font-bold text-primary focus:text-primary-foreground focus:bg-primary">
            + {translate('common:cycles.addNewYear')}
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{translate('common:cycles.addYearDialogTitle')}</DialogTitle>
            <DialogDescription>
              {translate('common:cycles.addYearDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="new-year-input" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {translate('common:cycles.addYearInputLabel')}
              </label>
              <Input
                id="new-year-input"
                type="text"
                placeholder="2028"
                value={newYearInput}
                onChange={(e) => {
                  setNewYearInput(e.target.value);
                  setErrorMessage('');
                }}
                className="col-span-3 text-sm font-semibold"
              />
              {errorMessage && (
                <span className="text-xs text-destructive font-medium mt-1">
                  {errorMessage}
                </span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-xs font-bold">
              {translate('common:cycles.cancelButton')}
            </Button>
            <Button onClick={handleAddYear} className="text-xs font-bold">
              {translate('common:cycles.addYearButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
