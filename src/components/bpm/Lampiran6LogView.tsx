import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ChangeLog, User } from '@shared/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, UserCircle, Calendar, CheckCircle2 } from 'lucide-react';
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
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Histori Persetujuan & Modifikasi Pengendalian</p>
        </div>
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 px-2 py-0.5 text-[10px]">
          {logs.length} Entries
        </Badge>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase py-3">Tanggal & Waktu</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-3">Pelaksana (Staff)</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-3">Perubahan</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-3 text-center">Approver (Manager)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {format(log.timestamp, 'dd MMM yyyy')}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono ml-4.5">
                      {format(log.timestamp, 'HH:mm:ss')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <UserCircle className="h-4 w-4 text-slate-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{getUserName(log.userId)}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-700 font-medium line-clamp-2">{log.descriptionAfter}</p>
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-slate-100 text-slate-500 font-normal">
                      Manual Update
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs font-bold text-slate-700">{getUserName(log.approvedBy)}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 italic">Validated</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
