import React from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GLSnapshot } from '@shared/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Calculator, Save, AlertCircle, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useTranslation } from 'react-i18next';
import { useNotification } from '@/hooks/use-notification';

interface SetBenchmarkModalProps {
  snapshot: GLSnapshot | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetBenchmarkModal({ snapshot: initialSnapshot, isOpen, onOpenChange }: SetBenchmarkModalProps) {
  const { t } = useTranslation('scoping');
  const { notify } = useNotification();
  const queryClient = useQueryClient();
  const [selectedFsliNames, setSelectedFsliNames] = React.useState<string[]>([]);
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  // Fetch full snapshot with rows
  const { data: snapshot, isLoading } = useQuery({
    queryKey: ['gl-snapshot-detail', initialSnapshot?.id],
    queryFn: () => api<GLSnapshot>(`/api/gl-snapshots/${initialSnapshot?.id}`),
    enabled: !!initialSnapshot?.id && isOpen
  });

  React.useEffect(() => {
    if (snapshot) {
      setSelectedFsliNames(snapshot.benchmarkFsliNames || []);
    }
  }, [snapshot]);

  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Track unsaved changes
  const isDirty = React.useMemo(() => {
    if (!snapshot) return false;
    const initial = snapshot.benchmarkFsliNames || [];
    if (initial.length !== selectedFsliNames.length) return true;
    return !initial.every(name => selectedFsliNames.includes(name));
  }, [snapshot, selectedFsliNames]);

  // Sync with global guard
  useUnsavedChanges(isDirty && isOpen);

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
  };

  const uniqueFsliData = React.useMemo(() => {
    if (!snapshot || !snapshot.rows) return [];
    
    // Group by fsliName and track total balance + min noUrut
    const fsliMap = new Map<string, { total: number, minNoUrut: number, explicitlyProvidedTotal: number | null }>();
    
    snapshot.rows.forEach(r => {
      if (r.fsliName) {
        const current = fsliMap.get(r.fsliName) || { total: 0, minNoUrut: Infinity, explicitlyProvidedTotal: null };
        fsliMap.set(r.fsliName, {
          total: current.total + Math.abs(r.balance || 0),
          minNoUrut: Math.min(current.minNoUrut, r.noUrut ?? Infinity),
          explicitlyProvidedTotal: r.fsliBalance !== undefined && r.fsliBalance !== null ? r.fsliBalance : current.explicitlyProvidedTotal
        });
      }
    });

    return Array.from(fsliMap.entries())
      .map(([name, data]) => ({ 
        name, 
        total: (data.explicitlyProvidedTotal !== null && data.explicitlyProvidedTotal !== 0) ? data.explicitlyProvidedTotal : data.total, 
        minNoUrut: data.minNoUrut === Infinity ? 999999 : data.minNoUrut 
      }))
      .sort((a, b) => {
        if (a.minNoUrut !== b.minNoUrut) {
          return a.minNoUrut - b.minNoUrut;
        }
        return a.name.localeCompare(b.name);
      });
  }, [snapshot]);

  const filteredFsliData = React.useMemo(() => {
    if (!searchQuery.trim()) return uniqueFsliData;
    const q = searchQuery.toLowerCase().trim();
    return uniqueFsliData.filter(item => item.name.toLowerCase().includes(q));
  }, [uniqueFsliData, searchQuery]);

  const mappingMutation = useMutation({
    mutationFn: (names: string[]) => 
      api(`/api/gl-snapshots/${snapshot?.id}/mapping`, {
        method: 'PUT',
        body: JSON.stringify({ benchmarkFsliNames: names })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-snapshots'] });
      notify({
        message: t('benchmarkModal.saveSuccess'),
        type: 'success'
      });
      onOpenChange(false);
    }
  });

  const handleToggle = (name: string) => {
    setSelectedFsliNames(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name) 
        : [...prev, name]
    );
  };

  const totalSelectedValue = uniqueFsliData
    .filter(d => selectedFsliNames.includes(d.name))
    .reduce((sum, d) => sum + d.total, 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col rounded-lg overflow-hidden border shadow-2xl p-0">
        <DialogHeader className="p-4 sm:p-6 bg-mancity-pattern text-primary-foreground">
          <DialogTitle className="flex items-center gap-3 text-lg sm:text-2xl font-black uppercase tracking-tight text-primary-foreground">
            <Calculator className="h-6 w-6 text-primary-foreground" />
            {t('benchmarkModal.title')}
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/60 font-medium">
            {t('benchmarkModal.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6 flex-1 overflow-y-auto bg-slate-50/50 min-h-0">
          <div className="md:col-span-2 flex flex-col border border-slate-200 rounded-lg shadow-sm bg-white overflow-hidden min-h-[280px]">
            <div className="p-3 border-b border-slate-100 bg-slate-50/80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('benchmarkModal.searchPlaceholder')}
                  className="pl-9 bg-white border-slate-200 rounded-xl text-xs font-medium focus-visible:ring-indigo-500"
                />
              </div>
            </div>
            <div className="overflow-auto flex-1">
              {isLoading ? (
                <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-muted-foreground py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  <p className="text-sm font-medium">{t('benchmarkModal.loading')}</p>
                </div>
              ) : filteredFsliData.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-slate-400 py-16">
                  <Search className="h-8 w-8 text-slate-300" />
                  <p className="text-xs font-medium">{t('benchmarkModal.noResults')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[60px] text-center font-black uppercase text-xs tracking-widest">{t('benchmarkModal.colSelect')}</TableHead>
                      <TableHead className="font-black uppercase text-xs tracking-widest">{t('benchmarkModal.colFsli')}</TableHead>
                      <TableHead className="text-right font-black uppercase text-xs tracking-widest">{t('benchmarkModal.colBalance')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFsliData.map(item => (
                      <TableRow 
                        key={item.name} 
                        className={cn(
                          "hover:bg-indigo-50/30 transition-colors cursor-pointer group",
                          selectedFsliNames.includes(item.name) && "bg-indigo-50/50"
                        )}
                        onClick={() => handleToggle(item.name)}
                      >
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedFsliNames.includes(item.name)}
                            onCheckedChange={() => handleToggle(item.name)}
                            className="rounded-md border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                          />
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-700 uppercase tracking-tight">{item.name}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-600 font-medium">
                          Rp {item.total.toLocaleString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-md space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t('benchmarkModal.summaryTitle')}</h4>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('benchmarkModal.selectedCount')}</p>
                <p className="text-3xl font-black text-indigo-600 leading-none">{selectedFsliNames.length}</p>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('benchmarkModal.totalValue')}</p>
                <p className="text-xl font-mono font-black text-slate-900 tracking-tighter">
                  Rp {totalSelectedValue.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100 flex gap-3 shadow-inner">
              <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0" />
              <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                {t('benchmarkModal.tip')}
              </p>
            </div>

            {selectedFsliNames.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('benchmarkModal.selectedList')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFsliNames.map(name => (
                    <Badge key={name} variant="secondary" className="text-xs font-bold bg-indigo-100/50 text-indigo-700 border-indigo-200 py-0.5 px-2.5 rounded-full">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-6 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-lg font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 w-full sm:w-auto min-h-[44px]">{t('benchmarkModal.cancel')}</Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 gap-2 min-h-[44px] px-6 sm:px-10 rounded-lg font-black uppercase tracking-widest shadow-xl shadow-indigo-100 text-xs transition-all active:scale-95 w-full sm:w-auto"
            onClick={() => mappingMutation.mutate(selectedFsliNames)}
            disabled={mappingMutation.isPending || selectedFsliNames.length === 0}
          >
            {mappingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('benchmarkModal.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
