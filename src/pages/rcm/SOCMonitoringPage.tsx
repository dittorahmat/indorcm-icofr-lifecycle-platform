import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddApplicationDialog } from '@/components/rcm/AddApplicationDialog';
import { ApplicationDetailDialog } from '@/components/rcm/ApplicationDetailDialog';
import { AddSOCReportDialog } from '@/components/audit/AddSOCReportDialog';
import { AddVendorDialog } from '@/components/audit/AddVendorDialog';
import { SOCReviewDialog } from '@/components/audit/SOCReviewDialog';
import { useConfirm } from '@/hooks/use-confirm';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import type { Application, SOCReport } from '@shared/types';
import { useSocMonitoring } from './useSocMonitoring';
import { SignificantApplicationInventory } from './components/SignificantApplicationInventory';
import { SocMonitoringHeaderActions } from './components/SocMonitoringHeaderActions';
import { SocMonitoringSummary } from './components/SocMonitoringSummary';
import { SocRepository } from './components/SocRepository';
import { Table1ComplianceNote } from './components/Table1ComplianceNote';

/**
 * Orchestrator for the significant-application inventory + SOC repository
 * (Bab III.1.5 & 4.3). Data/write live in `useSocMonitoring`, badge decisions
 * in `soc-monitoring-badges`, both views are thin adapters under `./components`.
 * This file owns composition + local dialog state only.
 */
export function SOCMonitoringPage() {
  const confirm = useConfirm();
  const { t } = useTranslation(['rcm', 'common']);
  const {
    applications,
    socReports,
    vendors,
    isLoadingApplications,
    isLoadingSocReports,
    removeApplication,
  } = useSocMonitoring();

  const [selectedReport, setSelectedReport] = React.useState<SOCReport | null>(null);
  const [editingApp, setEditingApp] = React.useState<Application | null>(null);
  const [selectedAppDetail, setSelectedAppDetail] = React.useState<Application | null>(null);
  const [isAddAppModalOpen, setIsAddAppModalOpen] = React.useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = React.useState(false);
  const [isAddSOCModalOpen, setIsAddSOCModalOpen] = React.useState(false);

  useUnsavedChanges(
    isAddAppModalOpen || isAddVendorModalOpen || isAddSOCModalOpen ||
      !!selectedReport || !!editingApp || !!selectedAppDetail,
  );

  const handleDelete = useCallback(
    async (application: Application) => {
      const ok = await confirm({
        title: t('rcm:soc.delete_app_title', { defaultValue: 'Remove Application' }),
        description: t('rcm:soc.delete_app_description', {
          defaultValue:
            'Are you sure you want to remove application "{{name}}" from library? This will delete all scoping and RCM associations for this application.',
          name: application.name,
        }),
        confirmText: t('common:actions.delete', { defaultValue: 'Delete' }),
        variant: 'destructive',
      });
      if (ok) removeApplication(application.id);
    },
    [confirm, removeApplication, t],
  );

  const validReportsCount = socReports.filter((report) => report.status === 'Valid').length;
  const expiredReportsCount = socReports.filter((report) => report.status === 'Expired').length;

  return (
    <AppLayout container>
      <div className="space-y-6">
        <PageHeader
          title={t('rcm:soc.page_title', { defaultValue: 'Application Inventory & IT Assets' })}
          description={t('rcm:soc.page_description', {
            defaultValue: 'Evaluation of 3rd Parties and Significant Applications (Bab III.1.5 & 4.3).',
          })}
        >
          <SocMonitoringHeaderActions
            onAddVendor={() => setIsAddVendorModalOpen(true)}
            onRegisterSoc={() => setIsAddSOCModalOpen(true)}
            onAddApplication={() => setIsAddAppModalOpen(true)}
          />
        </PageHeader>

        <Tabs defaultValue="apps">
          <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain no-scrollbar -mx-1 px-1">
            <TabsList className="flex w-full sm:w-auto sm:grid sm:grid-cols-2 sm:max-w-[400px] min-w-max sm:min-w-0 gap-1 min-h-[44px]">
              <TabsTrigger value="apps" className="flex-1 sm:flex-none min-h-[44px] min-w-[140px] sm:min-w-0 px-4 text-xs font-semibold">
                {t('rcm:soc.tab.applications', { defaultValue: 'Significant Applications' })}
              </TabsTrigger>
              <TabsTrigger value="soc" className="flex-1 sm:flex-none min-h-[44px] min-w-[140px] sm:min-w-0 px-4 text-xs font-semibold">
                {t('rcm:soc.tab.reports', { defaultValue: 'SOC Monitoring' })}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="apps" className="space-y-6 pt-4">
            <SignificantApplicationInventory
              applications={applications}
              isLoading={isLoadingApplications}
              onView={setSelectedAppDetail}
              onEdit={setEditingApp}
              onDelete={handleDelete}
            />
            <Table1ComplianceNote />
          </TabsContent>

          <TabsContent value="soc" className="space-y-6 pt-4">
            <SocMonitoringSummary
              validReports={validReportsCount}
              expiredReports={expiredReportsCount}
              totalVendors={vendors.length}
            />
            <SocRepository reports={socReports} isLoading={isLoadingSocReports} onReview={setSelectedReport} />
          </TabsContent>
        </Tabs>

        {selectedReport && (
          <SOCReviewDialog
            report={selectedReport}
            isOpen={!!selectedReport}
            onClose={() => setSelectedReport(null)}
            onSave={() => setSelectedReport(null)}
          />
        )}

        <AddApplicationDialog
          isOpen={isAddAppModalOpen || !!editingApp}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddAppModalOpen(false);
              setEditingApp(null);
            } else {
              setIsAddAppModalOpen(true);
            }
          }}
          initialData={editingApp}
        />

        <AddVendorDialog isOpen={isAddVendorModalOpen} onOpenChange={setIsAddVendorModalOpen} />

        <AddSOCReportDialog isOpen={isAddSOCModalOpen} onOpenChange={setIsAddSOCModalOpen} />

        <ApplicationDetailDialog
          application={selectedAppDetail}
          isOpen={!!selectedAppDetail}
          onOpenChange={(open) => {
            if (!open) setSelectedAppDetail(null);
          }}
          onEditApplication={(application) => {
            setSelectedAppDetail(null);
            setEditingApp(application);
          }}
        />
      </div>
    </AppLayout>
  );
}
