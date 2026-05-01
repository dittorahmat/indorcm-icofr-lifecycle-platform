import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { GLRow } from '@shared/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Database, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TransactionSamplingTabProps {
  noGL: string;
  onSamplesSelected: (samples: GLRow[]) => void;
}

export function TransactionSamplingTab({ noGL, onSamplesSelected }: TransactionSamplingTabProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const { data: rowsData, isLoading } = useQuery({
    queryKey: ['gl-rows-sampling', noGL],
    queryFn: () => api<{ items: GLRow[] }>(`/api/gl-rows?noGL=${noGL}`),
  });

  const filteredRows = React.useMemo(() => {
    if (!rowsData?.items) return [];
    return rowsData.items.filter(row => 
      row.glDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.ymd.includes(searchTerm)
    );
  }, [rowsData, searchTerm]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleApply = () => {
    const selectedRows = rowsData?.items.filter(r => selectedIds.has((r as any).id)) || [];
    onSamplesSelected(selectedRows);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari transaksi..." 
            className="pl-9 h-9 text-xs" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs font-bold text-slate-500">
            {selectedIds.size} Transaksi Terpilih
          </p>
          <Button 
            disabled={selectedIds.size === 0}
            onClick={handleApply}
            className="bg-indigo-600 hover:bg-indigo-700 h-9 font-bold gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Jadikan Sampel CSA
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead className="w-12 text-center"></TableHead>
              <TableHead className="w-32 text-[10px] font-black uppercase">Tanggal</TableHead>
              <TableHead className="text-[10px] font-black uppercase">Referensi / Deskripsi</TableHead>
              <TableHead className="w-32 text-[10px] font-black uppercase text-right">Nilai</TableHead>
              <TableHead className="w-24 text-[10px] font-black uppercase text-center">Mata Uang</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" /></TableCell></TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-64 text-center text-slate-400 italic">Data transaksi tidak ditemukan.</TableCell></TableRow>
            ) : filteredRows.map((row) => (
              <TableRow key={(row as any).id} className={cn("hover:bg-indigo-50/30 transition-colors", selectedIds.has((row as any).id) && "bg-indigo-50/50")}>
                <TableCell className="text-center">
                  <Checkbox 
                    checked={selectedIds.has((row as any).id)} 
                    onCheckedChange={() => toggleSelect((row as any).id)} 
                  />
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-600">{row.ymd}</TableCell>
                <TableCell>
                   <div className="text-xs font-bold text-slate-900">{row.glDesc}</div>
                   <div className="text-[10px] text-slate-400 uppercase tracking-tighter">REF: {(row as any).id.substring(0,8)}</div>
                </TableCell>
                <TableCell className="text-xs font-mono font-bold text-right">
                  {new Intl.NumberFormat('id-ID').format(row.balance)}
                </TableCell>
                <TableCell className="text-center"><Badge variant="outline" className="text-[10px]">{row.currency}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
