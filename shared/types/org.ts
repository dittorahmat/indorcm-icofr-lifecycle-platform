import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import * as schema from '../../worker/db/schema';
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

