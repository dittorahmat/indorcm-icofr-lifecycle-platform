import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MaterialitySimulation, GLSnapshot } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Loader2, Calculator, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignificantLocationModalProps {
  simulation: MaterialitySimulation;
  activeSnapshot: GLSnapshot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignificantLocationModal({ 
  simulation, 
  activeSnapshot, 
  open, 
  onOpenChange 
}: SignificantLocationModalProps) {
  const queryClient = useQueryClient();
  const [threshold, setThreshold] = React.useState(simulation.locationThreshold || 80);

  // 1. Pareto Calculation Logic
  const analysisResults = React.useMemo(() => {
    if (!activeSnapshot || !simulation.basis) return [];

    // Group by entity code
    const entityMap = new Map<string, number>();
    activeSnapshot.rows.forEach(row => {
      if (row.fsliName === simulation.basis) {
        const current = entityMap.get(row.entityCode) || 0;
        entityMap.set(row.entityCode, current + Math.abs(row.balance));
      }
    });

    const totalBasis = Array.from(entityMap.values()).reduce((sum, val) => sum + val, 0);
    if (totalBasis === 0) return [];

    // Sort descending
    const sorted = Array.from(entityMap.entries())
      .map(([entityCode, balance]) => ({ entityCode, balance }))
      .sort((a, b) => b.balance - a.balance);

    // Calculate percentages
    let cumulative = 0;
    return sorted.map(item => {
      const contribution = (item.balance / totalBasis) * 100;
      cumulative += contribution;
      return {
        ...item,
        contributionPercentage: contribution,
        cumulativePercentage: cumulative,
        isSignificant: (cumulative - contribution) < threshold
      };
    });
  }, [activeSnapshot, simulation.basis, threshold]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<MaterialitySimulation>) => 
      api(`/api/simulations/${simulation.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success("Location scoping saved successfully");
      onOpenChange(false);
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      locationThreshold: threshold,
      locationResults: analysisResults
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-primary text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Significant Location Analysis</DialogTitle>
              <DialogDescription className="text-blue-100">
                Pareto scoping based on <strong>{simulation.basis}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase text-blue-700 tracking-wider">Location Scoping Threshold (%)</Label>
              <div className="flex items-center gap-3">
                <Input 
                  type="number" 
                  className="w-24 h-9 font-bold text-lg border-blue-200 focus:ring-primary" 
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                />
                <span className="text-sm text-blue-600 font-medium italic">
                  * SK-5/2024 recommendation is 80%
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-500 uppercase font-bold tracking-tight">Total Basis Value</p>
              <p className="text-xl font-black text-primary">
                Rp {analysisResults.reduce((sum, r) => sum + r.balance, 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50 border-b">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Entity Code</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Value ({simulation.basis})</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">% Contribution</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">% Cumulative</TableHead>
                  <TableHead className="text-center font-bold text-slate-700">Significant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic">
                      No data available for the selected basis.
                    </TableCell>
                  </TableRow>
                ) : (
                  analysisResults.map((row) => (
                    <TableRow key={row.entityCode} className={cn(
                      "hover:bg-slate-50 transition-colors",
                      row.isSignificant ? "bg-blue-50/30" : "opacity-60"
                    )}>
                      <TableCell className="font-mono font-bold text-slate-900">{row.entityCode}</TableCell>
                      <TableCell className="text-right font-medium">
                        {row.balance.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        {row.contributionPercentage.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {row.cumulativePercentage.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-center">
                        {row.isSignificant ? (
                          <Badge className="bg-green-600 h-6 px-3 gap-1.5 uppercase font-black text-xs">
                            <CheckCircle2 className="h-3 w-3" /> Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 border-slate-200 h-6 px-3 gap-1.5 uppercase font-bold text-xs">
                            <XCircle className="h-3 w-3" /> No
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="bg-primary hover:bg-primary/90 gap-2 font-bold px-8"
            disabled={analysisResults.length === 0 || updateMutation.isPending}
            onClick={handleSave}
          >
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save Scoping Result
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
