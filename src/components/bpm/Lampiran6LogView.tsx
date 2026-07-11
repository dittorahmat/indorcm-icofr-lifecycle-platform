import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ChangeLog, User } from '@shared/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Lampiran6LogViewProps {
  entityId: string;
}

export function Lampiran6LogView({ entityId }: Lampiran6LogViewProps) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['change-logs', entityId],
    queryFn: async () => {
      const all = await api<{ items: ChangeLog[] }>('/api/change-logs');
      return all.items.filter(l => l.entityId === entityId).sort((a, b) => b.timestamp - a.timestamp);
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm font-medium">Loading historical logs...</p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-300 italic border-2 border-dashed rounded-xl bg-slate-50/50">
        <History className="h-10 w-10 opacity-20" />
        <p className="text-sm">Belum ada riwayat perubahan yang disetujui (Lampiran 6).</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-500" />
            Lampiran 6: Log Perubahan BPM & RCM
          </h4>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Histori Persetujuan & Modifikasi Pengendalian</p>
        </div>
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 px-2 py-0.5 text-xs">
          {logs.length} Entries
        </Badge>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[1200px]">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[50px] text-xs font-bold uppercase py-3 text-center">No (i)</TableHead>
                <TableHead className="text-xs font-bold uppercase py-3">Perusahaan (ii)</TableHead>
                <TableHead className="text-xs font-bold uppercase py-3">Proses Bisnis (iii)</TableHead>
                <TableHead className="text-xs font-bold uppercase py-3">Sub-Proses (iv)</TableHead>
                <TableHead className="text-xs font-bold uppercase py-3">Tanggal Laporan (v)</TableHead>
                <TableHead className="text-xs font-bold uppercase py-3">Pemilik (vi)</TableHead>
                <TableHead className="text-xs font-bold uppercase py-3">Deskripsi Sebelum (vii)</TableHead>
                <TableHead className="text-xs font-bold uppercase py-3">Deskripsi Setelah (viii)</TableHead>
                <TableHead className="text-xs font-bold uppercase py-3 text-center">Ref Sebelum (ix)</TableHead>
                <TableHead className="text-xs font-bold uppercase py-3 text-center">Ref Setelah (x)</TableHead>
                <TableHead className="text-xs font-bold uppercase py-3">Tgl Efektif (xi)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, index) => {
                const meta = getRowMetadata(log);
                return (
                  <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="text-center font-medium text-xs text-slate-500 py-3">{index + 1}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700 py-3">PT Bukit Asam Tbk</TableCell>
                    <TableCell className="text-xs text-slate-600 py-3">{meta.process}</TableCell>
                    <TableCell className="text-xs text-slate-600 py-3">{meta.subProcess}</TableCell>
                    <TableCell className="py-3">
                      <span className="text-xs text-slate-500 font-mono">
                        {log.timestamp ? format(log.timestamp, 'dd MMM yyyy HH:mm') : "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 py-3 font-medium">{meta.owner}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-slate-500 py-3" title={meta.descBefore}>{meta.descBefore}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-slate-800 py-3 font-medium" title={meta.descAfter}>{meta.descAfter}</TableCell>
                    <TableCell className="text-center text-xs font-mono text-slate-500 py-3">{meta.refBefore}</TableCell>
                    <TableCell className="text-center text-xs font-mono text-slate-800 py-3 font-semibold">{meta.refAfter}</TableCell>
                    <TableCell className="py-3">
                      <span className="text-xs font-bold text-indigo-600">
                        {log.effectiveDate ? format(log.effectiveDate, 'dd MMM yyyy') : "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

