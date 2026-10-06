import { useTranslation } from 'react-i18next';
import { AlertCircle, Calculator } from 'lucide-react';

interface MaterialitySummaryProps {
  omValue: number;
  pmValue: number;
  groupMultiplier: number;
}

export function MaterialitySummary({ omValue, pmValue, groupMultiplier }: MaterialitySummaryProps) {
  const { t } = useTranslation(['rcm', 'common', 'scoping']);

  return (
    <div className="bg-mancity-pattern rounded-lg p-6 text-primary-foreground space-y-6 flex flex-col justify-center border-4 border-white/20 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Calculator className="h-32 w-32 -rotate-12" />
      </div>
      <div className="space-y-4 relative z-10">
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">
            {t('rcm:migration.materiality.calculatedOm')}
          </p>
          <p className="text-lg sm:text-2xl font-mono font-black tracking-tighter break-all min-w-0">
            Rp {omValue.toLocaleString()}
          </p>
        </div>
        <div className="h-px bg-slate-800" />
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
            {t('rcm:migration.materiality.performanceMateriality')}
          </p>
          <p className="text-lg sm:text-2xl font-mono font-black tracking-tighter text-amber-50 break-all min-w-0">
            Rp {pmValue.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest relative z-10">
        <AlertCircle className="h-3 w-3" />
        {t('rcm:migration.materiality.groupMultiplierNote', { multiplier: groupMultiplier })}
      </div>
    </div>
  );
}
