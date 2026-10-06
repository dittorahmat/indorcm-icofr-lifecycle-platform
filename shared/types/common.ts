import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import * as schema from '../../worker/db/schema';
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

