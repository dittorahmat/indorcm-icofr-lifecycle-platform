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
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <Button onClick={onCreateClick} size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 gap-2 font-bold h-9">
          <Plus className="h-4 w-4" /> {t('csa_hub:scheduling.newEvent')}
        </Button>
        
        <div className="flex items-center gap-1">
          <Tabs defaultValue="month" className="hidden md:block">
            <TabsList className="bg-slate-100/50 p-1">
              <TabsTrigger value="day" className="text-xs px-4">{t('common:calendar.day')}</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-4">{t('common:calendar.week')}</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-4">{t('common:calendar.month')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center border rounded-md p-0.5 bg-slate-50">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={onPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-semibold" onClick={onToday}>
            {t('common:calendar.today')}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={onNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-sm font-bold text-slate-700 ml-2">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="h-4 w-[1px] bg-slate-200 mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500"><Search className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500"><Printer className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
