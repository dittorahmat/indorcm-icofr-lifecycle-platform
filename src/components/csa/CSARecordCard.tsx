import React, { useState } from 'react';
import { CSARecord, BPMProcess } from '@shared/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Printer, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  Loader2, 
  Layers,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { CSAReviewMatrix } from '@/components/csa/CSAReviewMatrix';
import { TODVerificationDialog } from '@/components/csa/TODVerificationDialog';
import { EvidenceCaptureButton } from '@/components/csa/EvidenceCaptureButton';
import { WorkflowPanel } from '@/components/workflow/WorkflowPanel';
import { useExcelExport } from '@/lib/useExcelExport';
import { buildCsaRecordSummaryRows, exportCsaRecordToExcel } from '@/lib/csa-excel-export';
import { useCsaRecordDetail } from '@/pages/csa/components/useCsaRecordDetail';
import {
  findTodEvaluation,
  isValidAssessmentDate,
  resolveWorkflowStatus,
  type MatrixControl,
} from '@/pages/csa/components/csa-record-detail';

interface CSARecordCardProps {
  record: CSARecord;
  process?: BPMProcess;
}

export function CSARecordCard({ record: initialRecord, process }: CSARecordCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedControl, setSelectedControl] = useState<MatrixControl | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { isExporting: isExportingXLS, exportNow: exportXlsNow } =
    useExcelExport<Record<string, string>>();

  const { t } = useTranslation(['csa_hub', 'common']);
  const {
    fullRecord,
    isRecordLoading,
    controls,
    evaluations,
    saveMutation,
    applyWorkflowStatus,
    saveDual,
  } = useCsaRecordDetail({
    recordId: initialRecord.id,
    bpmProcessId: initialRecord.bpmProcessId,
    isExpanded,
  });

  const record = fullRecord || initialRecord;

  const handleExportPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExportingPDF(true);
    const toastId = toast.loading(t('common:notifications.exportingPdf', { defaultValue: 'Mengekspor PDF...' }));
    try {
      const res = await fetch(`/api/csa/${initialRecord.id}/export-pdf`, {
        headers: { 'X-Mock-Role': localStorage.getItem('mockRole') || 'Line 2' }
      });
      if (!res.ok) throw new Error(t('common:notifications.exportFailed', { defaultValue: 'Gagal mengekspor PDF' }));
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CSA_${process?.name || 'Report'}_${initialRecord.period}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('common:notifications.exportSuccess', { defaultValue: 'PDF berhasil diunduh' }), { id: toastId });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common:notifications.exportFailed', { defaultValue: 'Gagal mengekspor PDF' }), { id: toastId });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportXLS = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const toastId = toast.loading(t('common:notifications.exportingExcel', { defaultValue: 'Mengekspor Excel...' }));
    const exported = await exportXlsNow({
      rows: buildCsaRecordSummaryRows({
        processName: process?.name || 'N/A',
        bpmProcessId: initialRecord.bpmProcessId,
        period: initialRecord.period,
        assessmentDate: initialRecord.assessmentDate,
        result: initialRecord.result,
        comments: initialRecord.comments,
        samples: record.samples || [],
      }),
      filename: `CSA_Report_${process?.name || 'Export'}_${initialRecord.period}.xlsx`,
      exportFn: (rows, opts) => exportCsaRecordToExcel({
        processName: process?.name || 'N/A',
        bpmProcessId: initialRecord.bpmProcessId,
        period: initialRecord.period,
        assessmentDate: initialRecord.assessmentDate,
        result: initialRecord.result,
        comments: initialRecord.comments,
        samples: record.samples || [],
        filename: opts.filename,
      }),
      onError: () => toast.error(
        t('common:notifications.exportFailed', { defaultValue: 'Gagal mengekspor Excel' }),
        { id: toastId },
      ),
    });
    if (exported) {
      toast.success(t('common:notifications.exportSuccess', { defaultValue: 'Excel berhasil diunduh' }), { id: toastId });
    }
  };

  return (
    <div 
      className={cn(
        "bg-card rounded-lg border border-border shadow-sm overflow-hidden transition-all",
        isExpanded && "border-primary/40 ring-1 ring-primary/20"
      )}
      data-testid={`csa-card-${initialRecord.id}`}
    >
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer hover:bg-muted/40 transition-colors space-y-3"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>ID: {initialRecord.bpmProcessId?.substring(0, 8) || '-'}</span>
            </div>
            <h4 className="font-bold text-foreground text-sm sm:text-base leading-snug line-clamp-2">
              {process?.name || t('page.unknownProcess')}
            </h4>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge className={cn(
              "text-xs font-bold uppercase shadow-none",
              initialRecord.result === 'Effective' 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "bg-red-600 hover:bg-red-700 text-white"
            )}>
              {initialRecord.result}
            </Badge>
            <div className="flex items-center text-xs text-muted-foreground font-medium">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-primary transition-transform" />
              ) : (
                <ChevronRight className="h-4 w-4 transition-transform" />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
          <div>
            <span className="text-muted-foreground font-medium block">{t('page.table.period')}</span>
            <span className="font-bold text-primary">{initialRecord.period}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium block">{t('page.table.samples')}</span>
            <span className="font-semibold text-foreground">{record.samples?.length || 0} {t('page.table.samples')}</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground pt-1">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-xs">
              {isValidAssessmentDate(initialRecord.assessmentDate)
                ? format(new Date(initialRecord.assessmentDate), 'dd MMM yyyy HH:mm')
                : '-'}
            </span>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-2 border-t border-border/50" onClick={e => e.stopPropagation()}>
          <Button 
            variant="outline"
            size="sm"
            disabled={isExportingPDF}
            className="flex-1 min-h-[44px] text-xs font-semibold gap-1.5 border-border"
            onClick={handleExportPDF}
          >
            {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            <span>PDF</span>
          </Button>
          <Button 
            variant="outline"
            size="sm"
            disabled={isExportingXLS}
            className="flex-1 min-h-[44px] text-xs font-semibold gap-1.5 border-border"
            onClick={handleExportXLS}
          >
            {isExportingXLS ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>XLS</span>
          </Button>
          <Button
            variant={isExpanded ? "secondary" : "default"}
            size="sm"
            className="flex-1 min-h-[44px] text-xs font-semibold gap-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>{isExpanded ? t('common:actions.collapse', { defaultValue: 'Tutup' }) : t('common:actions.view', { defaultValue: 'Detail' })}</span>
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-border bg-muted/20 space-y-4 animate-in fade-in duration-200">
          {isRecordLoading ? (
            <div className="h-32 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('page.loadingSamples')}
              </span>
            </div>
          ) : (
            <>
              <CSAReviewMatrix 
                record={record} 
                controls={controls}
                todEvaluations={evaluations}
                onControlClick={(control) => setSelectedControl(control as MatrixControl)}
              />
              <div className="pt-2">
                <WorkflowPanel
                  entityType="CSA"
                  entityId={record.id}
                  currentStatus={resolveWorkflowStatus(record)}
                  history={record.workflowHistory || []}
                  onStatusChange={(newStatus) => applyWorkflowStatus(record.id, newStatus)}
                />
              </div>
              <div className="pt-2 border-t border-border/60" onClick={e => e.stopPropagation()}>
                <EvidenceCaptureButton recordId={record.id} />
              </div>
            </>
          )}
        </div>
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
              setSelectedControl(null);
              toast.success(t('tod.saveSuccess', { defaultValue: 'Evaluasi berhasil disimpan' }));
            } catch (err: unknown) {
              toast.error(err instanceof Error ? err.message : t('tod.saveError', { defaultValue: 'Gagal menyimpan evaluasi' }));
            }
          }}
          isPending={saveMutation.isPending}
        />
      )}
    </div>
  );
}
