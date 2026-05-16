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
import { Label } from '@/components/ui/label';
import { FileText, Printer, Search, Download, History, ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CSAReviewMatrix } from '@/components/csa/CSAReviewMatrix';
import { TODVerificationDialog } from '@/components/csa/TODVerificationDialog';
import { useTOD } from '@/hooks/useTOD';
import { useTranslation } from 'react-i18next';

function CSARecordRow({ record: initialRecord, process }: { record: CSARecord, process?: BPMProcess }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [selectedControl, setSelectedControl] = React.useState<Control | null>(null);
  const { t } = useTranslation(['csa_hub', 'common']);
  
  const { evaluations, saveMutation } = useTOD(initialRecord.id);

  // Fetch full details (with samples) when expanded
  const { data: fullRecord, isLoading: isRecordLoading } = useQuery({
    queryKey: ['csa-record-detail', initialRecord.id],
    queryFn: () => api<CSARecord>(`/api/csa/${initialRecord.id}`),
    enabled: isExpanded
  });

  const record = fullRecord || initialRecord;

  // Fetch all control mappings for this process to build the matrix
  const { data: matrixData } = useQuery({
    queryKey: ['rcm-matrix-tlc-process', initialRecord.bpmProcessId],
    queryFn: () => api<{ items: any[] }>(`/api/rcm-matrix/tlc?bpmProcessId=${initialRecord.bpmProcessId}`),
    enabled: isExpanded && !!initialRecord.bpmProcessId
  });

  const controls = matrixData?.items || [];

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
               <div className="font-bold text-slate-900">{process?.name || t('page.unknownProcess')}</div>
               <div className="text-xs text-slate-400 uppercase font-black tracking-tight">ID: {initialRecord.bpmProcessId?.substring(0,8)}</div>
             </div>
           </div>
        </TableCell>
        <TableCell className="text-center font-black text-indigo-700 text-xs">{initialRecord.period}</TableCell>
        <TableCell className="text-center">
          <Badge className={cn(
            "text-xs font-black uppercase shadow-none border-none",
            initialRecord.result === 'Effective' ? "bg-green-500 text-white" : "bg-red-500 text-white"
          )}>{initialRecord.result}</Badge>
        </TableCell>
        <TableCell className="text-xs text-slate-500 font-medium">
          {format(new Date(initialRecord.assessmentDate), 'dd MMM yyyy HH:mm')}
        </TableCell>
        <TableCell className="text-center">
           <Badge variant="outline" className="font-black text-xs bg-white border-slate-200">
             {record.samples?.length || 0} {t('page.table.samples')}
           </Badge>
        </TableCell>
        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
          <div className="flex justify-end gap-2 pr-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 font-bold shadow-sm">
              <Printer className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-slate-200 font-bold shadow-sm">
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
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">{t('page.loadingSamples')}</span>
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
          initialData={evaluations.find(e => e.controlId === (selectedControl as any).controlId)}
          onSave={async (values) => {
            try {
              // Orchestrate dual save
              const rcmPayload = {
                mappingId: (selectedControl as any).mappingId,
                riskDescription: values.riskDescription,
                isFraudRelated: values.isFraudRelated,
                riskRating: values.riskRating,
                controlName: values.mappedControlName,
                controlDescription: values.mappedControlDescription,
                supportingDocs: values.supportingDocs,
                isKeyControl: values.isKeyControl,
                controlType: values.controlType,
                controlNature: values.controlNature,
                automatedSubNature: values.automatedSubNature,
                frequency: values.frequency,
                supportingApp: values.supportingApp,
                executingFunction: values.executingFunction,
                executorRole: values.executorRole,
                affectedFsliItem: values.affectedFsliItem,
                effectivePeriod: values.effectivePeriod,
                ipoC: values.ipoC,
                ipoA: values.ipoA,
                ipoV: values.ipoV,
                ipoRa: values.ipoRa,
                assertionE: values.assertionE,
                assertionC: values.assertionC,
                assertionA: values.assertionA,
                assertionCo: values.assertionCo,
                assertionVa: values.assertionVa,
                assertionRo: values.assertionRo,
                assertionPd: values.assertionPd,
              };

              const todPayload = {
                controlId: (selectedControl as any).controlId,
                pilarObjective: values.pilarObjective,
                pilarTiming: values.pilarTiming,
                pilarAuthority: values.pilarAuthority,
                pilarReliability: values.pilarReliability,
                pilarCoverage: values.pilarCoverage,
                pilarEvidence: values.pilarEvidence,
                kkReference: values.kkReference,
                conclusion: values.conclusion,
                comment: values.comment,
              };

              // Run both updates
              await Promise.all([
                api('/api/rcm-matrix/tlc/batch-update', { method: 'POST', body: JSON.stringify({ items: [rcmPayload] }) }),
                saveMutation.mutateAsync(todPayload)
              ]);

              toast.success("RCM Design & TOD Evaluation synced successfully");
              setSelectedControl(null);
            } catch (err) {
              toast.error("Failed to sync design changes");
            }
          }}
          isPending={saveMutation.isPending}
        />
      )}
    </>
  );
}

export function CSAPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const { t } = useTranslation(['csa_hub', 'common']);

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
              <div className="p-3 bg-indigo-600 rounded-xl shadow-xl shadow-indigo-200 ring-4 ring-indigo-50">
                 <History className="h-8 w-8 text-white" />
              </div>
              <div>
                {t('page.title')}
                <div className="h-1.5 w-1/2 bg-indigo-600 rounded-full mt-1" />
              </div>
            </h1>
            <p className="text-slate-500 text-sm mt-3 font-medium max-w-xl leading-relaxed">
              {t('page.description')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border shadow-xl shadow-slate-200/40 ring-1 ring-slate-200/50">
          <div className="relative flex-1 max-w-md">
            <Label htmlFor="csa-search" className="sr-only">Search CSA Records</Label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              id="csa-search"
              placeholder={t('page.searchPlaceholder')} 
              className="pl-11 h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-indigo-500 transition-all border-2" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="hidden sm:flex items-center gap-3 px-5 py-3 bg-indigo-50 rounded-xl border-2 border-indigo-100 shadow-sm shadow-indigo-100/50 animate-in fade-in slide-in-from-right-4">
             <ShieldCheck className="h-5 w-5 text-indigo-600" />
             <div className="flex flex-col">
                <span className="text-xs font-black uppercase text-indigo-700 tracking-widest leading-none">{t('page.modeBadge')}</span>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-tighter mt-0.5">{t('page.modeSubtitle')}</span>
             </div>
          </div>
        </div>

        <div className="border rounded-2xl bg-white shadow-2xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-200/50">
          <Table>
            <TableHeader className="bg-slate-50/80 backdrop-blur-md border-b-2 border-slate-100">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400 py-6 pl-8">{t('page.table.subProcess')}</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400 text-center">{t('page.table.period')}</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400 text-center">{t('page.table.status')}</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400">{t('page.table.signOff')}</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400 text-center">{t('page.table.samples')}</TableHead>
                <TableHead className="text-right text-xs font-black uppercase tracking-widest text-slate-400 pr-8">{t('page.table.reports')}</TableHead>
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
                      <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">{t('page.loading')}</span>
                   </div>
                </TableCell></TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow className="border-none"><TableCell colSpan={6} className="h-80 text-center text-slate-400 italic border-none">{t('page.empty')}</TableCell></TableRow>
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
