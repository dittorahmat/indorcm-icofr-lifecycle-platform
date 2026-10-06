import type { Control, Deficiency } from '@shared/types';

export interface DoDLampiran10ReportProps {
  deficiencies?: Deficiency[];
  controls?: Control[];
  fiscalYear?: number;
}

export interface DoDAssertions {
  c: boolean;
  a: boolean;
  eo: boolean;
  co: boolean;
  ro: boolean;
  va: boolean;
  pd: boolean;
}

export interface DoDBoxes {
  box1: boolean;
  box2: boolean;
  box3: boolean;
  box4: boolean;
  box5: boolean;
  box6: boolean;
  box7: boolean;
}

export interface FormattedDoDRow {
  ref: string;
  description: string;
  isRemediated: boolean;
  ineffectivePeriod: string;
  exposureValue: number;
  severity: string;
  impactedAccount: string;
  cosoComponent: string;
  businessProcess: string;
  businessUnit: string;
  assertions: DoDAssertions;
  boxes: DoDBoxes;
}

export type AssertionKey = keyof DoDAssertions;

export type BoxKey = keyof DoDBoxes;

export interface DoDCounters {
  total: number;
  mw: number;
  sd: number;
  cd: number;
  remediated: number;
}

export type TranslateFn = (key: string, options?: Record<string, unknown>) => string;
