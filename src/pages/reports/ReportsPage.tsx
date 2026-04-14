import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saveAs } from 'file-saver';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileDown, Printer, Shield, FileText, CheckCircle2, AlertTriangle, Lock, Layers, Loader2, QrCode, XCircle, BrainCircuit } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import type { Deficiency, Settings, Control, TestRecord } from '@shared/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { RegulatoryAppendices } from '@/components/reports/RegulatoryAppendices';
import { AIAnalyticsMockup } from '@/components/reports/AIAnalyticsMockup';
import { RiskHeatmap } from '@/components/reports/RiskHeatmap';
import { COSOHeatmap } from '@/components/reports/COSOHeatmap';

export function ReportsPage() {
  const queryClient = useQueryClient();
  const [testTypeFilter, setTestTypeFilter] = React.useState<'ALL' | 'TOD' | 'TOE'>('ALL');
  const [testStatusFilter, setTestStatusFilter] = React.useState<'ALL' | 'Pass' | 'Fail'>('ALL');
  
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['reportSummary'],
    queryFn: () => api<any>('/api/reports/summary'),
  });

  const { data: aggregateData } = useQuery({
    queryKey: ['aggregatedeficiencies'],
    queryFn: () => api<{ items: any[] }>('/api/aggregatedeficiencies'),
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/api/settings'),
  });

  const { data: rcmData } = useQuery({
    queryKey: ['rcm'],
    queryFn: () => api<{ items: any[] }>('/api/rcm'),
  });

  const { data: controlsData } = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });

  const { data: testsData } = useQuery({
    queryKey: ['tests'],
    queryFn: () => api<{ items: TestRecord[] }>('/api/tests'),
  });

  const signOffMutation = useMutation({
    mutationFn: () => api<Settings>('/api/reports/sign-off', { method: 'POST' }),
    onSuccess: (updatedSettings) => {
      toast.success('Report signed and locked by CEO & CFO.', {
        description: `Verification Hash: ${updatedSettings.verificationHash}`,
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />
      });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => toast.error(`Sign-off failed: ${err.message}`)
  });

  const handleSignOff = () => {
    signOffMutation.mutate();
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    const toastId = toast.loading(`Exporting to ${format.toUpperCase()}...`);
    try {
      const response = await fetch(`/api/reports/export`, {
        method: 'POST',
        headers: { 'X-Mock-Role': localStorage.getItem('mockRole') || 'Line 2' },
      });
      if (!response.ok) throw new Error('Export failed');
      const json = await response.json();

      if (format === 'csv') {
        const { unparse } = await import('papaparse');
        const csv = unparse(json);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'icofr_report.csv');
      } else {
        const XLSX = await import('xlsx');
        const rows = Array.isArray(json) ? json : [json];
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        saveAs(blob, 'icofr_report.xlsx');
      }
      toast.success('Export successful!', { id: toastId });
    } catch (error) {
      toast.error('Export failed.', { id: toastId });
    }
  };

  const isSigned = settings?.isPeriodLocked;
  const mwCount = summaryData?.deficienciesBySeverity.find((d: any) => d.name === 'Material Weakness')?.count || 0;
  const isEffective = mwCount === 0;

  const isLoading = summaryLoading || settingsLoading;

  if (isLoading) {
    return (
      <AppLayout container>
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-3xl font-bold">Reports & Exports</h1>
            <p className="text-muted-foreground">Standardized ICOFR reports for {settings?.companyName} compliance.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleExport('csv')}><FileDown className="h-4 w-4 mr-2" /> Export CSV</Button>
            <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print Report</Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="no-print">
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard">Overview</TabsTrigger>
            <TabsTrigger value="management">Management Assessment</TabsTrigger>
            <TabsTrigger value="audit">Test Results Report</TabsTrigger>
            <TabsTrigger value="appendices">Regulatory Appendices</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 pt-4">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <RiskHeatmap />
              </div>
              <div className="space-y-6">
                <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Overall Effectiveness</CardTitle></CardHeader>
                <CardContent>
                  <div className={cn("text-3xl font-bold", isEffective ? "text-green-600" : "text-red-600")}>
                    {isEffective ? "EFFECTIVE" : "INEFFECTIVE"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Controls</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{summaryData?.totalControls}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Open Deficiencies</CardTitle></CardHeader>
                <CardContent>
                  <div className={cn("text-3xl font-bold", summaryData?.openDeficiencies > 0 ? "text-red-600" : "text-green-600")}>
                    {summaryData?.openDeficiencies}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <COSOHeatmap />

          <div className="grid gap-6 md:grid-cols-2">

              <Card>
                <CardHeader><CardTitle>Deficiencies by Severity</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={summaryData?.deficienciesBySeverity}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={10} />
                      <YAxis stroke="#888888" fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Deficiency Status</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={summaryData?.deficienciesByStatus} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                        {summaryData?.deficienciesByStatus.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'Open' ? '#F97316' : '#16A34A'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="management" className="pt-4">
            <div className="flex justify-end mb-4 gap-2 no-print">
              {!isSigned ? (
                <Button onClick={handleSignOff} variant="destructive" className="font-bold" disabled={signOffMutation.isPending}>
                  {signOffMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                  Sign & Lock Report (CEO & CFO)
                </Button>
              ) : (
                <Badge className="bg-blue-600 text-white px-4 py-2 text-sm shadow-md gap-2">
                  <CheckCircle2 className="h-4 w-4" /> PERIOD FINALIZED & SIGNED
                </Badge>
              )}
            </div>
            <Card className="print:shadow-none border-none sm:border relative overflow-hidden">
              <AnimatePresence>
                {isSigned && (
                  <motion.div initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 0.15 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="border-8 border-green-600 text-green-600 font-black text-9xl p-10 rotate-[-30deg] uppercase tracking-tighter">Signed</div>
                  </motion.div>
                )}
              </AnimatePresence>
              <CardHeader className="text-center border-b pb-8">
                <div className="flex justify-center mb-4"><Shield className="h-12 w-12 text-primary" /></div>
                <CardTitle className="text-2xl uppercase">Management Assessment on ICOFR Implementation Effectiveness</CardTitle>
                <CardDescription>Appendix 11 - SK-5/DKU.MBU/11/2024</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 py-8 px-10">
                <div className="space-y-4 text-justify leading-relaxed">
                  <p>The Board of Directors of {settings?.companyName} states that:</p>
                  
                  {!isEffective ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
                      <p className="font-bold text-red-800 underline mb-2 text-center uppercase">Conclusion: Ineffective</p>
                      <p className="text-sm text-red-700">
                        Based on the evaluation performed, management concludes that the Company <strong>did not maintain</strong> effective internal control over financial reporting as of the report date, due to identified material weaknesses.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-6">
                      <p className="font-bold text-green-800 underline mb-2 text-center uppercase">Conclusion: Effective</p>
                      <p className="text-sm text-green-700">
                        Based on the evaluation performed, management concludes that the Company <strong>has maintained</strong>, in all material respects, effective internal control over financial reporting as of the report date.
                      </p>
                    </div>
                  )}

                  <ol className="list-decimal pl-5 space-y-6 text-sm text-foreground/90">
                    <li>We have reviewed the financial statements of {settings?.companyName} ending on {new Date(settings?.signedOffDate || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</li>
                    <li>To our knowledge, the financial statements do not contain any untrue statement of a material fact or omit to state a material fact necessary to make the statements made, in light of the circumstances under which such statements were made, not misleading.</li>
                    <li>To our knowledge, the financial statements and other financial information included in the financial statements, fairly present in all material respects the financial condition and results of operations for the period presented.</li>
                    <li>We have implemented controls and procedures for the preparation of financial statements deemed necessary to properly prepare and present the financial statements (consolidated) and free from material misstatement.</li>
                  </ol>
                </div>

                <div className="bg-muted/30 p-6 rounded-lg space-y-4">
                  <h3 className="font-bold border-b pb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Deficiency Details & Remediation Plan
                  </h3>
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow><TableHead>Deficiency</TableHead><TableHead>Severity</TableHead><TableHead>Remediation Plan</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {summaryData?.allDeficiencies.filter((d: any) => d.severity !== 'Control Deficiency').map((def: any) => (
                        <TableRow key={def.id}>
                          <TableCell className="font-medium">{def.description}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{def.severity}</Badge></TableCell>
                          <TableCell className="italic text-muted-foreground">Monitor progress via Deficiency Board</TableCell>
                        </TableRow>
                      ))}
                      {!summaryData?.allDeficiencies.some((d: any) => d.severity !== 'Control Deficiency') && (
                        <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No significant deficiencies or material weaknesses found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid grid-cols-2 gap-20 pt-12">
                  <div className="text-center space-y-24">
                    <p className="font-semibold border-b pb-2">Chief Financial Officer (CFO)</p>
                    <p className="font-bold">{settings?.cfoName}</p>
                  </div>
                  <div className="text-center space-y-24">
                    <p className="font-semibold border-b pb-2">Chief Executive Officer (CEO)</p>
                    <p className="font-bold">{settings?.ceoName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="pt-4 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/20 p-4 rounded-lg border border-dashed no-print">
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Test Type</p>
                  <div className="flex gap-1">
                    {['ALL', 'TOD', 'TOE'].map(t => (
                      <Button 
                        key={t} 
                        size="sm" 
                        variant={testTypeFilter === t ? 'default' : 'outline'} 
                        className="h-7 text-[10px]"
                        onClick={() => setTestTypeFilter(t as any)}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Status</p>
                  <div className="flex gap-1">
                    {['ALL', 'Pass', 'Fail'].map(s => (
                      <Button 
                        key={s} 
                        size="sm" 
                        variant={testStatusFilter === s ? 'default' : 'outline'} 
                        className="h-7 text-[10px]"
                        onClick={() => setTestStatusFilter(s as any)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-700 uppercase">Regulatory Reference</p>
                <p className="text-[11px] text-blue-600 italic">SK-5 Bab V & Lampiran 8</p>
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
                        <TableHead className="w-[40px] text-[10px] uppercase font-bold text-center">No</TableHead>
                        <TableHead className="w-[180px] text-[10px] uppercase font-bold">Process Context (Appx 5)</TableHead>
                        <TableHead className="w-[180px] text-[10px] uppercase font-bold">Control Reference</TableHead>
                        <TableHead className="w-[120px] text-[10px] uppercase font-bold text-center">Assertion (Table 8)</TableHead>
                        <TableHead className="w-[60px] text-[10px] uppercase font-bold text-center">Type</TableHead>
                        <TableHead className="w-[80px] text-[10px] uppercase font-bold text-center">Method</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-center">Appx 8 Criteria (xxvii-xxxii)</TableHead>
                        <TableHead className="w-[60px] text-[10px] uppercase font-bold text-center">Sample</TableHead>
                        <TableHead className="w-[90px] text-[10px] uppercase font-bold text-center">Result</TableHead>
                        <TableHead className="w-[200px] text-[10px] uppercase font-bold text-left">Walkthrough / Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(testsData?.items || [])
                        .filter(t => testTypeFilter === 'ALL' || t.testType === testTypeFilter)
                        .filter(t => testStatusFilter === 'ALL' || t.result === testStatusFilter)
                        .map((test, index) => {
                          const control = controlsData?.items.find(c => c.id === test.controlId);
                          const rcm = rcmData?.items.find(r => r.id === control?.rcmId);
                          const attrCount = test.evaluationAttributes ? Object.values(test.evaluationAttributes).filter(Boolean).length : 0;
                          
                          return (
                            <TableRow key={test.id} className="hover:bg-muted/30">
                              <TableCell className="text-center text-xs font-medium text-muted-foreground">{index + 1}</TableCell>
                              <TableCell className="py-3">
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-tighter">{rcm?.process || 'N/A'}</p>
                                  <p className="text-[10px] text-slate-600 line-clamp-1 italic">{rcm?.subProcess || 'N/A'}</p>
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-primary leading-none">{control?.code || '???'}</p>
                                  <p className="text-[11px] font-medium leading-tight text-slate-700 line-clamp-2">{control?.name || 'Unknown Control'}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-wrap justify-center gap-0.5">
                                  {control?.assertions.map(a => (
                                    <Badge key={a} variant="outline" className="text-[8px] h-3.5 px-1 bg-slate-50">{a.substring(0,1)}</Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={cn(
                                  "text-[9px] h-5",
                                  test.testType === 'TOD' ? "border-blue-200 text-blue-700 bg-blue-50" : "border-purple-200 text-purple-700 bg-purple-50"
                                )}>
                                  {test.testType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-[10px] font-medium text-slate-600 font-mono italic">{test.method}</TableCell>
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
                                  <span className="text-[9px] font-bold text-slate-500">{attrCount}/6 Criteria</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-xs font-mono font-bold text-slate-600">
                                {test.testType === 'TOE' ? (test.sampleSize || '-') : 'N/A'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={cn(
                                  "text-[10px] uppercase font-bold",
                                  test.result === 'Pass' ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" : "bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
                                )} variant="outline">
                                  {test.result === 'Pass' ? <><CheckCircle2 className="h-2 w-2 mr-1" /> PASS</> : <><XCircle className="h-2 w-2 mr-1" /> FAIL</>}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3 text-[10px] text-muted-foreground leading-relaxed">
                                <p className="line-clamp-3 italic">"{test.comments}"</p>
                                <p className="text-[8px] mt-1 uppercase font-bold">Audit Ref: {test.id.substring(0,8).toUpperCase()}</p>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      {(!testsData?.items || testsData.items.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-muted-foreground italic">
                            Belum ada data pengujian yang tercatat untuk periode ini.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appendices" className="pt-4">
            <RegulatoryAppendices />
          </TabsContent>
        </Tabs>

        {/* Print Section updated with settings and QR Verification */}
        <div className="hidden print:block space-y-8 font-serif">
           <div className="flex items-start justify-between border-b-4 border-double pb-4 mb-8">
              <div className="flex items-center gap-4">
                <Shield className="h-16 w-12 text-primary" />
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">ISB Risk Pro</h1>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">ICOFR Lifecycle Management Platform</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase">Confidential State Document</p>
                <p className="text-[10px]">Classification: INTERNAL</p>
                <p className="text-[10px]">Appendix 11 - SK-5/DKU.MBU/11/2024</p>
              </div>
           </div>

           <div className="text-center space-y-2 mb-10">
              <h2 className="text-xl font-bold uppercase underline">Management Assessment on ICOFR Implementation Effectiveness</h2>
              <p className="text-sm font-medium">{settings?.companyName}</p>
              <p className="text-xs">Report Period: {settings?.fiscalYear}</p>
           </div>
           
           <div className="space-y-6 text-sm text-justify leading-relaxed">
              <p>The Board of Directors of {settings?.companyName} states that:</p>
              {!isEffective ? (
                <div className="p-4 border-2 border-red-800 rounded-md bg-red-50/50 mb-6 text-center">
                  <p className="font-bold text-red-900 underline mb-2">CONCLUSION: INEFFECTIVE</p>
                  <p className="text-xs text-red-800">Due to identified material weakness (Material Weakness).</p>
                </div>
              ) : (
                <div className="p-4 border-2 border-green-800 rounded-md bg-green-50/50 mb-6 text-center">
                  <p className="font-bold text-green-900 underline mb-2">CONCLUSION: EFFECTIVE</p>
                </div>
              )}
              <ol className="list-decimal pl-5 space-y-4">
                <li>We have reviewed the financial statements ending on {new Date(settings?.signedOffDate || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</li>
                <li>The financial statements do not contain any untrue statement of a material fact or omit to state a material fact necessary to make the statements made, in light of the circumstances under which such statements were made, not misleading.</li>
              </ol>
           </div>

           <div className="pt-12">
              <div className="grid grid-cols-3 gap-10 items-end">
                <div className="text-center space-y-20">
                  <p className="font-semibold border-b">Chief Financial Officer (CFO)</p>
                  <p className="font-bold text-lg">{settings?.cfoName}</p>
                </div>
                
                {/* QR Code Verification Placeholder (Bab VII Requirement) */}
                <div className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg bg-white shadow-sm relative overflow-hidden">
                   {isSigned ? (
                     <>
                       <div className="w-24 h-24 bg-slate-50 border border-slate-200 flex items-center justify-center relative">
                          {/* Stylized SVG QR Placeholder */}
                          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M7 7h.01M7 17h.01M17 7h.01M17 17h.01" />
                            <path d="M12 7v10M7 12h10" />
                          </svg>
                          <QrCode className="h-8 w-8 text-primary absolute opacity-80" />
                       </div>
                       <p className="text-[8px] font-bold text-slate-500 uppercase mt-2 tracking-tighter">Verified by ISB Risk Pro</p>
                       <p className="text-[7px] text-blue-600 font-mono mt-0.5 font-bold">VERIF-ID: {settings?.verificationHash}</p>
                     </>
                   ) : (
                     <div className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded text-[8px] text-muted-foreground text-center px-2">
                       Awaiting CEO/CFO Sign-off
                     </div>
                   )}
                </div>

                <div className="text-center space-y-20">
                  <p className="font-semibold border-b">Chief Executive Officer (CEO)</p>
                  <p className="font-bold text-lg">{settings?.ceoName}</p>
                </div>
              </div>
           </div>

           <div className="absolute bottom-0 left-0 right-0 border-t pt-2 text-[8px] text-muted-foreground flex justify-between">
              <span>Automatically printed by ISB Risk Pro v2.0</span>
              <span>Verification Hash: {settings?.verificationHash || 'NOT-SIGNED'}</span>
              <span>Timestamp: {new Date().toLocaleString()}</span>
           </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 2cm !important; }
          .AppLayout_content { padding: 0 !important; }
          .print\:block { display: block !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </AppLayout>
  );
}
