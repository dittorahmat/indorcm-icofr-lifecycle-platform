import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { saveAs } from 'file-saver';
import { MainHeader } from '@/components/layout/MainHeader';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileDown, Printer } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import type { Deficiency } from '@shared/types';
import { motion } from 'framer-motion';
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
export function ReportsPage() {
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['reportSummary'],
    queryFn: () => api<any>('/api/reports/summary'),
  });
  const { data: auditTrailData, isLoading: auditLoading } = useQuery({
    queryKey: ['auditTrailSample'],
    queryFn: () => api<any[]>('/api/audits/rcm/rcm-p2p-1'),
    enabled: !!summaryData, // only fetch when summary is available
  });
  const handleExport = async (format: 'csv' | 'excel') => {
    const toastId = toast.loading(`Exporting to ${format.toUpperCase()}...`);
    try {
      const response = await fetch(`/api/reports/export?format=${format}`, {
        method: 'POST',
        headers: { 'X-Mock-Role': localStorage.getItem('mockRole') || 'Line 2' },
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      saveAs(blob, `icofr_report.${format === 'csv' ? 'csv' : 'xlsx'}`);
      toast.success('Export successful!', { id: toastId });
    } catch (error) {
      toast.error('Export failed.', { id: toastId });
    }
  };
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <MainHeader />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="flex items-center justify-between mb-6 no-print">
              <h1 className="text-3xl font-bold">Reports & Exports</h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleExport('csv')}><FileDown className="h-4 w-4 mr-2" /> Export CSV</Button>
                <Button onClick={() => handleExport('excel')}><FileDown className="h-4 w-4 mr-2" /> Export Excel</Button>
                <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print</Button>
              </div>
            </div>
            <motion.div
              className="grid gap-6 md:grid-cols-3 mb-8"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
              <motion.div variants={cardVariants}>
                <Card>
                  <CardHeader><CardTitle>Overall Control Effectiveness</CardTitle></CardHeader>
                  <CardContent>
                    {isLoading ? <Skeleton className="h-12 w-24" /> : <div className="text-4xl font-bold text-green-600">{summaryData?.effectiveness}%</div>}
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={cardVariants}>
                <Card>
                  <CardHeader><CardTitle>Total Controls</CardTitle></CardHeader>
                  <CardContent>
                    {isLoading ? <Skeleton className="h-12 w-24" /> : <div className="text-4xl font-bold">{summaryData?.totalControls}</div>}
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={cardVariants}>
                <Card>
                  <CardHeader><CardTitle>Open Deficiencies</CardTitle></CardHeader>
                  <CardContent>
                    {isLoading ? <Skeleton className="h-12 w-24" /> : <div className="text-4xl font-bold text-red-600">{summaryData?.openDeficiencies}</div>}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Deficiencies by Severity</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {isLoading ? <Skeleton className="h-full w-full" /> : (
                      <BarChart data={summaryData?.deficienciesBySeverity}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                        <YAxis stroke="#888888" fontSize={12} />
                        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} className="cursor-pointer hover:opacity-80 transition-opacity" />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Deficiency Status</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {isLoading ? <Skeleton className="h-full w-full" /> : (
                      <PieChart>
                        <Pie data={summaryData?.deficienciesByStatus} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label className="cursor-pointer hover:opacity-80 transition-opacity">
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
            <Card className="mt-8">
              <CardHeader><CardTitle>Detailed Deficiency List</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Identified Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      summaryData?.allDeficiencies.map((def: Deficiency) => (
                        <TableRow key={def.id}>
                          <TableCell>{def.description}</TableCell>
                          <TableCell><Badge variant={def.severity === 'Material Weakness' ? 'destructive' : def.severity === 'Significant Deficiency' ? 'secondary' : 'outline'}>{def.severity}</Badge></TableCell>
                          <TableCell>{def.status}</TableCell>
                          <TableCell>{new Date(def.identifiedDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="mt-8">
              <CardHeader><CardTitle>Audit Trail Sample (RCM: P2P)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLoading ? (
                      <TableRow><TableCell colSpan={3}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                    ) : (
                      auditTrailData?.map((audit, i) => (
                        <TableRow key={i}>
                          <TableCell className="capitalize">{audit.action}</TableCell>
                          <TableCell>{audit.userId}</TableCell>
                          <TableCell>{new Date(audit.timestamp).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          main, main * {
            visibility: visible;
          }
          main {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none;
          }
          table {
            border-collapse: collapse !important;
            width: 100%;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
}