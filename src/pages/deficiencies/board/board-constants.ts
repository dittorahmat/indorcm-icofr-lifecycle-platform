import type { Variants } from 'framer-motion';
import type { DoDWorksheetData } from '@shared/types';

export const KANBAN_COLUMNS: string[] = ['Ineffective', 'In Review', 'In Approval', 'Resolved'];

/**
 * Granular origin filters across the Three Lines Model (SK-5/DKU.MBU/11/2024).
 * `fallback` mirrors the `en` locale, which is the app's `fallbackLng`.
 */
export const SOURCE_FILTERS = [
  { id: 'all', labelKey: 'sources.all', fallback: 'All' },
  { id: 'csa', labelKey: 'sources.csa', fallback: 'CSA Ineffective' },
  { id: 'tod', labelKey: 'sources.tod', fallback: 'TOD Review (Design)' },
  { id: 'toe', labelKey: 'sources.toe', fallback: 'TOE Review (Operation)' },
  { id: 'audit', labelKey: 'sources.audit', fallback: 'External / SPI Audit' },
] as const;

export const MOBILE_STATUS_KEY: Record<string, string> = {
  Ineffective: 'status.ineffective',
  'In Review': 'status.review',
  'In Approval': 'status.approval',
  Resolved: 'status.resolved',
};

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

export interface DoDCompletionMetadata {
  dodWorksheet: DoDWorksheetData;
  exposureValue: number;
  assertions: string[];
  flowchartPath: Record<number, boolean>;
}

export type TranslateFn = (key: string, options?: Record<string, unknown>) => string;
