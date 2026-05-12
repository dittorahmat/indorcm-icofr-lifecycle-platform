import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { CSARecord, BPMProcess, Control } from '@shared/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Printer, Search, Download, History, ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CSAReviewMatrix } from '@/components/csa/CSAReviewMatrix';
import { TODVerificationDialog } from '@/components/csa/TODVerificationDialog';
import { useTOD } from '@/hooks/useTOD';

function CSARecordRow({ record: initialRecord, process }: { record: CSARecord, process?: BPMProcess }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [selectedControl, setSelectedControl] = React.useState<Control | null>(null);
  
  const { evaluations, saveMutation } = useTOD(initialRecord.id);

  // Fetch full details (with samples) when expanded
  const { data: fullRecord, isLoading: isRecordLoading } = useQuery({
    queryKey: ['csa-record-detail', initialRecord.id],
    queryFn: () => api<CSARecord>(`/api/csa/${initialRecord.id}`),
    enabled: isExpanded
  });

  const record = fullRecord || initialRecord;

  // Fetch all controls for this process to build the matrix
  const { data: controlsData } = useQuery({
    queryKey: ['bpm-controls', initialRecord.bpmProcessId],
    queryFn: () => api<{ items: Control[] }>(`/api/bpm-processes/${initialRecord.bpmProcessId}/controls`),
    enabled: isExpanded && !!initialRecord.bpmProcessId
  });

  const controls = controlsData?.items || [];

  return (
    <>
      <TableRow 
        className={cn(
            "hover:bg-indigo-50/10 transition-colors cursor-pointer",
            isExpanded && "bg-indigo-50/5 border-l-4 border-l-indigo-600"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell>
           <div className="flex items-center gap-3">
             {isExpanded ? <ChevronDown className="h-4 w-4 text-indigo-600" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
             <div>
               <div className="font-bold text-slate-900">{process?.name || 'Unknown Process'}</div>
               <div className="text-[9px] text-slate-400 uppercase font-black tracking-tight">ID: {initialRecord.bpmProcessId?.substring(0,8)}</div>
             </div>
           </div>
        </TableCell>
        <TableCell className="text-center font-black text-indigo-700 text-xs">{initialRecord.period}</TableCell>
        <TableCell className="text-center">
          <Badge className={cn(
            "text-[9px] font-black uppercase",
            initialRecord.result === 'Effective' ? "bg-green-600" : "bg-red-600"
          )}>{initialRecord.result}</Badge>
        </TableCell>
        <TableCell className="text-xs text-slate-500 font-medium">
          {format(new Date(initialRecord.assessmentDate), 'dd MMM yyyy HH:mm')}
        </TableCell>
        <TableCell className="text-center">
           <Badge variant="outline" className="font-black text-[10px] bg-white">
             {record.samples?.length || 0} Samples
           </Badge>
        </TableCell>
        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold">
              <Printer className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1.5 font-bold">
              <Download className="h-3.5 w-3.5" /> XLS
            </Button>
          </div>
        </TableCell>
      </TableRow>
      
      {isExpanded && (
        <TableRow className="bg-slate-50/30 hover:bg-slate-50/30 border-b-2">
          <TableCell colSpan={6} className="p-0">
             <div className="animate-in fade-in slide-in-from-top-2 duration-300">
               {isRecordLoading ? (
                 <div className="h-32 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Samples...</span>
                    </div>
                 </div>
               ) : (
                 <CSAReviewMatrix 
                   record={record} 
                   controls={controls}
                   todEvaluations={evaluations}
                   onControlClick={setSelectedControl}
                 />
               )}
             </div>
          </TableCell>
        </TableRow>
      )}

      {selectedControl && (
        <TODVerificationDialog 
          open={!!selectedControl}
          onOpenChange={(open) => !open && setSelectedControl(null)}
          control={selectedControl}
          csaId={record.id}
          initialData={evaluations.find(e => e.controlId === selectedControl.id)}
          onSave={(values) => {
            saveMutation.mutate({ ...values, controlId: selectedControl.id });
            setSelectedControl(null);
          }}
          isPending={saveMutation.isPending}
        />
      )}
    </>
  );
}

export function CSAPage() {
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data: records, isLoading } = useQuery({
    queryKey: ['csa-records-all'],
    queryFn: () => api<{ items: CSARecord[] }>('/api/csa'),
  });

  const { data: processes } = useQuery({
    queryKey: ['bpm-processes-all'],
    queryFn: () => api<{ items: BPMProcess[] }>('/api/bpm-processes'),
  });

  const filteredRecords = React.useMemo(() => {
    if (!records?.items) return [];
    return records.items.filter(r => {
      const process = processes?.items.find(p => p.id === r.bpmProcessId);
      return process?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             r.period.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [records, processes, searchTerm]);

  return (
    <AppLayout container>
      <div className="space-y-6 pb-20">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                 <History className="h-8 w-8 text-white" />
              </div>
              CSA Reports & Line 2 Review
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">Archived Control Self-Assessments and Line 2 TOD Verifications.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border shadow-sm ring-1 ring-slate-200/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari berdasarkan sub-proses atau periode..." 
              className="pl-9 h-11 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-indigo-500" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
             <ShieldCheck className="h-4 w-4 text-indigo-600" />
             <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Line 2 Auditor Mode</span>
          </div>
        </div>

        <div className="border rounded-2xl bg-white shadow-xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-200/50">
          <Table>
            <TableHeader className="bg-slate-50/80 backdrop-blur-sm border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Sub-Proses Bisnis</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Periode</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status Efektivitas</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal Sign-off</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Sampel</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Reports</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-64 text-center">
                   <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading reports...</span>
                   </div>
                </TableCell></TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-64 text-center text-slate-400 italic">Tidak ada laporan CSA yang ditemukan.</TableCell></TableRow>
              ) : filteredRecords.map((record) => (
                <CSARecordRow 
                  key={record.id} 
                  record={record} 
                  process={processes?.items.find(p => p.id === record.bpmProcessId)} 
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
