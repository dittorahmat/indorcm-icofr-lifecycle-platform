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
import { GLSnapshot, BenchmarkBasis } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Calculator, Save, AlertCircle } from 'lucide-react';

interface SetBenchmarkModalProps {
  snapshot: GLSnapshot | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const BENCHMARK_BASES: BenchmarkBasis[] = ['Revenue', 'PBT', 'Assets', 'Equity', 'Net Current Assets'];

export function SetBenchmarkModal({ snapshot, isOpen, onOpenChange }: SetBenchmarkModalProps) {
  const queryClient = useQueryClient();
  const [mapping, setMapping] = React.useState<Record<string, BenchmarkBasis[]>>({});

  React.useEffect(() => {
    if (snapshot) {
      setMapping(snapshot.benchmarkMapping || {});
    }
  }, [snapshot]);

  const uniqueFsliNames = React.useMemo(() => {
    if (!snapshot) return [];
    const names = new Set<string>();
    snapshot.rows.forEach(r => {
      if (r.fsliName) names.add(r.fsliName);
    });
    return Array.from(names).sort();
  }, [snapshot]);

  const mappingMutation = useMutation({
    mutationFn: (newMapping: Record<string, BenchmarkBasis[]>) => 
      api(`/api/gl-snapshots/${snapshot?.id}/mapping`, {
        method: 'PUT',
        body: JSON.stringify({ benchmarkMapping: newMapping })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-snapshots'] });
      toast.success("Benchmark mapping saved successfully");
      onOpenChange(false);
    }
  });

  const handleMappingToggle = (fsliName: string, basis: BenchmarkBasis) => {
    const currentBases = mapping[fsliName] || [];
    const newBases = currentBases.includes(basis)
      ? currentBases.filter(b => b !== basis)
      : [...currentBases, basis];
    
    setMapping({
      ...mapping,
      [fsliName]: newBases
    });
  };

  const calculateTotal = (basis: BenchmarkBasis) => {
    if (!snapshot) return 0;
    const fsliNames = Object.entries(mapping)
      .filter(([_, bases]) => Array.isArray(bases) && bases.includes(basis))
      .map(([name]) => name);
    
    return snapshot.rows
      .filter(r => r.fsliName && fsliNames.includes(r.fsliName))
      .reduce((sum, r) => sum + Math.abs(r.balance), 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calculator className="h-6 w-6 text-primary" />
            Set Benchmark Basis Mapping
          </DialogTitle>
          <DialogDescription>
            Select one or more benchmark categories for each FSLI. Multiple selection allowed for multi-impact accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-4 flex-1 overflow-hidden">
          <div className="lg:col-span-3 overflow-auto border rounded-xl shadow-inner bg-slate-50/30">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[300px] bg-white">FSLI Name</TableHead>
                  {BENCHMARK_BASES.map(basis => (
                    <TableHead key={basis} className="text-center text-[10px] uppercase tracking-tighter">
                      {basis}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {uniqueFsliNames.map(name => (
                  <TableRow key={name} className="hover:bg-slate-100/50 transition-colors">
                    <TableCell className="text-xs font-bold text-slate-700">{name}</TableCell>
                    {BENCHMARK_BASES.map(basis => (
                      <TableCell key={basis} className="text-center">
                        <Checkbox 
                          checked={(mapping[name] || []).includes(basis)}
                          onCheckedChange={() => handleMappingToggle(name, basis)}
                          className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Summary Totals</h4>
            <div className="grid grid-cols-1 gap-3">
              {BENCHMARK_BASES.map(basis => {
                const total = calculateTotal(basis);
                return (
                  <div key={basis} className="p-3 rounded-xl border bg-white shadow-sm flex flex-col gap-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{basis}</p>
                    <p className="text-sm font-mono font-bold text-indigo-600">
                      Rp {total.toLocaleString('id-ID')}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex gap-3 shadow-sm">
              <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0" />
              <p className="text-[11px] text-indigo-700 leading-relaxed italic">
                A single FSLI can contribute to multiple benchmarks. Calculations use absolute values (|Saldo|) for audit safety.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 gap-2 h-10 px-6 font-bold shadow-lg shadow-indigo-200"
            onClick={() => mappingMutation.mutate(mapping)}
            disabled={mappingMutation.isPending}
          >
            <Save className="h-4 w-4" /> Save & Lock Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
