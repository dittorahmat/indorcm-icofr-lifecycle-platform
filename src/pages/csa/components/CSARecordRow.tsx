import React from 'react';
import { CSARecord, BPMProcess } from '@shared/types';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Download, Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CSAReviewMatrix } from '@/components/csa/CSAReviewMatrix';
import { TODVerificationDialog } from '@/components/csa/TODVerificationDialog';
import { useTranslation } from 'react-i18next';
import { WorkflowPanel } from '@/components/workflow/WorkflowPanel';
import {
  useCsaAssessedDetail,
  findTodEvaluation,
  isValidAssessmentDate,
  resolveWorkflowStatus,
  type MatrixControl,
  CSA_ASSESSED_COLUMNS,
} from './csa-assessed-detail';

export function CSARecordRow({ record: initialRecord, process }: { record: CSARecord, process?: BPMProcess }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [selectedControl, setSelectedControl] = React.useState<MatrixControl | null>(null);
  const { t } = useTranslation(['csa_hub', 'common']);
  const {
    fullRecord,
    isRecordLoading,
    controls,
    evaluations,
    saveMutation,
    applyWorkflowStatus,
    saveDual,
    exportPdf,
    exportXls,
    isExportingPdf,
    isExportingXls,
  } = useCsaAssessedDetail({
    recordId: initialRecord.id,
    bpmProcessId: initialRecord.bpmProcessId,
    isExpanded,
  });

  const record = fullRecord || initialRecord;

  const handleExportPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const toastId = toast.loading(t('page.row.pdfLoading'));
    try {
      await exportPdf({
        processName: process?.name,
        period: initialRecord.period,
        failureMessage: t('page.row.pdfFailed'),
      });
      toast.success(t('page.row.pdfDone'), { id: toastId });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err), { id: toastId });
    }
  };

  const handleExportXLS = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const toastId = toast.loading(t('page.row.xlsLoading'));
    const exported = await exportXls({
      processName: process?.name,
      bpmProcessId: initialRecord.bpmProcessId,
      period: initialRecord.period,
      assessmentDate: initialRecord.assessmentDate,
      result: initialRecord.result,
      comments: initialRecord.comments,
      samples: record.samples || [],
    }, () => toast.error(t('page.row.xlsFailed'), { id: toastId }));
    if (exported) {
      toast.success(t('page.row.xlsDone'), { id: toastId });
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
        <TableCell className={cn("py-4", CSA_ASSESSED_COLUMNS.subProcess)}>
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
        <TableCell className={cn("text-center font-black text-indigo-700 text-xs", CSA_ASSESSED_COLUMNS.period)}>{initialRecord.period}</TableCell>
        <TableCell className={cn("text-center", CSA_ASSESSED_COLUMNS.status)}>
          <Badge className={cn(
            "text-xs font-black uppercase shadow-none border-none",
            initialRecord.result === 'Effective' ? "bg-green-500 text-white" : "bg-red-500 text-white"
          )}>{initialRecord.result}</Badge>
        </TableCell>
        <TableCell className={cn("text-xs text-slate-500 font-medium", CSA_ASSESSED_COLUMNS.signOff)}>
          {isValidAssessmentDate(initialRecord.assessmentDate)
            ? format(new Date(initialRecord.assessmentDate), 'dd MMM yyyy HH:mm')
            : '-'}
        </TableCell>
        <TableCell className={cn("text-center", CSA_ASSESSED_COLUMNS.samples)}>
           <Badge variant="outline" className="font-black text-xs bg-white border-slate-200">
             {record.samples?.length || 0} {t('page.table.samples')}
           </Badge>
        </TableCell>
        <TableCell className={cn("text-right", CSA_ASSESSED_COLUMNS.reports)} onClick={e => e.stopPropagation()}>
          <div className="flex flex-wrap justify-end gap-2 pr-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              className="h-11 md:h-8 min-h-[44px] md:min-h-0 text-xs gap-1.5 border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 font-bold shadow-sm"
            >
              {isExportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />} PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportXLS}
              disabled={isExportingXls}
              className="h-11 md:h-8 min-h-[44px] md:min-h-0 text-xs gap-1.5 border-slate-200 font-bold shadow-sm"
            >
              {isExportingXls ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} XLS
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
                         currentStatus={resolveWorkflowStatus(record)}
                         history={record.workflowHistory || []}
                         onStatusChange={(newStatus) => applyWorkflowStatus(record.id, newStatus)}
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
          initialData={findTodEvaluation(evaluations, selectedControl)}
          onSave={async (values) => {
            try {
              await saveDual(selectedControl, values);
              toast.success(t('page.row.todSynced'));
              setSelectedControl(null);
            } catch {
              toast.error(t('page.row.todSyncFailed'));
            }
          }}
          isPending={saveMutation.isPending}
        />
      )}
    </>
  );
}
