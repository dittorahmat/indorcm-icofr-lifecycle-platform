import { format } from 'date-fns';
import type { ChangeLog } from '@shared/types';
import type { RegulatoryExportColumn } from './rcm-excel-export';

export interface ChangeLogColumnLabels {
  no: string;
  company: string;
  process: string;
  subProcess: string;
  reportDate: string;
  owner: string;
  descBefore: string;
  descAfter: string;
  refBefore: string;
  refAfter: string;
  effectiveDate: string;
  preparer: string;
  approver: string;
}

export interface ChangeLogRegulatoryMeta {
  process: string;
  subProcess: string;
  descBefore: string;
  descAfter: string;
  refBefore: string;
  refAfter: string;
  owner: string;
}

const FALLBACK = '-';

export function extractChangeLogMeta(log: ChangeLog): ChangeLogRegulatoryMeta {
  const dataBefore = log.dataBefore as Record<string, any> | null;
  const dataAfter = log.dataAfter as Record<string, any> | null;
  return {
    process: dataAfter?.process || dataBefore?.process || FALLBACK,
    subProcess: dataAfter?.subProcess || dataBefore?.subProcess || FALLBACK,
    descBefore: dataBefore?.controlDescription || dataBefore?.riskDescription || log.descriptionBefore || FALLBACK,
    descAfter: dataAfter?.controlDescription || dataAfter?.riskDescription || log.descriptionAfter || FALLBACK,
    refBefore: dataBefore?.controlId || dataBefore?.id || FALLBACK,
    refAfter: dataAfter?.controlId || dataAfter?.id || FALLBACK,
    owner: dataAfter?.executingFunction || dataAfter?.executorRole || dataBefore?.executingFunction || FALLBACK,
  };
}

export function changeLogRegulatoryColumns(labels: ChangeLogColumnLabels): RegulatoryExportColumn[] {
  return [
    { key: 'no', header: labels.no, numeric: true },
    { key: 'company', header: labels.company },
    { key: 'process', header: labels.process },
    { key: 'subProcess', header: labels.subProcess },
    { key: 'reportDate', header: labels.reportDate },
    { key: 'owner', header: labels.owner },
    { key: 'descBefore', header: labels.descBefore },
    { key: 'descAfter', header: labels.descAfter },
    { key: 'refBefore', header: labels.refBefore },
    { key: 'refAfter', header: labels.refAfter },
    { key: 'effectiveDate', header: labels.effectiveDate },
    { key: 'preparer', header: labels.preparer },
    { key: 'approver', header: labels.approver },
  ];
}

export function mapChangeLogToRegulatoryRow(
  log: ChangeLog,
  index: number,
  companyName: string,
  resolveUserName: (id?: string | null) => string,
): Record<string, unknown> {
  const meta = extractChangeLogMeta(log);
  return {
    no: index + 1,
    company: companyName,
    process: meta.process,
    subProcess: meta.subProcess,
    reportDate: log.timestamp ? format(log.timestamp, 'yyyy-MM-dd HH:mm:ss') : FALLBACK,
    owner: meta.owner,
    descBefore: meta.descBefore,
    descAfter: meta.descAfter,
    refBefore: meta.refBefore,
    refAfter: meta.refAfter,
    effectiveDate: log.effectiveDate ? format(log.effectiveDate, 'yyyy-MM-dd') : FALLBACK,
    preparer: resolveUserName(log.userId),
    approver: resolveUserName(log.approvedBy ?? undefined),
  };
}

export function changeLogRegulatoryFilename(): string {
  return `BUMN_ICOFR_ChangeLog_Lampiran6_${format(new Date(), 'yyyyMMdd')}.xlsx`;
}
