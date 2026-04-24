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

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export type QualitativeLevel = "Low" | "Medium" | "High";

export interface QualitativeEntry {
  ruleId: number; // 1-8
  level: QualitativeLevel;
}

export interface GLRow {
  ymd: string;
  entityCode: string;
  noGL: string;
  glDesc: string;
  currency: string;
  balance: number;
  fsliCode: string;
  // New Fields from Template SK-5/2024
  fsliName?: string;      // Dari kolom "FSLI"
  category?: string;      // "Neraca" atau "Laba Rugi"
  subKategori?: string;   // "Aset", "Pendapatan", dll
  fsliBalance?: number;   // Verifikasi agregasi
  noUrut?: number;        // Display order
  assignedDepartmentId?: string; // Department assignment
  ownerAcceptance?: "Accepted" | "Rejected"; // Owner acceptance status (null = Pending)
}

export type BenchmarkBasis = "Revenue" | "PBT" | "Assets" | "Equity" | "Net Current Assets";

export interface GLSnapshot {
  id: string;
  filename: string;
  uploadDate: number;
  rows: GLRow[];
  status: "Draft" | "Mapped";
  isActive: boolean;
  benchmarkFsliNames: string[]; // List of FSLI names marked as potential benchmarks
}

export type SimulationStatus = "Draft" | "Pending CFO" | "Pending Komut" | "Approved" | "Rejected";
export type BPMWorkflowStatus = "Draft" | "Pending Approval" | "Approved" | "Rejected";

export interface ApprovalHistoryEntry {
  id: string;
  action: "Submit" | "Approve" | "Reject" | "Update";
  role: UserRole;
  userId: string;
  timestamp: number;
  note: string;
}

export interface MaterialitySimulation {
  id: string;
  name: string;
  year: number;
  status: SimulationStatus;
  basis: string; // FSLI name selected as basis
  omPercentage: number;
  haircutPercentage: number;
  locationCount: number; // New: Added for multiplier logic
  locationThreshold: number; // New: Default 80%
  locationResults?: {
    entityCode: string;
    balance: number;
    contributionPercentage: number;
    cumulativePercentage: number;
    isSignificant: boolean;
  }[];
  omValue: number;
  pmValue: number;
  glSnapshotId: string;
  significantAccounts?: SignificantAccount[]; // Added for explicit scoping results
  assessmentData: Record<string, Record<number, QualitativeLevel>>; // Key: FSLI Name, Sub-Key: ruleId (1-8)
  approvedBy?: string;
  approvedDate?: number;
  createdBy: string;
  createdAt: number;
  history: ApprovalHistoryEntry[];
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

export interface Application {
  id: string;
  name: string;
  version?: string;
  description: string;
  statusITGC: "Effective" | "Ineffective" | "Not Tested";
  lastITGCTestDate?: number;
  criticality: "High" | "Medium" | "Low";
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
  assignedDepartmentId?: string; // New: Assigned Lini 1 Department
  relatedProcessIds?: string[]; // New: IDs of RCM processes covering this account
}

export interface Scoping {
  id: string;
  year: number;
  significantAccounts: SignificantAccount[]; 
  significantLocations: string[];
  significantProcesses: string[];
}

export interface AggregateDeficiency {
  id: string;
  name: string;
  year: number;
  deficiencyIds: string[];
  affectedAccounts: string[];
  affectedAssertions: ControlAssertion[];
  combinedMagnitude: number;
  aggregateLikelihood: "Low" | "Medium" | "High";
  finalSeverity: DeficiencySeverity; // CD, SD, or MW
  conclusionRationale: string;
  identifiedBy: string; // User ID
  identifiedDate: number;
  remediationPlan?: string;
  remediationStatus?: string;
  targetDate?: number;
  isBeforeYearEnd?: boolean;
  description?: string; // Optional if needed
}

export type ControlLevel = "ELC" | "TLC" | "ITGC";

export interface Control {
  id: string;
  rcmId: string;
  code: string; // e.g., "CTRL-001"
  name: string;
  description: string;
  ownerId: string; // User ID
  level: ControlLevel; // New: SK-5 Requirement
  type: ControlType;
  nature: ControlNature;
  frequency: ControlFrequency;
  assertions: ControlAssertion[];
  ipos: InformationProcessingObjective[];
  cosoPrinciples: COSOPrinciple[];
  relatedControlIds: string[]; // New: For linkage (Many-to-Many)
  attachmentUrl?: string; // New: For policy documents
  itgcArea?: ITGCArea;
  itgcAssertions?: Record<string, 'Y' | 'N'>; // New: Dummy IT assertions mapping
  cobitId?: string; // New: For ITGC controls (Tabel 1)
  isFraudRisk: boolean; // New: (Tabel 18)
  effectiveDate: number; // New: epoch millis (Tabel 18)
  automatedSubNature?: AutomatedSubNature; // New: (Tabel 18)
  riskRating: "High" | "Medium" | "Low";
  riskAssessment?: {
    quantitativeScore: "High" | "Medium" | "Low";
    qualitativeScore: "High" | "Medium" | "Low";
    transactionValue?: number; // Optional: for quant comparison with materiality
  };
  isKeyControl: boolean;
  itApplication?: string; // For Automated/ITDM
  eucComplexity?: EUCComplexity; // New: (Tabel 14)
  ipeType?: IPEType; // New: (Tabel 20)
  fsliCodes?: string[]; // New: Linked FSLI codes from Scoping
  departmentId?: string; // New: Assigned Lini 1 Department
  bpmStatus?: BPMWorkflowStatus; // New: Workflow state (Draft, Pending, Approved)
  
