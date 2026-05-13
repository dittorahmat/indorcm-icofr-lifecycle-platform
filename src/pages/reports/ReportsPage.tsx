import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import type { Settings } from '@shared/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

import { useReportSummary, useAggregateDeficiencies, useSignOffReport, useExportReport, useReportData } from '@/hooks/use-reports';
import { ReportDashboard } from '@/components/reports/ReportDashboard';
import { ReportExportPanel } from '@/components/reports/ReportExportPanel';
import { ManagementAssessment } from '@/components/reports/ManagementAssessment';
import { RegulatoryAppendices } from '@/components/reports/RegulatoryAppendices';
import { PageHeader } from '@/components/layout/PageHeader';

export function ReportsPage() {
  const { t } = useTranslation('reports');
  const queryClient = useQueryClient();
  const [testTypeFilter, setTestTypeFilter] = React.useState<'ALL' | 'TOD' | 'TOE'>('ALL');
  const [testStatusFilter, setTestStatusFilter] = React.useState<'ALL' | 'Effective' | 'Ineffective'>('ALL');
  
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

  const isSigned = settings?.isPeriodLocked || false;
  const mwCount = summaryData?.deficienciesBySeverity?.find((d: any) => d.name === 'Material Weakness')?.count || 0;
  const isEffective = mwCount === 0;

  const isLoading = summaryLoading || settingsLoading || dataLoading;

  if (isLoading) {
    return (
      <AppLayout container>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">{t('actions.generatingReport')}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout container>
      <div className="flex flex-col gap-6">
        <PageHeader 
          title="ICOFR Reporting & Management Assessment" 
          description="Regulatory reporting dashboard and Appendix 11 sign-off portal."
        >
          <ReportExportPanel onExport={handleExport} />
        </PageHeader>

        <Tabs defaultValue="dashboard" className="w-full">
          <div className="border-b no-print">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
              <TabsTrigger value="dashboard" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 font-bold uppercase tracking-wider text-xs">{t('tabs.dashboard')}</TabsTrigger>
              <TabsTrigger value="management" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 font-bold uppercase tracking-wider text-xs">{t('tabs.managementAssessment')}</TabsTrigger>
              <TabsTrigger value="audit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 font-bold uppercase tracking-wider text-xs">{t('tabs.testingResults')}</TabsTrigger>
              <TabsTrigger value="appendices" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 font-bold uppercase tracking-wider text-xs">Regulatory Appendices</TabsTrigger>
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

          <TabsContent value="audit" className="pt-4 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/20 p-4 rounded-lg border border-dashed no-print">
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Test Type</p>
                  <div className="flex gap-1">
                    {['ALL', 'TOD', 'TOE'].map(t => (
                      <Button 
                        key={t} 
                        size="sm" 
                        variant={testTypeFilter === t ? 'default' : 'outline'} 
                        className="h-7 text-xs"
                        onClick={() => setTestTypeFilter(t as any)}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Status</p>
                  <div className="flex gap-1">
                    {['ALL', 'Effective', 'Ineffective'].map(s => (
                      <Button 
                        key={s} 
                        size="sm" 
                        variant={testStatusFilter === s ? 'default' : 'outline'} 
                        className="h-7 text-xs"
                        onClick={() => setTestStatusFilter(s as any)}
                      >
                        {s === 'ALL' ? 'ALL' : s === 'Effective' ? t('reports:testing.effective').toUpperCase() : t('reports:testing.ineffective').toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-blue-700 uppercase">Regulatory Reference</p>
                <p className="text-xs text-blue-600 italic">SK-5 Bab V & Lampiran 8</p>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">Test Results Report (TOD & TOE)</CardTitle>
                <CardDescription>Consolidated results of control design and operating effectiveness testing.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[40px] text-xs uppercase font-bold text-center">No</TableHead>
                        <TableHead className="w-[180px] text-xs uppercase font-bold">Process Context (Appx 5)</TableHead>
                        <TableHead className="w-[180px] text-xs uppercase font-bold">Control Reference</TableHead>
                        <TableHead className="w-[120px] text-xs uppercase font-bold text-center">Assertion (Table 8)</TableHead>
                        <TableHead className="w-[60px] text-xs uppercase font-bold text-center">Type</TableHead>
                        <TableHead className="w-[80px] text-xs uppercase font-bold text-center">Method</TableHead>
                        <TableHead className="text-xs uppercase font-bold text-center">Appx 8 Criteria (xxvii-xxxii)</TableHead>
                        <TableHead className="w-[60px] text-xs uppercase font-bold text-center">Sample</TableHead>
                        <TableHead className="w-[90px] text-xs uppercase font-bold text-center">Result</TableHead>
                        <TableHead className="w-[200px] text-xs uppercase font-bold text-left">Walkthrough / Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testsData
                        .filter(t => testTypeFilter === 'ALL' || t.testType === testTypeFilter)
                        .filter(t => testStatusFilter === 'ALL' || t.result === testStatusFilter)
                        .map((test, index) => {
                          const control = controlsData?.find(c => c.id === test.controlId);
                          const rcm = rcmData?.find(r => r.id === control?.rcmId);
                          const attrCount = test.evaluationAttributes ? Object.values(test.evaluationAttributes).filter(Boolean).length : 0;
                          
                          return (
                            <TableRow key={test.id} className="hover:bg-muted/30">
                              <TableCell className="text-center text-xs font-medium text-muted-foreground">{index + 1}</TableCell>
                              <TableCell className="py-3">
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-blue-800 uppercase tracking-tighter">{rcm?.process || 'N/A'}</p>
                                  <p className="text-xs text-slate-600 line-clamp-1 italic">{rcm?.subProcess || 'N/A'}</p>
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-primary leading-none">{control?.code || '???'}</p>
                                  <p className="text-xs font-medium leading-tight text-slate-700 line-clamp-2">{control?.name || 'Unknown Control'}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-wrap justify-center gap-0.5">
                                  {(control?.assertions || []).map(a => (
                                    <Badge key={a} variant="outline" className="text-xs h-3.5 px-1 bg-slate-50">{a.substring(0,1)}</Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={cn(
                                  "text-xs h-5",
                                  test.testType === 'TOD' ? "border-blue-200 text-blue-700 bg-blue-50" : "border-purple-200 text-purple-700 bg-purple-50"
                                )}>
                                  {test.testType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-xs font-medium text-slate-600 font-mono italic">{test.method}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                      <div 
                                        key={i} 
                                        className={cn(
                                          "w-1.5 h-3 rounded-full",
                                          i <= attrCount ? "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" : "bg-slate-200"
                                        )} 
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs font-bold text-slate-500">{attrCount}/6 Criteria</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-xs font-mono font-bold text-slate-600">
                                {test.testType === 'TOE' ? (test.sampleSize || '-') : 'N/A'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={cn(
                                  "text-xs uppercase font-bold",
                                  test.result === 'Effective' ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" : "bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
                                )} variant="outline">
                                  {test.result === 'Effective' ? <><CheckCircle2 className="h-2 w-2 mr-1" /> {t('reports:testing.effective').toUpperCase()}</> : <><XCircle className="h-2 w-2 mr-1" /> {t('reports:testing.ineffective').toUpperCase()}</>}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3 text-xs text-muted-foreground leading-relaxed">
                                <p className="line-clamp-3 italic">"{test.comments}"</p>
                                <p className="text-xs mt-1 uppercase font-bold">Audit Ref: {test.id.substring(0,8).toUpperCase()}</p>
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
