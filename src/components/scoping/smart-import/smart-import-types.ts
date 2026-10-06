import type { StagingRow } from '@/components/import/StagingTable';
import type { SheetCandidate } from '@/pages/scoping/services/gl-parser';
import type { RCMType } from '@/pages/scoping/services/rcm-parser';

export type { RCMType, SheetCandidate, StagingRow };

export type WizardStep = 1 | 2 | 3;

export interface SmartImportWizardProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export interface ParsedTbRow {
  accountCode: string;
  accountName: string;
  balance: number;
  fsliBalance?: number | null;
  entityCode?: string;
  parentEntityCode?: string;
  suggestedFsli?: string;
  confidence?: number;
  noUrut?: number;
  currency?: string;
  ymd?: string;
  category?: string;
  subKategori?: string;
  fsliCode?: string;
}

export interface FsliCandidate {
  name: string;
  total: number;
  minNoUrut: number;
}

export type TranslateFn = (key: string, options?: Record<string, unknown>) => string;