  // BPM Spreadsheet Specific Fields (SK-5 Layout)
  businessProcess?: string;
  subProcess?: string;
  location?: string;
  isFraudRelated?: boolean;
  reference?: string;
  supportingDocs?: string;
  applicationId?: string;
  bpmProcessId?: string; // Link to the BPMProcess header list

  // New Smart CSA Fields
  attributeQuestions?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };

  // MRC Specific Metadata - Tabel 21 (Hal 45 & 55)
  mrcMetadata?: {
    expectation: string; // Kewajaran ekspektasi
    investigationThreshold: string; // Batasan/Kriteria anomali
    investigationProcedures: string; // Prosedur investigasi
  };
  // Line 2 Validation (Test of One) - Bab III 4
  line2Validation?: {
    status: "Pending" | "Validated" | "Rejected";
    validatedBy?: string;
    validatedDate?: number;
    testOfOneEvidenceUrl?: string;
    comments?: string;
  };
}

export interface BPMProcess {
  id: string;
  name: string;
  noGL: string; // Link to specific Account
  fsliName: string;
  createdBy: string;
  createdAt: number;
  riskCount?: number;
  controlCount?: number;
}

export interface BPMNode {
  id: string;
  type: "start" | "end" | "activity" | "decision" | "document" | "system" | "risk" | "control" | "archive";
  position: { x: number; y: number };
  parentId?: string; // For React Flow grouping/docking
  extent?: 'parent'; // For React Flow docking
  data: {
    label: string;
    description?: string;
    role?: string;
    code?: string;
    riskIds?: string[]; // Multiple RCM IDs linked to this activity
    controlIds?: string[]; // Multiple Control IDs linked to this activity (via risks or direct)
  };
}

export interface BPMEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface RCMControlMapping {
  id: string;
  rcmId: string;
  controlName?: string;
  controlDescription?: string; // Column xi
  supportingDocs?: string; // Column xii
  isKeyControl: boolean; // Column xiii

  // Regulatory Metadata (Lampiran 5 b)
  ipoC?: string;
  ipoA?: string;
  ipoV?: string;
  ipoRa?: string;
  assertionE?: string;
  assertionC?: string;
  assertionA?: string;
  assertionCo?: string;
  assertionVa?: string;
  assertionRo?: string;
  assertionPd?: string;
  
  controlType?: string; // Column xxv: Preventif / Detektif
  controlNature?: string; // Column xxvi: Manual, Otomatis, ITDM - EUC, ITDM - IPE, MRC
  automatedType?: string; // Column xxvii: Automated Control, Automated Calculation, Restricted Access, Interface
  frequency?: string; // Column xxviii
  supportingApp?: string; // Column xxix
  executingFunction?: string; // Column xxx
  executorRole?: string; // Column xxxi
  affectedFsliItem?: string; // Column xxxii
  effectivePeriod?: string; // Column xxxiii

  // ELC & ITGC Regulatory Metadata
  cosoPrinciples?: number[]; // Array of numbers 1-17
  itgcDomain?: string; // Access, Changes, Development, Operations
  itgcAssertions?: Record<string, 'Y' | 'N'>; // JSON mapping for IT assertions
}

