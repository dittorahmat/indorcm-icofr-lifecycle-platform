import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, UserCheck, Download, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface TestingToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showOnlyValidated: boolean;
  onToggleValidated: (value: boolean) => void;
  isExportingExcel: boolean;
  onExportExcel: () => void;
}

export function TestingToolbar({
  searchTerm,
  onSearchChange,
  showOnlyValidated,
  onToggleValidated,
  isExportingExcel,
  onExportExcel,
}: TestingToolbarProps) {
  const { t } = useTranslation(['testing', 'reports']);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
      {/* Search Input */}
      <div className="relative group w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder={t('searchPlaceholder')} 
          className="pl-8.5 h-10 sm:h-9 min-h-[44px] sm:min-h-0 w-full bg-slate-50/50 border-slate-200 text-base sm:text-xs font-medium rounded-lg focus:bg-white"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter and Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
        <div className="flex items-center justify-between sm:justify-start gap-2.5 bg-slate-50/80 min-h-[44px] h-auto sm:h-9 py-1.5 sm:py-0 px-3 sm:px-3.5 rounded-lg border border-slate-200 shrink-0">
          <Switch 
            id="validated-filter" 
            checked={showOnlyValidated} 
            onCheckedChange={onToggleValidated} 
            className="data-[state=checked]:bg-secondary"
          />
          <Label htmlFor="validated-filter" className="text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer flex items-center gap-1.5 select-none">
            <UserCheck className="h-3.5 w-3.5 text-secondary shrink-0" /> {t('filterReady')}
          </Label>
        </div>

        <Button
          variant="outline"
          onClick={onExportExcel}
          disabled={isExportingExcel}
          className="h-10 sm:h-9 min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-center px-3.5 gap-2 bg-white border-slate-200 text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs hover:bg-slate-50 shrink-0"
        >
          {isExportingExcel ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4 text-secondary" />
          )}
          {t('exportExcel')}
        </Button>
      </div>
    </div>
  );
}
