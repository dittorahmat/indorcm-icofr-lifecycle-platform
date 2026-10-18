import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';
import type { SOCReport } from '@shared/types';
import { SocReportCard } from './SocReportCard';
import { SocReportTableRow } from './SocReportTableRow';

interface SocRepositoryProps {
  reports: SOCReport[];
  isLoading: boolean;
  onReview: (report: SOCReport) => void;
}

/**
 * Card shell for the SOC report repository (Bab III.1.5). Both views are thin
 * adapters over `useSocMonitoring` data; this file owns the table shell and the
 * loading/empty states only.
 */
export function SocRepository({ reports, isLoading, onReview }: SocRepositoryProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const isEmpty = reports.length === 0;
  const emptyText = t('rcm:soc.reports.empty', {
    defaultValue: 'No SOC reports found. Register a vendor and report to begin.',
  });

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>
          {t('rcm:soc.reports.title', { defaultValue: 'Service Organization Control (SOC) Repository' })}
        </CardTitle>
        <CardDescription>
          {t('rcm:soc.reports.description', {
            defaultValue: 'Formal review of third-party assurance reports to ensure financial reporting data integrity.',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="px-4 pt-4 sm:px-0 sm:pt-0">
          <MobileDesktopBanner recordCount={reports.length} />
        </div>
        <div className="block md:hidden space-y-3 px-4 sm:px-0">
          {isLoading ? (
            <p className="text-center py-8 text-xs text-muted-foreground">
              {t('rcm:soc.loading_reports', { defaultValue: 'Loading SOC data...' })}
            </p>
          ) : isEmpty ? (
            <p className="text-center py-8 text-xs text-muted-foreground">{emptyText}</p>
          ) : (
            reports.map((report) => (
              <SocReportCard key={report.id} report={report} onReview={onReview} />
            ))
          )}
        </div>
        <div className="hidden md:block overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t('rcm:soc.table.vendor_name', { defaultValue: 'Vendor Name' })}</TableHead>
                <TableHead>{t('rcm:soc.table.report_type', { defaultValue: 'Report Type' })}</TableHead>
                <TableHead>{t('rcm:soc.table.coverage_period', { defaultValue: 'Coverage Period' })}</TableHead>
                <TableHead>{t('rcm:soc.table.status', { defaultValue: 'Status' })}</TableHead>
                <TableHead>{t('rcm:soc.table.evaluation', { defaultValue: 'Evaluation' })}</TableHead>
                <TableHead className="text-right">{t('rcm:soc.table.actions', { defaultValue: 'Actions' })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {t('rcm:soc.loading_reports', { defaultValue: 'Loading SOC data...' })}
                  </TableCell>
                </TableRow>
              ) : isEmpty ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                    {emptyText}
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <SocReportTableRow key={report.id} report={report} onReview={onReview} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
