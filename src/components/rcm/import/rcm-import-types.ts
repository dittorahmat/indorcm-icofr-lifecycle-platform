export type RCMFlavor = 'TLC' | 'ELC' | 'ITGC';

export interface RCMImportParsedRow {
  id: string;
  processName: string;
  subProcessName: string;
  bpmNodeRef?: string;
  riskDescription: string;
  isFraudRelated?: boolean;
  riskRating?: string;
  controlCode?: string;
  controlName: string;
  controlDescription?: string;
  supportingDocs?: string;
  isKeyControl?: boolean;
  ipoC?: string;
  ipoA?: string;
  ipoV?: string;
  ipoRa?: string;
  assertionC?: string;
  assertionA?: string;
  assertionE?: string;
  assertionCo?: string;
  assertionVa?: string;
  assertionRo?: string;
  assertionPd?: string;
  controlType?: string;
  controlNature?: string;
  frequency?: string;
  supportingApp?: string;
  executorRole?: string;
  affectedFsliItem?: string;
  effectivePeriod?: string;
  cosoPrinciples?: number[];
  itgcDomain?: string;
  targetBpmNodeId?: string;
  matchStatus?: 'matched' | 'suggested' | 'unmatched';
  isValid?: boolean;
  validationErrors?: string[];
}

export interface BPMNodeOption {
  id: string;
  label: string;
  type: string;
}

export interface RCMImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagramId?: string;
  bpmProcessId?: string;
  subProcessName?: string;
  workingYear: string;
  bpmNodes?: BPMNodeOption[];
  /** Preset flavor selected when the dialog opens. Defaults to TLC for existing callers. */
  initialFlavor?: RCMFlavor;
  onSuccess?: () => void;
  onAddBpmNode?: (nodeLabel: string, controlName: string) => string;
}
