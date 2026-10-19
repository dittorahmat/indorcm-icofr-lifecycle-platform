import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isPast } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Plus, ChevronRight, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import type { AgendaEvent } from '@/components/csa/MobileTodoAgenda';

export interface MonthlyTaskItem {
  day: Date;
  events: AgendaEvent[];
}

interface TodoTaskSidebarProps {
  currentDate: Date;
  selectedDate?: Date;
  onSelectDate: (date: Date | undefined) => void;
  onMonthChange: (date: Date) => void;
  monthlyTaskSummary: MonthlyTaskItem[];
  onOpenHub: (event: AgendaEvent) => void;
  onEditClick: (event: AgendaEvent) => void;
  onDeleteClick: (id: string) => void;
}

export function TodoTaskSidebar({
  currentDate,
  selectedDate,
  onSelectDate,
  onMonthChange,
  monthlyTaskSummary,
  onOpenHub,
  onEditClick,
  onDeleteClick,
}: TodoTaskSidebarProps) {
  const { t, i18n } = useTranslation(['csa_hub', 'common']);
  const activeLocale = i18n.language === 'id' ? idLocale : enUS;

  return (
    <div className="hidden md:flex w-64 border-r bg-slate-50/30 flex-col overflow-hidden">
      <div className="p-4 border-b">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          month={currentDate}
          onMonthChange={onMonthChange}
          className="rounded-md border-none p-0 w-full"
          classNames={{
            month_caption: 'hidden',
            nav: 'hidden',
            day: 'h-8 w-8 p-0 font-normal aria-selected:opacity-100',
            today: 'bg-indigo-100 text-indigo-900 font-bold',
            selected: 'bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white',
          }}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-4 py-3 bg-white border-b">
          {t('common:calendar.todoTitle')}
        </h3>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-slate-100">
            {monthlyTaskSummary.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                {t('common:calendar.noTasks')}
              </div>
            ) : (
              monthlyTaskSummary.map(({ day, events }) => (
                <div key={day.toISOString()} className="p-3 bg-white border-b last:border-b-0">
                  <p className="text-xs font-bold text-indigo-600 mb-2">
                    {format(day, 'EEEE, d MMM', { locale: activeLocale })}
                  </p>
                  <div className="space-y-1.5">
                    {events.map((e: AgendaEvent) => {
                      const isOverdue =
                        e.status !== 'Completed' &&
                        isPast(new Date(e.plannedDate || e.targetDate));
                      const isCompleted = e.status === 'Completed';

                      return (
                        <Popover key={e.id}>
                          <PopoverTrigger asChild>
                            <div className="text-xs text-slate-600 truncate flex items-center justify-between gap-1.5 p-1.5 rounded-md hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100 group/item flex-wrap">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div
                                  className={cn(
                                    'w-2 h-2 rounded-full shrink-0',
                                    e.eventType === 'REMEDIATION'
                                      ? 'bg-amber-500'
                                      : 'bg-indigo-500'
                                  )}
                                />
                                <span className="truncate font-medium">
                                  {e.displayTitle || t('common:status.active')}
                                </span>
                              </div>
                              <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-64 max-w-[calc(100vw-2rem)] p-0"
                            align="start"
                            side="right"
                            sideOffset={10}
                            avoidCollisions={true}
                          >
                            <div className="p-3 border-b bg-slate-50/50">
                              <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs uppercase font-bold bg-white"
                                >
                                  {e.type || 'REMEDIATION'}
                                </Badge>
                                <Badge
                                  className={cn(
                                    'text-xs font-mono uppercase',
                                    isCompleted
                                      ? 'bg-emerald-600'
                                      : isOverdue
                                      ? 'bg-red-600'
                                      : e.status === 'In Progress'
                                      ? 'bg-amber-500'
                                      : 'bg-indigo-600'
                                  )}
                                >
                                  {e.status === 'Completed'
                                    ? t('csa_hub:status.completed')
                                    : e.status === 'In Progress'
                                    ? t('csa_hub:status.started')
                                    : isOverdue
                                    ? t('csa_hub:status.overdue')
                                    : t('csa_hub:status.pending')}
                                </Badge>
                              </div>
                              <h4 className="text-xs font-black text-slate-800 leading-snug">
                                {e.displayTitle || t('csa_hub:scheduling.detailActivity', { defaultValue: 'Activity Detail' })}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />{' '}
                                {format(new Date(e.plannedDate || e.targetDate), 'EEEE, d MMMM yyyy', {
                                  locale: activeLocale,
                                })}
                              </p>
                            </div>
                            <div className="p-2 grid grid-cols-1 gap-1">
                              {e.bpmProcessId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="justify-start gap-2 h-8 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                                  onClick={() => onOpenHub(e)}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                                  {t('csa_hub:actions.execute')}
                                </Button>
                              )}
                              {e.eventType === 'SCHEDULE' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2 h-8 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                    onClick={() => onEditClick(e)}
                                  >
                                    <Plus className="h-3.5 w-3.5" />{' '}
                                    {t('csa_hub:scheduling.editDetails', { defaultValue: 'Edit Details' })}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2 h-8 text-xs font-bold text-rose-600 hover:bg-rose-50"
                                    onClick={() => onDeleteClick(e.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />{' '}
                                    {t('csa_hub:scheduling.removeSchedule', { defaultValue: 'Remove Schedule' })}
                                  </Button>
                                </>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
