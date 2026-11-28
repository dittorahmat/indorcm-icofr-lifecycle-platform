import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, XCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useExcelExport } from '@/lib/useExcelExport';
import type { Settings, TestRecord } from '@shared/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

import { useReportSummary, useSignOffReport, useExportReport, useReportData } from '@/hooks/use-reports';
import { ReportDashboard } from '@/components/reports/ReportDashboard';
import { ReportExportPanel } from '@/components/reports/ReportExportPanel';
import { ManagementAssessment } from '@/components/reports/ManagementAssessment';
import { RegulatoryAppendices } from '@/components/reports/RegulatoryAppendices';
import { PageHeader } from '@/components/layout/PageHeader';
import { CollapsibleFilterCard } from '@/components/layout/CollapsibleFilterCard';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';
import { buildTestingRows, testingColumns, toTestingExportRecord, type TestingResultRow } from './testing-rows';

const TEST_TYPE_FILTERS: ReadonlyArray<'ALL' | TestRecord['testType']> = ['ALL', 'TOD', 'TOE'];
const TEST_STATUS_FILTERS: ReadonlyArray<'ALL' | TestRecord['result']> = ['ALL', 'Effective', 'Ineffective'];

const RESULT_BADGE_CLASS: Record<TestRecord['result'], string> = {
  Effective: 'bg-green-100 text-green-700 border-green-200',
  Ineffective: 'bg-red-100 text-red-700 border-red-200',
};

/** Mobile adapter over the single derived row. */
function TestingResultCard({ row }: { row: TestingResultRow }) {
  const { t } = useTranslation('reports');
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs font-bold text-primary leading-none">{row.controlCode}</p>
          <p className="mt-1 text-xs font-semibold text-slate-800 leading-snug">{row.controlName}</p>
          <p className="mt-1 text-xs text-muted-foreground">{row.process} / {row.subProcess}</p>
        </div>
        <Badge variant="outline" className={cn('text-xs uppercase font-bold shrink-0', RESULT_BADGE_CLASS[row.result])}>
          {row.result}
        </Badge>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <span className="font-mono font-bold">{row.type}</span>
        <span aria-hidden="true">·</span>
        <span className="font-mono">{row.method}</span>
        <span aria-hidden="true">·</span>
        <span>{row.sample} {t('testing.table.sample')}</span>
      </div>
      {row.notes ? (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">&quot;{row.notes}&quot;</p>
      ) : null}
    </div>
  );
}

