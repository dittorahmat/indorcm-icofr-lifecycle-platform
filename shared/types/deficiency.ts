import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import * as schema from '../../worker/db/schema';
import type { DeficiencySeverity, ActionPlanStatus, ControlAssertion } from './common';
import type { DeficiencyWorkflowStatus, WorkflowHistoryEntry } from './scoping';
export interface DoDBoxEvaluation {
  answer: boolean;
  justification: string;
  evidenceRef?: string;
  supportingData?: Record<string, any>;
}

export interface DoDWorksheetData {
  deficiencyId: string;
  evaluatedAt: number;
  evaluatorId?: string;
  evaluatorName?: string;
  exposureValue: number;
  ineffectivePeriod: string;
  isRemediated: boolean;
  assertions: string[];
  cosoComponent: string;
  boxes: {
    box1?: DoDBoxEvaluation;
    box2?: DoDBoxEvaluation;
    box3?: DoDBoxEvaluation;
    box4?: DoDBoxEvaluation;
    box5?: DoDBoxEvaluation;
    box6?: DoDBoxEvaluation;
    box7?: DoDBoxEvaluation;
  };
  finalSeverity: DeficiencySeverity;
  governanceRouting: string[]; // e.g. ['CEO', 'Direksi', 'Komite Audit', 'Dewan Komisaris']
}

export interface DoDEvidenceContext {
  testRecord?: {
    id: string;
    testType: "TOD" | "TOE";
    workpaperRef?: string;
    sampleCount: number;
    failedSampleCount: number;
    exceptionRate: number;
    method?: string;
  };
  materiality?: {
    omThreshold: number;
    pmThreshold: number;
    accountBalance?: number;
    exposureRatio?: number;
    isAbovePM: boolean;
  };
  compensatingControls?: Array<{
    id: string;
    code: string;
    name: string;
    nature: string;
    status: "Effective" | "Ineffective" | "Not Tested";
    precision: "Sufficient" | "Insufficient";
  }>;
  redFlags?: {
    seniorManagementFraud: boolean;
    materialFraudImpact: boolean;
    restatement: boolean;
    auditorIdentifiedMisstatement: boolean;
    ineffectiveAuditCommittee: boolean;
  };
}

export interface Deficiency extends Omit<InferSelectModel<typeof schema.deficiencies>, 'assertions' | 'flowchartPath' | 'identifiedDate' | 'compensatingControlIds' | 'source'> {
  severity: DeficiencySeverity;
  status: "Open" | "Remediated" | "Verified" | "Closed";
  source: "Lini 1 - CSA" | "Lini 2 - CSA Review" | "Lini 2 - CSA Validation" | "Lini 2 - TOD Review" | "Lini 2 - TOE Review" | "Lini 3 - Audit";
  relatedAssertions: ControlAssertion[];
  compensatingControlIds: string[];
  assertions?: string[];
  flowchartPath?: Record<number, boolean>;
  dodWorksheet?: DoDWorksheetData;
  preAssessment?: {
    seniorManagementFraud: boolean;
    materialFraudImpact: boolean;
    restatement: boolean;
    auditorIdentifiedMisstatement: boolean;
    ineffectiveAuditCommittee: boolean;
  };
  identifiedDate: number | null;
  controlCode?: string;
  controlName?: string;
  riskCode?: string;
  riskDescription?: string;
}

export interface ActionPlan extends Omit<InferSelectModel<typeof schema.actionPlans>, 'dueDate' | 'targetDate' | 'actualCompletionDate' | 'workflowHistory'> {
  status: ActionPlanStatus;
  workflowStatus: DeficiencyWorkflowStatus;
  workflowHistory: WorkflowHistoryEntry[];
  dueDate: number | null;
  targetDate: number | null;
  actualCompletionDate: number | null;
}

export type ChangeLog = Omit<InferSelectModel<typeof schema.auditLogs>, 'timestamp' | 'effectiveDate'> & {
  timestamp: number | null;
  effectiveDate: number | null;
};

export type Vendor = InferSelectModel<typeof schema.vendors>;

export interface SOCEvaluation extends Omit<InferSelectModel<typeof schema.socEvaluations>, 'evaluatedAt'> {
  evaluatedAt: number;
}

export interface SOCReport extends Omit<InferSelectModel<typeof schema.socReports>, 'periodStart' | 'periodEnd' | 'createdAt'> {
  evaluation?: SOCEvaluation;
  periodStart: number;
  periodEnd: number;
  createdAt: number;
}

export type WBSReport = {
  id: string;
  reportDate: number;
  category: "Financial Reporting" | "Asset Misappropriation" | "Corruption" | "Other";
  description: string;
  impactMagnitude: number;
  status: "Investigating" | "Confirmed" | "Closed";
  isFinancialImpact: boolean;
  relatedControlIds?: string[];
};

export type EntityMateriality = {
  entityId: string;
  entityName: string;
  totalAssets: number;
  allocatedOM: number;
  allocatedPM: number;
};

export type InvesteeMateriality = {
  id: string;
  name: string;
  ownershipPercentage: number;
  investmentValue: number;
  auditStatus: "Audit Report Received" | "Pending Review" | "Not Audited";
  controlsTested: string;
  allocatedOM: number;
  allocatedPM: number;
};

export interface AccountAssertion extends Omit<InferSelectModel<typeof schema.accountAssertions>, 'updatedAt'> {
  updatedAt: number | null;
}

export interface Materiality extends InferSelectModel<typeof schema.materiality> {
  entityAllocations?: EntityMateriality[];
  investeeAllocations?: InvesteeMateriality[];
}

