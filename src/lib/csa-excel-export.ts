import type { CSARecord } from '@shared/types';
import type { RegulatoryExportColumn } from './rcm-excel-export';

export interface CsaSummaryLabels {
  no: string;
  control: string;
  totalSamples: string;
  pass: string;
  fail: string;
  status: string;
  effectiveText: string;
  ineffectiveText: string;
}

export interface CsaDetailedLabels {
  no: string;
  sampleRef: string;
  control: string;
  result: string;
  evidence: string;
  passText: string;
  failText: string;
  hasEvidenceText: string;
  noEvidenceText: string;
}

export interface CsaControlAggregate {
  id: string;
  name: string;
  total: number;
  pass: number;
  fail: number;
}

export function aggregateCsaControls(record: CSARecord): CsaControlAggregate[] {
  const stats: Record<string, CsaControlAggregate> = {};
  for (const sample of record.samples ?? []) {
    for (const [id, res] of Object.entries(sample.controlResults ?? {})) {
      const current = stats[id] ?? { id, name: (res as any)?.controlName || id, total: 0, pass: 0, fail: 0 };
      current.total += 1;
      if ((res as any)?.implemented) current.pass += 1;
      else current.fail += 1;
      stats[id] = current;
    }
  }
  return Object.values(stats);
}

export function csaSummaryColumns(labels: CsaSummaryLabels): RegulatoryExportColumn[] {
  return [
    { key: 'no', header: labels.no, numeric: true },
    { key: 'control', header: labels.control },
    { key: 'total', header: labels.totalSamples, numeric: true },
    { key: 'pass', header: labels.pass, numeric: true },
    { key: 'fail', header: labels.fail, numeric: true },
    { key: 'status', header: labels.status },
  ];
}

export function mapCsaSummaryRows(
  record: CSARecord,
  labels: Pick<CsaSummaryLabels, 'effectiveText' | 'ineffectiveText'>,
): Record<string, unknown>[] {
  return aggregateCsaControls(record).map((agg, index) => ({
    no: index + 1,
    control: `${agg.id} - ${agg.name}`,
    total: agg.total,
    pass: agg.pass,
    fail: agg.fail,
    status: agg.fail === 0 ? labels.effectiveText : labels.ineffectiveText,
  }));
}

export function csaDetailedColumns(labels: CsaDetailedLabels): RegulatoryExportColumn[] {
  return [
    { key: 'no', header: labels.no, numeric: true },
    { key: 'sampleRef', header: labels.sampleRef },
    { key: 'control', header: labels.control },
    { key: 'result', header: labels.result },
    { key: 'evidence', header: labels.evidence },
  ];
}

export function mapCsaDetailedRows(
  record: CSARecord,
  labels: Pick<CsaDetailedLabels, 'passText' | 'failText' | 'hasEvidenceText' | 'noEvidenceText'>,
): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  let counter = 0;
  for (const sample of record.samples ?? []) {
    for (const [controlId, res] of Object.entries(sample.controlResults ?? {})) {
      const result = res as any;
      counter += 1;
      rows.push({
        no: counter,
        sampleRef: (sample as any).sampleRef || (sample as any).id || '-',
        control: `${controlId} - ${result?.controlName || '-'}`,
        result: result?.implemented ? labels.passText : labels.failText,
        evidence: result?.evidenceUrl ? labels.hasEvidenceText : labels.noEvidenceText,
      });
    }
  }
  return rows;
}

export function csaAppendixFilename(layout: 'detailed' | 'summary', reference: string, period: string): string {
  const safe = (value: string) => value.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-');
  const suffix = layout === 'detailed' ? 'Detailed' : 'Summary';
  return `CSA_Appendix7a_${suffix}_${safe(reference)}_${safe(period)}.xlsx`;
}
