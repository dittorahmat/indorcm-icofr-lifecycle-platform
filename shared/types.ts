export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// --- ICOFR Domain Models ---
export type ControlAssertion = "Completeness" | "Accuracy" | "Validity" | "Cut-off" | "Presentation" | "Existence";
export type ControlType = "Preventive" | "Detective";
export type ControlNature = "Manual" | "IT-Dependent" | "Automated";
export type DeficiencySeverity = "Control Deficiency" | "Significant Deficiency" | "Material Weakness";
export type ActionPlanStatus = "Draft" | "In Progress" | "Resolved" | "Verified";
export type UserRole = "Line 1" | "Line 2" | "Line 3" | "Admin";
export interface Control {
  id: string;
  rcmId: string;
  name: string;
  description: string;
  ownerId: string; // User ID
  type: ControlType;
  nature: ControlNature;
  assertions: ControlAssertion[];
  materiality: "High" | "Medium" | "Low";
}
export interface RCM {
  id: string;
  process: string;
  subProcess: string;
  riskDescription: string;
  controls: string[]; // Array of Control IDs
}
export interface CSARecord {
  id:string;
  controlId: string;
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
  testDate: number; // epoch millis
  testedBy: string; // User ID
  result: "Pass" | "Fail";
  sampleSize?: number;
  evidenceUrl?: string;
  comments: string;
}
export interface Deficiency {
  id: string;
  controlId: string;
  description: string;
  severity: DeficiencySeverity;
  identifiedDate: number; // epoch millis
  identifiedBy: string; // User ID
  status: "Open" | "Remediated";
}
export interface ActionPlan {
  id: string;
  deficiencyId: string;
  description: string;
  ownerId: string; // User ID
  dueDate: number; // epoch millis
  status: ActionPlanStatus;
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