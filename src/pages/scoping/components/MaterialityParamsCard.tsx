import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings2, PanelLeftClose, Info, Calculator, Percent, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MaterialitySimulation } from '@shared/types';
import { cn } from '@/lib/utils';

interface MaterialityParamsCardProps {
  simState: MaterialitySimulation;
  setSimState: React.Dispatch<React.SetStateAction<MaterialitySimulation>>;
  multiplier: number;
  benchmarkValue: number;
  omValue: number;
  pmValue: number;
  isLocked: boolean;
  onCollapse: () => void;
}

export function MaterialityParamsCard({
  simState,
  setSimState,
  multiplier,
  benchmarkValue,
  omValue,
  pmValue,
  isLocked,
  onCollapse
}: MaterialityParamsCardProps) {
  const { t } = useTranslation('scoping');

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden w-[300px] bg-white flex flex-col h-full">
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between px-5">
        <CardTitle className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] flex items-center gap-2">
          <Settings2 className="h-3.5 w-3.5 text-slate-900" /> {t('params.title')}
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all" 
          onClick={onCollapse}
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 pt-6 px-5 flex-1">
        <div className="space-y-2.5">
          <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
             <Layers className="h-3 w-3" /> {t('params.locations')}
          </Label>
          <div className="relative">
            <Input 
              type="number" 
              min={1} 
              disabled={isLocked} 
              value={simState.locationCount ?? 1} 
              onChange={e => setSimState(s => ({ ...s, locationCount: Number(e.target.value) }))} 
              className="h-10 font-bold bg-slate-50 border-slate-200 focus:bg-white transition-all pr-12 text-slate-900"
            />
            <div className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-slate-400 uppercase">
              {t('params.unit')}
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-1.5 px-1">
             <Calculator className="h-3 w-3" /> {t('params.multiplier')}: <span className="text-slate-900">{multiplier}x</span>
          </p>
        </div>

        <div className="space-y-2.5">
          <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
             <Percent className="h-3 w-3" /> {t('params.omLabel')}
          </Label>
          <div className="relative">
            <Input 
              type="number" 
              step={0.1} 
              disabled={isLocked} 
              value={simState.omPercentage ?? 0} 
              onChange={e => setSimState(s => ({ ...s, omPercentage: Number(e.target.value) }))} 
              className="h-10 font-bold bg-slate-50 border-slate-200 focus:bg-white transition-all pr-10 text-slate-900"
            />
            <div className="absolute inset-y-0 right-3 flex items-center text-slate-400">
              %
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
             <ShieldAlert className="h-3 w-3 text-red-500" /> {t('params.haircutLabel')}
          </Label>
          <div className="relative">
            <Input 
              type="number" 
              disabled={isLocked} 
              value={simState.haircutPercentage ?? 0} 
              onChange={e => setSimState(s => ({ ...s, haircutPercentage: Number(e.target.value) }))} 
              className="h-10 font-bold bg-slate-50 border-slate-200 focus:bg-white transition-all pr-10 text-slate-900"
            />
            <div className="absolute inset-y-0 right-3 flex items-center text-slate-400">
              %
            </div>
          </div>
        </div>

        <Separator className="bg-slate-100" />
        
        <div className="space-y-4 bg-mancity-pattern rounded-xl p-5 text-primary-foreground shadow-md relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <p className="text-[9px] text-primary-foreground/60 uppercase font-bold tracking-[0.15em] flex justify-between items-center">
              {t('params.benchmarkValue', { basis: simState.basis })} 
              <Info className="h-2.5 w-2.5 opacity-40" />
            </p>
            <p className="text-sm font-display font-bold text-primary-foreground text-right">Rp {benchmarkValue.toLocaleString('id-ID')}</p>
          </div>

          <div className="space-y-1 pt-3 border-t border-primary-foreground/10 relative z-10">
            <p className="text-[9px] text-primary-foreground/50 uppercase font-bold tracking-[0.15em]">{t('params.omValue')}</p>
            <p className="text-xl font-display font-bold text-primary-foreground text-right tracking-tight leading-none mt-1">Rp {omValue.toLocaleString('id-ID')}</p>
          </div>

          <div className="space-y-1 relative z-10">
            <p className="text-[9px] text-primary-foreground/50 uppercase font-bold tracking-[0.15em]">{t('params.pmValue')}</p>
            <p className="text-xl font-display font-bold text-primary-foreground text-right tracking-tight leading-none mt-1">Rp {pmValue.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </CardContent>
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
