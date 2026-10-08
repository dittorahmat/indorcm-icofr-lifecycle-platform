import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileUp, Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RCMIngestionStep } from './RCMIngestionStep';
import { RCMValidationStep } from './RCMValidationStep';
import { RCMReconciliationStep } from './RCMReconciliationStep';
import { useRCMImportWizard } from './useRCMImportWizard';
import type { RCMImportWizardModalProps } from './rcm-import-types';

export function RCMImportWizardModal({
  isOpen,
  onClose,
  diagramId,
  bpmProcessId,
  workingYear,
  bpmNodes = [],
  onSuccess,
  onAddBpmNode,
}: RCMImportWizardModalProps) {
  const { t } = useTranslation(['rcm', 'common']);

  const {
    step,
    setStep,
    flavor,
    setFlavor,
    selectedFile,
    parsedRows,
    isSubmitting,
    handleFileSelect,
    handleUpdateRowNodeLink,
    handleAutoCreateNode,
    handleCommit,
  } = useRCMImportWizard({
    diagramId,
    bpmProcessId,
    workingYear,
    bpmNodes,
    onSuccess,
    onClose,
    onAddBpmNode,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!isSubmitting && !open ? onClose() : undefined)}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-4xl p-4 sm:p-6 max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800 text-base sm:text-lg">
            <FileUp className="h-5 w-5 text-indigo-600 shrink-0" />
            {t('rcm:importWizard.modalTitle', { defaultValue: 'Import & Rekonsiliasi RCM (SK-5 Lampiran 5)' })}
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 py-2 border-b border-border text-xs font-semibold text-muted-foreground overflow-x-auto">
          <span className={step === 1 ? 'text-indigo-600 font-bold' : ''}>1. Pilih & Unggah</span>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className={step === 2 ? 'text-indigo-600 font-bold' : ''}>2. Validasi Data</span>
          {flavor === 'TLC' && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className={step === 3 ? 'text-indigo-600 font-bold' : ''}>3. Pemetaan BPM</span>
            </>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto py-4 min-h-0">
          {step === 1 && (
            <RCMIngestionStep
              flavor={flavor}
              onFlavorChange={setFlavor}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
            />
          )}

          {step === 2 && (
            <RCMValidationStep flavor={flavor} rows={parsedRows} />
          )}

          {step === 3 && flavor === 'TLC' && (
            <RCMReconciliationStep
              rows={parsedRows}
              bpmNodes={bpmNodes}
              onUpdateRowNodeLink={handleUpdateRowNodeLink}
              onAutoCreateNode={handleAutoCreateNode}
            />
          )}
        </div>

        {/* Responsive Footer */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-3 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px]"
          >
            {t('common:actions.cancel', { defaultValue: 'Batal' })}
          </Button>

          <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px]"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Kembali
              </Button>
            )}

            {step === 2 && flavor === 'TLC' && (
              <Button
                onClick={() => setStep(3)}
                className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Lanjut ke Pemetaan BPM <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}

            {((step === 2 && flavor !== 'TLC') || step === 3) && (
              <Button
                onClick={handleCommit}
                disabled={isSubmitting || parsedRows.length === 0}
                className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Simpan & Komit ke RCM
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
