import React, { useState, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { CSASchedule, BPMProcess, ActionPlan } from '@shared/types';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay
} from 'date-fns';
import { useTranslation } from 'react-i18next';

import { TodoScheduleDialog } from './components/TodoScheduleDialog';
import { TodoRescheduleDialog } from './components/TodoRescheduleDialog';
import { TodoTaskSidebar } from './components/TodoTaskSidebar';
import { toast } from 'sonner';
import { BPMModal } from '@/components/bpm/BPMModal';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { TodoListFilters } from '@/components/csa/TodoListFilters';
import { TodoListGrid } from '@/components/csa/TodoListGrid';
import { MobileTodoAgenda, AgendaEvent } from '@/components/csa/MobileTodoAgenda';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { useConfirm } from '@/hooks/use-confirm';

export function TodoListPage() {
  const { t, i18n } = useTranslation(['csa', 'common', 'rcm', 'csa_hub']);
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { workingYear } = useFiscalYearStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Execution Hub Modal State
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [selectedHubProcess, setSelectedHubProcess] = useState<{ id: string, name: string, noGL: string, fsliName: string, scheduleId?: string } | null>(null);

  const defaultPlannedDate = useMemo(() => {
    if (workingYear && workingYear !== new Date().getFullYear().toString()) {
      return `${workingYear}-01-15`;
    }
    return format(new Date(), 'yyyy-MM-dd');
  }, [workingYear]);

  const [formData, setFormData] = useState({
    bpmProcessId: '',
    description: '',
    type: 'CSA',
    plannedDate: defaultPlannedDate,
    reminderConfig: { value: 30, unit: 'minute' }
  });

  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    justification: ''
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isRescheduleDirty, setIsRescheduleDirty] = useState(false);
  
  useUnsavedChanges((isDirty && isDialogOpen) || (isRescheduleDirty && isRescheduleOpen));

  const { data: schedules } = useQuery({
    queryKey: ['csa-schedules', workingYear],
    queryFn: () => api<{ items: CSASchedule[] }>(`/api/csa/schedules?year=${workingYear}`),
  });

  const { data: remediations } = useQuery({
    queryKey: ['action-plans-all', workingYear],
    queryFn: () => api<{ items: ActionPlan[] }>(`/api/actionplans?year=${workingYear}`),
  });

  const { data: processes } = useQuery({
    queryKey: ['bpm-processes-all', workingYear],
    queryFn: () => api<{ items: BPMProcess[] }>(`/api/bpm-processes?year=${workingYear}`),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => api(`/api/csa/schedules/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csa-schedules'] });
      toast.success(t('common:notifications.success'));
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : undefined;
      toast.error(message || t('common:notifications.error'));
    }
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api(`/api/csa/schedules/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csa-schedules'] });
      toast.success(t('rcm:matrix.save_success'));
      setIsDialogOpen(false);
      setIsEditMode(false);
      setIsDirty(false);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : undefined;
      toast.error(message || t('common:notifications.error'));
    }
  });

  const handleOpenHub = (event: CSASchedule | AgendaEvent | string) => {
    const processId = typeof event === 'string' ? event : event.bpmProcessId;
    const scheduleId = typeof event === 'string' ? undefined : event.id;
    
    const process = processes?.items.find(p => p.id === processId);
    if (process) {
      setSelectedHubProcess({
        id: process.id,
        name: process.name,
        noGL: process.noGL,
        fsliName: process.fsliName || 'N/A',
        scheduleId: scheduleId // Pass schedule context
      });
      setIsHubOpen(true);
    } else {
      toast.error(t('common:notifications.processNotFound'));
    }
  };

  const createScheduleMutation = useMutation({
    mutationFn: (data: any) => api('/api/csa/schedules', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csa-schedules'] });
      toast.success(t('common:notifications.created'));
      setIsDialogOpen(false);
      setIsDirty(false);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : undefined;
      toast.error(message || t('common:notifications.error'));
    }
  });

  const handleCreate = () => {
    const needsProcess = ['CSA', 'TOD', 'TOE', 'RCM', 'REMEDIATION'].includes(formData.type);
    if ((needsProcess && !formData.description) || !formData.plannedDate) {
      toast.error(t('common:notifications.missingData'));
      return;
    }
    
    if (isEditMode && editingId) {
      updateScheduleMutation.mutate({ id: editingId, data: formData });
    } else {
      createScheduleMutation.mutate(formData);
    }
  };

  const handleEditClick = (event: any) => {
    setEditingId(event.id);
    setIsEditMode(true);
    setFormData({
      bpmProcessId: event.bpmProcessId || '',
      description: event.description || '',
      type: event.type,
      plannedDate: format(new Date(event.plannedDate), 'yyyy-MM-dd'),
      reminderConfig: event.reminderConfig || { value: 30, unit: 'minute' }
    });
    setIsDialogOpen(true);
    setIsDirty(false);
  };

  const handleDeleteClick = async (id: string) => {
    const ok = await confirm({
      title: t('common:actions.delete'),
      description: t('csa_hub:scheduling.delete_confirm', { defaultValue: 'Are you sure you want to remove this schedule?' }),
      variant: 'destructive',
    });
    if (ok) {
      deleteScheduleMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      bpmProcessId: '',
      description: '',
      type: 'CSA',
      plannedDate: defaultPlannedDate,
      reminderConfig: { value: 30, unit: 'minute' }
    });
    setIsDirty(false);
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getEventsForDay = useCallback((day: Date) => {
    const events: any[] = [];
    
    // Add CSA/TOD/TOE Schedules
    if (schedules?.items) {
      schedules.items.forEach(s => {
        if (isSameDay(new Date(s.plannedDate), day)) {
          const process = processes?.items.find(p => p.id === s.bpmProcessId);
          events.push({ 
            ...s, 
            eventType: 'SCHEDULE',
            // Pre-resolve the title for consistency across all views
            displayTitle: s.description || process?.name || s.type
          });
        }
      });
    }

    // Add Remediation Activities
    if (remediations?.items) {
      remediations.items.forEach(r => {
        if (r.targetDate && isSameDay(new Date(r.targetDate), day)) {
          events.push({ 
            ...r, 
            eventType: 'REMEDIATION',
            displayTitle: r.description || 'Remediation Activity'
          });
        }
      });
    }

    return events;
  }, [schedules, remediations, processes]);

  const monthlyTaskSummary = useMemo(() => {
    return calendarDays
      .filter(day => isSameMonth(day, currentDate))
      .map(day => ({ day, events: getEventsForDay(day) }))
      .filter(item => item.events.length > 0);
  }, [calendarDays, currentDate, getEventsForDay]);

  const allCalendarEvents = useMemo(() => {
    const list: AgendaEvent[] = [];
    calendarDays.forEach(day => {
      const dayEvts = getEventsForDay(day);
      dayEvts.forEach(e => {
        if (!list.some(existing => existing.id === e.id)) {
          list.push(e);
        }
      });
    });
    return list;
  }, [calendarDays, getEventsForDay]);

  return (
    <AppLayout container={false}>
      <div className="flex flex-col h-[calc(100dvh-64px)] overflow-hidden">
        {/* Calendar Header with Controls */}
        <TodoListFilters 
          currentDate={currentDate}
          onPrevMonth={() => setCurrentDate(subMonths(currentDate, 1))}
          onNextMonth={() => setCurrentDate(addMonths(currentDate, 1))}
          onToday={() => setCurrentDate(new Date())}
          onCreateClick={() => { resetForm(); setIsDialogOpen(true); }}
        />

        <div className="flex flex-1 overflow-hidden">
          <TodoTaskSidebar
            currentDate={currentDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onMonthChange={setCurrentDate}
            monthlyTaskSummary={monthlyTaskSummary}
            onOpenHub={handleOpenHub}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
          />

          {/* Desktop Calendar Grid */}
          <div className="hidden md:flex flex-1 overflow-hidden">
            <TodoListGrid 
              calendarDays={calendarDays}
              currentDate={currentDate}
              getEventsForDay={getEventsForDay}
              onSelectDate={setSelectedDate}
            />
          </div>

          {/* Mobile Agenda Feed View */}
          <div className="md:hidden flex-1 overflow-y-auto">
            <MobileTodoAgenda 
              events={allCalendarEvents}
              onOpenHub={handleOpenHub}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
            />
          </div>
        </div>

        {selectedHubProcess && (
          <BPMModal
            isOpen={isHubOpen}
            onOpenChange={setIsHubOpen}
            noGL={selectedHubProcess.noGL}
            glDesc={selectedHubProcess.name}
            fsliName={selectedHubProcess.fsliName}
            bpmProcessId={selectedHubProcess.id}
            subProcessName={selectedHubProcess.name}
            year={workingYear ? String(workingYear) : format(new Date(), 'yyyy')}
            scheduleId={selectedHubProcess.scheduleId}
            initialTab="csa"
          />
        )}
        
        <TodoScheduleDialog
          isOpen={isDialogOpen}
          isEditMode={isEditMode}
          isDirty={isDirty}
          formData={formData}
          onOpenChange={setIsDialogOpen}
          onUpdateFormData={updateFormData}
          onSubmit={handleCreate}
          onReset={resetForm}
        />

        <TodoRescheduleDialog
          isOpen={isRescheduleOpen}
          isRescheduleDirty={isRescheduleDirty}
          rescheduleData={rescheduleData}
          onOpenChange={(open) => {
            setIsRescheduleOpen(open);
            if (!open) setIsRescheduleDirty(false);
          }}
          onUpdateRescheduleData={(updates) => {
            setRescheduleData(prev => ({ ...prev, ...updates }));
            setIsRescheduleDirty(true);
          }}
          onSubmit={() => {
            toast.success(t('rcm:matrix.save_success'));
            setIsRescheduleOpen(false);
            setIsRescheduleDirty(false);
          }}
        />
      </div>
    </AppLayout>
  );
}
