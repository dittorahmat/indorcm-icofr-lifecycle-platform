import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { CSARecord, BPMProcess } from '@shared/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Printer, Search, Download, History, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function CSAPage() {
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data: records, isLoading } = useQuery({
    queryKey: ['csa-records-all'],
    queryFn: () => api<{ items: CSARecord[] }>('/api/csa'),
  });

  const { data: processes } = useQuery({
    queryKey: ['bpm-processes-all'],
    queryFn: () => api<{ items: BPMProcess[] }>('/api/bpm-processes'),
  });

  const filteredRecords = React.useMemo(() => {
    if (!records?.items) return [];
    return records.items.filter(r => {
      const process = processes?.items.find(p => p.id === r.bpmProcessId);
      return process?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             r.period.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [records, processes, searchTerm]);

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <History className="h-8 w-8 text-indigo-600" />
              CSA Reports & History
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Archived Control Self-Assessments and Signed-off Reports.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari berdasarkan sub-proses atau periode..." 
              className="pl-9 h-10" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase">Sub-Proses Bisnis</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Periode</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Status Efektivitas</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Tanggal Sign-off</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Sampel</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase">Reports</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-64 text-center">Loading reports...</TableCell></TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-64 text-center text-slate-400 italic">Tidak ada laporan CSA yang ditemukan.</TableCell></TableRow>
              ) : filteredRecords.map((record) => {
                const process = processes?.items.find(p => p.id === record.bpmProcessId);
                return (
                  <TableRow key={record.id} className="hover:bg-indigo-50/10 transition-colors">
                    <TableCell>
                       <div className="font-bold text-slate-900">{process?.name || 'Unknown Process'}</div>
                       <div className="text-[9px] text-slate-400 uppercase font-black">ID: {record.bpmProcessId?.substring(0,8)}</div>
                    </TableCell>
                    <TableCell className="text-center font-black text-indigo-700 text-xs">{record.period}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase",
                        record.result === 'Effective' ? "bg-green-600" : "bg-red-600"
                      )}>{record.result}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium">
                      {format(new Date(record.assessmentDate), 'dd MMM yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-center">
                       <Badge variant="outline" className="font-black text-[10px]">{record.samples?.length || 0} Samples</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold">
                          <Printer className="h-3.5 w-3.5" /> PDF
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1.5 font-bold">
                          <Download className="h-3.5 w-3.5" /> XLS
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
