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
import { toast } from 'sonner';
import { BPMModal } from '@/components/bpm/BPMModal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';

export function TodoListPage() {
  const { t, i18n } = useTranslation(['csa', 'common', 'rcm', 'csa_hub']);
  const queryClient = useQueryClient();
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
  
  const blocker = useUnsavedChanges((isDirty && isDialogOpen) || (isRescheduleDirty && isRescheduleOpen));

  const { data: schedules } = useQuery({
    queryKey: ['csa-schedules'],
    queryFn: () => api<{ items: CSASchedule[] }>('/api/csa/schedules'),
  });

  const { data: remediations } = useQuery({
    queryKey: ['action-plans-all'],
    queryFn: () => api<{ items: ActionPlan[] }>('/api/actionplans'),
  });

  const { data: processes } = useQuery({
    queryKey: ['bpm-processes-all'],
    queryFn: () => api<{ items: BPMProcess[] }>('/api/bpm-processes'),
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
    if ((needsProcess && !formData.bpmProcessId) || !formData.plannedDate) {
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
          events.push({ ...s, eventType: 'SCHEDULE' });
        }
      });
    }

    // Add Remediation Activities
    if (remediations?.items) {
      remediations.items.forEach(r => {
        if (r.targetDate && isSameDay(new Date(r.targetDate), day)) {
          events.push({ ...r, eventType: 'REMEDIATION' });
        }
      });
    }

    return events;
  }, [schedules, remediations]);

  const monthlyTaskSummary = useMemo(() => {
    return calendarDays
      .filter(day => isSameMonth(day, currentDate))
      .map(day => ({ day, events: getEventsForDay(day) }))
      .filter(item => item.events.length > 0);
  }, [calendarDays, currentDate, getEventsForDay]);

  return (
    <AppLayout contentClassName="bg-slate-50/50">
      <div className="flex flex-col h-[calc(100vh-4rem)] border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden m-4">
        {/* Outlook-style Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
          <div className="flex items-center gap-4">
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (!open) {
                if (isDirty) {
                  if (confirm(t('common:unsavedChanges.description'))) {
                    setIsDialogOpen(false);
                    resetForm();
                  }
                } else {
                  setIsDialogOpen(false);
                  resetForm();
                }
                return;
              }
              setIsDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm" onClick={resetForm}>
                  <Plus className="h-4 w-4" /> {t('csa_hub:scheduling.newEvent')} <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{t('csa_hub:scheduling.title')}</DialogTitle>
                  <DialogDescription>{t('csa_hub:scheduling.description')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t('csa_hub:scheduling.activityType')}</Label>
                    <Select value={formData.type} onValueChange={(v) => updateFormData({ type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CSA">{t('csa_hub:scheduling.types.csa')}</SelectItem>
                        <SelectItem value="TOD">{t('csa_hub:scheduling.types.tod')}</SelectItem>
                        <SelectItem value="TOE">{t('csa_hub:scheduling.types.toe')}</SelectItem>
                        <SelectItem value="REMEDIATION">{t('csa_hub:scheduling.types.remediation')}</SelectItem>
                        <SelectItem value="SCOPING">{t('csa_hub:scheduling.types.scoping')}</SelectItem>
                        <SelectItem value="RCM">{t('csa_hub:scheduling.types.rcm')}</SelectItem>
                        <SelectItem value="SOC">{t('csa_hub:scheduling.types.soc')}</SelectItem>
                        <SelectItem value="INVESTEE">{t('csa_hub:scheduling.types.investee')}</SelectItem>
                        <SelectItem value="SIGNOFF">{t('csa_hub:scheduling.types.signoff')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {['CSA', 'TOD', 'TOE', 'RCM', 'REMEDIATION'].includes(formData.type) && (
                    <div className="space-y-2">
                      <Label>{t('csa_hub:scheduling.subProcess')}</Label>
                      <Select value={formData.bpmProcessId} onValueChange={(v) => updateFormData({ bpmProcessId: v })}>
                        <SelectTrigger><SelectValue placeholder={t('common:actions.select')} /></SelectTrigger>
                        <SelectContent>
                          {processes?.items.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>{t('csa_hub:scheduling.targetDate')}</Label>
                    <input 
                      type="date" 
                      className="w-full h-10 px-3 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500" 
                      value={formData.plannedDate} 
                      onChange={e => updateFormData({ plannedDate: e.target.value })}
                    />
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-700">
                      <Bell className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase">{t('csa_hub:scheduling.setReminder')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        className="w-20 h-9 px-2 border rounded-md text-sm"
                        value={formData.reminderConfig.value}
                        onChange={e => updateFormData({ reminderConfig: { ...formData.reminderConfig, value: parseInt(e.target.value) } })}
                      />
                      <Select 
                        value={formData.reminderConfig.unit} 
                        onValueChange={(v: any) => updateFormData({ reminderConfig: { ...formData.reminderConfig, unit: v } })}
                      >
                        <SelectTrigger className="h-9 w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minute">{t('csa_hub:scheduling.units.minute')}</SelectItem>
                          <SelectItem value="hour">{t('csa_hub:scheduling.units.hour')}</SelectItem>
                          <SelectItem value="day">{t('csa_hub:scheduling.units.day')}</SelectItem>
                          <SelectItem value="month">{t('csa_hub:scheduling.units.month')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-slate-500 font-medium">{t('csa_hub:scheduling.beforeDeadline')}</span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common:actions.cancel')}</Button>
                  <Button onClick={handleCreate} disabled={createScheduleMutation.isPending} className="bg-indigo-600 shadow-lg shadow-indigo-200">{t('csa_hub:scheduling.save')}</Button>
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
                    <input 
                      type="date" 
                      className="w-full h-10 px-3 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500" 
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
                    className="bg-indigo-600"
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
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-semibold" onClick={() => setCurrentDate(new Date())}>
                {t('common:calendar.today')}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
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
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3 bg-white border-b">
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
                        <p className="text-[10px] font-bold text-indigo-600 mb-2">{format(day, 'EEEE, d MMM')}</p>
                        <div className="space-y-1.5">
                          {events.map((e: any) => {
                            const isOverdue = e.status !== 'Completed' && isPast(new Date(e.plannedDate || e.targetDate));
                            const isCompleted = e.status === 'Completed';
                            const process = processes?.items.find(p => p.id === e.bpmProcessId);

                            return (
                              <Popover key={e.id}>
                                <PopoverTrigger asChild>
                                  <div className="text-[11px] text-slate-600 truncate flex items-center justify-between gap-1.5 p-1.5 rounded-md hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100 group/item">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <div className={cn(
                                        "w-2 h-2 rounded-full shrink-0",
                                        e.eventType === 'REMEDIATION' ? "bg-amber-500" : "bg-indigo-500"
                                      )} />
                                      <span className="truncate font-medium">
                                        {e.description || process?.name || t('common:status.active')}
                                      </span>
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0" align="start" side="right" sideOffset={10}>
                                  <div className="p-3 border-b bg-slate-50/50">
                                    <div className="flex justify-between items-start mb-1">
                                      <Badge variant="outline" className="text-[9px] uppercase font-bold bg-white">{e.type || 'REMEDIATION'}</Badge>
                                      <Badge className={cn(
                                        "text-[9px] font-mono uppercase",
                                        isCompleted ? "bg-emerald-600" : isOverdue ? "bg-red-600" : e.status === 'In Progress' ? "bg-amber-500" : "bg-indigo-600"
                                      )}>
                                        {e.status === 'Completed' ? t('csa_hub:status.completed') : 
                                         e.status === 'In Progress' ? t('csa_hub:status.started') : 
                                         isOverdue ? t('csa_hub:status.overdue') : t('csa_hub:status.pending')}
                                      </Badge>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-800 leading-snug">
                                      {process?.name || e.description || 'Activity Detail'}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> {format(new Date(e.plannedDate || e.targetDate), 'EEEE, d MMMM yyyy', { locale: i18n.language === 'id' ? idLocale : enUS })}
                                    </p>
                                  </div>
                                  <div className="p-2 grid grid-cols-1 gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="justify-start gap-2 h-8 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                                      onClick={() => handleOpenHub(e)}
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" /> {t('csa_hub:actions.execute')}
                                    </Button>
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

          {/* Monthly Grid */}
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            {/* Grid Header */}
            <div className="grid grid-cols-7 border-b bg-white shadow-sm">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid Body */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-7 auto-rows-fr min-h-full">
                {calendarDays.map((day, idx) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  
                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "min-h-[140px] border-r border-b p-1 transition-colors hover:bg-slate-100/50 group bg-white",
                        !isCurrentMonth && "bg-slate-50/50 text-slate-300"
                      )}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="flex justify-start mb-1 px-1">
                        <span className={cn(
                          "text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                          isToday(day) ? "bg-indigo-600 text-white" : "text-slate-500",
                          !isCurrentMonth && "opacity-30"
                        )}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => {
                          const isOverdue = event.status !== 'Completed' && isPast(new Date(event.plannedDate || event.targetDate));
                          const isCompleted = event.status === 'Completed';
                          const process = processes?.items.find(p => p.id === event.bpmProcessId);
                          
                          return (
                            <Popover key={event.id}>
                              <PopoverTrigger asChild>
                                <div 
                                  className={cn(
                                    "text-[10px] leading-tight p-1 px-1.5 rounded-sm border shadow-xs flex items-center justify-between group/pill cursor-pointer transition-all",
                                    isCompleted ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                                    (event.status === 'In Progress' && isOverdue) ? "bg-red-100 border-red-300 text-red-900 animate-pulse" :
                                    isOverdue ? "bg-red-50 border-red-200 text-red-800" :
                                    event.status === 'In Progress' ? "bg-amber-50 border-amber-200 text-amber-800" :
                                    "bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100",
                                    event.eventType === 'REMEDIATION' && event.severity === 'Material Weakness' && "border-l-4 border-l-slate-900 shadow-md",
                                    event.eventType === 'REMEDIATION' && event.severity === 'Significant Deficiency' && "border-l-4 border-l-orange-500 shadow-sm"
                                  )}
                                >
                                  <div className="flex items-center gap-1 overflow-hidden">
                                    {event.eventType === 'REMEDIATION' && (
                                      event.severity === 'Material Weakness' ? 
                                        <AlertCircle className="h-2 w-2 text-red-600" /> : 
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                    )}
                                    <span className="truncate font-medium">{process?.name || event.description || 'Activity'}</span>
                                    {event.reminderConfig && <Bell className="h-2 w-2 text-indigo-500 opacity-70 flex-shrink-0" />}
                                  </div>
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-0" align="start">
                                <div className="p-3 border-b bg-slate-50/50">
                                  <div className="flex justify-between items-start mb-1">
                                    <Badge variant="outline" className="text-[9px] uppercase font-bold bg-white">{event.type || 'REMEDIATION'}</Badge>
                                    <Badge className={cn(
                                      "text-[9px] font-mono",
                                      isCompleted ? "bg-emerald-600" : isOverdue ? "bg-red-600" : "bg-indigo-600"
                                    )}>{event.status || 'Pending'}</Badge>
                                  </div>
                                  <h4 className="text-xs font-black text-slate-800 leading-snug">
                                    {process?.name || event.description || 'Activity Detail'}
                                  </h4>
                                  <p className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {format(new Date(event.plannedDate || event.targetDate), 'EEEE, d MMMM yyyy')}
                                  </p>
                                </div>
                                <div className="p-2 grid grid-cols-1 gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="justify-start gap-2 h-8 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                                    onClick={() => handleOpenHub(event)}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> {t('csa_hub:actions.execute')}
                                  </Button>                                  {event.eventType === 'SCHEDULE' && (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="justify-start gap-2 h-8 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                        onClick={() => handleEditClick(event)}
                                      >
                                        <Plus className="h-3.5 w-3.5" /> Edit Details
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="justify-start gap-2 h-8 text-xs font-bold text-rose-600 hover:bg-rose-50"
                                        onClick={() => handleDeleteClick(event.id)}
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
                        {dayEvents.length > 3 && (
                          <div className="text-[9px] font-bold text-slate-400 px-1.5 py-0.5">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
            year={format(new Date(), 'yyyy')}
            scheduleId={selectedHubProcess.scheduleId}
          />
        )}
        <UnsavedChangesDialog blocker={blocker} />
      </div>
    </AppLayout>
  );
}
