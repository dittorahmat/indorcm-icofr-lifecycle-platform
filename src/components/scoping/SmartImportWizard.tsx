import { useTranslation } from 'react-i18next';
import { WizardShell } from './smart-import/WizardShell';
import { IngestionStep } from './smart-import/IngestionStep';
import { NormalizationStep } from './smart-import/NormalizationStep';
import { BaseliningStep } from './smart-import/BaseliningStep';
import { useSmartImport } from './smart-import/useSmartImport';
import type { SmartImportWizardProps } from './smart-import/smart-import-types';

export type { SmartImportWizardProps };

export function SmartImportWizard({ isOpen, onOpenChange, onSuccess }: SmartImportWizardProps) {
  const { t } = useTranslation(['rcm', 'common', 'scoping']);
  const {
    step,
    fiscalYear,
    files,
    materiality,
    goToStep,
    handleDialogOpenChange,
    handleFinalize,
  } = useSmartImport({ isOpen, onOpenChange, onSuccess, t });

  const goToNormalization = () => goToStep(2);

  return (
    <WizardShell
      isOpen={isOpen}
      fiscalYear={fiscalYear}
      step={step}
      sheetModalOpen={files.sheetModalOpen}
      sheetFileName={files.pendingTargetFile?.name || files.tbFile?.name || ''}
      sheetCandidates={files.sheetCandidates}
      onDialogOpenChange={(open) => void handleDialogOpenChange(open)}
      onSheetModalChange={files.setSheetModalOpen}
      onSelectSheet={(name) => void files.handleSheetSelected(name, goToNormalization)}
    >
      {step === 1 && (
        <IngestionStep
          key="ingestion"
          tbFile={files.tbFile}
          isProcessing={files.isProcessing}
          onSelectTbFile={files.selectTbFile}
          onProcess={() => void files.handleProcessAI(goToNormalization)}
        />
      )}
      {step === 2 && (
        <NormalizationStep
          key="normalization"
          stagingData={files.stagingData}
          onUpdateRow={files.updateStagingRow}
          onBack={() => goToStep(1)}
          onNext={() => goToStep(3)}
        />
      )}
      {step === 3 && (
        <BaseliningStep
          key="baselining"
          stagingCount={files.stagingData.length}
          hasTbData={files.parsedTbData.length > 0}
          materiality={materiality}
          onBack={() => goToStep(2)}
          onFinalize={() => void handleFinalize()}
        />
      )}
    </WizardShell>
  );
}
