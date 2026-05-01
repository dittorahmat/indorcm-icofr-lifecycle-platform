import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { CSASchedule, BPMProcess } from '@shared/types';
import { Calendar as CalendarIcon, ListTodo, Clock, CheckCircle2, AlertCircle, Plus, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogFooter, DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BPMModal } from '@/components/bpm/BPMModal';

export function TodoListPage() {
  const { t } = useTranslation(['csa', 'common']);
  const queryClient = useQueryClient();
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  // Execution Hub Modal State
  const [isHubOpen, setIsHubOpen] = React.useState(false);
  const [selectedHubProcess, setSelectedHubHubProcess] = React.useState<{ id: string, name: string, noGL: string, fsliName: string } | null>(null);

  const [formData, setFormData] = React.useState({
    bpmProcessId: '',
    type: 'CSA',
    plannedDate: format(new Date(), 'yyyy-MM-dd'),
    recurringFrequency: 'Monthly'
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['csa-schedules'],
    queryFn: () => api<{ items: CSASchedule[] }>('/api/csa/schedules'),
  });

  const { data: processes } = useQuery({
    queryKey: ['bpm-processes-all'],
    queryFn: () => api<{ items: BPMProcess[] }>('/api/bpm-processes'),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => api(`/api/csa/schedules/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csa-schedules'] });
      toast.success("Jadwal dihapus");
    }
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Hapus jadwal untuk "${name}"?`)) {
      deleteScheduleMutation.mutate(id);
    }
  };

  const handleOpenHub = (processId: string) => {
    const process = processes?.items.find(p => p.id === processId);
    if (process) {
      setSelectedHubHubProcess({
        id: process.id,
        name: process.name,
        noGL: process.noGL,
        fsliName: process.fsliName || 'N/A'
      });
      setIsHubOpen(true);
    }
  };

  const createScheduleMutation = useMutation({
    mutationFn: (data: any) => api('/api/csa/schedules', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csa-schedules'] });
      toast.success("Jadwal berhasil dibuat");
      setIsDialogOpen(false);
    }
  });

  const handleCreate = () => {
    if (!formData.bpmProcessId || !formData.plannedDate) {
      toast.error("Mohon lengkapi data");
      return;
    }
    createScheduleMutation.mutate(formData);
  };

  const selectedDateSchedules = React.useMemo(() => {
    if (!schedules?.items || !date) return [];
    return schedules.items.filter(s => {
      const pDate = new Date(s.plannedDate);
      return pDate.getDate() === date.getDate() &&
             pDate.getMonth() === date.getMonth() &&
             pDate.getFullYear() === date.getFullYear();
    });
  }, [schedules, date]);

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">To-do List & Calendar</h1>
            <p className="text-muted-foreground text-sm">Manage CSA schedules and remediation deadlines.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" /> Set Jadwal Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Set Jadwal Pengujian</DialogTitle>
                <DialogDescription>Tentukan rencana CSA atau Test untuk sub-proses bisnis.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Sub-Proses Bisnis</Label>
                  <Select value={formData.bpmProcessId} onValueChange={(v) => setFormData(prev => ({ ...prev, bpmProcessId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Pilih Sub-Proses" /></SelectTrigger>
                    <SelectContent>
                      {processes?.items.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipe Pengujian</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CSA">CSA (Self-Asessment)</SelectItem>
                        <SelectItem value="TOD">TOD (Design)</SelectItem>
                        <SelectItem value="TOE">TOE (Operating)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Frekuensi</Label>
                    <Select value={formData.recurringFrequency} onValueChange={(v) => setFormData(prev => ({ ...prev, recurringFrequency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly">Bulanan</SelectItem>
                        <SelectItem value="Quarterly">Triwulanan</SelectItem>
                        <SelectItem value="Semi-Annual">Semesteran</SelectItem>
                        <SelectItem value="Annual">Tahunan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <input 
                    type="date" 
                    className="w-full h-10 px-3 border rounded-md" 
                    value={formData.plannedDate} 
                    onChange={e => setFormData(prev => ({ ...prev, plannedDate: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button onClick={handleCreate} disabled={createScheduleMutation.isPending} className="bg-indigo-600">Simpan Jadwal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-indigo-600" />
                Compliance Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border border-slate-100"
                modifiers={{
                  scheduled: (date) => {
                    return !!schedules?.items.some(s => {
                      const pDate = new Date(s.plannedDate);
                      return pDate.getDate() === date.getDate() &&
                             pDate.getMonth() === date.getMonth() &&
                             pDate.getFullYear() === date.getFullYear();
                    });
                  }
                }}
                modifiersStyles={{
                  scheduled: { fontWeight: 'bold', textDecoration: 'underline', color: '#4f46e5' }
                }}
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b py-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <ListTodo className="h-5 w-5 text-indigo-600" />
                    Tasks for {date ? format(date, 'PPP') : 'Select a date'}
                  </CardTitle>
                  <CardDescription>Scheduled assessments and follow-ups.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-white">
                  {selectedDateSchedules.length} Items
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {selectedDateSchedules.length === 0 ? (
                <div className="py-20 text-center text-slate-400 italic">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  No tasks scheduled for this date.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selectedDateSchedules.map(schedule => {
                    const process = processes?.items.find(p => p.id === schedule.bpmProcessId);
                    return (
                      <div key={schedule.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-start group">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{process?.name || 'Unknown Process'}</span>
                            <Badge className={cn(
                              "text-[10px] uppercase font-black px-1.5 py-0",
                              schedule.type === 'CSA' ? "bg-blue-100 text-blue-700" :
                              schedule.type === 'TOE' ? "bg-purple-100 text-indigo-700" : "bg-orange-100 text-orange-700"
                            )}>
                              {schedule.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">Sub-proses ID: {schedule.bpmProcessId.substring(0,8)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <div className="flex items-center gap-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-indigo-600">
                                <Edit className="h-3.5 w-3.5" />
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-slate-300 hover:text-red-600"
                                onClick={() => handleDelete(schedule.id, process?.name || 'Proses')}
                                disabled={deleteScheduleMutation.isPending}
                             >
                                <Trash2 className="h-3.5 w-3.5" />
                             </Button>
                          </div>
                          <Badge variant="secondary" className={cn(
                            "text-[10px] font-bold",
                            schedule.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            schedule.status === 'In Progress' ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {schedule.status === 'Completed' ? <CheckCircle2 className="h-3 w-3 mr-1 inline" /> : 
                             schedule.status === 'Overdue' ? <AlertCircle className="h-3 w-3 mr-1 inline" /> : null}
                            {schedule.status}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-[10px] border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold shadow-sm"
                            onClick={() => handleOpenHub(schedule.bpmProcessId)}
                          >
                            Buka Execution Hub
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedHubProcess && (
          <BPMModal
            isOpen={isHubOpen}
            onOpenChange={setIsHubOpen}
            noGL={selectedHubProcess.noGL}
            glDesc={selectedHubProcess.name}
            fsliName={selectedHubProcess.fsliName}
            bpmProcessId={selectedHubProcess.id}
            year={format(new Date(), 'yyyy')}
          />
        )}
      </div>
    </AppLayout>
  );
}
