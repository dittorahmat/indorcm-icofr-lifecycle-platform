import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import * as schema from '../worker/db/schema';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// --- ICOFR Domain Models ---

export type ControlAssertion = "Completeness" | "Accuracy" | "Validity" | "Cut-off" | "Presentation" | "Existence" | "Valuation" | "Occurrence" | "Classification";
export type ControlType = "Preventive" | "Detective";
export type ControlNature = "Manual" | "Automated" | "ITDM - IPE" | "ITDM - EUC" | "MRC";
export type AutomatedSubNature = "Automated Control" | "Automated Calculation" | "Restricted Access" | "Interface";
export type ControlFrequency = "Annual" | "Semi-Annual" | "Quarterly" | "Monthly" | "Weekly" | "Daily" | "Ad-hoc";
export type InformationProcessingObjective = "Completeness" | "Accuracy" | "Validity" | "Restricted Access" | "Availability";
export type DeficiencySeverity = "Control Deficiency" | "Significant Deficiency" | "Material Weakness";
export type ActionPlanStatus = "Draft" | "In Review" | "In Progress" | "Resolved" | "Verified";
export type UserRole = "Line 1" | "Line 2" | "Line 3" | "Admin" | "External Auditor" | "Commissioner" | "CFO";
export type UserLevel = "Staff" | "Manager" | "Head" | "Director";

export type Department = InferSelectModel<typeof schema.departments>;
export type NewDepartment = InferInsertModel<typeof schema.departments>;

export type Organization = InferSelectModel<typeof schema.organization>;
export type NewOrganization = InferInsertModel<typeof schema.organization>;

export type BusinessEntity = InferSelectModel<typeof schema.businessEntities>;
export type NewBusinessEntity = InferInsertModel<typeof schema.businessEntities>;

export type QualitativeLevel = "Low" | "Medium" | "High";

export interface QualitativeEntry {
  ruleId: number; // 1-8
  level: QualitativeLevel;
}

export type GLRow = InferSelectModel<typeof schema.glRows> & {
  fsliBalance?: number | null;
  scopeClassification?: 'above-pm' | 'two-thirds' | 'qualitative' | 'out-of-scope';
};
export type NewGLRow = InferInsertModel<typeof schema.glRows>;

export interface TransactionDetail extends Omit<InferSelectModel<typeof schema.transactionDetails>, 'transDate'> {
  transDate: number | null;
}
export type NewTransactionDetail = InferInsertModel<typeof schema.transactionDetails>;

export interface TransactionUpload extends Omit<InferSelectModel<typeof schema.transactionUploads>, 'createdAt'> {
  createdAt: number | null;
}
export type NewTransactionUpload = InferInsertModel<typeof schema.transactionUploads>;

export type BenchmarkBasis = "Revenue" | "PBT" | "Assets" | "Equity" | "Net Current Assets";

export interface GLSnapshot extends Omit<InferSelectModel<typeof schema.glSnapshots>, 'benchmarkFsliNames' | 'uploadDate'> {
  benchmarkFsliNames: string[];
  rows: GLRow[];
  uploadDate: number;
}

export type SimulationStatus = "Draft" | "Pending CFO" | "Pending Komut" | "Approved" | "Rejected";
export type WorkflowAction = "Submit" | "Review" | "Approve" | "Reject" | "Rollback" | "Update";

export type BPMWorkflowStatus = "Draft" | "In Review" | "In Approval" | "Resolved" | "Rejected";
export type DeficiencyWorkflowStatus = "Ineffective" | "In Review" | "In Approval" | "Resolved";

export interface WorkflowHistoryEntry {
  id: string;
  action: WorkflowAction;
  fromStatus: string;
  toStatus: string;
  userId: string;
  role: string;
  timestamp: number;
  note: string;
}

export interface ApprovalHistoryEntry {
  id: string;
  action: "Submit" | "Approve" | "Reject" | "Update";
  role: UserRole;
  userId: string;
  timestamp: number;
  note: string;
}

export interface MaterialitySimulation extends Omit<InferSelectModel<typeof schema.simulations>, 'workflowHistory' | 'significantAccounts' | 'assessmentData' | 'createdAt' | 'updatedAt'> {
  workflowStatus: SimulationStatus;
  workflowHistory: WorkflowHistoryEntry[];
  significantAccounts?: SignificantAccount[];
  assessmentData: Record<string, Record<number, QualitativeLevel>>;
  glSnapshotId: string | null;
  createdAt: number;
  updatedAt: number | null;
}

export type BUMNCluster = 
  | "Umum" 
  | "Industri Energi" 
  | "Industri Pangan dan Pupuk" 
  | "Jasa Keuangan" 
  | "Industri Mineral dan Batubara" 
  | "Jasa Telekomunikasi dan Media" 
  | "Jasa Infrastruktur" 
  | "Jasa Asuransi dan Dana Pensiun" 
  | "Jasa Pariwisata dan Pendukung" 
  | "Industri Perkebunan dan Kehutanan" 
  | "Jasa Logistik";

