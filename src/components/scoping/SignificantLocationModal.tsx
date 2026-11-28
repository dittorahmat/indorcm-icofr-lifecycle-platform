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
import { Loader2, Calculator, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateScopingCompliance } from '@/pages/scoping/services/materiality-calc';
import { useTranslation } from 'react-i18next';
import { formatIDR, formatIDRPlain } from '@/components/reports/dod/dod-format';

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
  const { t } = useTranslation(['scoping', 'common']);
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

  const selectedEntityCodes = React.useMemo(() => {
    return analysisResults.filter(r => r.isSignificant).map(r => r.entityCode);
  }, [analysisResults]);

  const compliance = React.useMemo(() => {
    if (!activeSnapshot || selectedEntityCodes.length === 0) return null;
    return calculateScopingCompliance(activeSnapshot.rows, selectedEntityCodes);
  }, [activeSnapshot, selectedEntityCodes]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<MaterialitySimulation>) => 
      api(`/api/simulations/${simulation.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success(t('locationModal.saveSuccess'));
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
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[800px] max-h-[90dvh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-lg">
        <DialogHeader className="p-6 bg-primary text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{t('locationModal.title')}</DialogTitle>
              <DialogDescription className="text-blue-100">
                {t('locationModal.description', { basis: simulation.basis })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-blue-50 p-4 rounded-lg border border-blue-100 flex-wrap gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase text-blue-700 tracking-wider">{t('locationModal.thresholdLabel')}</Label>
              <div className="flex items-center gap-3">
                <Input 
                  type="number" 
                  className="w-24 h-11 min-h-[44px] text-base sm:text-sm font-bold border-blue-200 focus:ring-primary" 
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                />
                <span className="text-sm text-blue-600 font-medium">
                  {t('locationModal.thresholdRecommendation')}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-blue-500 uppercase font-bold tracking-tight">{t('locationModal.totalBasisValue')}</p>
              <p className="text-xl font-black text-primary">
                {formatIDR(analysisResults.reduce((sum, r) => sum + r.balance, 0))}
              </p>
            </div>
          </div>

          {compliance && (
            <div className={cn(
              "p-4 rounded-xl border flex flex-col gap-3",
              compliance.isOverallCompliant 
                ? "bg-emerald-50/50 border-emerald-100 text-emerald-950 dark:bg-emerald-950/10 dark:border-emerald-900/30 dark:text-emerald-50" 
                : "bg-amber-50/50 border-amber-100 text-amber-950 dark:bg-amber-950/10 dark:border-amber-900/30 dark:text-amber-50"
            )}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertCircle className={cn("h-4 w-4", compliance.isOverallCompliant ? "text-emerald-600" : "text-amber-600")} />
                  <span>{t('health.complianceCheck')}</span>
                </div>
                <Badge variant={compliance.isOverallCompliant ? "default" : "secondary"} className={cn(
                  "text-xs font-black uppercase tracking-wider px-2.5 py-0.5 border-none",
                  compliance.isOverallCompliant ? "bg-emerald-600 text-white hover:bg-emerald-600" : "bg-amber-600 text-white hover:bg-amber-600"
                )}>
                  {compliance.isOverallCompliant ? t('health.compliant') : t('health.nonCompliant')}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white/60 dark:bg-black/20 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500">{t('health.assetsCoverage')}</span>
                  <p className="text-xs font-black flex items-center gap-1.5 mt-0.5">
                    <span className={compliance.aggregateCompliance.assets.isCompliant ? "text-emerald-600" : "text-amber-600"}>
                      {compliance.aggregateCompliance.assets.percentage.toFixed(1)}%
                    </span>
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500">{t('health.liabilitiesCoverage')}</span>
                  <p className="text-xs font-black flex items-center gap-1.5 mt-0.5">
                    <span className={compliance.aggregateCompliance.liabilities.isCompliant ? "text-emerald-600" : "text-amber-600"}>
                      {compliance.aggregateCompliance.liabilities.percentage.toFixed(1)}%
                    </span>
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500">{t('health.revenueCoverage')}</span>
                  <p className="text-xs font-black flex items-center gap-1.5 mt-0.5">
                    <span className={compliance.aggregateCompliance.revenue.isCompliant ? "text-emerald-600" : "text-amber-600"}>
                      {compliance.aggregateCompliance.revenue.percentage.toFixed(1)}%
                    </span>
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500">{t('health.expensesCoverage')}</span>
                  <p className="text-xs font-black flex items-center gap-1.5 mt-0.5">
                    <span className={compliance.aggregateCompliance.expenses.isCompliant ? "text-emerald-600" : "text-amber-600"}>
                      {compliance.aggregateCompliance.expenses.percentage.toFixed(1)}%
                    </span>
                  </p>
                </div>
              </div>

              {!compliance.isOverallCompliant && (
                <div className="mt-1 text-xs font-medium text-amber-800 dark:text-amber-300 leading-relaxed border-t border-amber-100/50 dark:border-amber-900/30 pt-2">
                  <span className="font-bold flex items-center gap-1 mb-1">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    {t('health.nonCompliantFslis')}
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {compliance.fsliCoverages.filter(c => !c.isCompliant).map(c => (
                      <li key={c.fsliName}>
                        {c.fsliName}: <span className="font-bold">{c.coveragePercentage.toFixed(1)}%</span> (Consolidated: {formatIDRPlain(c.consolidatedBalance)})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg border border-slate-200 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint shadow-sm">
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-slate-700">{t('locationModal.colEntityCode')}</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">{t('locationModal.colValue', { basis: simulation.basis })}</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">{t('locationModal.colContribution')}</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">{t('locationModal.colCumulative')}</TableHead>
                  <TableHead className="text-center font-bold text-slate-700">{t('locationModal.colSignificant')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                      {t('locationModal.noData')}
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
                        {formatIDRPlain(row.balance)}
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
                            <CheckCircle2 className="h-3 w-3" /> {t('common:yes')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 border-slate-200 h-6 px-3 gap-1.5 uppercase font-bold text-xs">
                            <XCircle className="h-3 w-3" /> {t('common:no')}
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

        <DialogFooter className="p-4 sm:p-6 bg-slate-50 border-t flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto min-h-[44px] justify-center" onClick={() => onOpenChange(false)}>{t('common:actions.cancel')}</Button>
          <Button 
            className="bg-primary hover:bg-primary/90 gap-2 font-bold px-8 w-full sm:w-auto min-h-[44px] justify-center"
            disabled={analysisResults.length === 0 || updateMutation.isPending}
            onClick={handleSave}
          >
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {t('locationModal.saveResult')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
