import { FileSearch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { SOCReport } from '@shared/types';
import { socStatusBadge } from '../soc-monitoring-badges';
import { SocBadge } from './SocBadge';

interface SocReportCardProps {
  report: SOCReport;
  onReview: (report: SOCReport) => void;
}

/**
 * Mobile adapter (`block md:hidden`) for one SOC report. The evaluation badge
 * is deliberately absent here — the desktop row owns the `Evaluation` column.
 */
export function SocReportCard({ report, onReview }: SocReportCardProps) {
  const { t } = useTranslation(['rcm', 'common']);

  return (
    <div
      data-testid={`soc-card-${report.id}`}
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground leading-snug">{report.vendorName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{report.reportType}</p>
        </div>
        <SocBadge spec={socStatusBadge(report.status)} className="shrink-0" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onReview(report)}
        className="mt-2 w-full min-h-[44px] gap-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
      >
        <FileSearch className="h-4 w-4" />
        {t('rcm:soc.action.review', { defaultValue: 'Review' })}
      </Button>
    </div>
  );
}