export type Application = InferSelectModel<typeof schema.applications> & {
  linkedControlCount?: number;
  version?: string;
};
export type NewApplication = InferInsertModel<typeof schema.applications>;

export interface RiskLibrary {
  id: string;
  cluster: BUMNCluster;
  description: string;
  suggestedAssertions: ControlAssertion[];
}

// New types from SK-5/DKU.MBU/11/2024
export type COSOPrinciple = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;
export type ITGCArea = "Access to Program and Data" | "Program Development" | "Program Changes" | "Computer Operations";
export type TestMethod = "Inquiry" | "Observation" | "Inspection" | "Reperformance";
export type EUCComplexity = "Low" | "Medium" | "High";
export type IPEType = "Standard/Custom" | "Query";

export type QualitativeScopingReason = 
  | "Besarnya eksposur risiko kecurangan"
  | "Volume transaksi, kompleksitas, dan homogenitas"
  | "Adanya perubahan signifikan dalam karakteristik akun"
  | "Akun yang memerlukan judgement tinggi"
  | "Akun yang dipengaruhi oleh estimasi"
  | "Kepatuhan terhadap loan covenant"
  | "Aset yang dikelola oleh pihak ketiga"
  | "Lainnya";

export interface SignificantAccount {
  name: string;
  balance: number;
  isQuantitative: boolean; // Over PM
  qualitativeReasons?: QualitativeScopingReason[];
  fsliCode?: string;
  assignedDepartmentIds?: string[]; // New: Assigned Lini 1 Departments
  relatedProcessIds?: string[]; // New: IDs of RCM processes covering this account
}

export interface Scoping {
  id: string;
  year: number;
  significantAccounts: SignificantAccount[]; 
  significantLocations: string[];
  significantProcesses: string[];
}

export type AggregateDeficiency = Omit<InferSelectModel<typeof schema.aggregateDeficiencies>, 'createdAt'> & {
  createdAt: number;
};

export type ControlLevel = "ELC" | "TLC" | "ITGC";

export interface Control extends Omit<InferSelectModel<typeof schema.controls>, 'relatedControlIds' | 'ipos' | 'assertions' | 'fsliCodes' | 'attributeQuestions' | 'effectiveDate' | 'lastCsaDate' | 'isMigrated' | 'aiGuessedFields'> {
  assertions: ControlAssertion[];
  ipos: InformationProcessingObjective[];
  cosoPrinciples: COSOPrinciple[];
  relatedControlIds: string[];
  fsliCodes?: string[];
  attributeQuestions?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  mrcMetadata?: {
    expectation: string;
    investigationThreshold: string;
    investigationProcedures: string;
  };
  line2Validation?: {
    status: "Pending" | "Validated" | "Rejected";
    validatedBy?: string;
    validatedDate?: number;
    testOfOneEvidenceUrl?: string;
    comments?: string;
  };
  effectiveDate: number | null;
  lastCsaDate: number | null;
  isMigrated?: boolean | null;
  aiGuessedFields?: string[] | null;
}

export type BPMProcess = Omit<InferSelectModel<typeof schema.bpmProcesses>, 'createdAt' | 'workflowHistory'> & {
  createdAt: number;
  workflowStatus: BPMWorkflowStatus;
  workflowHistory: WorkflowHistoryEntry[];
};

export interface BPMNode {
  id: string;
  type: "start" | "end" | "activity" | "automated-activity" | "decision" | "document" | "system" | "risk" | "control" | "archive" | "swimlane" | "docked-risk" | "docked-control" | "reference" | "manual-input" | "external-process" | "off-page-ref" | "data-media" | "alternate-process" | "data" | "predefined-process" | "internal-storage" | "multi-document" | "preparation" | "manual-operation" | "card" | "punched-tape" | "summing-junction" | "or" | "collate" | "sort" | "extract" | "merge" | "stored-data" | "delay" | "sequential-access" | "direct-access" | "display" | "loop-limit" | "annotation";
  position: { x: number; y: number };
  parentId?: string; // For React Flow grouping/docking
  extent?: 'parent'; // For React Flow docking
  width?: number; // For resizable nodes like swimlanes
  height?: number;
  data: {
    label: string;
    description?: string;
    role?: string;
    code?: string;
    department?: string; // For Swimlane labels
    function?: string;   // For Swimlane labels
    riskIds?: string[]; // Multiple RCM IDs linked to this node
    controlIds?: string[]; // Multiple Control IDs linked to this node
    regulatoryData?: any; // Legacy/Single pair support
    regulatoryPairs?: any[]; // For universal mapping (multiple Risk-Control pairs)
    hasLinkage?: boolean;
    relatedElcNames?: string[];
  };
}

export interface BPMEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export type RCMControlMapping = InferSelectModel<typeof schema.rcmControls>;

