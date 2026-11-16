import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Control, CSARecord } from '@shared/types';
import { useTOD } from '@/hooks/use-tod';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { useExcelExport } from '@/lib/useExcelExport';
import {
  buildCsaRecordSummaryRows,
  exportCsaRecordToExcel,
  type CsaRecordSampleInput,
} from '@/lib/csa-excel-export';

/**
 * Deep assessed-detail module (C1+C2). Single owner of the CSA
 * assessed-record expansion: detail + matrix fetch, PDF/XLS export
 * transport, TOD dual-save, and workflow-status mutation.
 * Row and Card adapters supply presentation only.
 */

/** Shared column sizing tokens for the desktop CSA Assessed Records Table */
export const CSA_ASSESSED_COLUMNS = {
  subProcess: 'min-w-[240px]',
  period: 'w-[100px] min-w-[100px]',
  status: 'w-[110px] min-w-[110px]',
  signOff: 'w-[160px] min-w-[160px]',
  samples: 'w-[110px] min-w-[110px]',
  reports: 'w-[150px] min-w-[150px]',
} as const;

/** TLC matrix row: Control plus the mapping identifiers the API joins in. */
export type MatrixControl = Control & { controlId: string; mappingId: string };

export interface TodFormValues {
  riskDescription?: string | null;
  isFraudRelated: boolean;
  riskRating?: string | null;
  mappedControlName: string;
  mappedControlDescription?: string | null;
  supportingDocs?: string | null;
  isKeyControl: boolean;
  controlType?: string | null;
  controlNature?: string | null;
  automatedSubNature?: string | null;
  frequency?: string | null;
  supportingApp?: string | null;
  executingFunction?: string | null;
  executorRole?: string | null;
  affectedFsliItem?: string | null;
  effectivePeriod?: string | null;
  ipoC: boolean;
  ipoA: boolean;
  ipoV: boolean;
  ipoRa: boolean;
  assertionE: boolean;
  assertionC: boolean;
  assertionA: boolean;
  assertionCo: boolean;
  assertionVa: boolean;
  assertionRo: boolean;
  assertionPd: boolean;
  pilarObjective: string;
  pilarTiming: string;
  pilarAuthority: string;
  pilarReliability: string;
  pilarCoverage: string;
  pilarEvidence: string;
  kkReference?: string;
  conclusion: string;
  comment?: string;
}

export interface RcmBatchItem {
  mappingId: string;
  riskDescription?: string | null;
  isFraudRelated: boolean;
  riskRating?: string | null;
  controlName: string;
  controlDescription?: string | null;
  supportingDocs?: string | null;
  isKeyControl: boolean;
  controlType?: string | null;
  controlNature?: string | null;
  automatedSubNature?: string | null;
  frequency?: string | null;
  supportingApp?: string | null;
  executingFunction?: string | null;
  executorRole?: string | null;
  affectedFsliItem?: string | null;
  effectivePeriod?: string | null;
  ipoC: boolean;
  ipoA: boolean;
  ipoV: boolean;
  ipoRa: boolean;
  assertionE: boolean;
  assertionC: boolean;
  assertionA: boolean;
  assertionCo: boolean;
  assertionVa: boolean;
  assertionRo: boolean;
  assertionPd: boolean;
}

export interface TodSavePayload {
  controlId: string;
  pilarObjective: string;
  pilarTiming: string;
  pilarAuthority: string;
  pilarReliability: string;
  pilarCoverage: string;
  pilarEvidence: string;
  kkReference?: string;
  conclusion: string;
  comment?: string;
}

export interface CsaAssessedExportInput {
  processName?: string;
  bpmProcessId?: string | null;
  period: string;
  assessmentDate: number | string | Date;
  result: string;
  comments?: string | null;
  samples: CsaRecordSampleInput[];
}

export interface UseCsaAssessedDetailArgs {
  recordId: string;
  bpmProcessId?: string | null;
  isExpanded: boolean;
}

