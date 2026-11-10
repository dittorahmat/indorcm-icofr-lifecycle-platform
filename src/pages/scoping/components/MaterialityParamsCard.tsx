import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calculator, Settings2, Info, AlertTriangle, 
  Layers, Percent, X, CheckCircle2, AlertCircle, FileText, ShieldAlert
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatIDR } from '@/components/reports/dod/dod-format';
import type { MaterialitySimulation, MaterialityJustification } from '@shared/types';
import { MaterialityJustificationModal } from './MaterialityJustificationModal';
import { isJustificationComplete } from '../services/materiality-justification';
import { cn } from '@/lib/utils';

interface MaterialityParamsCardProps {
  simState: MaterialitySimulation;
  setSimState: React.Dispatch<React.SetStateAction<MaterialitySimulation>>;
  multiplier: number;
  benchmarkValue: number;
  isLocked: boolean;
  isReadOnly?: boolean;
  onClose?: () => void;
  // Local/Draft parameter controls
  draftOmPercentage: number;
  setDraftOmPercentage: (val: number) => void;
  draftHaircutPercentage: number;
  setDraftHaircutPercentage: (val: number) => void;
  isRecalculating: boolean;
  handleRecalculate: (omPct: number, hcPct: number) => void;
  onSaveJustification?: (justification: MaterialityJustification) => void;
}

