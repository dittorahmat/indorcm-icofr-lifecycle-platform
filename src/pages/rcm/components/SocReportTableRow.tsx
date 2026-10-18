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
      <TableCell className="font-semibold text-slate-800">{report.vendorName}</TableCell>
      <TableCell className="text-xs">{report.reportType}</TableCell>
      <TableCell className="text-xs whitespace-nowrap">
        {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <SocBadge spec={socStatusBadge(report.status)} />
      </TableCell>
      <TableCell>
        {report.evaluation?.id ? (
          <Badge variant="outline" className="text-xs gap-1 border-green-200 text-green-700 bg-green-50">
            <ShieldCheck className="h-3 w-3" />
            {t('rcm:soc.evaluation.reviewed', { defaultValue: 'Reviewed' })}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs gap-1 border-amber-200 text-amber-700 bg-amber-50">
            <AlertCircle className="h-3 w-3" />
            {t('rcm:soc.evaluation.pending', { defaultValue: 'Pending Review' })}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReview(report)}
          className="gap-2 text-indigo-600 hover:bg-indigo-50 h-11 sm:h-8 min-h-[44px] sm:min-h-0 px-3 text-xs font-semibold"
        >
          <FileSearch className="h-4 w-4" />
          {t('rcm:soc.action.review', { defaultValue: 'Review' })}
        </Button>
      </TableCell>
    </TableRow>
  );
}