export interface RCM {
  id: string;
  process: string;
  // ... rest of RCM interface remains the same
  subProcess: string;
  riskDescription: string;
  isFraudRelated: boolean;
  riskRating: QualitativeLevel;
  status: "Draft" | "Pending Validation" | "Active" | "Archived" | "Pending Change Approval"; // Added Pending Change Approval
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

export interface CSATestSample {
  id: string;
  sampleRef: string;
  attributeResults: {
    A: boolean;
    B: boolean;
    C: boolean;
    D: boolean;
  };
  itacResults?: {
    expectedResult: string;
    actualResult: string;
    isMatch: boolean;
  };
}

export interface CSARecord {
  id:string;
  controlId: string;
  period: string; // e.g., "2024-Q1"
  assessmentDate: number; // epoch millis
  assessedBy: string; // User ID
  result: "Effective" | "Ineffective" | "No Transaction";
  evidenceUrl?: string;
  comments: string;
  samples: CSATestSample[]; // Dynamic sampling

  // New Smart CSA Gate
  isBpmConfirmed?: boolean;

  // Section II: Prosedur (Lampiran 7)
  samplingMethodology?: string;
  documentList?: string;

  // Summary Regulatory Fields (SK-5/2024) - Aggregated from samples
  attrA?: boolean;
  attrB?: boolean;
  attrC?: boolean;
  attrD?: boolean;

  // Forensic Metadata (Retained)
  gpsVerified?: boolean;
  latitude?: number;
  longitude?: number;
  timestampVerified?: boolean;
  capturedAt?: number; // Store as epoch
  hash?: string;
  biometricVerified?: boolean;

  // ITAC Specific (Lampiran 7 Hal 91-92)
  itacScenario?: string;
  itacMethod?: string;
  itacSampleInfo?: string;

