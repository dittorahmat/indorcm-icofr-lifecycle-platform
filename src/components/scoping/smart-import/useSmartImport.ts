import * as React from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useConfirm } from '@/hooks/use-confirm';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import type { RCMType } from '@/pages/scoping/services/rcm-parser';
import { useSmartImportFiles } from './useSmartImportFiles';
import { useSmartImportMateriality } from './useSmartImportMateriality';
import type {
  SmartImportWizardProps,
  TranslateFn,
  WizardStep,
} from './smart-import-types';

interface UseSmartImportParams extends SmartImportWizardProps {
  t: TranslateFn;
}

export function useSmartImport({ isOpen, onOpenChange, onSuccess, t }: UseSmartImportParams) {
  const confirm = useConfirm();
  const { setDirty, resetDirty } = useUnsavedChangesContext();
  const { workingYear } = useFiscalYearStore();

  const [isModified, setIsDirtyLocal] = React.useState(false);
  const [step, setStep] = React.useState<WizardStep>(1);
  const [fiscalYear, setFiscalYear] = React.useState(workingYear);
  const [rcmType, setRcmType] = React.useState<RCMType>('TLC');

  const markMutated = React.useCallback(() => setIsDirtyLocal(true), []);

  const files = useSmartImportFiles({ rcmType, t, onMutated: markMutated });
  const materiality = useSmartImportMateriality(files.parsedTbData);

  React.useEffect(() => {
    setFiscalYear(workingYear);
  }, [workingYear]);

  React.useEffect(() => {
    if (isOpen) {
      setDirty(isModified);
    }
    return () => {
      if (!isOpen) resetDirty();
    };
  }, [isModified, setDirty, resetDirty, isOpen]);

  const goToStep = React.useCallback((next: WizardStep) => setStep(next), []);

  const resetWizard = React.useCallback(() => {
    setStep(1);
    files.resetFiles();
  }, [files]);

  const handleDialogOpenChange = React.useCallback(
    async (open: boolean) => {
      if (!open && isModified) {
        const ok = await confirm({
          title: t('common:unsavedChanges.title'),
          description: t('common:unsavedChanges.description'),
          confirmText: t('common:unsavedChanges.discard'),
          cancelText: t('common:unsavedChanges.stay'),
          variant: 'destructive',
        });
        if (ok) {
          onOpenChange(false);
          setIsDirtyLocal(false);
          resetWizard();
        }
      } else {
        onOpenChange(open);
        if (!open) {
          resetWizard();
        }
      }
    },
    [isModified, confirm, t, onOpenChange, resetWizard],
  );

  const handleFinalize = React.useCallback(async () => {
    const invalidCount = files.stagingData.filter((r) => !r.isValid).length;
    if (invalidCount > 0) {
      toast.error(t('rcm:migration.normalization.fix_errors_first', { count: invalidCount }));
      return;
    }

    const finalizePromise = (async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await api('/api/migration/finalize', {
        method: 'POST',
        body: JSON.stringify({
          year: fiscalYear,
          rcmData: files.stagingData,
          tbData: files.parsedTbData,
          tbFileName: files.tbFile?.name,
          simulationParams:
            files.parsedTbData.length > 0
              ? {
                  basis: materiality.selectedBasis,
                  omPercentage: materiality.omPercentage,
                  haircutPercentage: materiality.haircutPercentage,
                  locationCount: materiality.locationCount,
                  omValue: materiality.omValue,
                  pmValue: materiality.pmValue,
                }
              : null,
        }),
      });

      await api('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          message: t('rcm:migration.baselining.notification'),
          type: 'success',
          link: '/rcm',
        }),
      });
    })();

    toast.promise(finalizePromise, {
      loading: t('rcm:migration.baselining.processing'),
      success: t('rcm:migration.baselining.success'),
      error: t('common:notifications.error'),
    });

    try {
      await finalizePromise;
      resetDirty();
      setIsDirtyLocal(false);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Finalize failed:', err);
    }
  }, [files, fiscalYear, materiality, t, resetDirty, onOpenChange, onSuccess]);

  return {
    step,
    fiscalYear,
    rcmType,
    isModified,
    files,
    materiality,
    setRcmType,
    goToStep,
    handleDialogOpenChange,
    handleFinalize,
  };
}
