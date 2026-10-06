import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SheetSelectionModal } from '../../import/SheetSelectionModal';
import type { SheetCandidate, WizardStep } from './smart-import-types';

const STEPS: WizardStep[] = [1, 2, 3];

interface WizardShellProps {
  isOpen: boolean;
  fiscalYear: string;
  step: WizardStep;
  sheetModalOpen: boolean;
  sheetFileName: string;
  sheetCandidates: SheetCandidate[];
  onDialogOpenChange: (open: boolean) => void;
  onSheetModalChange: (open: boolean) => void;
  onSelectSheet: (sheetName: string) => void;
  children: React.ReactNode;
}

export function WizardShell({
  isOpen,
  fiscalYear,
  step,
  sheetModalOpen,
  sheetFileName,
  sheetCandidates,
  onDialogOpenChange,
  onSheetModalChange,
  onSelectSheet,
  children,
}: WizardShellProps) {
  const { t } = useTranslation(['rcm', 'common', 'scoping']);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => void onDialogOpenChange(open)}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-[90vw] lg:max-w-[1100px] h-[92dvh] sm:h-[85vh] flex flex-col p-0 overflow-hidden border shadow-2xl rounded-lg">
        <DialogHeader className="px-4 sm:px-8 py-4 sm:py-6 bg-mancity-pattern text-primary-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
          <div className="space-y-1 min-w-0">
            <DialogTitle className="text-lg sm:text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-primary-foreground">
              <Zap className="h-6 w-6 text-primary-foreground" />
              {t('rcm:migration.title')}
            </DialogTitle>
            <p className="text-xs text-primary-foreground/60 font-medium">{t('rcm:migration.description')}</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-6 mr-1 sm:mr-8 shrink-0">
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-black text-primary-foreground/60 uppercase tracking-widest">
                {t('rcm:migration.importForCycle')}
              </span>
              <span className="text-xs font-bold text-primary-foreground">{fiscalYear}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-8 min-h-0">
          <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
            <div className="flex items-center justify-center gap-2 sm:gap-8 py-2 overflow-x-auto no-scrollbar max-w-full">
              {STEPS.map((s) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500',
                        step >= s
                          ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg scale-110'
                          : 'bg-slate-200 text-slate-500',
                      )}
                    >
                      {s}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-black uppercase tracking-widest transition-colors duration-500 whitespace-nowrap',
                        step >= s ? 'text-indigo-900' : 'text-slate-400',
                      )}
                    >
                      {s === 1
                        ? t('rcm:migration.steps.ingestion')
                        : s === 2
                          ? t('rcm:migration.steps.normalization')
                          : t('rcm:migration.steps.baselining')}
                    </span>
                  </div>
                  {s < 3 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                </React.Fragment>
              ))}
            </div>

            <Card className="border-slate-200 shadow-xl overflow-hidden rounded-lg bg-white">
              <CardContent className="p-4 sm:p-8">
                <AnimatePresence mode="wait">{children}</AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>

      <SheetSelectionModal
        isOpen={sheetModalOpen}
        onOpenChange={onSheetModalChange}
        fileName={sheetFileName}
        sheets={sheetCandidates}
        onSelectSheet={onSelectSheet}
      />
    </Dialog>
  );
}
