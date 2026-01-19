export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// --- ICOFR Domain Models ---

export type ControlAssertion = "Completeness" | "Accuracy" | "Validity" | "Cut-off" | "Presentation" | "Existence";
export type ControlType = "Preventive" | "Detective";
export type ControlNature = "Manual" | "Automated" | "ITDM - IPE" | "ITDM - EUC" | "MRC";
export type AutomatedSubNature = "Automated Control" | "Automated Calculation" | "Restricted Access" | "Interface";
export type ControlFrequency = "Annual" | "Semi-Annual" | "Quarterly" | "Monthly" | "Weekly" | "Daily" | "Ad-hoc";
export type InformationProcessingObjective = "Completeness" | "Accuracy" | "Validity" | "Restricted Access";
export type DeficiencySeverity = "Control Deficiency" | "Significant Deficiency" | "Material Weakness";
export type ActionPlanStatus = "Draft" | "In Progress" | "Resolved" | "Verified";
export type UserRole = "Line 1" | "Line 2" | "Line 3" | "Admin" | "External Auditor";

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

export interface RiskLibrary {
  id: string;
  cluster: BUMNCluster;
  riskDescription: string;
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
}

export interface Control {
  id: string;
  rcmId: string;
  code: string; // e.g., "CTRL-001"
  name: string;
  description: string;
  ownerId: string; // User ID
  type: ControlType;
  nature: ControlNature;
  frequency: ControlFrequency;
  assertions: ControlAssertion[];
  ipos: InformationProcessingObjective[];
  cosoPrinciples: COSOPrinciple[];
  itgcArea?: ITGCArea;
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

export interface RCM {
  id: string;
  process: string;
  subProcess: string;
  riskDescription: string;
  status: "Draft" | "Pending Validation" | "Active" | "Archived" | "Pending Change Approval"; // Added Pending Change Approval
  controls: string[]; // Array of Control IDs
  bpmData?: {
    nodes: any[];
    edges: any[];
  };
  changeRequest?: {
    requestedBy: string;
    requestedAt: number;
    description: string;
    proposedData: any;
  };
}

export interface CSARecord {
  id:string;
  controlId: string;
  period: string; // e.g., "2024-Q1"
  assessmentDate: number; // epoch millis
  assessedBy: string; // User ID
  result: "Pass" | "Fail" | "N/A";
  evidenceUrl?: string;
  comments: string;
  // ITAC Specific (Lampiran 7 Hal 91-92)
  itacScenario?: string;
  itacMethod?: string;
  itacSampleInfo?: string;
  itacExpectedResult?: string;
  itacActualResult?: string;
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
  result: "Pass" | "Fail";
  sampleSize?: number;
  deviations?: number;
  evidenceUrl?: string;
  comments: string;
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
  status: "Open" | "Remediated";
  relatedAssertions: ControlAssertion[];
  // SK-5 Requirement: Compensating Controls (Bab VII 1.1.e)
  compensatingControlIds?: string[]; 
  rootCause?: string;
  magnitude?: number; // Value exposed to risk
  likelihood?: "Low" | "Medium" | "High";
}

export interface ActionPlan {
  id: string;
  deficiencyId: string;
  description: string;
  ownerId: string; // User ID
  dueDate: number; // epoch millis
  status: ActionPlanStatus;
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
}
// --- Original Demo Types (can be removed later if not needed) ---
export interface User {
  id: string;
  name: string;
  role?: UserRole;
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