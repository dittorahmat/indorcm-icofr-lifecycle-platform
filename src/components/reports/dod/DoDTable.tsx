import { useTranslation } from 'react-i18next';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { checkMark, formatIDR, getSeverityMeta } from './dod-format';
import type { AssertionKey, BoxKey, FormattedDoDRow } from './dod-types';
import {
  ASSERTION_CODE,
  ASSERTION_FIELDS,
  ASSERTION_TIP,
} from '@shared/assertion-fields';

const ASSERTION_COLS: Array<{ key: AssertionKey; label: string; tip: AssertionKey }> =
  ASSERTION_FIELDS.map((field) => ({
    key: ASSERTION_TIP[field],
    label: ASSERTION_CODE[field],
    tip: ASSERTION_TIP[field],
  }));

const BOX_COLS: Array<{ key: BoxKey; label: string; tip: string }> = [
  { key: 'box1', label: 'B1 (xviii)', tip: 'box1' },
  { key: 'box2', label: 'B2 (xix)', tip: 'box2' },
  { key: 'box3', label: 'B3 (xx)', tip: 'box3' },
  { key: 'box4', label: 'B4 (xxi)', tip: 'box4' },
  { key: 'box5', label: 'B5 (xxii)', tip: 'box5' },
  { key: 'box6', label: 'B6 (xxiii)', tip: 'box6' },
  { key: 'box7', label: 'B7 (xxiv)', tip: 'box7' },
];

const BOX_YES_CLASS: Record<BoxKey, string> = {
  box1: 'text-emerald-700',
  box2: 'text-emerald-700',
  box3: 'text-red-700 font-bold',
  box4: 'text-amber-700 font-bold',
  box5: 'text-emerald-700',
  box6: 'text-red-700 font-bold',
  box7: 'text-amber-700 font-bold',
};