/** Desktop adapter over the single derived row. */
function TestingResultTableRow({ row }: { row: TestingResultRow }) {
  const { t } = useTranslation('reports');
  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell className="text-center text-xs font-medium text-muted-foreground py-2 px-3">{row.no}</TableCell>
      <TableCell className="py-2 px-3">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-blue-800 uppercase tracking-tighter">{row.process}</p>
          <p className="text-xs text-slate-600 line-clamp-1">{row.subProcess}</p>
        </div>
      </TableCell>
      <TableCell className="py-2 px-3">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-primary leading-none">{row.controlCode}</p>
          <p className="text-xs font-medium leading-tight text-slate-700 line-clamp-2">{row.controlName}</p>
        </div>
      </TableCell>
      <TableCell className="text-center py-2 px-3">
        <div className="flex flex-wrap justify-center gap-0.5">
          {row.assertions.map((assertion) => (
            <Badge key={assertion} variant="outline" className="text-xs h-3.5 px-1 bg-slate-50">{assertion.substring(0, 1)}</Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="text-center py-2 px-3">
        <Badge variant="outline" className={cn(
          'text-xs h-5',
          row.type === 'TOD' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-purple-200 text-purple-700 bg-purple-50',
        )}>
          {row.type}
        </Badge>
      </TableCell>
      <TableCell className="text-center text-xs font-medium text-slate-600 font-mono py-2 px-3">{row.method}</TableCell>
      <TableCell className="text-center py-2 px-3">
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div
                key={step}
                className={cn(
                  'w-1.5 h-3 rounded-full',
                  step <= row.attributeCount ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]' : 'bg-slate-200',
                )}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-slate-500">{row.attributeCount}/6 Criteria</span>
        </div>
      </TableCell>
      <TableCell className="text-center text-xs font-mono font-bold text-slate-600 py-2 px-3">{row.sample}</TableCell>
      <TableCell className="text-center py-2 px-3">
        <Badge className={cn(
          'text-xs uppercase font-bold',
          row.result === 'Effective' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' : 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200',
        )} variant="outline">
          {row.result === 'Effective' ? <><CheckCircle2 className="h-2 w-2 mr-1" /> {t('reports:testing.effective').toUpperCase()}</> : <><XCircle className="h-2 w-2 mr-1" /> {t('reports:testing.ineffective').toUpperCase()}</>}
        </Badge>
      </TableCell>
      <TableCell className="py-2 px-3 text-xs text-muted-foreground leading-relaxed">
        <p className="line-clamp-3">&quot;{row.notes}&quot;</p>
        <p className="text-xs mt-1 uppercase font-bold">Audit Ref: {row.id.substring(0, 8).toUpperCase()}</p>
      </TableCell>
    </TableRow>
  );
}

export function ReportsPage() {
  const { t } = useTranslation('reports');
  const [testTypeFilter, setTestTypeFilter] = React.useState<'ALL' | TestRecord['testType']>('ALL');
  const [testStatusFilter, setTestStatusFilter] = React.useState<'ALL' | TestRecord['result']>('ALL');
  const { isExporting: isExportingTests, exportNow } = useExcelExport<TestingResultRow>();

  const { data: summaryData, isLoading: summaryLoading } = useReportSummary();
  const { rcmData, controlsData, testsData, isLoading: dataLoading } = useReportData();
  const signOffMutation = useSignOffReport();
  const exportReport = useExportReport();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/api/settings'),
  });

  const handleSignOff = () => {
    signOffMutation.mutate();
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    await exportReport(format);
  };

  const testingRows = React.useMemo(() => buildTestingRows(
    testsData,
    { controls: controlsData, rcms: rcmData },
    {
      filter: (test) =>
        (testTypeFilter === 'ALL' || test.testType === testTypeFilter) &&
        (testStatusFilter === 'ALL' || test.result === testStatusFilter),
      dateFormat: (timestamp) => format(timestamp, 'yyyy-MM-dd'),
    },
  ), [testsData, controlsData, rcmData, testTypeFilter, testStatusFilter]);

  const handleExportTestsExcel = async () => {
    await exportNow({
      rows: testingRows,
      filename: `TOD_TOE_Hasil_Pengujian_${testTypeFilter}_${testStatusFilter}_${new Date().getFullYear()}.xlsx`,
      sheetName: t('testing.title'),
      exportFn: async (rows, opts) => {
        const { exportRegulatoryTableToExcel } = await import('@/lib/rcm-excel-export');
        await exportRegulatoryTableToExcel(rows.map(toTestingExportRecord), {
          title: t('testing.title'),
          subtitle: t('testing.description'),
          identityLines: [String(new Date().getFullYear()), `${testTypeFilter} / ${testStatusFilter}`],
          columns: testingColumns((key) => t(key)),
          filename: opts.filename,
          sheetName: opts.sheetName,
        });
      },
    });
  };

  const isSigned = settings?.isPeriodLocked || false;
  const mwCount = summaryData?.deficienciesBySeverity?.find((d) => d.name === 'Material Weakness')?.count || 0;
  const isEffective = mwCount === 0;

  const isLoading = summaryLoading || settingsLoading || dataLoading;

  if (isLoading) {
    return (
      <AppLayout container>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">{t('actions.generatingReport')}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout container>
      <div className="flex flex-col gap-4">
        <PageHeader 
          title={t('pageTitle')} 
          description={t('pageDescription')}
        >
          <ReportExportPanel onExport={handleExport} />
        </PageHeader>

        <Tabs defaultValue="dashboard" className="w-full">
          <div className="border-b no-print overflow-x-auto no-scrollbar max-w-full touch-pan-x overscroll-x-contain">
            <TabsList className="bg-transparent h-auto p-0 gap-6 min-w-max">
              <TabsTrigger value="dashboard" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-0 py-2.5 font-bold uppercase tracking-wider text-xs text-slate-500 data-[state=active]:text-indigo-600 transition-all">{t('tabs.dashboard')}</TabsTrigger>
              <TabsTrigger value="management" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-0 py-2.5 font-bold uppercase tracking-wider text-xs text-slate-500 data-[state=active]:text-indigo-600 transition-all">{t('tabs.managementAssessment')}</TabsTrigger>
              <TabsTrigger value="audit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-0 py-2.5 font-bold uppercase tracking-wider text-xs text-slate-500 data-[state=active]:text-indigo-600 transition-all">{t('tabs.testingResults')}</TabsTrigger>
              <TabsTrigger value="appendices" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-0 py-2.5 font-bold uppercase tracking-wider text-xs text-slate-500 data-[state=active]:text-indigo-600 transition-all">{t('tabs.appendices')}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <ReportDashboard summaryData={summaryData} isEffective={isEffective} />
          </TabsContent>

          <TabsContent value="management">
            <ManagementAssessment 
              isSigned={isSigned}
              isEffective={isEffective}
              onSignOff={handleSignOff}
              isSigningOff={signOffMutation.isPending}
              settings={settings}
              summaryData={summaryData}
            />
          </TabsContent>

          <TabsContent value="audit" className="pt-4 space-y-4">
            <CollapsibleFilterCard
              title={t('testing.filters.title')}
              testId="reports-audit-filters"
              className="no-print"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
                  <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('testing.filters.type')}</p>
                  <div className="flex gap-1 flex-wrap">
                    {TEST_TYPE_FILTERS.map((value) => (
                      <Button 
                        key={value} 
                        size="sm" 
                        variant={testTypeFilter === value ? 'default' : 'outline'} 
                        className={cn("h-11 sm:h-7 min-h-[44px] sm:min-h-0 px-4 sm:px-3 text-xs font-bold", testTypeFilter === value ? "bg-indigo-600" : "bg-white text-slate-600")}
                        onClick={() => setTestTypeFilter(value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('testing.filters.status')}</p>
                  <div className="flex gap-1 flex-wrap">
                    {TEST_STATUS_FILTERS.map((value) => (
                      <Button 
                        key={value} 
                        size="sm" 
                        variant={testStatusFilter === value ? 'default' : 'outline'} 
                        className={cn("h-11 sm:h-7 min-h-[44px] sm:min-h-0 px-4 sm:px-3 text-xs font-bold", testStatusFilter === value ? "bg-indigo-600" : "bg-white text-slate-600")}
                        onClick={() => setTestStatusFilter(value)}
                      >
                        {value === 'ALL' ? 'ALL' : value === 'Effective' ? t('reports:testing.effective').toUpperCase() : t('reports:testing.ineffective').toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right space-y-2 w-full sm:w-auto min-w-0">
                <div>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{t('testing.referenceTitle')}</p>
                  <p className="text-xs text-slate-500 font-medium">{t('testing.referenceDesc')}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportTestsExcel}
                  disabled={isExportingTests}
                  className="gap-2 h-9 text-xs font-bold rounded-md bg-white w-full sm:w-auto justify-center"
                >
                  {isExportingTests ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  {t('actions.exportExcel')}
                </Button>
              </div>
              </div>
            </CollapsibleFilterCard>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b py-3 px-4 sm:px-6">
                <CardTitle className="text-base font-bold text-slate-900">{t('testing.title')}</CardTitle>
                <CardDescription className="text-xs">{t('testing.description')}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 p-3 sm:p-4">
                <div className="mb-4 md:hidden">
                  <MobileDesktopBanner recordCount={testingRows.length} />
                </div>
                <div className="block md:hidden space-y-3">
                  {testingRows.map((row) => (
                    <TestingResultCard key={row.id} row={row} />
                  ))}
                  {testingRows.length === 0 ? (
                    <p className="text-center py-8 text-xs text-muted-foreground">{t('testing.empty', { defaultValue: 'Belum ada hasil pengujian.' })}</p>
                  ) : null}
                </div>
                <div className="hidden md:block rounded-lg border border-slate-200 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint shadow-sm bg-white">
                  <Table className="min-w-[880px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px] text-xs uppercase font-bold text-center text-slate-500 tracking-wider py-2 px-3">{t('testing.table.no')}</TableHead>
                        <TableHead className="w-[180px] text-xs uppercase font-bold text-slate-500 tracking-wider py-2 px-3">{t('testing.table.process')}</TableHead>
                        <TableHead className="w-[180px] text-xs uppercase font-bold text-slate-500 tracking-wider py-2 px-3">{t('testing.table.control')}</TableHead>
                        <TableHead className="w-[120px] text-xs uppercase font-bold text-center text-slate-500 tracking-wider py-2 px-3">{t('testing.table.assertion')}</TableHead>
                        <TableHead className="w-[60px] text-xs uppercase font-bold text-center text-slate-500 tracking-wider py-2 px-3">{t('testing.table.type')}</TableHead>
                        <TableHead className="w-[80px] text-xs uppercase font-bold text-center text-slate-500 tracking-wider py-2 px-3">{t('testing.table.method')}</TableHead>
                        <TableHead className="text-xs uppercase font-bold text-center text-slate-500 tracking-wider py-2 px-3">{t('testing.table.criteria')}</TableHead>
                        <TableHead className="w-[60px] text-xs uppercase font-bold text-center text-slate-500 tracking-wider py-2 px-3">{t('testing.table.sample')}</TableHead>
                        <TableHead className="w-[90px] text-xs uppercase font-bold text-center text-slate-500 tracking-wider py-2 px-3">{t('testing.table.result')}</TableHead>
                        <TableHead className="w-[200px] text-xs uppercase font-bold text-left text-slate-500 tracking-wider py-2 px-3">{t('testing.table.notes')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testingRows.map((row) => (
                        <TestingResultTableRow key={row.id} row={row} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appendices">
            <RegulatoryAppendices 
              rcmData={rcmData}
              controlsData={controlsData}
              testsData={testsData}
              summaryData={summaryData}
            />
          </TabsContent>
        </Tabs>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 2cm !important; }
          .AppLayout_content { padding: 0 !important; }
          .print\\\\:block { display: block !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </AppLayout>
  );
}
