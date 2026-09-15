import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { CSASchedule, BPMProcess, ActionPlan, User } from '@shared/types';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Printer, 
  Share2, 
  RefreshCcw,
  Bell,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  ChevronDown,
  Trash2
} from 'lucide-react';
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
  isSameDay, 
  isToday,
  isPast
} from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogFooter, DialogTrigger 
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BPMModal } from '@/components/bpm/BPMModal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { TodoListFilters } from '@/components/csa/TodoListFilters';
import { TodoListGrid } from '@/components/csa/TodoListGrid';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';

export function TodoListPage() {
  const { t, i18n } = useTranslation(['csa', 'common', 'rcm', 'csa_hub']);
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

  const [formData, setFormData] = useState({
    bpmProcessId: '',
    description: '',
    type: 'CSA',
    plannedDate: format(new Date(), 'yyyy-MM-dd'),
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
    queryKey: ['csa-schedules'],
    queryFn: () => api<{ items: CSASchedule[] }>('/api/csa/schedules'),
  });

  const { data: remediations } = useQuery({
    queryKey: ['action-plans-all'],
    queryFn: () => api<{ items: ActionPlan[] }>('/api/actionplans'),
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
    }
  });

  const handleOpenHub = (event: CSASchedule | string) => {
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

  const handleDeleteClick = (id: string) => {
    if (confirm(t('common:unsavedChanges.description'))) {
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
      plannedDate: format(new Date(), 'yyyy-MM-dd'),
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

  return (
    <AppLayout container={false}>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Calendar Header with Controls */}
        <TodoListFilters 
          currentDate={currentDate}
          onPrevMonth={() => setCurrentDate(subMonths(currentDate, 1))}
          onNextMonth={() => setCurrentDate(addMonths(currentDate, 1))}
          onToday={() => setCurrentDate(new Date())}
          onCreateClick={() => { resetForm(); setIsDialogOpen(true); }}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Calendar Sidebar */}
          <div className="w-64 border-r bg-slate-50/30 flex flex-col overflow-hidden">
            <div className="p-4 border-b">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentDate}
                onMonthChange={setCurrentDate}
                className="rounded-md border-none p-0 w-full"
                classNames={{
                   month_caption: "hidden",
                   nav: "hidden",
                   day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                   today: "bg-indigo-100 text-indigo-900 font-bold",
                   selected: "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white"
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
                    <div className="p-8 text-center text-slate-400 text-xs italic">
                      {t('common:calendar.noTasks')}
                    </div>
                  ) : (
                    monthlyTaskSummary.map(({ day, events }) => (
                      <div key={day.toISOString()} className="p-3 bg-white border-b last:border-b-0">
                        <p className="text-xs font-bold text-indigo-600 mb-2">{format(day, 'EEEE, d MMM')}</p>
                        <div className="space-y-1.5">
                          {events.map((e: any) => {
                            const isOverdue = e.status !== 'Completed' && isPast(new Date(e.plannedDate || e.targetDate));
                            const isCompleted = e.status === 'Completed';
                            const process = processes?.items.find(p => p.id === e.bpmProcessId);

                            return (
                              <Popover key={e.id}>
                                <PopoverTrigger asChild>
                                  <div className="text-xs text-slate-600 truncate flex items-center justify-between gap-1.5 p-1.5 rounded-md hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100 group/item">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <div className={cn(
                                        "w-2 h-2 rounded-full shrink-0",
                                        e.eventType === 'REMEDIATION' ? "bg-amber-500" : "bg-indigo-500"
                                      )} />
                                      <span className="truncate font-medium">
                                        {e.displayTitle || t('common:status.active')}
                                      </span>
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0" align="start" side="right" sideOffset={10}>
                                  <div className="p-3 border-b bg-slate-50/50">
                                    <div className="flex justify-between items-start mb-1">
                                      <Badge variant="outline" className="text-xs uppercase font-bold bg-white">{e.type || 'REMEDIATION'}</Badge>
                                      <Badge className={cn(
                                        "text-xs font-mono uppercase",
                                        isCompleted ? "bg-emerald-600" : isOverdue ? "bg-red-600" : e.status === 'In Progress' ? "bg-amber-500" : "bg-indigo-600"
                                      )}>
                                        {e.status === 'Completed' ? t('csa_hub:status.completed') : 
                                         e.status === 'In Progress' ? t('csa_hub:status.started') : 
                                         isOverdue ? t('csa_hub:status.overdue') : t('csa_hub:status.pending')}
                                      </Badge>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-800 leading-snug">
                                      {e.displayTitle || 'Activity Detail'}
                                    </h4>
                                    <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> {format(new Date(e.plannedDate || e.targetDate), 'EEEE, d MMMM yyyy', { locale: i18n.language === 'id' ? idLocale : enUS })}
                                    </p>
                                  </div>
                                  <div className="p-2 grid grid-cols-1 gap-1">
                                    {e.bpmProcessId && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="justify-start gap-2 h-8 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                                        onClick={() => handleOpenHub(e)}
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5" /> {t('csa_hub:actions.execute')}
                                      </Button>
                                    )}
                                    {e.eventType === 'SCHEDULE' && (
                                      <>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="justify-start gap-2 h-8 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                          onClick={() => handleEditClick(e)}
                                        >
                                          <Plus className="h-3.5 w-3.5" /> Edit Details
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="justify-start gap-2 h-8 text-xs font-bold text-rose-600 hover:bg-rose-50"
                                          onClick={() => handleDeleteClick(e.id)}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" /> Remove Schedule
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

          <TodoListGrid 
            calendarDays={calendarDays}
            currentDate={currentDate}
            getEventsForDay={getEventsForDay}
            onSelectDate={setSelectedDate}
          />
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
            year={format(new Date(), 'yyyy')}
            scheduleId={selectedHubProcess.scheduleId}
            initialTab="csa"
          />
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open && isDirty) {
            if (confirm(t('common:unsavedChanges.description'))) {
              setIsDialogOpen(false);
              resetForm();
            }
          } else {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditMode ? t('csa_hub:actions.execute') : t('csa_hub:scheduling.newEvent')}</DialogTitle>
              <DialogDescription>{t('csa_hub:scheduling.description')}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t('csa_hub:scheduling.activityType')}</Label>
                <Select value={formData.type} onValueChange={(v) => updateFormData({ type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSA">{t('csa_hub:scheduling.types.csa')}</SelectItem>
                    <SelectItem value="TOD">{t('csa_hub:scheduling.types.tod')}</SelectItem>
                    <SelectItem value="TOE">{t('csa_hub:scheduling.types.toe')}</SelectItem>
                    <SelectItem value="REMEDIATION">{t('csa_hub:scheduling.types.remediation')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Detail Activity</Label>
                <Input 
                  placeholder="e.g. Weekly Review, Monthly Closing" 
                  value={formData.description} 
                  onChange={(e) => updateFormData({ description: e.target.value })} 
                />
              </div>
              <div className="grid gap-2">
                <Label>{t('csa_hub:scheduling.targetDate')}</Label>
                <Input type="date" value={formData.plannedDate} onChange={(e) => updateFormData({ plannedDate: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common:actions.cancel')}</Button>
              <Button onClick={handleCreate}>{t('csa_hub:scheduling.save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reschedule Dialog */}
        <Dialog open={isRescheduleOpen} onOpenChange={(open) => {
          if (!open && isRescheduleDirty) {
            if (confirm(t('common:unsavedChanges.description'))) {
              setIsRescheduleOpen(false);
              setIsRescheduleDirty(false);
            }
            return;
          }
          setIsRescheduleOpen(open);
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('csa_hub:scheduling.reschedule.title')}</DialogTitle>
              <DialogDescription>{t('csa_hub:scheduling.reschedule.description')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('csa_hub:scheduling.reschedule.newDate')}</Label>
                <Input
                  type="date"
                  value={rescheduleData.newDate}
                  onChange={e => {
                    setRescheduleData(prev => ({ ...prev, newDate: e.target.value }));
                    setIsRescheduleDirty(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('csa_hub:scheduling.reschedule.justification')} <span className="text-red-500">*</span></Label>
                <textarea
                  className="w-full min-h-[100px] p-3 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('csa_hub:scheduling.reschedule.placeholder')}
                  value={rescheduleData.justification}
                  onChange={e => {
                    setRescheduleData(prev => ({ ...prev, justification: e.target.value }));
                    setIsRescheduleDirty(true);
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRescheduleOpen(false)}>{t('common:actions.cancel')}</Button>
              <Button
                disabled={!rescheduleData.justification.trim() || !rescheduleData.newDate}
                onClick={() => {
                  toast.success(t('rcm:matrix.save_success'));
                  setIsRescheduleOpen(false);
                  setIsRescheduleDirty(false);
                }}
              >
                {t('csa_hub:scheduling.reschedule.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
