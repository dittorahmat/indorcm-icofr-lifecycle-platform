import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { CSARecord, BPMProcess, Control } from '@shared/types';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Download, Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CSAReviewMatrix } from '@/components/csa/CSAReviewMatrix';
import { TODVerificationDialog } from '@/components/csa/TODVerificationDialog';
import { useTOD } from '@/hooks/use-tod';
import { useTranslation } from 'react-i18next';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { WorkflowPanel } from '@/components/workflow/WorkflowPanel';
import { useExcelExport } from '@/lib/useExcelExport';
import { buildCsaRecordSummaryRows, exportCsaRecordToExcel } from '@/lib/csa-excel-export';

/** TLC matrix row: Control columns plus the mapping identifiers the API joins in. */
type MatrixControl = Control & { controlId: string; mappingId: string };

export function CSARecordRow({ record: initialRecord, process }: { record: CSARecord, process?: BPMProcess }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [selectedControl, setSelectedControl] = React.useState<MatrixControl | null>(null);
  const [isExportingPDF, setIsExportingPDF] = React.useState(false);
  const { isExporting: isExportingXLS, exportNow: exportXlsNow } =
    useExcelExport<Record<string, string>>();
  const { t } = useTranslation(['csa_hub', 'common']);
  const { workingYear } = useFiscalYearStore();
  const queryClient = useQueryClient();
  
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
    queryFn: () => api<{ items: MatrixControl[] }>(`/api/rcm-matrix/tlc?bpmProcessId=${initialRecord.bpmProcessId}&year=${workingYear}`),
    enabled: isExpanded && !!initialRecord.bpmProcessId
  });

  const controls = React.useMemo(() => {
    if (!matrixData?.items) return [];
    const seen = new Set<string>();
    return matrixData.items.filter((item: MatrixControl) => {
      const id = item.controlId || item.id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [matrixData?.items]);

  const handleExportPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExportingPDF(true);
    const toastId = toast.loading(t('row.pdfLoading'));
    try {
      const response = await fetch(`/api/csa/${initialRecord.id}/export-pdf`, {
        headers: {
          'X-Mock-Role': localStorage.getItem('mockRole') || 'Line 2'
        }
      });
      if (!response.ok) throw new Error(t('row.pdfFailed'));
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CSA_${process?.name || 'Report'}_${initialRecord.period}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('row.pdfDone'), { id: toastId });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err), { id: toastId });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportXLS = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const toastId = toast.loading(t('row.xlsLoading'));
    const exported = await exportXlsNow({
      rows: buildCsaRecordSummaryRows({
        processName: process?.name || 'N/A',
        period: initialRecord.period,
        assessmentDate: initialRecord.assessmentDate,
        result: initialRecord.result,
        comments: initialRecord.comments,
        samples: record.samples || [],
      }),
      filename: `CSA_Report_${process?.name || 'Export'}_${initialRecord.period}.xlsx`,
      exportFn: (rows, opts) => exportCsaRecordToExcel({
        processName: process?.name || 'N/A',
        period: initialRecord.period,
        assessmentDate: initialRecord.assessmentDate,
        result: initialRecord.result,
        comments: initialRecord.comments,
        samples: record.samples || [],
        filename: opts.filename,
      }),
      onError: () => toast.error(t('row.xlsFailed'), { id: toastId }),
    });
    if (exported) {
      toast.success(t('row.xlsDone'), { id: toastId });
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
          <div className="flex flex-wrap justify-end gap-2 pr-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="h-11 md:h-8 min-h-[44px] md:min-h-0 text-xs gap-1.5 border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 font-bold shadow-sm"
            >
              {isExportingPDF ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />} PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportXLS}
              disabled={isExportingXLS}
              className="h-11 md:h-8 min-h-[44px] md:min-h-0 text-xs gap-1.5 border-slate-200 font-bold shadow-sm"
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
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('page.loadingSamples')}</span>
                    </div>
                 </div>
               ) : (
                  <div className="p-4 space-y-6">
                     <CSAReviewMatrix
                       record={record}
                       controls={controls}
                       todEvaluations={evaluations}
                       onControlClick={(control) => setSelectedControl(control as MatrixControl)}
                     />
                     <div className="max-w-xl mx-2">
                       <WorkflowPanel
                         entityType="CSA"
                         entityId={record.id}
                         currentStatus={record.workflowStatus || (record.line2Status === 'Validated' ? 'Validated' : (record.isDraft ? 'Draft' : 'In Review'))}
                         history={record.workflowHistory || []}
                         onStatusChange={(newStatus) => {
                           queryClient.setQueryData<CSARecord>(
                             ['csa-record-detail', record.id],
                             (old) => (old ? { ...old, workflowStatus: newStatus } : old),
                           );
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
          initialData={evaluations.find(e => e.controlId === selectedControl.controlId)}
          onSave={async (values) => {
            try {
              // Orchestrate dual save
              const rcmPayload = {
                mappingId: selectedControl.mappingId,
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
                controlId: selectedControl.controlId,
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

              toast.success(t('row.todSynced'));
              setSelectedControl(null);
            } catch (err) {
              toast.error(t('row.todSyncFailed'));
            }
          }}
          isPending={saveMutation.isPending}
        />
      )}
    </>
  );
}
