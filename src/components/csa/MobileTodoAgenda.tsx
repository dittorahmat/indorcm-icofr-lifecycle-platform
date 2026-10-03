import React from 'react';
import { cn } from '@/lib/utils';
import { format, isPast, isToday } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, ChevronRight, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface AgendaEvent {
  id: string;
  eventType: 'SCHEDULE' | 'REMEDIATION';
  displayTitle: string;
  plannedDate?: string;
  targetDate?: string;
  type?: string;
  status?: string;
  bpmProcessId?: string;
  description?: string;
}

interface MobileTodoAgendaProps {
  events: AgendaEvent[];
  onOpenHub: (event: AgendaEvent) => void;
  onEditClick: (event: AgendaEvent) => void;
  onDeleteClick: (id: string) => void;
}

export function MobileTodoAgenda({
  events,
  onOpenHub,
  onEditClick,
  onDeleteClick,
}: MobileTodoAgendaProps) {
  const { t, i18n } = useTranslation(['csa_hub', 'common']);
  const currentLocale = i18n.language === 'id' ? idLocale : enUS;

  // Group events into Today, Overdue, and Upcoming
  const { overdue, today, upcoming } = React.useMemo(() => {
    const overdueList: AgendaEvent[] = [];
    const todayList: AgendaEvent[] = [];
    const upcomingList: AgendaEvent[] = [];

    events.forEach((item) => {
      const dateStr = item.plannedDate || item.targetDate;
      if (!dateStr) return;
      const date = new Date(dateStr);

      if (isToday(date)) {
        todayList.push(item);
      } else if (isPast(date) && item.status !== 'Completed') {
        overdueList.push(item);
      } else {
        upcomingList.push(item);
      }
    });

    return {
      overdue: overdueList,
      today: todayList,
      upcoming: upcomingList,
    };
  }, [events]);

  const renderEventCard = (e: AgendaEvent, isOverdueCategory: boolean = false) => {
    const isCompleted = e.status === 'Completed';
    const dateStr = e.plannedDate || e.targetDate;
    const dateObj = dateStr ? new Date(dateStr) : new Date();

    return (
      <div
        key={e.id}
        data-testid={`agenda-card-${e.id}`}
        className={cn(
          "p-3.5 bg-card border rounded-lg shadow-sm space-y-2.5 transition-colors",
          isOverdueCategory
            ? "border-red-200 dark:border-red-900/40 bg-red-50/20"
            : "border-border"
        )}
      >
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-xs uppercase font-semibold",
                e.eventType === 'REMEDIATION'
                  ? "border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/30"
                  : "border-primary/40 text-primary bg-primary/5"
              )}
            >
              {e.type || (e.eventType === 'REMEDIATION' ? 'Remediation' : 'CSA')}
            </Badge>

            <Badge
              className={cn(
                "text-xs font-semibold",
                isCompleted
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                  : isOverdueCategory
                  ? "bg-destructive hover:bg-destructive text-destructive-foreground font-bold"
                  : e.status === 'In Progress'
                  ? "bg-amber-500 hover:bg-amber-500 text-white"
                  : "bg-slate-700 hover:bg-slate-700 text-white"
              )}
            >
              {isCompleted
                ? t('csa_hub:status.completed', { defaultValue: 'Selesai' })
                : isOverdueCategory
                ? t('csa_hub:status.overdue', { defaultValue: 'Terlambat' })
                : e.status === 'In Progress'
                ? t('csa_hub:status.started', { defaultValue: 'Sedang Berjalan' })
                : t('csa_hub:status.pending', { defaultValue: 'Menunggu' })}
            </Badge>
          </div>

          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 font-medium">
            <Clock className="h-3.5 w-3.5" />
            {format(dateObj, 'd MMM yyyy', { locale: currentLocale })}
          </span>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground leading-snug break-words">
            {e.displayTitle || t('common:status.active', { defaultValue: 'Aktivitas Kepatuhan' })}
          </h4>
          {e.description && e.description !== e.displayTitle && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2" title={e.description}>
              {e.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            {e.eventType === 'SCHEDULE' && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => onEditClick(e)}
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  {t('common:actions.edit', { defaultValue: 'Edit' })}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] px-2 text-xs font-medium text-destructive hover:bg-destructive/10"
                  onClick={() => onDeleteClick(e.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {t('common:actions.delete', { defaultValue: 'Hapus' })}
                </Button>
              </>
            )}
          </div>

          {e.bpmProcessId ? (
            <Button
              type="button"
              size="sm"
              className="min-h-[44px] px-3 text-xs font-semibold bg-primary text-primary-foreground gap-1.5 ml-auto"
              onClick={() => onOpenHub(e)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('csa_hub:actions.execute', { defaultValue: 'Eksekusi / Review' })}
            </Button>
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
          )}
        </div>
      </div>
    );
  };

  const hasAnyEvent = overdue.length > 0 || today.length > 0 || upcoming.length > 0;

  if (!hasAnyEvent) {
    return (
      <div className="p-8 text-center bg-card border rounded-lg my-4 space-y-2">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm font-semibold text-foreground">
          {t('common:calendar.noTasks', { defaultValue: 'Tidak ada tugas atau agenda' })}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('csa_hub:scheduling.description', { defaultValue: 'Gunakan tombol + untuk membuat jadwal evaluasi baru' })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-3 pb-8" data-testid="mobile-todo-agenda">
      {/* 1. Overdue Section */}
      {overdue.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 flex-wrap gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-600 animate-none inline-block" />
              {t('csa_hub:status.overdue', { defaultValue: 'Terlambat / Perlu Tindakan Segera' })}
            </h3>
            <Badge variant="destructive" className="text-xs font-bold px-1.5 py-0 h-5">
              {overdue.length}
            </Badge>
          </div>
          <div className="space-y-2.5">
            {overdue.map(e => renderEventCard(e, true))}
          </div>
        </div>
      )}

      {/* 2. Today Section */}
      {today.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 flex-wrap gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary inline-block" />
              {t('common:calendar.today', { defaultValue: 'Hari Ini' })}
            </h3>
            <Badge className="text-xs font-bold px-1.5 py-0 h-5 bg-primary text-primary-foreground">
              {today.length}
            </Badge>
          </div>
          <div className="space-y-2.5">
            {today.map(e => renderEventCard(e, false))}
          </div>
        </div>
      )}

      {/* 3. Upcoming Section */}
      {upcoming.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 flex-wrap gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60 inline-block" />
              {t('common:status.upcoming', { defaultValue: 'Mendatang' })}
            </h3>
            <Badge variant="outline" className="text-xs font-semibold px-1.5 py-0 h-5">
              {upcoming.length}
            </Badge>
          </div>
          <div className="space-y-2.5">
            {upcoming.map(e => renderEventCard(e, false))}
          </div>
        </div>
      )}
    </div>
  );
}