export interface RCM extends Omit<InferSelectModel<typeof schema.rcms>, 'auditTrail'> {
  riskRating: QualitativeLevel;
  status: "Draft" | "Pending Validation" | "Active" | "Archived" | "Pending Change Approval";
  controls: string[]; // Array of Control IDs
  bpmData?: {
    nodes: BPMNode[];
    edges: BPMEdge[];
  };
  changeRequest?: {
    requestedBy: string;
    requestedAt: number;
    description: string;
    proposedData: Partial<RCM>;
  };
}

export type CSASchedule = Omit<InferSelectModel<typeof schema.csaSchedules>, 'plannedDate' | 'createdAt'> & {
  plannedDate: number;
  createdAt: number;
};

export type CSASample = CSATestSample;

export interface CSATestSample extends Omit<InferSelectModel<typeof schema.csaSamples>, 'controlResults'> {
  controlResults?: Record<string, { 
    implemented: boolean; 
    evidenceUrl?: string; 
    comment?: string;
    riskId: string;
    riskName: string;
    controlName: string;
  }>;
}

export interface CSARecord extends Omit<InferSelectModel<typeof schema.csaRecords>, 'assessmentDate' | 'capturedAt' | 'line2ValidatedDate'> {
  result: "Effective" | "Ineffective" | "No Transaction";
  samples: CSATestSample[];
  assessmentDate: number;
  capturedAt: number | null;
  line2ValidatedDate: number | null;
}

export type TestSample = InferSelectModel<typeof schema.testSamples>;
export type NewTestSample = InferInsertModel<typeof schema.testSamples>;

export type TODEvaluation = Omit<InferSelectModel<typeof schema.todEvaluations>, 'createdAt' | 'updatedAt'> & {
  createdAt: number;
  updatedAt: number | null;
};
export type NewTODEvaluation = InferInsertModel<typeof schema.todEvaluations>;

export interface TestRecord extends Omit<InferSelectModel<typeof schema.testRecords>, 'evaluationAttributes' | 'testDate' | 'todPilarComments'> {
  testType: "TOD" | "TOE";
  result: "Effective" | "Ineffective";
  evaluationAttributes?: {
    objectiveAchieved: boolean;
    timingAccuracy: boolean;
    authorityCompetence: boolean;
    infoReliability: boolean;
    periodCoverage: boolean;
    evidenceAvailability: boolean;
  };
  testDate: number;
  todPilarComments?: Record<string, string>;
  samples?: TestSample[];
}

export type Notification = Omit<InferSelectModel<typeof schema.notifications>, 'createdAt'> & {
  createdAt: number;
};

export interface Deficiency extends Omit<InferSelectModel<typeof schema.deficiencies>, 'assertions' | 'flowchartPath' | 'identifiedDate' | 'compensatingControlIds' | 'source'> {
  severity: DeficiencySeverity;
  status: "Open" | "Remediated" | "Verified" | "Closed";
  source: "Lini 1 - CSA" | "Lini 2 - CSA Review" | "Lini 2 - TOD Review" | "Lini 3 - Audit";
  relatedAssertions: ControlAssertion[];
  compensatingControlIds: string[];
  assertions?: string[];
  flowchartPath?: Record<number, boolean>;
  preAssessment?: {
    seniorManagementFraud: boolean;
    materialFraudImpact: boolean;
    restatement: boolean;
    auditorIdentifiedMisstatement: boolean;
    ineffectiveAuditCommittee: boolean;
  };
  identifiedDate: number | null;
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

export interface BPMDiagram extends Omit<InferSelectModel<typeof schema.bpmDiagrams>, 'nodes' | 'edges' | 'createdAt' | 'updatedAt'> {
  nodes: BPMNode[];
  edges: BPMEdge[];
  createdAt: number;
  updatedAt: number | null;
}

export type User = Omit<InferSelectModel<typeof schema.user>, 'createdAt' | 'updatedAt'> & {
  createdAt: number;
  updatedAt: number;
};

export type Chat = {
  id: string;
  title: string;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number;
};

// --- Restored & Virtual Types ---

export interface Settings {
  id: string;
  companyName: string;
  logoUrl?: string;
  ceoName: string;
  cfoName: string;
  fiscalYear: number;
  reportHeaderUrl?: string;
  isPeriodLocked: boolean;
  signedOffDate?: number;
  signedOffBy?: string;
  verificationHash?: string;
  emailProvider?: 'system' | 'smtp';
  senderEmail?: string;
  senderName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  mockRole?: UserRole;
}

// --- AI & Analytics Types ---

export interface AIUseCaseStat {
  label: string;
  value: string;
  trend?: 'up' | 'down';
}

export interface AIUseCaseDrilldown {
  id: string;
  metrics: AIUseCaseStat[];
  chart: {
    type: 'bar' | 'line' | 'scatter' | 'radar';
    title: string;
    data: any[];
  };
  findings: any[]; // Table-friendly data
}

export type AIBankingData = Record<string, AIUseCaseDrilldown>;
