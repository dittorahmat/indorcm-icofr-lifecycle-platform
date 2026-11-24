import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { buildRcmImportPayload, convertRcmSpreadsheetToCsvText, importRcmFileText, linkRowToNode } from './rcm-ingestion';
import type { BPMNodeOption, RCMFlavor, RCMImportParsedRow } from './rcm-import-types';
import { formatBpmNodeLabel } from '../editor/utils/step-ref-utils';

interface UseRCMImportWizardParams {
  diagramId?: string;
  bpmProcessId?: string;
  workingYear: string;
  bpmNodes?: BPMNodeOption[];
  /** Preset flavor selected when the dialog opens (e.g. ELC page opens as ELC). Still switchable inside. */
  initialFlavor?: RCMFlavor;
  /** Dialog open flag. Flavor re-syncs to the preset on every false→true transition. */
  isOpen?: boolean;
  onSuccess?: () => void;
  onClose: () => void;
  onAddBpmNode?: (nodeLabel: string, controlName: string) => string;
}

export function useRCMImportWizard({
  diagramId,
  bpmProcessId,
  workingYear,
  bpmNodes = [],
  initialFlavor,
  isOpen,
  onSuccess,
  onClose,
  onAddBpmNode,
}: UseRCMImportWizardParams) {
  const { t } = useTranslation(['rcm', 'common']);
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [flavor, setFlavor] = React.useState<RCMFlavor>(initialFlavor ?? 'TLC');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [parsedRows, setParsedRows] = React.useState<RCMImportParsedRow[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (initialFlavor) setFlavor(initialFlavor);
  }, [initialFlavor]);

  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (isOpen && !wasOpen.current) setFlavor(initialFlavor ?? 'TLC');
    wasOpen.current = isOpen ?? false;
  }, [isOpen, initialFlavor]);

  const handleFileSelect = React.useCallback(
    async (file: File) => {
      setSelectedFile(file);
      try {
        const isXlsx = /\.(xlsx?)$/i.test(file.name);
        const text = isXlsx
          ? await convertRcmSpreadsheetToCsvText(await file.arrayBuffer())
          : await file.text();
        const staged = importRcmFileText(text, flavor, bpmNodes);

        if (!staged.canProceed) {
          toast.error(
            staged.errors[0] ??
              t('rcm:importWizard.emptyFile', { defaultValue: 'Gagal membaca file spreadsheet RCM.' }),
          );
          return;
        }

        setParsedRows(staged.rows);
        setStep(2);
      } catch (err: unknown) {
        toast.error('Gagal membaca file spreadsheet RCM.');
      }
    },
    [flavor, bpmNodes, t]
  );

  const handleUpdateRowNodeLink = React.useCallback(
    (rowId: string, targetNodeId?: string) => {
      setParsedRows((prev) => linkRowToNode(prev, rowId, targetNodeId));
    },
    []
  );

  const handleAutoCreateNode = React.useCallback(
    (rowId: string) => {
      const targetRow = parsedRows.find((r) => r.id === rowId);
      if (!targetRow) return;

      if (onAddBpmNode) {
        const stepLabel = formatBpmNodeLabel(
          targetRow.bpmNodeRef,
          targetRow.bpmNodeName,
          targetRow.controlName
        );
        const newNodeId = onAddBpmNode(stepLabel, targetRow.controlName);
        handleUpdateRowNodeLink(rowId, newNodeId);
        toast.success(`Simpul baru dibuat di canvas: ${stepLabel}`);
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
        summary?: {
          createdProcesses: number;
          createdRisks: number;
          createdControls: number;
          createdNodeLinks: number;
        };
      }>('/api/rcm/import', {
        method: 'POST',
        body: JSON.stringify(
          buildRcmImportPayload({
            flavor,
            workingYear,
            bpmProcessId,
            diagramId,
            rows: parsedRows,
          }),
        ),
      });

      const summary = res?.summary;
      if (summary) {
        toast.success(
          `Impor RCM Berhasil: ${summary.createdControls} kontrol & ${summary.createdNodeLinks} tautan BPM dibuat.`
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
