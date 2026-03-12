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
import { FileDown, Printer, Shield, FileText, CheckCircle2, AlertTriangle, Lock, Layers, Loader2, QrCode } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import type { Deficiency, Settings } from '@shared/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export function ReportsPage() {
  const queryClient = useQueryClient();
  
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
          <TabsList>
            <TabsTrigger value="dashboard">Overview</TabsTrigger>
            <TabsTrigger value="management">Asesmen Manajemen</TabsTrigger>
            <TabsTrigger value="audit">Laporan Hasil Pengujian</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 pt-4">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Overall Effectiveness</CardTitle></CardHeader>
                <CardContent>
                  <div className={cn("text-3xl font-bold", isEffective ? "text-green-600" : "text-red-600")}>
                    {isEffective ? "EFEKTIF" : "TIDAK EFEKTIF"}
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
                <CardTitle className="text-2xl uppercase">Asesmen Manajemen atas Efektivitas Implementasi ICOFR</CardTitle>
                <CardDescription>Lampiran 11 - SK-5/DKU.MBU/11/2024</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 py-8 px-10">
                <div className="space-y-4 text-justify leading-relaxed">
                  <p>Direksi {settings?.companyName} menyatakan bahwa:</p>
                  
                  {!isEffective ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
                      <p className="font-bold text-red-800 underline mb-2 text-center uppercase">Kesimpulan: Tidak Efektif</p>
                      <p className="text-sm text-red-700">
                        Berdasarkan evaluasi yang dilakukan, manajemen menyimpulkan bahwa Perusahaan <strong>tidak mempertahankan</strong> pengendalian internal yang efektif atas pelaporan keuangan per tanggal laporan, sehubungan dengan ditemukannya kelemahan material (Material Weakness).
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-6">
                      <p className="font-bold text-green-800 underline mb-2 text-center uppercase">Kesimpulan: Efektif</p>
                      <p className="text-sm text-green-700">
                        Berdasarkan evaluasi yang dilakukan, manajemen menyimpulkan bahwa Perusahaan <strong>telah mempertahankan</strong>, dalam semua hal yang material, pengendalian internal yang efektif atas pelaporan keuangan per tanggal laporan.
                      </p>
                    </div>
                  )}

                  <ol className="list-decimal pl-5 space-y-6 text-sm text-foreground/90">
                    <li>Kami telah menelaah laporan keuangan {settings?.companyName} yang berakhir pada tanggal {new Date(settings?.signedOffDate || Date.now()).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}.</li>
                    <li>Berdasarkan pengetahuan kami, laporan keuangan tidak memuat pernyataan yang tidak benar tentang fakta material atau tidak mencantumkan fakta material yang diperlukan untuk membuat pernyataan yang dibuat, mengingat keadaan di mana pernyataan tersebut dibuat, tidak menyesatkan.</li>
                    <li>Berdasarkan pengetahuan kami, laporan keuangan, dan informasi keuangan lainnya yang termasuk dalam laporan keuangan, secara wajar menyajikan dalam semua hal yang material atas kondisi keuangan dan hasil operasi untuk periode tersebut.</li>
                    <li>Kami telah mengimplementasikan pengendalian dan prosedur atas penyusunan laporan keuangan yang dianggap perlu untuk menyusun dan menyajikan secara wajar laporan keuangan (konsolidasi) dan bebas dari salah saji material.</li>
                  </ol>
                </div>

                <div className="bg-muted/30 p-6 rounded-lg space-y-4">
                  <h3 className="font-bold border-b pb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Rincian Defisiensi & Rencana Remediasi
                  </h3>
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow><TableHead>Defisiensi</TableHead><TableHead>Severity</TableHead><TableHead>Rencana Remediasi</TableHead></TableRow>
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
                        <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">Tidak ditemukan defisiensi signifikan atau kelemahan material.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid grid-cols-2 gap-20 pt-12">
                  <div className="text-center space-y-24">
                    <p className="font-semibold border-b pb-2">Direktur Keuangan (CFO)</p>
                    <p className="font-bold">{settings?.cfoName}</p>
                  </div>
                  <div className="text-center space-y-24">
                    <p className="font-semibold border-b pb-2">Direktur Utama (CEO)</p>
                    <p className="font-bold">{settings?.ceoName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="pt-4">
             {/* ... audit content ... */}
          </TabsContent>
        </Tabs>

        {/* Print Section updated with settings and QR Verification */}
        <div className="hidden print:block space-y-8 font-serif">
           <div className="flex items-start justify-between border-b-4 border-double pb-4 mb-8">
              <div className="flex items-center gap-4">
                <Shield className="h-16 w-12 text-primary" />
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">IndoRCM Pro</h1>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">ICOFR Lifecycle Management Platform</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase">Dokumen Rahasia Negara</p>
                <p className="text-[10px]">Klasifikasi: INTERNAL</p>
                <p className="text-[10px]">Lampiran 11 - SK-5/DKU.MBU/11/2024</p>
              </div>
           </div>

           <div className="text-center space-y-2 mb-10">
              <h2 className="text-xl font-bold uppercase underline">Asesmen Manajemen atas Efektivitas Implementasi ICOFR</h2>
              <p className="text-sm font-medium">{settings?.companyName}</p>
              <p className="text-xs">Periode Laporan: {settings?.fiscalYear}</p>
           </div>
           
           <div className="space-y-6 text-sm text-justify leading-relaxed">
              <p>Direksi {settings?.companyName} menyatakan bahwa:</p>
              {!isEffective ? (
                <div className="p-4 border-2 border-red-800 rounded-md bg-red-50/50 mb-6 text-center">
                  <p className="font-bold text-red-900 underline mb-2">KESIMPULAN: TIDAK EFEKTIF</p>
                  <p className="text-xs text-red-800">Sehubungan dengan ditemukannya kelemahan material (Material Weakness).</p>
                </div>
              ) : (
                <div className="p-4 border-2 border-green-800 rounded-md bg-green-50/50 mb-6 text-center">
                  <p className="font-bold text-green-900 underline mb-2">KESIMPULAN: EFEKTIF</p>
                </div>
              )}
              <ol className="list-decimal pl-5 space-y-4">
                <li>Kami telah menelaah laporan keuangan yang berakhir pada tanggal {new Date(settings?.signedOffDate || Date.now()).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}.</li>
                <li>Laporan keuangan tidak memuat pernyataan yang tidak benar tentang fakta material...</li>
              </ol>
           </div>

           <div className="pt-12">
              <div className="grid grid-cols-3 gap-10 items-end">
                <div className="text-center space-y-20">
                  <p className="font-semibold border-b">Direktur Keuangan (CFO)</p>
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
                       <p className="text-[8px] font-bold text-slate-500 uppercase mt-2 tracking-tighter">Verified by IndoRCM Pro</p>
                       <p className="text-[7px] text-blue-600 font-mono mt-0.5 font-bold">VERIF-ID: {settings?.verificationHash}</p>
                     </>
                   ) : (
                     <div className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded text-[8px] text-muted-foreground text-center px-2">
                       Awaiting CEO/CFO Sign-off
                     </div>
                   )}
                </div>

                <div className="text-center space-y-20">
                  <p className="font-semibold border-b">Direktur Utama (CEO)</p>
                  <p className="font-bold text-lg">{settings?.ceoName}</p>
                </div>
              </div>
           </div>

           <div className="absolute bottom-0 left-0 right-0 border-t pt-2 text-[8px] text-muted-foreground flex justify-between">
              <span>Dicetak otomatis oleh IndoRCM Pro v1.0</span>
              <span>Hash Verifikasi: {settings?.verificationHash || 'NOT-SIGNED'}</span>
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
