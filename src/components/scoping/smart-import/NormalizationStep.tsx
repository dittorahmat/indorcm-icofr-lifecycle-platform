import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CrossCheckPanel } from '../../import/CrossCheckPanel';
import { StagingTable } from '../../import/StagingTable';
import type { StagingRow } from './smart-import-types';

const DEMO_COVERAGE_ITEMS = [
  { accountCode: '1110.01', accountName: 'Kas Kecil', balance: 25000000, status: 'Covered' as const, linkedControls: 1 },
  { accountCode: '1210.01', accountName: 'Piutang PLN', balance: 15000000000, status: 'Unmitigated' as const, linkedControls: 0 },
  { accountCode: '4110.01', accountName: 'Pendapatan', balance: 75000000000, status: 'Unmitigated' as const, linkedControls: 0 },
];

interface NormalizationStepProps {
  stagingData: StagingRow[];
  onUpdateRow: (id: string, field: string, value: unknown) => void;
  onBack: () => void;
  onNext: () => void;
}

export function NormalizationStep({ stagingData, onUpdateRow, onBack, onNext }: NormalizationStepProps) {
  const { t } = useTranslation(['rcm', 'common', 'scoping']);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="lg:col-span-1">
          <CrossCheckPanel items={DEMO_COVERAGE_ITEMS} />
        </div>
        <div className="lg:col-span-3">
          <StagingTable rows={stagingData} onUpdateRow={onUpdateRow} />
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-slate-400 font-bold uppercase tracking-widest text-xs min-h-[44px] w-full sm:w-auto justify-center"
        >
          {t('rcm:migration.normalization.backToUpload')}
        </Button>
        <Button
          onClick={onNext}
          className="rounded-lg px-6 sm:px-10 min-h-[44px] h-11 font-black uppercase tracking-widest bg-mancity-pattern text-primary-foreground hover:opacity-90 shadow-lg text-xs w-full sm:w-auto"
        >
          {t('rcm:migration.normalization.nextSummary')}
        </Button>
      </div>
    </motion.div>
  );
}
