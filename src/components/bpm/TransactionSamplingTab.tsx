import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { TransactionDetail } from '@shared/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, Plus, Upload, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { TransactionUploadModal } from './TransactionUploadModal';
import { formatIDRPlain } from '@/components/reports/dod/dod-format';
import { toast } from 'sonner';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TransactionSamplingTabProps {
  noGL: string;
  bpmProcessId?: string;
  year?: string;
  onSamplesSelected: (samples: TransactionDetail[]) => void;
}

export function TransactionSamplingTab({ noGL, bpmProcessId, year: propYear, onSamplesSelected }: TransactionSamplingTabProps) {
  const { t } = useTranslation(['bpm', 'csa_hub', 'common']);
  const queryClient = useQueryClient();
  const { workingYear: globalYear } = useFiscalYearStore();
  const workingYear = propYear || globalYear;
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);

  const { data: rowsData, isLoading, refetch } = useQuery({
    queryKey: ['transaction-details-sampling', noGL, bpmProcessId, workingYear],
    queryFn: () => {
      let url = `/api/transaction-details?noGL=${noGL}&year=${workingYear}`;
      // Robustness: only add if truthy and not 'null'/'undefined' strings
      if (bpmProcessId && bpmProcessId !== 'null' && bpmProcessId !== 'undefined') {
        url += `&bpmProcessId=${bpmProcessId}`;
      }
      return api<{ items: (TransactionDetail & { bpmCode?: string })[] }>(url);
    },
  });

  const filteredRows = React.useMemo(() => {
    if (!rowsData?.items) return [];
    return rowsData.items.filter(row => {
      const transYear = row.transDate ? new Date(row.transDate).getFullYear() : null;
      const matchesYear = transYear === parseInt(workingYear);
      const matchesSearch = 
        (row.description?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (row.refNo?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (row.bpmCode?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
      
      return matchesYear && matchesSearch;
    });
  }, [rowsData, searchTerm, workingYear]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleApply = () => {
    const selectedRows = rowsData?.items.filter(r => selectedIds.has(r.id)) || [];
    onSamplesSelected(selectedRows);
  };

  const handleReset = async () => {
    try {
      let url = `/api/transaction-details/${noGL}`;
      if (bpmProcessId && bpmProcessId !== 'null' && bpmProcessId !== 'undefined') {
        url += `?bpmProcessId=${bpmProcessId}`;
      }
      await api(url, { method: 'DELETE' });
      toast.success(t('bpm:sampling.reset.success'));
      refetch();
    } catch (err) {
      toast.error('Gagal menghapus data.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 flex-wrap gap-3 min-w-0 max-w-full">
        <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-2 min-w-0 w-full sm:w-auto flex-wrap">
          <div className="relative w-full sm:w-72 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder={t('bpm:sampling.search')} 
              className="pl-9 h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-base sm:text-xs" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs gap-2 border-dashed w-full sm:w-auto justify-center"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload className="h-4 w-4" /> {t('csa_hub:upload.button')}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('bpm:sampling.reset.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('bpm:sampling.reset.description', { noGL })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                <AlertDialogCancel className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] rounded-md mt-0">{t('bpm:sampling.reset.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto h-11 sm:h-10 min-h-[44px] rounded-md">
                  {t('bpm:sampling.reset.confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs font-bold text-slate-500">
            {t('bpm:sampling.selected', { count: selectedIds.size })}
          </p>
          <Button 
            disabled={selectedIds.size === 0}
            onClick={handleApply}
            className="bg-indigo-600 hover:bg-indigo-700 h-9 font-bold gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" /> {t('bpm:sampling.apply')}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader sticky>
            <TableRow>
              <TableHead className="w-12 text-center"></TableHead>
              <TableHead className="w-24 text-xs font-black uppercase">BPM Code</TableHead>
              <TableHead className="w-32 text-xs font-black uppercase">{t('bpm:sampling.columns.date')}</TableHead>
              <TableHead className="w-40 text-xs font-black uppercase">{t('bpm:sampling.columns.ref')}</TableHead>
              <TableHead className="text-xs font-black uppercase">{t('bpm:sampling.columns.description')}</TableHead>
              <TableHead className="w-32 text-xs font-black uppercase text-right">{t('bpm:sampling.columns.amount')}</TableHead>
              <TableHead className="w-24 text-xs font-black uppercase text-center">{t('bpm:sampling.columns.currency')}</TableHead>
              <TableHead className="w-16 text-xs font-black uppercase text-center">{t('bpm:sampling.columns.dc')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" /></TableCell></TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-64 text-center text-slate-400">{t('bpm:sampling.empty')}</TableCell></TableRow>
            ) : filteredRows.map((row) => (
              <TableRow key={row.id} className={cn("hover:bg-indigo-50/30 transition-colors", selectedIds.has(row.id) && "bg-indigo-50/50")}>
                <TableCell className="text-center">
                  <Checkbox 
                    checked={selectedIds.has(row.id)} 
                    onCheckedChange={() => toggleSelect(row.id)} 
                  />
                </TableCell>
                <TableCell>
                  {row.bpmCode ? (
                    <Badge variant="secondary" className="text-xs font-mono font-bold bg-slate-100 text-slate-600 border-slate-200">
                      {row.bpmCode}
                    </Badge>
                  ) : (
                    <span className="text-xs text-slate-300">Unlinked</span>
                  )}
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-600">
                  {row.transDate ? format(new Date(row.transDate), 'dd/MM/yyyy') : '-'}
                </TableCell>
                <TableCell className="text-xs font-bold text-indigo-600">
                  {row.refNo || '-'}
                </TableCell>
                <TableCell className="text-xs text-slate-900">
                   {row.description}
                </TableCell>
                <TableCell className="text-xs font-mono font-bold text-right">
                  {formatIDRPlain(row.amount || 0)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-xs uppercase font-bold">{row.currency}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    "text-xs font-black px-1.5 py-0.5 rounded",
                    row.dcFlag === 'D' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {row.dcFlag}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TransactionUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        noGL={noGL}
        bpmProcessId={bpmProcessId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
