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
import { GLSnapshot } from '@shared/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Calculator, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SetBenchmarkModalProps {
  snapshot: GLSnapshot | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetBenchmarkModal({ snapshot: initialSnapshot, isOpen, onOpenChange }: SetBenchmarkModalProps) {
  const queryClient = useQueryClient();
  const [selectedFsliNames, setSelectedFsliNames] = React.useState<string[]>([]);

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

  const uniqueFsliData = React.useMemo(() => {
    if (!snapshot || !snapshot.rows) return [];
    const fsliMap = new Map<string, number>();
    snapshot.rows.forEach(r => {
      if (r.fsliName) {
        const current = fsliMap.get(r.fsliName) || 0;
        fsliMap.set(r.fsliName, current + Math.abs(r.balance));
      }
    });
    return Array.from(fsliMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [snapshot]);

  const mappingMutation = useMutation({
    mutationFn: (names: string[]) => 
      api(`/api/gl-snapshots/${snapshot?.id}/mapping`, {
        method: 'PUT',
        body: JSON.stringify({ benchmarkFsliNames: names })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-snapshots'] });
      toast.success("Benchmark selection saved successfully");
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Calculator className="h-6 w-6 text-indigo-600" />
            Set Benchmark Basis
          </DialogTitle>
          <DialogDescription>
            Select which FSLI accounts should be available as materiality benchmark bases.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 flex-1 overflow-hidden">
          <div className="md:col-span-2 overflow-auto border rounded-xl shadow-inner bg-slate-50/30">
            {isLoading ? (
              <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-sm font-medium">Memuat data GL...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10 shadow-sm border-b">
                  <TableRow>
                    <TableHead className="w-[50px] text-center">Select</TableHead>
                    <TableHead>FSLI Name</TableHead>
                    <TableHead className="text-right">Total Balance (|Saldo|)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueFsliData.map(item => (
                    <TableRow 
                      key={item.name} 
                      className={cn(
                        "hover:bg-slate-100/50 transition-colors cursor-pointer",
                        selectedFsliNames.includes(item.name) && "bg-indigo-50/50"
                      )}
                      onClick={() => handleToggle(item.name)}
                    >
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={selectedFsliNames.includes(item.name)}
                          onCheckedChange={() => handleToggle(item.name)}
                          className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-700">{item.name}</TableCell>
                      <TableCell className="text-right font-mono text-[11px] text-slate-500">
                        Rp {item.total.toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Selection Summary</h4>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-medium">Selected Benchmarks:</p>
                <p className="text-2xl font-bold text-indigo-600">{selectedFsliNames.length}</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-medium">Total Benchmark Value:</p>
                <p className="text-lg font-mono font-bold text-slate-800">
                  Rp {totalSelectedValue.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex gap-3 shadow-sm">
              <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0" />
              <p className="text-[11px] text-indigo-700 leading-relaxed italic">
                Only the selected FSLIs will appear in the "Basis" dropdown when creating a new simulation.
              </p>
            </div>

            {selectedFsliNames.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected List:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFsliNames.map(name => (
                    <Badge key={name} variant="secondary" className="text-[9px] bg-indigo-100 text-indigo-700 border-indigo-200">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 gap-2 h-10 px-6 font-bold shadow-lg shadow-indigo-200"
            onClick={() => mappingMutation.mutate(selectedFsliNames)}
            disabled={mappingMutation.isPending || selectedFsliNames.length === 0}
          >
            <Save className="h-4 w-4" /> Save Selection & Enable Simulations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const Separator = () => <div className="h-px bg-slate-100 w-full" />;
