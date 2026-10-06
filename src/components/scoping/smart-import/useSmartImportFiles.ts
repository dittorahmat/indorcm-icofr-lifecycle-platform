import * as React from 'react';
import { toast } from 'sonner';
import { parseGLFile } from '@/pages/scoping/services/gl-parser';
import type { SheetCandidate } from '@/pages/scoping/services/gl-parser';
import { parseRCMFile } from '@/pages/scoping/services/rcm-parser';
import type { RCMType } from '@/pages/scoping/services/rcm-parser';
import type {
  ParsedTbRow,
  StagingRow,
  TranslateFn,
} from './smart-import-types';

interface UseSmartImportFilesParams {
  rcmType: RCMType;
  t: TranslateFn;
  onMutated: () => void;
}

export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export function useSmartImportFiles({ rcmType, t, onMutated }: UseSmartImportFilesParams) {
  const [tbFile, setTbFile] = React.useState<File | null>(null);
  const [rcmFile, setRcmFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const [stagingData, setStagingData] = React.useState<StagingRow[]>([]);
  const [parsedTbData, setParsedTbData] = React.useState<ParsedTbRow[]>([]);

  const [sheetModalOpen, setSheetModalOpen] = React.useState(false);
  const [sheetCandidates, setSheetCandidates] = React.useState<SheetCandidate[]>([]);
  const [pendingTargetFile, setPendingTargetFile] = React.useState<File | null>(null);

  const selectTbFile = React.useCallback(
    (file: File) => {
      setTbFile(file);
      onMutated();
    },
    [onMutated],
  );

  const selectRcmFile = React.useCallback(
    (file: File) => {
      setRcmFile(file);
      onMutated();
    },
    [onMutated],
  );

  const updateStagingRow = React.useCallback((id: string, field: string, value: unknown) => {
    setStagingData((prev) =>
      prev.map((r) => (r.id === id ? ({ ...r, [field]: value } as StagingRow) : r)),
    );
  }, []);

  const resetFiles = React.useCallback(() => {
    setTbFile(null);
    setRcmFile(null);
  }, []);

  const processTbWithSheet = React.useCallback(
    async (file: File, targetSheet?: string): Promise<boolean> => {
      const tbResult = await parseGLFile(file, { targetSheet });
      if (tbResult.requiresSheetSelection && tbResult.sheets) {
        setPendingTargetFile(file);
        setSheetCandidates(tbResult.sheets);
        setSheetModalOpen(true);
        setIsProcessing(false);
        return false;
      }

      if (tbResult.success) {
        setParsedTbData(
          tbResult.rows.map((r) => ({
            accountCode: r.noGL ?? '',
            accountName: r.glDesc ?? '',
            balance: r.balance ?? 0,
            fsliBalance: r.fsliBalance,
            entityCode: r.entityCode ?? undefined,
            parentEntityCode: r.parentEntityCode ?? undefined,
            suggestedFsli: r.fsliName ?? undefined,
            confidence: r.mappingConfidence ?? undefined,
            noUrut: r.noUrut ?? undefined,
            currency: r.currency ?? undefined,
            ymd: r.ymd ?? undefined,
            category: r.category ?? undefined,
            subKategori: r.subKategori ?? undefined,
            fsliCode: r.fsliCode ?? undefined,
          })),
        );
        return true;
      }

      toast.error(
        `${t('rcm:migration.toasts.tbParseError', { defaultValue: 'TB Parse Error' })}: ${tbResult.error}`,
      );
      setIsProcessing(false);
      return false;
    },
    [t],
  );

  const handleSheetSelected = React.useCallback(
    async (sheetName: string, onComplete: () => void) => {
      if (!pendingTargetFile) return;
      setIsProcessing(true);
      try {
        const ok = await processTbWithSheet(pendingTargetFile, sheetName);
        if (ok) {
          if (rcmFile && stagingData.length === 0) {
            const rcmResult = await parseRCMFile(rcmFile, rcmType);
            if (rcmResult.success) {
              setStagingData(rcmResult.rows as StagingRow[]);
            } else {
              toast.error(
                `${t('rcm:migration.toasts.rcmParseError', { defaultValue: 'RCM Parse Error' })}: ${rcmResult.error}`,
              );
              setIsProcessing(false);
              return;
            }
          }
          setIsProcessing(false);
          onMutated();
          onComplete();
          toast.success(t('rcm:migration.toasts.extractionComplete', { defaultValue: 'Extraction complete!' }));
        }
      } catch (err: unknown) {
        toast.error(
          `${t('rcm:migration.toasts.processingFailed', { defaultValue: 'Processing failed' })}: ${toErrorMessage(err)}`,
        );
        setIsProcessing(false);
      }
    },
    [pendingTargetFile, processTbWithSheet, rcmFile, stagingData.length, rcmType, onMutated, t],
  );

  const handleProcessAI = React.useCallback(
    async (onComplete: () => void) => {
      if (!tbFile && !rcmFile) {
        toast.error(t('rcm:migration.ingestion.emptyFiles', { defaultValue: 'Please upload at least one file to process.' }));
        return;
      }

      setIsProcessing(true);

      try {
        if (tbFile) {
          const tbSuccess = await processTbWithSheet(tbFile);
          if (!tbSuccess) {
            return;
          }
        }

        if (rcmFile) {
          const rcmResult = await parseRCMFile(rcmFile, rcmType);
          if (rcmResult.success) {
            setStagingData(rcmResult.rows as StagingRow[]);
          } else {
            toast.error(
              `${t('rcm:migration.toasts.rcmParseError', { defaultValue: 'RCM Parse Error' })}: ${rcmResult.error}`,
            );
            setIsProcessing(false);
            return;
          }
        }

        setIsProcessing(false);
        onMutated();
        onComplete();
        toast.success(t('rcm:migration.toasts.extractionComplete', { defaultValue: 'Extraction complete!' }));
      } catch (err: unknown) {
        toast.error(
          `${t('rcm:migration.toasts.processingFailed', { defaultValue: 'Processing failed' })}: ${toErrorMessage(err)}`,
        );
        setIsProcessing(false);
      }
    },
    [tbFile, rcmFile, processTbWithSheet, rcmType, onMutated, t],
  );

  return {
    tbFile,
    rcmFile,
    isProcessing,
    stagingData,
    parsedTbData,
    sheetModalOpen,
    sheetCandidates,
    pendingTargetFile,
    setSheetModalOpen,
    selectTbFile,
    selectRcmFile,
    updateStagingRow,
    resetFiles,
    handleSheetSelected,
    handleProcessAI,
  };
}
