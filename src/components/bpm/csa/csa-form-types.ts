import type { UseFormReturn } from 'react-hook-form';
import type { CSAFormValues } from '@/hooks/use-csa';

export interface ControlResultEntry {
  implemented?: boolean;
  riskId?: string;
  riskName?: string;
  controlName?: string;
  evidenceUrl?: string;
  comment?: string;
}

export interface SampleEntry {
  glRowId?: string;
  sampleRef?: string;
  controlResults: Record<string, ControlResultEntry>;
}

export interface ControlOption {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

export interface RiskControlPair {
  controlId: string;
  riskId?: string;
  riskName?: string;
  controlName?: string;
}

export interface SampleFieldEntry {
  id: string;
  glRowId?: string;
}

export interface CSAFormProps {
  form: UseFormReturn<CSAFormValues>;
  onSubmit: (values: CSAFormValues) => void;
  onSaveDraft: () => void;
  onBackToList: () => void;
  onPrint: (layout: 'detailed' | 'summary') => void;
  onFileUpload: (sIdx: number, cId: string) => void;
  onCameraUpload?: (sIdx: number, cId: string) => void;
  failedUploadRow?: { sIdx: number; cId: string } | null;
  onRetryUpload?: () => void;
  isReadOnly: boolean;
  isAuthenticating: boolean;
  isPending: boolean;
  activeControls: ControlOption[];
  bpmRiskControlPairs: RiskControlPair[];
  watchSamples: SampleEntry[];
  fields: SampleFieldEntry[];
  append: (data: { sampleRef: string; controlResults: Record<string, ControlResultEntry> }) => void;
  anyPointFailed: boolean;
  activeUploadRow: { sIdx: number; cId: string } | null;
  getFileNameFromUrl: (url: string) => string;
  bpmCode?: string;
  noGL?: string;
  bpmProcessId?: string;
  year?: string | number;
  hideLine2Actions?: boolean;
}

export const RESULT_LABEL_KEYS: Record<string, string> = {
  Effective: 'csa_hub:form.effective',
  Ineffective: 'csa_hub:form.ineffective',
  'No Transaction': 'csa_hub:form.noTransaction',
};

export const RESULT_OPTIONS = ['Effective', 'Ineffective', 'No Transaction'];
