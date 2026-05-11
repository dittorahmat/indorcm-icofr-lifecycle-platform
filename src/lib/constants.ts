import { 
  ControlAssertion, 
  InformationProcessingObjective, 
  ControlFrequency, 
  ITGCArea 
} from '@shared/types';

export const ALL_ASSERTIONS: ControlAssertion[] = [
  "Completeness", 
  "Accuracy", 
  "Validity", 
  "Cut-off", 
  "Presentation", 
  "Existence"
];

export const ALL_IPOS: InformationProcessingObjective[] = [
  "Completeness", 
  "Accuracy", 
  "Validity", 
  "Restricted Access"
];

export const ALL_FREQUENCIES: ControlFrequency[] = [
  "Annual", 
  "Semi-Annual", 
  "Quarterly", 
  "Monthly", 
  "Weekly", 
  "Daily", 
  "Ad-hoc"
];

export const ALL_COSO = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export const ITGC_AREAS: ITGCArea[] = [
  "Access to Program and Data", 
  "Program Development", 
  "Program Changes", 
  "Computer Operations"
];

export const CONTROL_NATURES = [
  { value: 'Manual', label: 'Manual' },
  { value: 'Automated', label: 'Otomatis' },
  { value: 'ITDM - IPE', label: 'ITDM - IPE (Report)' },
  { value: 'ITDM - EUC', label: 'ITDM - EUC (Spreadsheet)' },
  { value: 'MRC', label: 'MRC (Management Review)' }
];

export const AUTOMATED_SUB_NATURES = [
  "Automated Control", 
  "Automated Calculation", 
  "Restricted Access", 
  "Interface"
];
