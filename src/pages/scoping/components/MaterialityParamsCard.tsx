import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings2, PanelLeftClose, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MaterialitySimulation } from '@shared/types';

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
    <Card className="border-slate-200 shadow-sm overflow-hidden w-[300px]">
      <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50 flex flex-row items-center justify-between">
        <CardTitle className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
          <Settings2 className="h-3.5 w-3.5" /> {t('params.title')}
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-slate-400 hover:text-slate-600" 
          onClick={onCollapse}
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase text-slate-400">{t('params.locations')}</Label>
          <Input 
            type="number" 
            min={1} 
            disabled={isLocked} 
            value={simState.locationCount ?? 1} 
            onChange={e => setSimState(s => ({ ...s, locationCount: Number(e.target.value) }))} 
          />
          <p className="text-[9px] text-blue-600 italic">Multiplier: {multiplier}x</p>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase text-slate-400">{t('params.omLabel')}</Label>
          <Input 
            type="number" 
            step={0.1} 
            disabled={isLocked} 
            value={simState.omPercentage ?? 0} 
            onChange={e => setSimState(s => ({ ...s, omPercentage: Number(e.target.value) }))} 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase text-slate-400">{t('params.haircutLabel')}</Label>
          <Input 
            type="number" 
            disabled={isLocked} 
            value={simState.haircutPercentage ?? 0} 
            onChange={e => setSimState(s => ({ ...s, haircutPercentage: Number(e.target.value) }))} 
          />
        </div>
        <Separator />
        <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <div className="space-y-1">
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest flex justify-between">{t('params.benchmarkValue', { basis: simState.basis })} <Info className="h-2.5 w-2.5" /></p>
            <p className="text-sm font-mono font-bold text-slate-700 text-right">Rp {benchmarkValue.toLocaleString('id-ID')}</p>
          </div>
          <div className="space-y-1 pt-2 border-t border-slate-200">
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{t('params.omValue')}</p>
            <p className="text-lg font-mono font-bold text-primary text-right">Rp {omValue.toLocaleString('id-ID')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] text-blue-400 uppercase font-bold tracking-widest">{t('params.pmValue')}</p>
            <p className="text-lg font-mono font-bold text-blue-600 text-right">Rp {pmValue.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
