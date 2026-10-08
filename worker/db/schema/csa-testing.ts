import { text, integer, timestamp, boolean, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { pgTable } from "./types";
import { organization, user } from "./auth";
import { controls, bpmProcesses } from "./rcm-bpm";

export const csaSchedules = pgTable("csa_schedules", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	bpmProcessId: text("bpm_process_id").references(() => bpmProcesses.id, { onDelete: 'cascade' }),
	description: text("description"), // Detail Activity (free-text)
	plannedDate: timestamp("planned_date").notNull(),
	type: text("type").notNull(), // CSA, TOD, TOE, SCOPING, etc.
	status: text("status").notNull().default("Not Started"), // Not Started, In Progress, Completed
	assignedTo: text("assigned_to").references(() => user.id),
	recurringFrequency: text("recurring_frequency"), // Monthly, Quarterly, etc.
	reminderConfig: jsonb("reminder_config"), // { value: number, unit: 'minute' | 'hour' | 'day' | 'month' }
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const csaRecords = pgTable("csa_records", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	controlId: text("control_id").references(() => controls.id), // Optional for aggregate CSA
	bpmProcessId: text("bpm_process_id").references(() => bpmProcesses.id), // New: Link to sub-process
	period: text("period").notNull(),
	scheduleId: text("schedule_id").references(() => csaSchedules.id), // Link to planning schedule
	assessmentDate: timestamp("assessment_date").notNull(),
	assessedBy: text("assessed_by").references(() => user.id),
	result: text("result").notNull(), // Effective, Ineffective, No Transaction
	comments: text("comments"),
	isDraft: boolean("is_draft").default(true),
	isBpmConfirmed: boolean("is_bpm_confirmed").default(false),

	// Appendix 7a Fields
	testProcedure: text("test_procedure"),
	archiveLocation: text("archive_location"),

	// Section II: Prosedur (Lampiran 7)
	samplingMethodology: text("sampling_methodology"),
	documentList: text("document_list"),

	// Summary Regulatory Fields (SK-5/2024) - Aggregated from samples
	attrA: boolean("attr_a").default(false),
	attrB: boolean("attr_b").default(false),
	attrC: boolean("attr_c").default(false),
	attrD: boolean("attr_d").default(false),

	// Forensic Metadata (Retained)
	gpsVerified: boolean("gps_verified").default(false),
	latitude: doublePrecision("latitude"),
	longitude: doublePrecision("longitude"),
	timestampVerified: boolean("timestamp_verified").default(false),
	capturedAt: timestamp("captured_at"),
	hash: text("hash"),
	biometricVerified: boolean("biometric_verified").default(false),

	// ITAC Specific (Lampiran 7 Hal 91-92)
	itacScenario: text("itac_scenario"),
	itacMethod: text("itac_method"),
	itacSampleInfo: text("itac_sample_info"),

	// Line 2 Validation
	line2Status: text("line2_status"), // Pending, Validated, Rejected
	line2Comments: text("line2_comments"),
	line2ValidatedBy: text("line2_validated_by").references(() => user.id),
	line2ValidatedDate: timestamp("line2_validated_date"),
	workflowStatus: text("workflow_status").default("Draft"),
	workflowHistory: jsonb("workflow_history").$type<any[]>().default([]),
});

export const csaSamples = pgTable("csa_samples", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").references(() => organization.id).notNull(),
	csaRecordId: text("csa_record_id").references(() => csaRecords.id, { onDelete: 'cascade' }),
	glRowId: text("gl_row_id"), // Link to original transaction/GL row (Flexi-link, no strict FK to allow both GL and TransDetails)
	sampleRef: text("sample_ref"),
	
	// Refactored Multi-Control Results
	// Format: { [controlId: string]: { implemented: boolean, evidenceUrl?: string, evidenceMeta?: { lat, lng, accuracyM, capturedAt, gpsStatus } } }
	controlResults: jsonb("control_results"), 

	itacExpectedResult: text("itac_expected_result"),
	itacActualResult: text("itac_actual_result"),
	itacMatch: boolean("itac_match").default(false),
	
	// Legacy fields (Retained for migration compatibility)
	attrA: boolean("attr_a").default(false),
	attrB: boolean("attr_b").default(false),
	attrC: boolean("attr_c").default(false),
	attrD: boolean("attr_d").default(false),
});

export const testRecords = pgTable("test_records", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	controlId: text("control_id").notNull().references(() => controls.id),
	testType: text("test_type").notNull(), // TOD, TOE
	method: text("method"),
	period: text("period").notNull(),
	testDate: timestamp("test_date").notNull(),
	testedBy: text("tested_by").references(() => user.id),
	result: text("result").notNull(), // Effective, Ineffective (SK-5); Pass, Fail (Legacy)
	comments: text("comments"),
	sampleSize: integer("sample_size"),
	homogeneityJustification: text("homogeneity_justification"),
	evaluationAttributes: jsonb("evaluation_attributes"),
	
	// Lampiran 8: 6-Pilar TOD (Test of Design)
	todPilarObjective: boolean("tod_pilar_objective"),
	todPilarTiming: boolean("tod_pilar_timing"),
	todPilarAuthority: boolean("tod_pilar_authority"),
	todPilarReliability: boolean("tod_pilar_reliability"),
	todPilarCoverage: boolean("tod_pilar_coverage"),
	todPilarEvidence: boolean("tod_pilar_evidence"),
	todPilarComments: jsonb("tod_pilar_comments").$type<Record<string, string>>(),
});

