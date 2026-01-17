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

export interface Materiality {
  id: string;
  year: number;
  overallMateriality: number; // OM
  performanceMateriality: number; // PM
  benchmark: "Pre-Tax Income" | "Revenue" | "Assets" | "Equity";
  percentage: number;
  haircut: number; // Percentage for PM calculation
}

export interface Scoping {
  id: string;
  year: number;
  significantAccounts: string[]; // List of account names/IDs
  significantLocations: string[];
  significantProcesses: string[];
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
}

export interface RCM {
  id: string;
  process: string;
  subProcess: string;
  riskDescription: string;
  status: "Draft" | "Pending Validation" | "Active" | "Archived"; // Updated for Line 2 workflow
  controls: string[]; // Array of Control IDs
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
}

export interface ActionPlan {
  id: string;
  deficiencyId: string;
  description: string;
  ownerId: string; // User ID
  dueDate: number; // epoch millis
  status: ActionPlanStatus;
}

export interface ChangeLog {
  id: string;
  entityId: string;
  entityType: "RCM" | "Control";
  descriptionBefore: string;
  descriptionAfter: string;
  userId: string;
  timestamp: number;
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
}
// --- Original Demo Types (can be removed later if not needed) ---
export interface User {
  id: string;
  name: string;
  role?: UserRole;
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