export function MaterialityParamsCard({
  simState,
  setSimState,
  multiplier,
  benchmarkValue,
  isLocked,
  isReadOnly = false,
  onClose,
  draftOmPercentage,
  setDraftOmPercentage,
  draftHaircutPercentage,
  setDraftHaircutPercentage,
  isRecalculating,
  handleRecalculate,
  onSaveJustification
}: MaterialityParamsCardProps) {
  const { t } = useTranslation('scoping');

  const [localOmPercentage, setLocalOmPercentage] = React.useState(draftOmPercentage);
  const [localHaircutPercentage, setLocalHaircutPercentage] = React.useState(draftHaircutPercentage);
  const [isJustificationOpen, setIsJustificationOpen] = React.useState(false);

  const hasCompleteJustification = React.useMemo(() => {
    return isJustificationComplete(simState.materialityJustification);
  }, [simState.materialityJustification]);

  React.useEffect(() => {
    setLocalOmPercentage(draftOmPercentage);
  }, [draftOmPercentage]);

  React.useEffect(() => {
    setLocalHaircutPercentage(draftHaircutPercentage);
  }, [draftHaircutPercentage]);

  const localIsStale = localOmPercentage !== (simState.omPercentage ?? 0) ||
                       localHaircutPercentage !== (simState.haircutPercentage ?? 0);

  const onRecalculateClick = () => {
    setDraftOmPercentage(localOmPercentage);
    setDraftHaircutPercentage(localHaircutPercentage);
    handleRecalculate(localOmPercentage, localHaircutPercentage);
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden w-full h-full bg-white flex flex-col">
      <CardHeader className="py-2.5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between px-3.5 shrink-0 gap-2 min-w-0">
        <CardTitle className="text-xs uppercase font-bold text-slate-500 tracking-[0.15em] flex items-center gap-1.5 truncate">
          <Settings2 className="h-3.5 w-3.5 text-slate-900 shrink-0" />
          <span className="truncate">{t('params.title')}</span>
        </CardTitle>
        <div className="flex items-center gap-1 shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 gap-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md px-1.5 transition-all text-xs font-bold uppercase tracking-wider"
              >
                <Info className="h-3 w-3 text-indigo-500" />
                <span>{t('logic.title')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] max-w-[300px] sm:w-[300px] p-4 border-slate-200 shadow-xl" align="end" side="bottom" sideOffset={5}>
              <h3 className="text-xs uppercase font-black text-slate-800 tracking-widest flex items-center gap-2 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> {t('logic.title')}
              </h3>
              <div className="text-xs text-slate-600 leading-relaxed space-y-2.5 font-medium">
                <p>{t('logic.description')}</p>
                <ol className="space-y-2">
                  <li className="flex gap-2">
                    <Badge className="h-3.5 w-3.5 p-0 flex items-center justify-center rounded-full bg-blue-600 border-none text-white text-xs font-black shrink-0">1</Badge>
                    <span>{t('logic.quant')}</span>
                  </li>
                  <li className="flex gap-2">
                    <Badge className="h-3.5 w-3.5 p-0 flex items-center justify-center rounded-full bg-indigo-600 border-none text-white text-xs font-black shrink-0">2</Badge>
                    <span>{t('logic.qual')}</span>
                  </li>
                </ol>
              </div>
            </PopoverContent>
          </Popover>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all shrink-0"
              title="Close panel"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3.5 flex flex-col gap-3 flex-grow min-h-0 justify-between">
        <div className="flex flex-col gap-2.5 w-full">
          {/* Significant Locations */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-slate-400" /> {t('params.locations')}
              </Label>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-0.5">
                <Calculator className="h-3 w-3" /> {multiplier}x
              </span>
            </div>
            <div className="relative">
              <Input 
                type="number" 
                min={1} 
                disabled={isLocked} 
                value={simState.locationCount ?? 1} 
                onChange={e => setSimState(s => ({ ...s, locationCount: Number(e.target.value) }))} 
                className="h-8 font-bold bg-slate-50 border-slate-200 focus:bg-white transition-all pr-12 text-slate-900 text-xs rounded-lg"
              />
              <div className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400 uppercase pointer-events-none">
                {t('params.unit')}
              </div>
            </div>
          </div>

          {/* % OM & % Haircut: mobile-first grid (single column base 320px, 2-col on min-[360px] or sm) */}
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 w-full">
            {/* % OM */}
            <div className="space-y-1 min-w-0">
              <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1 truncate">
                <Percent className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="truncate">{t('params.omLabel')}</span>
              </Label>
              <div className="relative">
                <Input 
                  type="number" 
                  step={0.1} 
                  disabled={isLocked} 
                  value={localOmPercentage} 
                  onChange={e => setLocalOmPercentage(Number(e.target.value))} 
                  onBlur={() => setDraftOmPercentage(localOmPercentage)}
                  className="h-8 font-bold bg-slate-50 border-slate-200 focus:bg-white transition-all pr-7 text-slate-900 text-xs rounded-lg"
                />
                <div className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 text-xs font-bold pointer-events-none">
                  %
                </div>
              </div>
            </div>

            {/* % Haircut */}
            <div className="space-y-1 min-w-0">
              <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1 truncate">
                <ShieldAlert className="h-3 w-3 text-rose-500 shrink-0" />
                <span className="truncate">{t('params.haircutLabel')}</span>
              </Label>
              <div className="relative">
                <Input 
                  type="number" 
                  disabled={isLocked} 
                  value={localHaircutPercentage} 
                  onChange={e => setLocalHaircutPercentage(Number(e.target.value))} 
                  onBlur={() => setDraftHaircutPercentage(localHaircutPercentage)}
                  className="h-8 font-bold bg-slate-50 border-slate-200 focus:bg-white transition-all pr-7 text-slate-900 text-xs rounded-lg"
                />
                <div className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 text-xs font-bold pointer-events-none">
                  %
                </div>
              </div>
            </div>
          </div>

          {/* Stale Warning & Recalculate Button */}
          {localIsStale && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2 flex items-start gap-1.5 text-amber-800 text-xs font-semibold leading-tight animate-in fade-in duration-200">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>{t('params.staleWarning')}</span>
            </div>
          )}

          <Button
            onClick={onRecalculateClick}
            disabled={!localIsStale || isRecalculating || isLocked}
            className={cn(
              "w-full text-white font-bold text-xs uppercase tracking-wider h-8 rounded-lg gap-1.5 shadow-sm transition-all",
              localIsStale
                ? "bg-indigo-600 hover:bg-indigo-700 ring-2 ring-indigo-200 shadow-indigo-100"
                : "bg-slate-300 text-slate-600 hover:bg-slate-300 cursor-not-allowed opacity-70"
            )}
          >
            <Calculator className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {isRecalculating ? t('params.recalculating') : t('params.recalculate')}
            </span>
          </Button>
        </div>

        {/* Bottom Section: Benchmark Summary & Justification */}
        <div className="flex flex-col gap-2 w-full pt-2 border-t border-slate-100 shrink-0">
          {/* Benchmark Details Inline */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-md px-2.5 py-1.5 w-full text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider truncate mr-2">
              {t('params.benchmarkValue', { basis: simState.basis || 'Benchmark' })}
            </span>
            <span className="font-mono font-bold text-slate-800 shrink-0">
              {formatIDR(benchmarkValue)}
            </span>
          </div>

          {/* Justification Status & Modal Trigger */}
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsJustificationOpen(true)}
              className={cn(
                "flex-1 h-8 text-xs font-semibold rounded-md flex items-center justify-between px-2.5 transition-all min-w-0",
                hasCompleteJustification
                  ? "border-slate-200 hover:bg-slate-50 text-slate-700"
                  : "border-amber-300 bg-amber-50/50 hover:bg-amber-50 text-amber-800"
              )}
            >
              <span className="flex items-center gap-1.5 truncate">
                <FileText className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{t('scoping:justification.buttonLabel')}</span>
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold px-1.5 py-0 rounded border shrink-0 leading-tight",
                  hasCompleteJustification
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-amber-50 text-amber-700 border-amber-300"
                )}
              >
                {hasCompleteJustification ? (
                  <span className="flex items-center gap-0.5">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                    {t('scoping:justification.statusComplete')}
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5">
                    <AlertCircle className="h-2.5 w-2.5 text-amber-600" />
                    {t('scoping:justification.statusPending')}
                  </span>
                )}
              </Badge>
            </Button>
          </div>
        </div>
      </CardContent>

      <MaterialityJustificationModal
        isOpen={isJustificationOpen}
        onOpenChange={setIsJustificationOpen}
        simulation={simState}
        isLocked={isLocked}
        isReadOnly={isReadOnly}
        onSave={(justification) => {
          setSimState((prev) => ({
            ...prev,
            materialityJustification: justification
          }));
          onSaveJustification?.(justification);
        }}
      />
    </Card>
  );
}