  // Line 2 Validation
  line2Status?: "Pending" | "Validated" | "Rejected";
  line2Comments?: string;
  line2ValidatedBy?: string;
  line2ValidatedDate?: number;
}

export interface TestRecord {
  id: string;
  controlId: string;
  testType: "TOD" | "TOE";
  method: TestMethod; // New: SK-5 Requirement (Gambar 4)
  period: string; // e.g., "2024-Q1"
  testDate: number; // epoch millis
  testedBy: string; // User ID
  result: "Effective" | "Ineffective";
  sampleSize?: number;
  deviations?: number;
  evidenceUrl?: string;
  comments: string;
  homogeneityJustification?: string;
  // SK-5 Table 21 / Lampiran 8 Attributes
  evaluationAttributes?: {
    objectiveAchieved: boolean; // Pencapaian Objektif
    timingAccuracy: boolean; // Ketepatan Waktu
    authorityCompetence: boolean; // Wewenang & Kompetensi
    infoReliability: boolean; // Keandalan Informasi (IPE/EUC)
    periodCoverage: boolean; // Periode yang Dicakup
    evidenceAvailability: boolean; // Bukti yang Tersedia
  };
}

export interface Deficiency {
  id: string;
  controlId: string;
  description: string;
  severity: DeficiencySeverity;
  identifiedDate: number; // epoch millis
  identifiedBy: string; // User ID
  status: "Open" | "Remediated" | "Verified" | "Closed";
  relatedAssertions: ControlAssertion[];
  // SK-5 Requirement: Compensating Controls (Bab VII 1.1.e)
  compensatingControlIds?: string[]; 
  rootCause?: string;
  magnitude?: number; // Value exposed to risk (deprecated or for manual calc)
  exposureValue?: number; // Nilai Eksposur Defisiensi (Lampiran 10)
  likelihood?: "Low" | "Medium" | "High";
  remediationEvidence?: string;
  correctiveActionTaken?: string;
  // Step 0 Indicators (SK-5 1.1.c)
  preAssessment?: {
    seniorManagementFraud: boolean;
    materialFraudImpact: boolean;
    restatement: boolean;
    auditorIdentifiedMisstatement: boolean;
    ineffectiveAuditCommittee: boolean;
  };
}

export interface ActionPlan {
  id: string;
  deficiencyId: string;
  description: string;
  ownerId: string; // User ID
  dueDate: number; // epoch millis
  status: ActionPlanStatus;
  completionDate?: number;
  // SK-5 Regulatory Fields (Lampiran 6 & 11)
  relatedFunction: string; // Fungsi Terkait
  picName: string; // Penanggung Jawab
  planDescription: string; // Deskripsi Rencana
  activityDetail: string; // Detail Aktivitas
  remediatedControlDescription?: string; // Deskripsi Pengendalian setelah Remediasi
  targetDate: number; // Target Tanggal (epoch millis)
  actualCompletionDate?: number; 
  isApprovedByLine2: boolean;
  isBeforeYearEnd: boolean; // For effectiveness conclusion
}

export interface Settings {
  id: string;
  companyName: string;
  ceoName: string;
  cfoName: string;
  fiscalYear: number;
  reportHeaderUrl?: string;
  isPeriodLocked: boolean;
  signedOffDate?: number;
  signedOffBy?: string;
  verificationHash?: string;
}

// SK-5 Requirement: Lampiran 6 - Log Perubahan
export interface ChangeLog {
  id: string;
  entityId: string;
  entityType: "RCM" | "Control" | "BPM";
  descriptionBefore: string;
  descriptionAfter: string;
  referenceBefore?: string;
  referenceAfter?: string;
  userId: string;
  timestamp: number;
  effectiveDate: number;
  approvedBy?: string;
}

// SK-5 Requirement: Bab III.4.3 - Evaluasi SOC Report
export interface SOCReportEvaluation {
  scopeAlignment: boolean;
  periodAlignment: boolean;
  methodologyAlignment: boolean;
  hasIneffectiveControls: boolean;
  compensatingControlsTested: boolean;
  auditorOpinion: string;
}

export interface SOCReport {
  id: string;
  vendorName: string;
  reportType: "SOC 1 Type 2" | "SOC 2 Type 2" | "Other";
  periodStart: number;
  periodEnd: number;
  issuer: string;
  status: "Valid" | "Expired" | "Pending Review";
  lastValidatedDate: number;
  evaluation?: SOCReportEvaluation;
}

// SK-5 Requirement: Whistleblowing System Integration (Lampiran 1 Prinsip 14 & 15)
export interface WBSReport {
  id: string;
  reportDate: number;
  category: "Financial Reporting" | "Asset Misappropriation" | "Corruption" | "Other";
  description: string;
  impactMagnitude: number;
  status: "Investigating" | "Confirmed" | "Closed";
  isFinancialImpact: boolean;
  relatedControlIds?: string[];
}

// SK-5 Requirement: Group Materiality & Multiplier (Tabel 25)
export interface EntityMateriality {
  entityId: string;
  entityName: string;
  totalAssets: number;
  allocatedOM: number;
  allocatedPM: number;
}

export interface InvesteeMateriality {
  id: string;
  name: string;
  ownershipPercentage: number;
  investmentValue: number;
  auditStatus: "Audit Report Received" | "Pending Review" | "Not Audited";
  controlsTested: string; // Brief description of what was tested
  allocatedOM: number;
  allocatedPM: number;
}

export interface AccountAssertion {
  id: string;
  fsliName: string;
  noGL: string;
  assertionE?: string; // "Y" / "N"
  assertionC?: string;
  assertionA?: string;
  assertionCo?: string;
  assertionRo?: string;
  assertionVa?: string;
  assertionPd?: string;
  updatedAt?: number;
  updatedBy?: string;
}

export interface Materiality {
  id: string;
  year: number;
  overallMateriality: number; // Group OM
  performanceMateriality: number; // Group PM
  benchmark: "Pre-Tax Income" | "Revenue" | "Assets" | "Equity";
  percentage: number;
  haircut: number;
  // Group logic
  isGroupConsolidation: boolean;
  subsidiaryCount?: number;
  multiplier?: number; // From Table 25 (1.5x - 9x)
  entityAllocations?: EntityMateriality[];
  investeeAllocations?: InvesteeMateriality[]; // FAQ No. 5
}
export interface BPMDiagram {
  id: string;
  name: string;
  subProcess: string;
  nodes: BPMNode[];
  edges: BPMEdge[];
  createdAt: number;
  updatedAt: number;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  mockRole?: UserRole;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role?: UserRole;
  departmentId?: string;
  level?: UserLevel;
  language?: string;
  processOwnershipHistory?: { processId: string; role: UserRole; endDate: number }[]; // For cooling-off validation
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
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