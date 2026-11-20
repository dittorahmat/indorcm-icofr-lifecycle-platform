import { AlertCircle, FileSearch, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import type { SOCReport } from '@shared/types';
import { socStatusBadge } from '../soc-monitoring-badges';
import { SocBadge } from './SocBadge';

interface SocReportTableRowProps {
  report: SOCReport;
  onReview: (report: SOCReport) => void;
}

/**
 * Desktop adapter (`hidden md:block` table) for one SOC report. The
 * `Evaluation` column is the deliberate difference from the mobile card; its
 * badge is single-site, so it stays inline rather than in the shared seam.
 */
export function SocReportTableRow({ report, onReview }: SocReportTableRowProps) {
  const { t } = useTranslation(['rcm', 'common']);

  return (
    <TableRow
      data-testid={`soc-row-${report.id}`}
      className="hover:bg-slate-50/50 transition-colors"
    >
      <TableCell className="py-2 px-3 font-semibold text-slate-800 text-xs">{report.vendorName}</TableCell>
      <TableCell className="py-2 px-3 text-xs">{report.reportType}</TableCell>
      <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
        {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
      </TableCell>
      <TableCell className="py-2 px-3">
        <SocBadge spec={socStatusBadge(report.status)} />
      </TableCell>
      <TableCell className="py-2 px-3">
        {report.evaluation?.id ? (
          <Badge variant="outline" className="text-xs gap-1 border-green-200 text-green-700 bg-green-50 h-5 px-1.5">
            <ShieldCheck className="h-3 w-3" />
            {t('rcm:soc.evaluation.reviewed', { defaultValue: 'Reviewed' })}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs gap-1 border-amber-200 text-amber-700 bg-amber-50 h-5 px-1.5">
            <AlertCircle className="h-3 w-3" />
            {t('rcm:soc.evaluation.pending', { defaultValue: 'Pending Review' })}
          </Badge>
        )}
      </TableCell>
      <TableCell className="py-2 px-3 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReview(report)}
          className="gap-1.5 text-indigo-600 hover:bg-indigo-50 h-11 sm:h-7 min-h-[44px] sm:min-h-0 px-2.5 text-xs font-semibold"
        >
          <FileSearch className="h-3.5 w-3.5" />
          {t('rcm:soc.action.review', { defaultValue: 'Review' })}
        </Button>
      </TableCell>
    </TableRow>
  );
}
