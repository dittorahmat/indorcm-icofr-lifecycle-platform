import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ChangeLog, User } from '@shared/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Printer, CheckCircle2, History } from 'lucide-react';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

export const ELCReport = () => <Card><CardContent className="p-4">ELC Report Content</CardContent></Card>;
export const TLCReport = () => <Card><CardContent className="p-4">TLC Report Content</CardContent></Card>;
export const ITGCReport = () => <Card><CardContent className="p-4">ITGC Report Content</CardContent></Card>;
export const FindingsReport = ({ deficiencies, controls }: any) => <Card><CardContent className="p-4">Findings Report Content</CardContent></Card>;
export const DoDReport = () => <Card><CardContent className="p-4">DoD Report Content</CardContent></Card>;

export function ChangeLogReport() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['regulatory-change-logs'],
    queryFn: async () => {
      const res = await api<{ items: ChangeLog[] }>('/api/change-logs?isRegulatory=true');
      return res.items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api<{ items: User[] }>('/api/users')
  });

  const getUserName = (id?: string) => users?.items.find(u => u.id === id)?.name || id || "-";

  const getRowMetadata = (log: ChangeLog) => {
    const dataBefore = log.dataBefore as any;
    const dataAfter = log.dataAfter as any;
    
    const process = dataAfter?.process || dataBefore?.process || "-";
    const subProcess = dataAfter?.subProcess || dataBefore?.subProcess || "-";
    const descBefore = dataBefore?.controlDescription || dataBefore?.riskDescription || log.descriptionBefore || "-";
    const descAfter = dataAfter?.controlDescription || dataAfter?.riskDescription || log.descriptionAfter || "-";
    const refBefore = dataBefore?.controlId || dataBefore?.id || "-";
    const refAfter = dataAfter?.controlId || dataAfter?.id || "-";
    const owner = dataAfter?.executingFunction || dataAfter?.executorRole || dataBefore?.executingFunction || "-";

    return { process, subProcess, descBefore, descAfter, refBefore, refAfter, owner };
  };

  const handleExport = () => {
    if (!logs || logs.length === 0) return;
    
    const csvData = logs.map((log, index) => {
      const meta = getRowMetadata(log);
      return {
        'No (i)': index + 1,
        'Perusahaan (ii)': 'PT Bukit Asam Tbk',
        'Proses Bisnis (iii)': meta.process,
        'Sub-Proses (iv)': meta.subProcess,
        'Tanggal Laporan (v)': log.timestamp ? format(log.timestamp, 'yyyy-MM-dd HH:mm:ss') : '-',
        'Pemilik Pengendalian (vi)': meta.owner,
        'Deskripsi Sebelum (vii)': meta.descBefore,
        'Deskripsi Setelah (viii)': meta.descAfter,
        'Referensi Sebelum (ix)': meta.refBefore,
        'Referensi Setelah (x)': meta.refAfter,
        'Tanggal Efektif (xi)': log.effectiveDate ? format(log.effectiveDate, 'yyyy-MM-dd') : '-',
        'Penyusun (Lini 1)': getUserName(log.userId),
        'Penyetuju (Lini 2)': getUserName(log.approvedBy || undefined)
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `BUMN_ICOFR_ChangeLog_Lampiran6_${format(new Date(), 'yyyyMMdd')}.csv`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm font-medium">Memuat Log Perubahan...</p>
      </div>
    );
  }

  const latestApprover = logs?.[0]?.approvedBy ? getUserName(logs[0].approvedBy) : null;
  const latestPreparer = logs?.[0]?.userId ? getUserName(logs[0].userId) : null;

  return (
    <Card className="border-slate-200 shadow-sm print:shadow-none print:border-none">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between no-print border-b pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-600" />
              Format Lampiran 6 - Log Perubahan Proses Bisnis & Pengendalian
            </h3>
            <p className="text-xs text-muted-foreground">Standardisasi perubahan sesuai regulasi SK-5/2024</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 text-xs font-bold text-slate-700 bg-white">
              <Download className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Export CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()} className="h-8 text-xs font-bold text-slate-700 bg-white">
              <Printer className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Print A4
            </Button>
          </div>
        </div>

        {/* Printable Header */}
        <div className="hidden print:block text-center space-y-2 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider">LAMPIRAN 6</h2>
          <h3 className="text-xs font-bold uppercase">ILUSTRASI DOKUMENTASI LOG PERUBAHAN PROSES BISNIS DAN PENGENDALIAN ATAS PELAPORAN KEUANGAN</h3>
          <p className="text-[10px] text-slate-500">PT BUKIT ASAM TBK - TAHUN {new Date().getFullYear()}</p>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="rounded-lg border overflow-x-auto bg-white max-w-full print:border-slate-300">
          <Table className="min-w-[1200px] print:min-w-0 print:w-full print:text-[9px]">
            <TableHeader className="bg-slate-50 border-b print:bg-transparent">
              <TableRow>
                <TableHead className="w-[50px] text-[10px] font-bold uppercase py-2 text-center text-slate-800">No (i)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase py-2 text-slate-800">Perusahaan (ii)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase py-2 text-slate-800">Proses Bisnis (iii)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase py-2 text-slate-800">Sub-Proses (iv)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase py-2 text-slate-800">Tanggal Laporan (v)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase py-2 text-slate-800">Pemilik (vi)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase py-2 text-slate-800">Deskripsi Sebelum (vii)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase py-2 text-slate-800">Deskripsi Setelah (viii)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase py-2 text-center text-slate-800">Ref Sebelum (ix)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase py-2 text-center text-slate-800">Ref Setelah (x)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase py-2 text-slate-800">Tgl Efektif (xi)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!logs || logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-slate-400 italic text-xs">
                    Tidak ditemukan data log perubahan regulasi.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, index) => {
                  const meta = getRowMetadata(log);
                  return (
                    <TableRow key={log.id} className="border-b hover:bg-slate-50/50 transition-colors print:border-slate-300">
                      <TableCell className="text-center font-medium text-[10px] text-slate-500 py-2.5 print:py-1">{index + 1}</TableCell>
                      <TableCell className="text-[10px] font-semibold text-slate-700 py-2.5 print:py-1">PT Bukit Asam Tbk</TableCell>
                      <TableCell className="text-[10px] text-slate-600 py-2.5 print:py-1">{meta.process}</TableCell>
                      <TableCell className="text-[10px] text-slate-600 py-2.5 print:py-1">{meta.subProcess}</TableCell>
                      <TableCell className="py-2.5 print:py-1 font-mono text-[10px] text-slate-500">
                        {log.timestamp ? format(log.timestamp, 'dd/MM/yyyy HH:mm') : "-"}
                      </TableCell>
                      <TableCell className="text-[10px] text-slate-600 py-2.5 print:py-1 font-medium">{meta.owner}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-[10px] text-slate-500 py-2.5 print:py-1" title={meta.descBefore}>{meta.descBefore}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-[10px] text-slate-800 py-2.5 print:py-1 font-medium" title={meta.descAfter}>{meta.descAfter}</TableCell>
                      <TableCell className="text-center text-[10px] font-mono text-slate-500 py-2.5 print:py-1">{meta.refBefore}</TableCell>
                      <TableCell className="text-center text-[10px] font-mono text-slate-800 py-2.5 print:py-1 font-semibold">{meta.refAfter}</TableCell>
                      <TableCell className="py-2.5 print:py-1">
                        <span className="text-[10px] font-bold text-indigo-600">
                          {log.effectiveDate ? format(log.effectiveDate, 'dd/MM/yyyy') : "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Digital Sign-off Blocks */}
        <div className="grid grid-cols-2 gap-8 pt-8 max-w-2xl mx-auto print:pt-4 print:max-w-full">
          <div className="border rounded-lg p-4 bg-slate-50/50 flex flex-col items-center justify-between text-center min-h-[140px] print:border-slate-300 print:bg-transparent print:p-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disetujui oleh:</span>
            <div className="flex flex-col items-center gap-1 my-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 print:h-4 print:w-4" />
              <span className="text-xs font-bold text-slate-800">{latestPreparer || "Pemilik Pengendalian"}</span>
              <span className="text-[9px] text-slate-400">Lini Pertama (Control Owner)</span>
            </div>
            <span className="text-[9px] text-slate-400 italic">Signed & Verified Digitally</span>
          </div>

          <div className="border rounded-lg p-4 bg-slate-50/50 flex flex-col items-center justify-between text-center min-h-[140px] print:border-slate-300 print:bg-transparent print:p-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diketahui oleh:</span>
            <div className="flex flex-col items-center gap-1 my-2">
              <CheckCircle2 className="h-6 w-6 text-indigo-600 print:h-4 print:w-4" />
              <span className="text-xs font-bold text-slate-800">{latestApprover || "Fungsi ICOFR"}</span>
              <span className="text-[9px] text-slate-400">Lini Kedua (Fungsi ICOFR)</span>
            </div>
            <span className="text-[9px] text-slate-400 italic">Approved & Validated Digitally</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const CSADocReport = () => <Card><CardContent className="p-4">CSA Doc Report Content</CardContent></Card>;
export const Lampiran11Report = ({ deficiencies, controls }: any) => <Card><CardContent className="p-4">Lampiran 11 Report Content</CardContent></Card>;
