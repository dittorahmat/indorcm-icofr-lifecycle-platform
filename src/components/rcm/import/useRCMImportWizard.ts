import React from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { parseRCMSpreadsheet } from './rcm-spreadsheet-parser';
import { reconcileRcmWithBpmNodes } from './rcm-reconciliation-matcher';
import type { BPMNodeOption, RCMFlavor, RCMImportParsedRow } from './rcm-import-types';

interface UseRCMImportWizardParams {
  diagramId?: string;
  bpmProcessId?: string;
  workingYear: string;
  bpmNodes?: BPMNodeOption[];
  onSuccess?: () => void;
  onClose: () => void;
  onAddBpmNode?: (nodeLabel: string, controlName: string) => string;
}

export function useRCMImportWizard({
  diagramId,
  bpmProcessId,
  workingYear,
  bpmNodes = [],
  onSuccess,
  onClose,
  onAddBpmNode,
}: UseRCMImportWizardParams) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [flavor, setFlavor] = React.useState<RCMFlavor>('TLC');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [parsedRows, setParsedRows] = React.useState<RCMImportParsedRow[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleFileSelect = React.useCallback(
    async (file: File) => {
      setSelectedFile(file);
      try {
        const text = await file.text();
        const { rows, errors } = parseRCMSpreadsheet(text, flavor);

        if (errors.length > 0 && rows.length === 0) {
          toast.error(errors[0]);
          return;
        }

        const reconciled = reconcileRcmWithBpmNodes(rows, bpmNodes);
        setParsedRows(reconciled);
        setStep(2);
      } catch (err: unknown) {
        toast.error('Gagal membaca file spreadsheet RCM.');
      }
    },
    [flavor, bpmNodes]
  );

  const handleUpdateRowNodeLink = React.useCallback(
    (rowId: string, targetNodeId?: string) => {
      setParsedRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? {
                ...r,
                targetBpmNodeId: targetNodeId,
                matchStatus: targetNodeId ? 'matched' : 'unmatched',
              }
            : r
        )
      );
    },
    []
  );

  const handleAutoCreateNode = React.useCallback(
    (rowId: string) => {
      const targetRow = parsedRows.find((r) => r.id === rowId);
      if (!targetRow) return;

      if (onAddBpmNode) {
        const newNodeId = onAddBpmNode(targetRow.controlName, targetRow.controlName);
        handleUpdateRowNodeLink(rowId, newNodeId);
        toast.success(`Simpul baru dibuat di canvas: ${targetRow.controlName}`);
      } else {
        toast.info('Simpul akan dibuat otomatis saat penyimpanan diagram.');
      }
    },
    [parsedRows, onAddBpmNode, handleUpdateRowNodeLink]
  );

  const handleCommit = React.useCallback(async () => {
    if (parsedRows.length === 0) return;

    try {
      setIsSubmitting(true);
      const res = await api<{
        success: boolean;
        summary: {
          createdProcesses: number;
          createdRisks: number;
          createdControls: number;
          createdNodeLinks: number;
        };
      }>('/api/rcm/import', {
        method: 'POST',
        body: JSON.stringify({
          rcmType: flavor,
          year: workingYear,
          bpmProcessId,
          diagramId,
          rows: parsedRows,
        }),
      });

      if (res.success) {
        toast.success(
          `Impor RCM Berhasil: ${res.summary.createdControls} kontrol & ${res.summary.createdNodeLinks} tautan BPM dibuat.`
        );
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Gagal menyimpan data RCM: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [parsedRows, flavor, workingYear, bpmProcessId, diagramId, onSuccess, onClose]);

  return {
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
  };
}
