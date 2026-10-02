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
import { FileText, Printer, Search, Download, History, ShieldCheck, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CSAReviewMatrix } from '@/components/csa/CSAReviewMatrix';
import { TODVerificationDialog } from '@/components/csa/TODVerificationDialog';
import { useTOD } from '@/hooks/use-tod';
import { useTranslation } from 'react-i18next';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { WorkflowPanel } from '@/components/workflow/WorkflowPanel';
import { CSARecordCard } from '@/components/csa/CSARecordCard';

function CSARecordRow({ record: initialRecord, process }: { record: CSARecord, process?: BPMProcess }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [selectedControl, setSelectedControl] = React.useState<Control | null>(null);
  const [isExportingPDF, setIsExportingPDF] = React.useState(false);
  const [isExportingXLS, setIsExportingXLS] = React.useState(false);
  const { t } = useTranslation(['csa_hub', 'common']);
  const { workingYear } = useFiscalYearStore();
  
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
    queryKey: ['rcm-matrix-tlc-process', initialRecord.bpmProcessId, workingYear],
    queryFn: () => api<{ items: any[] }>(`/api/rcm-matrix/tlc?bpmProcessId=${initialRecord.bpmProcessId}&year=${workingYear}`),
    enabled: isExpanded && !!initialRecord.bpmProcessId
  });

  const controls = React.useMemo(() => {
    if (!matrixData?.items) return [];
    const seen = new Set<string>();
    return matrixData.items.filter((item: any) => {
      const id = item.controlId || item.id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [matrixData?.items]);

  const handleExportPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExportingPDF(true);
    const toastId = toast.loading("Generating PDF Report...");
    try {
      const response = await fetch(`/api/csa/${initialRecord.id}/export-pdf`, {
        headers: {
          'X-Mock-Role': localStorage.getItem('mockRole') || 'Line 2'
        }
      });
      if (!response.ok) throw new Error("Failed to generate PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CSA_${process?.name || 'Report'}_${initialRecord.period}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF exported successfully", { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportXLS = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExportingXLS(true);
    const toastId = toast.loading("Generating Excel Report...");
    try {
      const XLSX = await import('xlsx');
      
      // Prepare Data
      const summaryData = [
        { "Field": "Process Name", "Value": process?.name },
        { "Field": "Period", "Value": initialRecord.period },
        { "Field": "Assessment Date", "Value": format(new Date(initialRecord.assessmentDate), 'yyyy-MM-dd HH:mm') },
        { "Field": "Overall Result", "Value": initialRecord.result },
        { "Field": "Comments", "Value": initialRecord.comments || "" }
      ];

      const samplesData = (record.samples || []).map((s, idx) => ({
        "No": idx + 1,
        "Sample Ref": s.sampleRef,
        "Result": s.controlResults ? "Mapped" : "Empty",
        "ITAC Match": s.itacMatch ? "Yes" : "N/A"
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary');
      if (samplesData.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(samplesData), 'Samples');
      }

      XLSX.writeFile(wb, `CSA_Report_${process?.name || 'Export'}_${initialRecord.period}.xlsx`);
      toast.success("Excel exported successfully", { id: toastId });
    } catch (err: any) {
      toast.error("Failed to generate Excel", { id: toastId });
    } finally {
      setIsExportingXLS(false);
    }
  };

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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 font-bold shadow-sm"
            >
              {isExportingPDF ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />} PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportXLS}
              disabled={isExportingXLS}
              className="h-8 text-xs gap-1.5 border-slate-200 font-bold shadow-sm"
            >
              {isExportingXLS ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} XLS
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
                  <div className="p-4 space-y-6">
                     <CSAReviewMatrix 
                       record={record} 
                       controls={controls}
                       todEvaluations={evaluations}
                       onControlClick={setSelectedControl}
                     />
                     <div className="max-w-xl mx-2">
                       <WorkflowPanel
                         entityType="CSA"
                         entityId={record.id}
                         currentStatus={(record as any).workflowStatus || ((record as any).line2Status === 'Validated' ? 'Validated' : ((record as any).isDraft ? 'Draft' : 'In Review'))}
                         history={(record as any).workflowHistory || []}
                         onStatusChange={(newStatus) => {
                           (record as any).workflowStatus = newStatus;
                         }}
                       />
                     </div>
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
  const { workingYear } = useFiscalYearStore();

  const { data: records, isLoading } = useQuery({
    queryKey: ['csa-records-all'],
    queryFn: () => api<{ items: CSARecord[] }>('/api/csa'),
  });

  const { data: processes } = useQuery({
    queryKey: ['bpm-processes-all', workingYear],
    queryFn: () => api<{ items: BPMProcess[] }>(`/api/bpm-processes?year=${workingYear}`),
  });

  const filteredRecords = React.useMemo(() => {
    if (!records?.items) return [];
    return records.items.filter(r => {
      // Logic requirement: Only Effective CSA records are eligible for TOE / regulatory review
      if (r.result !== 'Effective') return false;

      const process = processes?.items.find(p => p.id === r.bpmProcessId);
      return process?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             r.period.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [records, processes, searchTerm]);

  return (
    <AppLayout container>
      <div className="space-y-6 pb-20 pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 bg-indigo-600 rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl shadow-indigo-200 ring-2 sm:ring-4 ring-indigo-50 shrink-0">
                 <History className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <span>{t('page.title')}</span>
                <div className="h-1.5 w-1/2 bg-indigo-600 rounded-full mt-1" />
              </div>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-2 sm:mt-3 font-medium max-w-xl leading-relaxed">
              {t('page.description')}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 bg-white p-3.5 sm:p-6 rounded-lg sm:rounded-xl border shadow-sm ring-1 ring-slate-200/50">
          <div className="relative flex-1 max-w-none sm:max-w-md">
            <Label htmlFor="csa-search" className="sr-only">Search CSA Records</Label>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              id="csa-search"
              placeholder={t('page.searchPlaceholder')} 
              className="pl-10 h-10 sm:h-11 bg-slate-50/50 border-slate-200 rounded-lg focus:ring-indigo-500 transition-all text-xs" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2.5 px-3.5 sm:px-5 py-2.5 sm:py-3 bg-indigo-50/70 rounded-lg border border-indigo-100 shadow-xs shrink-0">
             <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 shrink-0" />
             <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold uppercase text-indigo-700 tracking-wider leading-none truncate">{t('page.modeBadge')}</span>
                <span className="text-xs font-medium text-indigo-500 uppercase tracking-tight mt-0.5 truncate">{t('page.modeSubtitle')}</span>
             </div>
          </div>
        </div>

        {/* DESKTOP VIEW: Table */}
        <div className="hidden md:block border rounded-lg bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 py-4 pl-6">{t('page.table.subProcess')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">{t('page.table.period')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">{t('page.table.status')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('page.table.signOff')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">{t('page.table.samples')}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500 pr-6">{t('page.table.reports')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-none"><TableCell colSpan={6} className="h-80 text-center border-none">
                   <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="h-10 w-10 border-4 border-slate-100 rounded-full" />
                        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('page.loading')}</span>
                   </div>
                </TableCell></TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow className="border-none"><TableCell colSpan={6} className="h-80 text-center text-slate-500 font-normal border-none">{t('page.empty')}</TableCell></TableRow>
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

        {/* MOBILE VIEW: Executive Summary & Card Stack */}
        <div className="block md:hidden space-y-4">
          {/* Executive Summary Card */}
          {records?.items && records.items.length > 0 && (
            <div className="p-4 bg-card border rounded-lg shadow-sm space-y-3" data-testid="csa-mobile-executive-summary">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {t('page.summary.title', { defaultValue: 'Ringkasan Eksekutif Pengujian' })}
                </span>
                <Badge variant="outline" className="text-xs font-semibold">
                  {records.items.length} {t('page.table.subProcess', { defaultValue: 'Proses' })}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-md">
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 block">
                    {t('page.summary.effective', { defaultValue: 'Efektif' })}
                  </span>
                  <span className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                    {records.items.filter(r => r.result === 'Effective').length}
                  </span>
                </div>
                <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-md">
                  <span className="text-xs font-medium text-red-700 dark:text-red-300 block">
                    {t('page.summary.ineffective', { defaultValue: 'Defisiensi' })}
                  </span>
                  <span className="text-lg font-bold text-red-800 dark:text-red-200">
                    {records.items.filter(r => r.result !== 'Effective').length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-xl border p-6">
              <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('page.loading')}</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="h-48 flex items-center justify-center bg-card rounded-lg border border-border p-6 text-center text-muted-foreground text-xs font-medium">
              {t('page.empty')}
            </div>
          ) : (
            filteredRecords.map((record) => (
              <CSARecordCard
                key={`mobile-${record.id}`}
                record={record}
                process={processes?.items.find(p => p.id === record.bpmProcessId)}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
