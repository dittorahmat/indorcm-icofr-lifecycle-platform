import type { TFunction } from 'i18next';
import { Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RCMColumnGroup } from '@/components/rcm/RCMTable';
import { cn } from '@/lib/utils';
import { ASSERTION_CODE, ASSERTION_FIELDS, IPO_CODE, IPO_FIELDS } from '@shared/assertion-fields';

/** One row of the Appendix 8 verification matrix. */
export interface VerificationMatrixItem {
  id: string;
  controlId: string;
  mappingId: string;
  companyName: string;
  locationCode: string;
  // Lini 1 Data
  controlCode: string;
  controlName: string;
  controlDescription: string;
  supportingDocs: string;
  isKeyControl: boolean;
  ipoC: string;
  ipoA: string;
  ipoV: string;
  ipoRa: string;
  assertionE: string;
  assertionC: string;
  assertionA: string;
  assertionCo: string;
  assertionVa: string;
  assertionRo: string;
  assertionPd: string;
  controlType: string;
  controlNature: string;
  automatedControlType: string;
  frequency: string;
  supportingApp: string;
  applicationId: string;
  executingFunction: string;
  executorRole: string;
  affectedFsliItem: string;
  effectivePeriod: string;
  // Lini 2 Data
  todId?: string;
  pilarObjective?: string;
  pilarTiming?: string;
  pilarAuthority?: string;
  pilarReliability?: string;
  pilarCoverage?: string;
  pilarEvidence?: string;
  kkReference?: string;
  conclusion?: string;
  comment?: string;
  // Metadata for grouping
  processName?: string;
  subProcessName?: string;
}

export interface VerificationColumnParams {
  t: TFunction;
  canEdit: boolean;
  onEdit: (item: VerificationMatrixItem) => void;
}

/** Appendix 8 column configuration, extracted so the page stays an orchestrator. */
export function buildVerificationDesignColumns({
  t,
  canEdit,
  onEdit,
}: VerificationColumnParams): RCMColumnGroup[] {
  return [
    {
      title: t('rcm:verification.columns.actions'),
      className: 'bg-slate-200/50 print:hidden',
      columns: [
        {
          id: 'action',
          header: t('common:actions.edit'),
          width: '60px',
          className: 'print:hidden',
          headerClassName: 'print:hidden',
          render: (row) => canEdit && (
            <Button
              variant="ghost"
              size="xs"
              className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => onEdit(row)}
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
          )
        },
        { id: 'no', header: t('rcm:matrix.no'), width: '50px', className: 'text-center font-mono text-xs text-slate-400', render: (_, idx) => idx + 1 },
        { id: 'control_ref', header: t('rcm:verification.columns.control_ref'), accessorKey: 'controlCode', width: '130px', className: 'font-mono text-xs font-bold text-slate-600 bg-white' },
      ]
    },
    {
      title: t('rcm:verification.groups.info'),
      className: 'bg-indigo-50/50',
      columns: [
        { id: 'control_name', header: t('rcm:verification.columns.control_name'), accessorKey: 'controlName', width: '280px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'control_desc', header: t('rcm:matrix.control_description'), accessorKey: 'controlDescription', width: '350px', className: 'text-xs text-slate-600 font-normal not-italic' },
        { id: 'docs', header: t('rcm:matrix.supporting_docs'), accessorKey: 'supportingDocs', width: '200px', className: 'text-xs text-slate-800 font-normal' },
        {
          id: 'is_key',
          header: t('rcm:verification.columns.is_key'),
          width: '90px',
          className: 'text-center text-xs font-mono',
          render: (row) => (
            <span className={cn(row.isKeyControl ? "font-bold text-indigo-700" : "text-slate-400 font-normal")}>
              {row.isKeyControl ? 'Y' : 'N'}
            </span>
          )
        },
      ]
    },
    {
      title: t('rcm:matrix.ipo'),
      className: 'bg-blue-600 text-white',
      columns: IPO_FIELDS.map((field) => ({
        id: field,
        header: IPO_CODE[field],
        width: '40px',
        className: 'text-center text-xs font-mono text-slate-700',
        render: (row) => row[field] === 'Y' ? 'Y' : 'N',
      }))
    },
    {
      title: t('rcm:matrix.assertions'),
      className: 'bg-indigo-600 text-white',
      columns: ASSERTION_FIELDS.map((field) => ({
        id: field,
        header: ASSERTION_CODE[field],
        width: '40px',
        className: 'text-center text-xs font-mono text-slate-700',
        render: (row) => row[field] === 'Y' ? 'Y' : 'N',
      }))
    },
    {
      title: t('rcm:matrix.groups.metadata'),
      columns: [
        { id: 'type', header: t('rcm:matrix.type'), accessorKey: 'controlType', width: '120px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'nature', header: t('rcm:matrix.nature'), accessorKey: 'controlNature', width: '150px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'auto_type', header: t('rcm:matrix.automated_type'), accessorKey: 'automatedControlType', width: '150px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'frequency', header: t('rcm:matrix.frequency'), accessorKey: 'frequency', width: '100px', className: 'text-xs text-slate-800 font-normal text-center' },
        { id: 'app', header: t('rcm:matrix.supporting_app'), accessorKey: 'supportingApp', width: '150px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'function', header: t('rcm:matrix.executing_function'), accessorKey: 'executingFunction', width: '150px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'role', header: t('rcm:matrix.executor_role'), accessorKey: 'executorRole', width: '150px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'fsli', header: t('rcm:matrix.affected_fsli_item'), accessorKey: 'affectedFsliItem', width: '150px', className: 'text-xs font-mono text-slate-600' },
        { id: 'period', header: t('rcm:matrix.effective_period'), accessorKey: 'effectivePeriod', width: '120px', className: 'text-xs font-semibold text-indigo-700' },
      ]
    },
    {
      title: t('rcm:verification.groups.tod'),
      className: 'bg-amber-50',
      columns: [
        { id: 'p_obj', header: t('rcm:verification.columns.p_obj'), accessorKey: 'pilarObjective', width: '150px', className: 'text-xs' },
        { id: 'p_time', header: t('rcm:verification.columns.p_time'), accessorKey: 'pilarTiming', width: '150px', className: 'text-xs' },
        { id: 'p_auth', header: t('rcm:verification.columns.p_auth'), accessorKey: 'pilarAuthority', width: '150px', className: 'text-xs' },
        { id: 'p_rel', header: t('rcm:verification.columns.p_rel'), accessorKey: 'pilarReliability', width: '150px', className: 'text-xs' },
        { id: 'p_cov', header: t('rcm:verification.columns.p_cov'), accessorKey: 'pilarCoverage', width: '150px', className: 'text-xs' },
        { id: 'p_evid', header: t('rcm:verification.columns.p_evid'), accessorKey: 'pilarEvidence', width: '150px', className: 'text-xs' },
        { id: 'kk_ref', header: t('rcm:verification.columns.kk_ref'), accessorKey: 'kkReference', width: '120px', className: 'font-mono text-xs' },
        {
          id: 'conclusion',
          header: t('rcm:verification.columns.conclusion'),
          width: '120px',
          className: 'text-center',
          render: (row) => row.conclusion && (
            <Badge variant="outline" className={cn("text-xs uppercase font-bold",
              row.conclusion === 'Effective' ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
            )}>
              {row.conclusion === 'Effective' ? t('common:status.effective') : t('common:status.ineffective')}
            </Badge>
          )
        },
      ]
    }
  ];
}
