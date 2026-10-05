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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-4 border-b bg-background sticky top-0 z-20">
      <div className="flex items-center justify-between sm:justify-start gap-3 flex-wrap">
        <Button onClick={onCreateClick} size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-2 font-bold h-11 sm:h-9 min-h-[44px] sm:min-h-0 w-full min-[420px]:w-auto justify-center text-xs rounded-md">
          <Plus className="h-4 w-4" /> {t('csa_hub:scheduling.newEvent')}
        </Button>
        
        <div className="flex items-center gap-1">
          <Tabs defaultValue="month" className="block max-w-full">
            <TabsList className="bg-slate-100/50 p-1 max-w-full overflow-x-auto touch-pan-x overscroll-x-contain no-scrollbar flex sm:inline-flex">
              <TabsTrigger value="day" className="text-xs px-3 sm:px-4 shrink-0 min-h-[44px] flex items-center justify-center">{t('common:calendar.day')}</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-3 sm:px-4 shrink-0 min-h-[44px] flex items-center justify-center">{t('common:calendar.week')}</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-3 sm:px-4 shrink-0 min-h-[44px] flex items-center justify-center">{t('common:calendar.month')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <div className="flex items-center border rounded-md p-0.5 bg-slate-50 shrink-0">
            <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9 rounded-md min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0" onClick={onPrevMonth} aria-label={t('common:calendar.prevMonth', { defaultValue: 'Bulan sebelumnya' })}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-11 sm:h-9 px-2.5 sm:px-3 text-xs font-semibold min-h-[44px] sm:min-h-0" onClick={onToday}>
              {t('common:calendar.today')}
            </Button>
            <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9 rounded-md min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0" onClick={onNextMonth} aria-label={t('common:calendar.nextMonth', { defaultValue: 'Bulan berikutnya' })}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-700 truncate min-w-0">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <div className="h-4 w-[1px] bg-slate-200 mx-1 shrink-0 hidden min-[420px]:block" />
          <Button variant="ghost" size="icon" aria-label={t('common:actions.search', { defaultValue: 'Cari' })} className="h-11 w-11 sm:h-9 sm:w-9 text-slate-500 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 shrink-0 rounded-md"><Search className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" aria-label={t('common:actions.print', { defaultValue: 'Cetak' })} className="h-11 w-11 sm:h-9 sm:w-9 text-slate-500 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 shrink-0 rounded-md"><Printer className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
