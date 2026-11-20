import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';
import type { Application } from '@shared/types';
import { ApplicationCard } from './ApplicationCard';
import { ApplicationTableRow } from './ApplicationTableRow';

interface SignificantApplicationInventoryProps {
  applications: Application[];
  isLoading: boolean;
  onView: (application: Application) => void;
  onEdit: (application: Application) => void;
  onDelete: (application: Application) => void;
}

/**
 * Card shell for Tabel 1 (significant application inventory). Both views are
 * thin adapters over `useSocMonitoring` data; this file owns the table shell,
 * the loading/empty states and the mobile/desktop switch only.
 */
export function SignificantApplicationInventory({
  applications,
  isLoading,
  onView,
  onEdit,
  onDelete,
}: SignificantApplicationInventoryProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const isEmpty = applications.length === 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
        <CardTitle className="text-base sm:text-lg font-bold">
          {t('rcm:soc.applications.title', { defaultValue: 'Significant Application Inventory' })}
        </CardTitle>
        <CardDescription className="text-xs">
          {t('rcm:soc.applications.description', {
            defaultValue: 'Inventory of IT assets affecting ICOFR and their ITGC status (Tabel 1).',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-5">
        <div className="px-3 pt-3 sm:px-0 sm:pt-0">
          <MobileDesktopBanner recordCount={applications.length} />
        </div>
        <div className="block md:hidden space-y-2.5 px-3 sm:px-0">
          {isLoading ? (
            <p className="text-center py-8 text-xs text-muted-foreground">
              {t('rcm:soc.loading', { defaultValue: 'Loading...' })}
            </p>
          ) : isEmpty ? (
            <p className="text-center py-8 text-xs text-muted-foreground">
              {t('rcm:soc.applications.empty', {
                defaultValue: 'No applications found. Click "Add Application" to start.',
              })}
            </p>
          ) : (
            applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onView={onView}
                onEdit={onEdit}
              />
            ))
          )}
        </div>
        <div className="hidden md:block overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-2.5 px-3 text-xs">{t('rcm:soc.table.application_name', { defaultValue: 'Application Name' })}</TableHead>
                <TableHead className="py-2.5 px-3 text-xs">{t('rcm:soc.table.icofr_scope', { defaultValue: 'ICOFR Scope (Y/N)' })}</TableHead>
                <TableHead className="py-2.5 px-3 text-xs">{t('rcm:soc.table.business_owner', { defaultValue: 'Business Owner' })}</TableHead>
                <TableHead className="py-2.5 px-3 text-xs">{t('rcm:soc.table.application_owner', { defaultValue: 'Application Owner' })}</TableHead>
                <TableHead className="py-2.5 px-3 text-xs">{t('rcm:soc.table.architecture', { defaultValue: 'Application Architecture' })}</TableHead>
                <TableHead className="py-2.5 px-3 text-xs">{t('rcm:soc.table.criticality', { defaultValue: 'Criticality' })}</TableHead>
                <TableHead className="py-2.5 px-3 text-xs">{t('rcm:soc.table.itgc_status', { defaultValue: 'ITGC Status' })}</TableHead>
                <TableHead className="py-2.5 px-3 text-xs">{t('rcm:soc.table.linked_controls', { defaultValue: 'Linked Controls' })}</TableHead>
                <TableHead className="py-2.5 px-3 text-xs">{t('rcm:soc.table.itgc_areas', { defaultValue: 'ITGC Areas (Table 1 Mapping)' })}</TableHead>
                <TableHead className="py-2.5 px-3 text-xs text-right">{t('rcm:soc.table.actions', { defaultValue: 'Actions' })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    {t('rcm:soc.loading', { defaultValue: 'Loading...' })}
                  </TableCell>
                </TableRow>
              ) : isEmpty ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-slate-400">
                    {t('rcm:soc.applications.empty', {
                      defaultValue: 'No applications found. Click "Add Application" to start.',
                    })}
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((application) => (
                  <ApplicationTableRow
                    key={application.id}
                    application={application}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
