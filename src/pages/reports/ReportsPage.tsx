import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { saveAs } from 'file-saver';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileDown, Printer, Shield, FileText, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import type { Deficiency } from '@shared/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function ReportsPage() {
  const [isSigned, setIsSigned] = React.useState(false);
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['reportSummary'],
    queryFn: () => api<any>('/api/reports/summary'),
  });

  const handleSignOff = () => {
    setIsSigned(true);
    toast.success('Report signed and locked by CEO & CFO.', {
      description: 'Audit trail entry created. Data is now immutable for this period.',
      icon: <CheckCircle2 className="h-4 w-4 text-green-600" />
    });
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
        // Dynamic import of papaparse for client-side CSV generation
        const { unparse } = await import('papaparse');
        const csv = unparse(json);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'icofr_report.csv');
      } else {
        // Dynamic import of xlsx (SheetJS) for client-side Excel generation
        const XLSX = await import('xlsx');
        // Ensure we pass an array of objects to json_to_sheet
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

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-3xl font-bold">Reports & Exports</h1>
            <p className="text-muted-foreground">Standardized ICOFR reports for BUMN compliance.</p>
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
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Overall Effectiveness</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? <Skeleton className="h-10 w-24" /> : <div className="text-3xl font-bold text-green-600">{summaryData?.effectiveness}%</div>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? <Skeleton className="h-10 w-24" /> : <div className="text-3xl font-bold">{summaryData?.totalControls}</div>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Open Deficiencies</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? <Skeleton className="h-10 w-24" /> : <div className="text-3xl font-bold text-red-600">{summaryData?.openDeficiencies}</div>}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Deficiencies by Severity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    {isLoading ? <Skeleton className="h-full w-full" /> : (
                      <BarChart data={summaryData?.deficienciesBySeverity}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={10} />
                        <YAxis stroke="#888888" fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Deficiency Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    {isLoading ? <Skeleton className="h-full w-full" /> : (
                      <PieChart>
                        <Pie data={summaryData?.deficienciesByStatus} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                          {summaryData?.deficienciesByStatus.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'Open' ? '#F97316' : '#16A34A'} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="management" className="pt-4">
            <div className="flex justify-end mb-4 gap-2 no-print">
              {!isSigned ? (
                <Button onClick={handleSignOff} variant="destructive" className="font-bold">
                  <Lock className="h-4 w-4 mr-2" /> Sign & Lock Report (CEO/CFO)
                </Button>
              ) : (
                <Badge className="bg-blue-600 text-white px-4 py-2 text-sm">
                  <Shield className="h-4 w-4 mr-2" /> PERIOD FINALIZED & SIGNED
                </Badge>
              )}
            </div>
            <Card className="print:shadow-none border-none sm:border relative overflow-hidden">
              <AnimatePresence>
                {isSigned && (
                  <motion.div 
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.15 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                  >
                    <div className="border-8 border-green-600 text-green-600 font-black text-9xl p-10 rotate-[-30deg] uppercase tracking-tighter">
                      Signed
                    </div>
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
                  <p>Direksi PT [Nama Perusahaan] menyatakan bahwa:</p>
                  
                  {/* Conditional Conclusion based on MW */}
                  {summaryData?.deficienciesBySeverity.find((d: any) => d.name === 'Material Weakness')?.count > 0 ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
                      <p className="font-bold text-red-800 underline mb-2 text-center">KESIMPULAN: TIDAK EFEKTIF</p>
                      <p className="text-sm text-red-700">
                        Berdasarkan evaluasi yang dilakukan, manajemen menyimpulkan bahwa Perusahaan <strong>tidak mempertahankan</strong> pengendalian internal yang efektif atas pelaporan keuangan per tanggal laporan, sehubungan dengan ditemukannya kelemahan material (Material Weakness) sebagaimana dirinci di bawah ini.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-6">
                      <p className="font-bold text-green-800 underline mb-2 text-center">KESIMPULAN: EFEKTIF</p>
                      <p className="text-sm text-green-700">
                        Berdasarkan evaluasi yang dilakukan, manajemen menyimpulkan bahwa Perusahaan <strong>telah mempertahankan</strong>, dalam semua hal yang material, pengendalian internal yang efektif atas pelaporan keuangan per tanggal laporan.
                      </p>
                    </div>
                  )}

                  <ol className="list-decimal pl-5 space-y-6 text-sm text-foreground/90">
                    <li>Kami telah menelaah laporan keuangan PT [Nama Perusahaan] yang berakhir pada tanggal {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}.</li>
                    
                    <li>Berdasarkan pengetahuan kami, laporan keuangan tidak memuat pernyataan yang tidak benar tentang fakta material atau tidak mencantumkan fakta material yang diperlukan untuk membuat pernyataan yang dibuat, mengingat keadaan di mana pernyataan tersebut dibuat, tidak menyesatkan.</li>
                    
                    <li>Berdasarkan pengetahuan kami, laporan keuangan, dan informasi keuangan lainnya yang termasuk dalam laporan keuangan, secara wajar menyajikan dalam semua hal yang material atas kondisi keuangan dan hasil operasi untuk periode-periode yang disajikan dalam laporan ini.</li>
                    
                    <li>Kami telah mengimplementasikan pengendalian dan prosedur atas penyusunan laporan keuangan yang dianggap perlu untuk menyusun dan menyajikan secara wajar laporan keuangan (konsolidasi) dan bebas dari salah saji material:
                      <ul className="list-[lower-alpha] pl-5 mt-2 space-y-2">
                        <li>Merancang pengendalian dan prosedur atas penyusunan laporan keuangan, di bawah pengawasan kami untuk memastikan bahwa informasi material Perusahaan yang berkaitan dengan pelaporan keuangan telah diketahui oleh para manajemen, khususnya selama periode penyusunan laporan.</li>
                        <li>Mengevaluasi efektivitas pengendalian dan prosedur atas penyusunan laporan keuangan, menyampaikan kesimpulan kami tentang efektivitas pengendalian berdasarkan periode pelaporan yang dicakup dalam laporan ini.</li>
                      </ul>
                    </li>
                    
                    <li>Kami telah mengungkapkan, berdasarkan hasil evaluasi pengendalian internal atas pelaporan keuangan kepada Dewan Komisaris, Direksi dan Komite Audit, perihal:
                      <ul className="list-[lower-alpha] pl-5 mt-2 space-y-2">
                        <li>Seluruh defisiensi signifikan dan kelemahan material dalam rancangan dan pengoperasian pengendalian internal yang cukup mungkin dapat berdampak pada kemampuan perusahaan untuk mencatat, memproses, merangkum, dan melaporkan informasi keuangan.</li>
                        <li>Setiap perubahan signifikan dalam kebijakan akuntansi, prosedur dan faktor lainnya selama tahun berjalan yang dapat memengaruhi pengendalian internal atas pelaporan keuangan Perusahaan.</li>
                        <li>Setiap kecurangan (fraud), baik yang berdampak secara material maupun tidak, yang melibatkan manajemen atau personel lain yang memiliki peran penting dalam pengendalian internal.</li>
                      </ul>
                    </li>
                  </ol>
                </div>

                <div className="bg-muted/30 p-6 rounded-lg space-y-4">
                  <h3 className="font-bold border-b pb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Rincian Defisiensi & Rencana Remediasi
                  </h3>
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Defisiensi</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Rencana Remediasi</TableHead>
                      </TableRow>
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
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">Tidak ditemukan defisiensi signifikan atau kelemahan material.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid grid-cols-2 gap-20 pt-12">
                  <div className="text-center space-y-24">
                    <p className="font-semibold border-b pb-2">Direktur Keuangan (CFO)</p>
                    <p className="font-bold">[Nama CFO]</p>
                  </div>
                  <div className="text-center space-y-24">
                    <p className="font-semibold border-b pb-2">Direktur Utama (CEO)</p>
                    <p className="font-bold">[Nama CEO]</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="pt-4">
            <Card className="print:shadow-none border-none sm:border">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Laporan Hasil Pengujian Efektivitas ICOFR
                </CardTitle>
                <CardDescription>Oleh Lini Ketiga (Audit Internal)</CardDescription>
              </CardHeader>
              <CardContent className="py-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Control Code</TableHead>
                      <TableHead>Control Name</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>1</TableCell>
                      <TableCell className="font-mono">P2P-01</TableCell>
                      <TableCell>3-Way Match</TableCell>
                      <TableCell>TOE (Sampling)</TableCell>
                      <TableCell><Badge className="bg-green-100 text-green-700 hover:bg-green-100">Efektif</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>2</TableCell>
                      <TableCell className="font-mono">R2R-01</TableCell>
                      <TableCell>Bank Reconciliation</TableCell>
                      <TableCell>TOE (Inspection)</TableCell>
                      <TableCell><Badge className="bg-green-100 text-green-700 hover:bg-green-100">Efektif</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>3</TableCell>
                      <TableCell className="font-mono">P2P-02</TableCell>
                      <TableCell>Vendor Master Changes</TableCell>
                      <TableCell>TOD (Walkthrough)</TableCell>
                      <TableCell><Badge variant="destructive">Tidak Efektif</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* This section is visible only during printing */}
        <div className="hidden print:block space-y-10">
           <div className="text-center space-y-4">
              <Shield className="h-16 w-12 mx-auto text-primary" />
              <h1 className="text-3xl font-bold uppercase">Laporan Tahunan ICOFR PT [Nama Perusahaan]</h1>
              <p className="text-lg font-medium">Periode Laporan: {new Date().getFullYear()}</p>
           </div>
           
           <div className="border-t-2 pt-8">
              <h2 className="text-xl font-bold mb-4">1. Asesmen Manajemen</h2>
              <p className="text-justify leading-relaxed mb-10">
                Berdasarkan evaluasi yang telah dilakukan, Manajemen menyimpulkan bahwa pengendalian internal 
                atas pelaporan keuangan (ICOFR) telah berjalan secara efektif dalam semua hal yang material.
              </p>
              
              <div className="grid grid-cols-2 gap-20 pt-12">
                <div className="text-center space-y-20">
                  <p className="font-semibold border-b">Direktur Keuangan</p>
                  <p className="font-bold">( ____________________ )</p>
                </div>
                <div className="text-center space-y-20">
                  <p className="font-semibold border-b">Direktur Utama</p>
                  <p className="font-bold">( ____________________ )</p>
                </div>
              </div>
           </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .AppLayout_content { padding: 0 !important; }
          [data-radix-collection-item] { display: block !important; opacity: 1 !important; }
          .tabs-content { display: block !important; border: none !important; }
        }
      `}</style>
    </AppLayout>
  );
}
