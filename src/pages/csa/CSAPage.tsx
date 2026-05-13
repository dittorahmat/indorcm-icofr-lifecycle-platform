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
            isExpanded && "bg-indigo-50/5 border-l-4 border-l-indigo-600 shadow-sm z-10"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell className="py-4">
           <div className="flex items-center gap-3">
             <div className={cn(
                 "p-1 rounded-md transition-transform duration-200",
                 isExpanded ? "bg-indigo-100 rotate-0" : "rotate-0"
             )}>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-indigo-600" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
             </div>
             <div>
               <div className="font-bold text-slate-900">{process?.name || 'Unknown Process'}</div>
               <div className="text-[9px] text-slate-400 uppercase font-black tracking-tight">ID: {initialRecord.bpmProcessId?.substring(0,8)}</div>
             </div>
           </div>
        </TableCell>
        <TableCell className="text-center font-black text-indigo-700 text-xs">{initialRecord.period}</TableCell>
        <TableCell className="text-center">
          <Badge className={cn(
            "text-[9px] font-black uppercase shadow-none border-none",
            initialRecord.result === 'Effective' ? "bg-green-500 text-white" : "bg-red-500 text-white"
          )}>{initialRecord.result}</Badge>
        </TableCell>
        <TableCell className="text-xs text-slate-500 font-medium">
          {format(new Date(initialRecord.assessmentDate), 'dd MMM yyyy HH:mm')}
        </TableCell>
        <TableCell className="text-center">
           <Badge variant="outline" className="font-black text-[10px] bg-white border-slate-200">
             {record.samples?.length || 0} Samples
           </Badge>
        </TableCell>
        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
          <div className="flex justify-end gap-2 pr-2">
            <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1.5 border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 font-bold shadow-sm">
              <Printer className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1.5 border-slate-200 font-bold shadow-sm">
              <Download className="h-3.5 w-3.5" /> XLS
            </Button>
          </div>
        </TableCell>
      </TableRow>
      
      {isExpanded && (
        <TableRow className="bg-slate-50/30 hover:bg-slate-50/30">
          <TableCell colSpan={6} className="p-0">
             <div className="animate-in fade-in slide-in-from-top-2 duration-300">
               {isRecordLoading ? (
                 <div className="h-40 flex items-center justify-center bg-slate-50/50">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Fetching Transaction Samples...</span>
                    </div>
                 </div>
               ) : (
                 <div className="p-4">
                    <CSAReviewMatrix 
                      record={record} 
                      controls={controls}
                      todEvaluations={evaluations}
                      onControlClick={setSelectedControl}
                    />
                 </div>
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
      <div className="space-y-6 pb-20 pt-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200 ring-4 ring-indigo-50">
                 <History className="h-8 w-8 text-white" />
              </div>
              <div>
                CSA Reports & Line 2 Review
                <div className="h-1.5 w-1/2 bg-indigo-600 rounded-full mt-1" />
              </div>
            </h1>
            <p className="text-slate-500 text-sm mt-3 font-medium max-w-xl leading-relaxed">
              Historical archive of Control Self-Assessments. Use this module to perform 
              regulatory design verification (Lampiran 8) for Line 2 accountability.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border shadow-xl shadow-slate-200/40 ring-1 ring-slate-200/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by sub-process or period..." 
              className="pl-11 h-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:ring-indigo-500 transition-all border-2" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="hidden sm:flex items-center gap-3 px-5 py-3 bg-indigo-50 rounded-2xl border-2 border-indigo-100 shadow-sm shadow-indigo-100/50 animate-in fade-in slide-in-from-right-4">
             <ShieldCheck className="h-5 w-5 text-indigo-600" />
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-widest leading-none">Line 2 Auditor</span>
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter mt-0.5">Verification Mode Active</span>
             </div>
          </div>
        </div>

        <div className="border rounded-[2.5rem] bg-white shadow-2xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-200/50">
          <Table>
            <TableHeader className="bg-slate-50/80 backdrop-blur-md border-b-2 border-slate-100">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 pl-8">Sub-Proses Bisnis</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Periode</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status Efektivitas</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal Sign-off</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Sampel</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 pr-8">Reports</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-none"><TableCell colSpan={6} className="h-80 text-center border-none">
                   <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="h-12 w-12 border-4 border-slate-100 rounded-full" />
                        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                      </div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing Reports...</span>
                   </div>
                </TableCell></TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow className="border-none"><TableCell colSpan={6} className="h-80 text-center text-slate-400 italic border-none">Tidak ada laporan CSA yang ditemukan.</TableCell></TableRow>
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