function DodHeadTip({
  label,
  tipBase,
  tone,
}: {
  label: string;
  tipBase: string;
  tone: 'blue' | 'amber';
}) {
  const { t } = useTranslation(['reports', 'common']);
  const triggerClass =
    tone === 'blue'
      ? 'cursor-help underline decoration-dotted underline-offset-2 hover:text-blue-700 decoration-blue-400'
      : 'cursor-help underline decoration-dotted underline-offset-2 hover:text-amber-700 decoration-amber-500';
  const titleClass =
    tone === 'blue' ? 'font-bold text-xs text-blue-300' : 'font-bold text-xs text-amber-300';
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={triggerClass}>
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-left p-2.5 bg-slate-900 text-white rounded-md shadow-lg border border-slate-700">
          <p className={titleClass}>{t(`dodReport.tooltips.${tipBase}.title`)}</p>
          <p className="text-xs text-slate-200 mt-1 leading-snug">{t(`dodReport.tooltips.${tipBase}.desc`)}</p>
          <p className="text-xs font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">
            {t(`dodReport.tooltips.${tipBase}.ref`)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function DoDTableRow({ row, index }: { row: FormattedDoDRow; index: number }) {
  const { t } = useTranslation(['reports', 'common']);
  const yesLabel = t('common:yes', { defaultValue: 'Ya' });
  const noLabel = t('common:no', { defaultValue: 'Tidak' });
  const sev = getSeverityMeta(row.severity);

  return (
    <TableRow key={`${row.ref}-${index}`} className="border-b border-border hover:bg-muted/40 transition-colors">
      <TableCell className="font-mono text-xs font-bold text-foreground border-r border-border py-2 px-3">
        {row.ref}
      </TableCell>
      <TableCell className="text-xs text-foreground font-medium border-r border-border py-2 px-3 max-w-[280px]">
        {row.description}
      </TableCell>
      <TableCell className="text-center border-r border-border py-2 px-3">
        {row.isRemediated ? (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs rounded-md">
            {yesLabel}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300 font-semibold text-xs rounded-md">
            {noLabel}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground border-r border-border py-2 px-3 font-medium">
        {row.ineffectivePeriod}
      </TableCell>
      <TableCell className="text-right font-mono text-xs font-semibold text-foreground border-r border-border py-2 px-3">
        {formatIDR(row.exposureValue)}
      </TableCell>
      <TableCell className="text-center border-r border-border py-2 px-3">
        <Badge className={sev.className}>{t(sev.labelKey)}</Badge>
      </TableCell>

      <TableCell className="text-xs text-foreground font-medium border-r border-border py-2 px-3">
        {row.impactedAccount}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground border-r border-border py-2 px-3">
        {row.cosoComponent}
      </TableCell>
      <TableCell className="text-xs text-foreground font-medium border-r border-border py-2 px-3">
        {row.businessProcess}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground border-r border-border py-2 px-3">
        {row.businessUnit}
      </TableCell>

      {ASSERTION_COLS.map((col) => (
        <TableCell key={col.key} className="text-center font-bold text-xs border-r border-border py-2 px-3 text-blue-700">
          {checkMark(row.assertions[col.key])}
        </TableCell>
      ))}

      {BOX_COLS.map((col, i) => (
        <TableCell
          key={col.key}
          className={`text-center text-xs font-semibold py-2 px-3 ${i < BOX_COLS.length - 1 ? 'border-r border-border' : ''}`}
        >
          {row.boxes[col.key] ? (
            <span className={BOX_YES_CLASS[col.key]}>{yesLabel}</span>
          ) : (
            <span className="text-slate-500">{noLabel}</span>
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DoDTable({ rows, showFullTable }: { rows: FormattedDoDRow[]; showFullTable: boolean }) {
  const { t } = useTranslation(['reports', 'common']);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const pagedRows = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  return (
    <div className={`rounded-lg border border-border overflow-hidden bg-background max-w-full ${showFullTable ? 'block' : 'hidden'} md:block`}>
      <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint">
        <Table className="min-w-[2000px] border-collapse print:min-w-0 print:w-full print:text-xs">
          <TableHeader className="bg-slate-50 border-b border-border">
            <TableRow className="border-b border-border text-center">
              <TableHead colSpan={6} className="text-center font-bold text-xs uppercase bg-slate-100 text-slate-800 border-r border-border py-2">
                {t('dodReport.table.groupFinding')} (i - vi)
              </TableHead>
              <TableHead colSpan={4} className="text-center font-bold text-xs uppercase bg-slate-50 text-slate-800 border-r border-border py-2">
                {t('dodReport.table.groupAggregation')} (vii - x)
              </TableHead>
              <TableHead colSpan={7} className="text-center font-bold text-xs uppercase bg-blue-50 text-blue-900 border-r border-border py-2">
                {t('dodReport.table.groupAssertions')} (xi - xvii)
              </TableHead>
              <TableHead colSpan={7} className="text-center font-bold text-xs uppercase bg-amber-50 text-amber-900 py-2">
                {t('dodReport.table.groupDecisionTree')} (xviii - xxiv)
              </TableHead>
            </TableRow>

            <TableRow className="border-b border-border text-left">
              <TableHead className="w-[120px] text-xs font-semibold text-slate-800 border-r border-border py-2 px-3">{t('dodReport.table.col1')}</TableHead>
              <TableHead className="min-w-[200px] text-xs font-semibold text-slate-800 border-r border-border py-2 px-3">{t('dodReport.table.col2')}</TableHead>
              <TableHead className="w-[100px] text-xs font-semibold text-center text-slate-800 border-r border-border py-2 px-3">{t('dodReport.table.col3')}</TableHead>
              <TableHead className="w-[130px] text-xs font-semibold text-slate-800 border-r border-border py-2 px-3">{t('dodReport.table.col4')}</TableHead>
              <TableHead className="w-[150px] text-xs font-semibold text-right text-slate-800 border-r border-border py-2 px-3">{t('dodReport.table.col5')}</TableHead>
              <TableHead className="w-[180px] text-xs font-semibold text-center text-slate-800 border-r border-border py-2 px-3">{t('dodReport.table.col6')}</TableHead>

              <TableHead className="w-[160px] text-xs font-semibold text-slate-800 border-r border-border py-2 px-3">{t('dodReport.table.col7')}</TableHead>
              <TableHead className="w-[140px] text-xs font-semibold text-slate-800 border-r border-border py-2 px-3">{t('dodReport.table.col8')}</TableHead>
              <TableHead className="w-[150px] text-xs font-semibold text-slate-800 border-r border-border py-2 px-3">{t('dodReport.table.col9')}</TableHead>
              <TableHead className="w-[140px] text-xs font-semibold text-slate-800 border-r border-border py-2 px-3">{t('dodReport.table.col10')}</TableHead>

              {ASSERTION_COLS.map((col) => (
                <TableHead key={col.key} className="w-[50px] text-xs font-semibold text-center text-blue-900 border-r border-border py-2 px-3">
                  <DodHeadTip label={col.label} tipBase={col.tip} tone="blue" />
                </TableHead>
              ))}

              {BOX_COLS.map((col) => (
                <TableHead
                  key={col.key}
                  className={`w-[95px] text-xs font-semibold text-center text-amber-900 py-2 px-3 ${col.key !== 'box7' ? 'border-r border-border' : ''}`}
                >
                  <DodHeadTip label={col.label} tipBase={col.tip} tone="amber" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={24} className="text-center py-10 text-muted-foreground font-medium text-xs">
                  {t('dodReport.empty')}
                </TableCell>
              </TableRow>
            ) : (
              pagedRows.map((r, idx) => <DoDTableRow key={`${r.ref}-${idx}`} row={r} index={idx} />)
            )}
          </TableBody>
        </Table>
      </div>

      {rows.length > 0 && (
        <div data-testid="dod-table-pagination">
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            totalItems={rows.length}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}
