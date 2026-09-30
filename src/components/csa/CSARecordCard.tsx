import React, { useState } from 'react';
import { CSARecord, BPMProcess, Control } from '@shared/types';
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
  FileSpreadsheet
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useTOD } from '@/hooks/use-tod';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { CSAReviewMatrix } from '@/components/csa/CSAReviewMatrix';
import { TODVerificationDialog } from '@/components/csa/TODVerificationDialog';
import { WorkflowPanel } from '@/components/workflow/WorkflowPanel';
import * as XLSX from 'xlsx';

interface CSARecordCardProps {
  record: CSARecord;
  process?: BPMProcess;
}

export function CSARecordCard({ record: initialRecord, process }: CSARecordCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingXLS, setIsExportingXLS] = useState(false);

  const { t } = useTranslation(['csa_hub', 'common']);
  const { workingYear } = useFiscalYearStore();
  const { evaluations, saveMutation } = useTOD(initialRecord.id);

  // Fetch full details (with samples) when expanded
  const { data: fullRecord, isLoading: isRecordLoading } = useQuery({
    queryKey: ['csa-record-detail', initialRecord.id],
    queryFn: () => api<CSARecord>(`/api/csa/${initialRecord.id}`),
    enabled: isExpanded,
  });

  const record = fullRecord || initialRecord;

  // Fetch control mappings for this process
  const { data: matrixData } = useQuery({
    queryKey: ['rcm-matrix-tlc-process', initialRecord.bpmProcessId, workingYear],
    queryFn: () => api<{ items: any[] }>(`/api/rcm-matrix/tlc?bpmProcessId=${initialRecord.bpmProcessId}&year=${workingYear}`),
    enabled: isExpanded && !!initialRecord.bpmProcessId,
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
    } catch (err: any) {
      toast.error(err.message || t('common:notifications.exportFailed', { defaultValue: 'Gagal mengekspor PDF' }), { id: toastId });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportXLS = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExportingXLS(true);
    const toastId = toast.loading(t('common:notifications.exportingExcel', { defaultValue: 'Mengekspor Excel...' }));
    try {
      const summaryData = [
        { "Field": "Process Name", "Value": process?.name || 'N/A' },
        { "Field": "Process ID", "Value": initialRecord.bpmProcessId },
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
      toast.success(t('common:notifications.exportSuccess', { defaultValue: 'Excel berhasil diunduh' }), { id: toastId });
    } catch (err: any) {
      toast.error(err.message || t('common:notifications.exportFailed', { defaultValue: 'Gagal mengekspor Excel' }), { id: toastId });
    } finally {
      setIsExportingXLS(false);
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
        <div className="flex items-start justify-between gap-3">
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

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
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
              {format(new Date(initialRecord.assessmentDate), 'dd MMM yyyy HH:mm')}
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
                onControlClick={setSelectedControl}
              />
              <div className="pt-2">
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
          initialData={evaluations.find(e => e.controlId === (selectedControl as any).controlId)}
          onSave={async (values) => {
            try {
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

              setSelectedControl(null);
              toast.success(t('tod.saveSuccess', { defaultValue: 'Evaluasi berhasil disimpan' }));
            } catch (err: any) {
              toast.error(err.message || t('tod.saveError', { defaultValue: 'Gagal menyimpan evaluasi' }));
            }
          }}
          isPending={saveMutation.isPending}
        />
      )}
    </div>
  );
}