export const testSamples = pgTable("test_samples", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	testRecordId: text("test_record_id").notNull().references(() => testRecords.id, { onDelete: 'cascade' }),
	sampleRef: text("sample_ref"),
	
	// Lampiran 7 Attributes
	attrA: boolean("attr_a").default(false),
	attrB: boolean("attr_b").default(false),
	attrC: boolean("attr_c").default(false),
	attrD: boolean("attr_d").default(false),
	
	status: text("status").notNull().default("Pass"), // Pass, Fail
	comments: text("comments"),
});

export const todEvaluations = pgTable("tod_evaluations", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	csaId: text("csa_id").references(() => csaRecords.id, { onDelete: 'cascade' }),
	controlId: text("control_id").notNull().references(() => controls.id),
	evaluatorId: text("evaluator_id").references(() => user.id),
	
	// Lampiran 8 Criteria (Pilar TOD) - Free text justification
	pilarObjective: text("pilar_objective"),
	pilarTiming: text("pilar_timing"),
	pilarAuthority: text("pilar_authority"),
	pilarReliability: text("pilar_reliability"),
	pilarCoverage: text("pilar_coverage"),
	pilarEvidence: text("pilar_evidence"),
	
	kkReference: text("kk_reference"),
	conclusion: text("conclusion"), // Effective, Ineffective
	comment: text("comment"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at"),
});

export const deficiencies = pgTable("deficiencies", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	controlId: text("control_id").references(() => controls.id),
	bpmProcessId: text("bpm_process_id").references(() => bpmProcesses.id),
	period: text("period"),
	description: text("description").notNull(),
	severity: text("severity").notNull(), // Control Deficiency, Significant, Material Weakness
	identifiedDate: timestamp("identified_date"),
	identifiedBy: text("identified_by"),
	status: text("status").notNull(), // Open, Closed
	rootCause: text("root_cause"),
	magnitude: doublePrecision("magnitude"),
	exposureValue: doublePrecision("exposure_value"), // Nilai Eksposur Defisiensi
	likelihood: text("likelihood"),
	assertions: jsonb("assertions").$type<string[]>(), // Assertions mapping (Lampiran 10)
	flowchartPath: jsonb("flowchart_path").$type<Record<number, boolean>>(), // Path taken in Gambar 5
	correctiveActionTaken: text("corrective_action_taken"),
	remediationEvidence: text("remediation_evidence"),
	compensatingControlIds: jsonb("compensating_control_ids").$type<string[]>().default([]),
	source: text("source").default("Lini 1 - CSA"), // Lini 1 - CSA, Lini 2 - TOD Review, Lini 3 - Audit, etc
});

export const actionPlans = pgTable("action_plans", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	deficiencyId: text("deficiency_id").references(() => deficiencies.id),
	description: text("description").notNull(),
	ownerId: text("owner_id"),
	dueDate: timestamp("due_date"),
	status: text("status").notNull(),
	relatedFunction: text("related_function"),
	picName: text("pic_name"),
	planDescription: text("plan_description"),
	activityDetail: text("activity_detail"),
	remediatedControlDescription: text("remediated_control_description"),
	targetDate: timestamp("target_date"),
	actualCompletionDate: timestamp("actual_completion_date"),
	isApprovedByLine2: boolean("is_approved_by_line2").default(false),
	isBeforeYearEnd: boolean("is_before_year_end").default(false),
	workflowStatus: text("workflow_status").default("Ineffective"), // DeficiencyWorkflowStatus
	workflowHistory: jsonb("workflow_history").$type<any[]>().default([]),
	severity: text("severity"), // CD, SD, MW
	rescheduleReason: text("reschedule_reason"),
});

export const aggregateDeficiencies = pgTable("aggregate_deficiencies", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	name: text("name").notNull(),
	year: integer("year").notNull(),
	deficiencyIds: jsonb("deficiency_ids").$type<string[]>(),
	affectedAccounts: jsonb("affected_accounts").$type<string[]>(),
	affectedAssertions: jsonb("affected_assertions").$type<any[]>(),
	combinedMagnitude: doublePrecision("combined_magnitude"),
	aggregateLikelihood: text("aggregate_likelihood"),
	finalSeverity: text("final_severity").notNull(),
	conclusionRationale: text("conclusion_rationale"),
	createdAt: timestamp("created_at").notNull(),
	createdBy: text("created_by").references(() => user.id),
});
