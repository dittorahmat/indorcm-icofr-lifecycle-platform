import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import * as schema from '../../worker/db/schema';
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// --- ICOFR Domain Models ---

/** Tabel 8 of SK-5/DKU.MBU/11/2024 — exactly the seven assertions of the regulation. */
export type ControlAssertion = "Completeness" | "Accuracy" | "Existence/Occurrence" | "Cut-Off" | "Rights and Obligation" | "Valuation and Allocation" | "Presentation and Disclosure";
export type ControlType = "Preventive" | "Detective";
export type ControlNature = "Manual" | "Automated" | "ITDM - IPE" | "ITDM - EUC" | "MRC";
export type AutomatedSubNature = "Automated Control" | "Automated Calculation" | "Restricted Access" | "Interface";
export type ControlFrequency = "Annual" | "Semi-Annual" | "Quarterly" | "Monthly" | "Weekly" | "Daily" | "Ad-hoc";
/** Tabel 13 of SK-5/DKU.MBU/11/2024 — exactly the four Information Processing Objectives. */
export type InformationProcessingObjective = "Completeness" | "Accuracy" | "Validity" | "Restricted Access";
export type DeficiencySeverity = "Control Deficiency" | "Significant Deficiency" | "Material Weakness";
export type ActionPlanStatus = "Draft" | "In Review" | "In Progress" | "Resolved" | "Verified";
export type UserRole = "Line 1" | "Line 2" | "Line 3" | "Admin" | "External Auditor" | "Commissioner" | "CFO";
export type UserLevel = "Staff" | "Manager" | "Head" | "Director";

