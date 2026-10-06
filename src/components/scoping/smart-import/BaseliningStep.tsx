import { useTranslation } from 'react-i18next';
import { Calculator, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { IntelligenceDashboard } from '../../import/IntelligenceDashboard';
import { BenchmarkSelect } from './BenchmarkSelect';
import { MaterialitySummary } from './MaterialitySummary';
import type { useSmartImportMateriality } from './useSmartImportMateriality';

type Materiality = ReturnType<typeof useSmartImportMateriality>;

interface BaseliningStepProps {
  stagingCount: number;
  hasTbData: boolean;
  materiality: Materiality;
  onBack: () => void;
  onFinalize: () => void;
}

export function BaseliningStep({ stagingCount, hasTbData, materiality, onBack, onFinalize }: BaseliningStepProps) {
  const { t } = useTranslation(['rcm', 'common', 'scoping']);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
      <IntelligenceDashboard
        summary={{
          totalEntities: 2,
          processesCreated: 3,
          risksMapped: 5,
          controlsIdentified: stagingCount,
          confidenceScore: 0.91,
          unmitigatedRisks: 2,
        }}
      />

      {hasTbData && (
        <div className="bg-white p-4 sm:p-8 rounded-lg border border-slate-200 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">
                {t('rcm:migration.materiality.title')}
              </h4>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                {t('rcm:migration.materiality.description')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
            <div className="space-y-4">
              <BenchmarkSelect
                selectedBasis={materiality.selectedBasis}
                candidates={materiality.uniqueFsliData}
                popoverOpen={materiality.benchmarkPopoverOpen}
                onBasisChange={materiality.setSelectedBasis}
                onPopoverChange={materiality.setBenchmarkPopoverOpen}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                    {t('rcm:migration.materiality.omPercent')}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      value={materiality.omPercentage}
                      onChange={(e) => materiality.setOmPercentage(parseFloat(e.target.value) || 0)}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50/50 font-black text-indigo-600 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                    {t('rcm:migration.materiality.haircutPercent')}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      value={materiality.haircutPercentage}
                      onChange={(e) => materiality.setHaircutPercentage(parseFloat(e.target.value) || 0)}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50/50 font-black text-amber-600 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</span>
                  </div>
                </div>
              </div>
            </div>

            <MaterialitySummary
              omValue={materiality.omValue}
              pmValue={materiality.pmValue}
              groupMultiplier={materiality.groupMultiplier}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center py-10 text-center gap-6 bg-indigo-50/30 rounded-lg border-2 border-dashed border-indigo-100">
        <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 uppercase">{t('rcm:migration.baselining.ready_title')}</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{t('rcm:migration.baselining.ready_desc')}</p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-xs font-bold text-slate-400 uppercase tracking-widest min-h-[44px] w-full sm:w-auto justify-center"
          >
            {t('rcm:migration.baselining.reviewMapping')}
          </Button>
          <Button
            size="lg"
            onClick={onFinalize}
            className="rounded-lg px-6 sm:px-12 font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-xl text-white min-h-[44px] h-12 sm:h-14 text-xs w-full sm:w-auto"
          >
            {t('rcm:migration.baselining.finalize_btn')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
