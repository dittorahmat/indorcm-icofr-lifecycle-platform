import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, ChevronRight, Search, Printer, Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface TodoListFiltersProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onCreateClick: () => void;
}

export function TodoListFilters({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  onCreateClick
}: TodoListFiltersProps) {
  const { t } = useTranslation(['csa', 'common', 'csa_hub']);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border-b bg-background sticky top-0 z-20">
      <div className="flex items-center justify-between sm:justify-start gap-3 flex-wrap">
        <Button onClick={onCreateClick} size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-2 font-bold h-9 min-h-[36px] text-xs">
          <Plus className="h-4 w-4" /> {t('csa_hub:scheduling.newEvent')}
        </Button>
        
        <div className="flex items-center gap-1">
          <Tabs defaultValue="month" className="block max-w-full">
            <TabsList className="bg-slate-100/50 p-1 max-w-full overflow-x-auto no-scrollbar flex sm:inline-flex">
              <TabsTrigger value="day" className="text-xs px-3 sm:px-4 shrink-0">{t('common:calendar.day')}</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-3 sm:px-4 shrink-0">{t('common:calendar.week')}</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-3 sm:px-4 shrink-0">{t('common:calendar.month')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between sm:justify-end gap-2 flex-wrap">
        <div className="flex items-center border rounded-md p-0.5 bg-slate-50 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 rounded-sm min-h-[32px] min-w-[32px]" onClick={onPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 sm:h-7 px-2.5 sm:px-3 text-xs font-semibold min-h-[32px]" onClick={onToday}>
            {t('common:calendar.today')}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 rounded-sm min-h-[32px] min-w-[32px]" onClick={onNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-xs sm:text-sm font-bold text-slate-700 ml-1 sm:ml-2 truncate">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="h-4 w-[1px] bg-slate-200 mx-1 shrink-0" />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 min-h-[32px] min-w-[32px] shrink-0"><Search className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 min-h-[32px] min-w-[32px] shrink-0"><Printer className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
