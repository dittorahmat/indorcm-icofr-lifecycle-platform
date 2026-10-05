import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings2, Info, Calculator, Percent, Layers, AlertTriangle, X, ShieldCheck, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MaterialitySimulation, MaterialityJustification } from '@shared/types';
import { cn } from '@/lib/utils';
import { MaterialityJustificationModal } from './MaterialityJustificationModal';
import { isJustificationComplete } from '../services/materiality-justification';

interface MaterialityParamsCardProps {
  simState: MaterialitySimulation;
  setSimState: React.Dispatch<React.SetStateAction<MaterialitySimulation>>;
  multiplier: number;
  benchmarkValue: number;
  omValue: number;
  pmValue: number;
  isLocked: boolean;
  onClose?: () => void;
  onSaveJustification?: (justification: MaterialityJustification) => void;
  draftBasis: string;
  setDraftBasis: (val: string) => void;
  draftOmPercentage: number;
  setDraftOmPercentage: (val: number) => void;
  draftHaircutPercentage: number;
  setDraftHaircutPercentage: (val: number) => void;
  isStale: boolean;
  isRecalculating: boolean;
  handleRecalculate: (om?: number, haircut?: number) => void;
}

export function MaterialityParamsCard({
  simState,
  setSimState,
  multiplier,
  benchmarkValue,
  omValue,
  pmValue,
  isLocked,
  onClose,
  onSaveJustification,
  draftBasis,
  setDraftBasis,
  draftOmPercentage,
  setDraftOmPercentage,
  draftHaircutPercentage,
  setDraftHaircutPercentage,
  isStale,
  isRecalculating,
  handleRecalculate
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
                       localHaircutPercentage !== (simState.haircutPercentage ?? 0) ||
                       draftBasis !== simState.basis;

  const onRecalculateClick = () => {
    // Propagate to parent draft states
    setDraftOmPercentage(localOmPercentage);
    setDraftHaircutPercentage(localHaircutPercentage);
    // Trigger recalculation with local parameters
    handleRecalculate(localOmPercentage, localHaircutPercentage);
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden w-full h-full bg-white flex flex-col">
      <CardHeader className="py-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 shrink-0 flex-wrap gap-2 min-w-0">
        <CardTitle className="text-xs uppercase font-bold text-slate-500 tracking-[0.2em] flex items-center gap-2">
          <Settings2 className="h-3.5 w-3.5 text-slate-900" /> {t('params.title')}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 gap-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md px-2 transition-all text-xs font-bold uppercase tracking-wider"
              >
                <Info className="h-3 w-3 text-indigo-500" /> {t('logic.title')}
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
                    <Badge className="h-3.5 w-3.5 p-0 flex items-center justify-center rounded-full bg-blue-600 border-none text-white text-xs font-black shrink-0">2</Badge>
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
      <CardContent className="p-4 flex flex-col gap-4 flex-grow overflow-y-auto min-h-0 justify-between">
        <div className="flex flex-col gap-4 w-full">
          {/* Significant Locations */}
          <div className="space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
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
                className="h-9 font-bold bg-slate-50 border-slate-200 focus:bg-white transition-all pr-12 text-slate-900 text-xs rounded-lg"
              />
              <div className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400 uppercase">
                {t('params.unit')}
              </div>
            </div>
          </div>

          {/* % OM Percentage */}
          <div className="space-y-1">
            <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5 text-slate-400" /> {t('params.omLabel')}
            </Label>
            <div className="relative">
              <Input 
                type="number" 
                step={0.1} 
                disabled={isLocked} 
                value={localOmPercentage} 
                onChange={e => setLocalOmPercentage(Number(e.target.value))} 
                onBlur={() => setDraftOmPercentage(localOmPercentage)}
                className="h-9 font-bold bg-slate-50 border-slate-200 focus:bg-white transition-all pr-8 text-slate-900 text-xs rounded-lg"
              />
              <div className="absolute inset-y-0 right-3 flex items-center text-slate-400 text-xs font-bold">
                %
              </div>
            </div>
          </div>

          {/* % Haircut */}
          <div className="space-y-1">
            <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-500" /> {t('params.haircutLabel')}
            </Label>
            <div className="relative">
              <Input 
                type="number" 
                disabled={isLocked} 
                value={localHaircutPercentage} 
                onChange={e => setLocalHaircutPercentage(Number(e.target.value))} 
                onBlur={() => setDraftHaircutPercentage(localHaircutPercentage)}
                className="h-9 font-bold bg-slate-50 border-slate-200 focus:bg-white transition-all pr-8 text-slate-900 text-xs rounded-lg"
              />
              <div className="absolute inset-y-0 right-3 flex items-center text-slate-400 text-xs font-bold">
                %
              </div>
            </div>
          </div>
        </div>

        {/* Warning & Recalculate Block */}
        <div className="flex flex-col gap-3 w-full mt-4 shrink-0">
          {localIsStale && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 flex items-start gap-2 text-amber-800 text-xs font-semibold leading-normal">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{t('params.staleWarning', 'Parameter telah berubah. Silakan hitung ulang untuk memperbarui tabel.')}</span>
            </div>
          )}

          <Button
            onClick={onRecalculateClick}
            disabled={!localIsStale || isRecalculating || isLocked}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider h-10 rounded-xl gap-2 shadow-sm"
          >
            <Calculator className="h-4 w-4" />
            {isRecalculating ? t('params.recalculating', 'Recalculating...') : t('params.recalculate', 'Recalculate')}
          </Button>

          {/* Benchmark Details Block */}
          <div className="flex flex-col gap-2 bg-slate-50 border border-slate-100 rounded-lg p-3 w-full">
            <div className="space-y-0.5 text-left">
              <p className="text-xs text-slate-400 uppercase font-black tracking-wider flex items-center justify-start gap-1">
                {t('params.benchmarkValue', { basis: simState.basis })} 
                <Info className="h-3 w-3 opacity-40" />
              </p>
              <p className="text-xs font-display font-black text-slate-700">Rp {benchmarkValue.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {/* Justification Status & Modal Trigger */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                {t('scoping:justification.buttonLabel')}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold px-2 py-0 rounded-md",
                  hasCompleteJustification
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-amber-50 text-amber-700 border-amber-300"
                )}
              >
                {hasCompleteJustification ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    {t('scoping:justification.statusComplete')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-amber-600" />
                    {t('scoping:justification.statusPending')}
                  </span>
                )}
              </Badge>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsJustificationOpen(true)}
              className={cn(
                "w-full h-8 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all",
                hasCompleteJustification
                  ? "border-slate-200 hover:bg-slate-50 text-slate-700"
                  : "border-amber-300 bg-amber-50/50 hover:bg-amber-50 text-amber-800"
              )}
            >
              <FileText className="h-3.5 w-3.5 text-indigo-500" />
              {t('scoping:justification.buttonLabel')}
            </Button>
          </div>
        </div>
      </CardContent>

      <MaterialityJustificationModal
        isOpen={isJustificationOpen}
        onOpenChange={setIsJustificationOpen}
        simulation={simState}
        isLocked={isLocked}
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

const ShieldAlert = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);