/** Dedupe matrix rows on the canonical `controlId || id` key. */
function dedupeMatrixControls<T extends { controlId?: string; id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = item.controlId || item.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function buildRcmPayload(mappingId: string, values: TodFormValues): RcmBatchItem {
  return {
    mappingId,
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
}

function buildTodPayload(controlId: string, values: TodFormValues): TodSavePayload {
  return {
    controlId,
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
}

type Workflowish = {
  workflowStatus?: string | null;
  line2Status?: string | null;
  isDraft?: boolean | null;
};

/** Single place for the Draft → In Review → Validated fallback. */
export function resolveWorkflowStatus(record: Workflowish): string {
  if (record.workflowStatus) return record.workflowStatus;
  if (record.line2Status === 'Validated') return 'Validated';
  if (record.isDraft) return 'Draft';
  return 'In Review';
}

function csaRecordDetailKey(recordId: string): string[] {
  return ['csa-record-detail', recordId];
}

function csaMatrixKey(bpmProcessId: string, workingYear: string): string[] {
  return ['rcm-matrix-tlc-process', bpmProcessId, workingYear];
}

function csaWorklistKey(workingYear: string): string[] {
  return ['csa-worklist', workingYear];
}

export function findTodEvaluation<T extends { controlId: string }>(
  evaluations: T[],
  control: { controlId: string },
): T | undefined {
  return evaluations.find((e) => e.controlId === control.controlId);
}

export function isValidAssessmentDate(value: unknown): boolean {
  if (typeof value === 'object' && value !== null && typeof (value as { getTime?: unknown }).getTime === 'function') {
    return Number.isFinite((value as { getTime: () => number }).getTime());
  }
  const time = new Date(value as string).getTime();
  return Number.isFinite(time);
}

/** PDF transport: fetch the blob and trigger the browser download. */
export async function exportCsaRecordPdf(recordId: string, filename: string, failureMessage: string): Promise<void> {
  const res = await fetch(`/api/csa/${recordId}/export-pdf`, {
    headers: { 'X-Mock-Role': localStorage.getItem('mockRole') || 'Line 2' },
  });
  if (!res.ok) throw new Error(failureMessage);
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/** Shared orchestration behind the CSA assessed row and card adapters. */
export function useCsaAssessedDetail({ recordId, bpmProcessId, isExpanded }: UseCsaAssessedDetailArgs) {
  const { workingYear } = useFiscalYearStore();
  const queryClient = useQueryClient();
  const { evaluations, saveMutation } = useTOD(recordId);
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);
  const { isExporting: isExportingXls, exportNow } =
    useExcelExport<Record<string, string>>();

  const { data: fullRecord, isLoading: isRecordLoading } = useQuery({
    queryKey: csaRecordDetailKey(recordId),
    queryFn: () => api<CSARecord>(`/api/csa/${recordId}`),
    enabled: isExpanded,
  });

  const { data: matrixData } = useQuery({
    queryKey: csaMatrixKey(bpmProcessId ?? '', workingYear),
    queryFn: () =>
      api<{ items: MatrixControl[] }>(`/api/rcm-matrix/tlc?bpmProcessId=${bpmProcessId}&year=${workingYear}`),
    enabled: isExpanded && !!bpmProcessId,
  });

  const controls = React.useMemo(
    () => dedupeMatrixControls(matrixData?.items ?? []),
    [matrixData?.items],
  );

  const applyWorkflowStatus = React.useCallback(
    (id: string, newStatus: string) => {
      queryClient.setQueryData<CSARecord>(csaRecordDetailKey(id), (old) =>
        old ? { ...old, workflowStatus: newStatus } : old,
      );
    },
    [queryClient],
  );

  /**
   * Ordered dual-write: RCM batch-update first, then the TOD evaluation.
   * A second-write failure propagates to the caller (partial failure is
   * surfaced, not swallowed). Cache invalidation runs exact-once per call
   * in `finally`, on success and on either failure path.
   */
  const saveDual = React.useCallback(
    async (control: MatrixControl, values: TodFormValues) => {
      try {
        await api('/api/rcm-matrix/tlc/batch-update', {
          method: 'POST',
          body: JSON.stringify({ items: [buildRcmPayload(control.mappingId, values)] }),
        });
        await saveMutation.mutateAsync(buildTodPayload(control.controlId, values));
      } finally {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['tod-evaluations', recordId] }),
          queryClient.invalidateQueries({ queryKey: csaRecordDetailKey(recordId) }),
          queryClient.invalidateQueries({ queryKey: csaWorklistKey(workingYear) }),
        ]);
      }
    },
    [queryClient, recordId, saveMutation, workingYear],
  );

  const exportPdf = React.useCallback(
    async (input: { processName?: string; period: string; failureMessage: string }) => {
      setIsExportingPdf(true);
      try {
        await exportCsaRecordPdf(recordId, `CSA_${input.processName || 'Report'}_${input.period}.pdf`, input.failureMessage);
      } finally {
        setIsExportingPdf(false);
      }
    },
    [recordId],
  );

  const exportXls = React.useCallback(
    async (input: CsaAssessedExportInput, onError: () => void) => {
      const name = input.processName || 'Export';
      const summary = { ...input, processName: input.processName || 'N/A' };
      return exportNow({
        rows: buildCsaRecordSummaryRows(summary),
        filename: `CSA_Report_${name}_${input.period}.xlsx`,
        exportFn: (rows, opts) => exportCsaRecordToExcel({ ...summary, filename: opts.filename }),
        onError,
      });
    },
    [exportNow],
  );

  return {
    workingYear,
    evaluations,
    saveMutation,
    fullRecord,
    isRecordLoading,
    controls,
    applyWorkflowStatus,
    saveDual,
    exportPdf,
    exportXls,
    isExportingPdf,
    isExportingXls,
  };
}
