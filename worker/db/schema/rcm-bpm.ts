import { text, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { pgTable } from "./types";
import { organization, user } from "./auth";
import { departments } from "./gl-scoping";
import { applications } from "./applications";

export const bpmDiagrams = pgTable("bpm_diagrams", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	name: text("name").notNull(),
	year: integer("year"),
	subProcess: text("sub_process"),
	nodes: jsonb("nodes").$type<any[]>(),
	edges: jsonb("edges").$type<any[]>(),
	metadata: jsonb("metadata"), // For Header/Footer settings, logo configuration, etc.
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at"),
	createdBy: text("created_by").references(() => user.id),
});

export const bpmProcesses = pgTable("bpm_processes", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	noGL: text("no_gl").notNull(),
	bpmCode: text("bpm_code"), // Free-text human readable ID (e.g. BPM-FIN-01)
	fsliName: text("fsli_name"),
	name: text("name").notNull(),
	year: integer("year"),
	riskCount: integer("risk_count").default(0),
	controlCount: integer("control_count").default(0),
	standardTestProcedure: text("standard_test_procedure"), // Master template for CSA
	parentId: text("parent_id").references((): any => bpmProcesses.id, { onDelete: 'set null' }),
	level: text("level").default("process"), // 'process' | 'sub_process'
	workflowStatus: text("workflow_status"), // BPMWorkflowStatus
	workflowHistory: jsonb("workflow_history").$type<any[]>().default([]),
	createdAt: timestamp("created_at").notNull(),
	createdBy: text("created_by").references(() => user.id),
}, (table) => {
	return {
		orgBpmCodeIdx: index("bpm_processes_org_code_idx").on(table.organizationId, table.bpmCode),
		noGLIdx: index("bpm_processes_no_gl_idx").on(table.noGL),
		yearIdx: index("bpm_processes_year_idx").on(table.year),
		parentIdIdx: index("bpm_processes_parent_id_idx").on(table.parentId),
		nameTrgmIdx: index("bpm_processes_name_trgm_idx").using("gin", table.name.op("gin_trgm_ops")),
	};
});

export const bpmProcessGlCodes = pgTable("bpm_process_gl_codes", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	bpmProcessId: text("bpm_process_id").notNull().references(() => bpmProcesses.id, { onDelete: 'cascade' }),
	noGL: text("no_gl").notNull(),
}, (table) => {
	return {
		bpmProcessIdx: index("bpm_process_gl_codes_process_idx").on(table.bpmProcessId),
		noGLIdx: index("bpm_process_gl_codes_no_gl_idx").on(table.noGL),
	};
});

export const rcms = pgTable("rcms", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	year: integer("year"),
	riskLibraryId: text("risk_library_id"), // Reference to standardized risk library
	process: text("process").notNull(),
	subProcess: text("sub_process").notNull(),
	riskDescription: text("risk_description").notNull(),
	isFraudRelated: boolean("is_fraud_related").default(false),
	riskRating: text("risk_rating"), // Low, Medium, High
	status: text("status").notNull(), // Draft, Active, Pending Change Approval
	diagramId: text("diagram_id").references(() => bpmDiagrams.id),
	auditTrail: jsonb("audit_trail"), // Legacy support
	workflowStatus: text("workflow_status").default("Draft"),
	workflowHistory: jsonb("workflow_history").$type<any[]>().default([]),
}, (table) => {
	return {
		orgIdx: index("rcms_org_idx").on(table.organizationId),
		subProcessTrgmIdx: index("rcms_sub_process_trgm_idx").using("gin", table.subProcess.op("gin_trgm_ops")),
		idTrgmIdx: index("rcms_id_trgm_idx").using("gin", table.id.op("gin_trgm_ops")),
	};
});

export const controls = pgTable("controls", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	year: integer("year"),
	rcmId: text("rcm_id").references(() => rcms.id),
	departmentId: text("department_id").references(() => departments.id),
	code: text("code").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	ownerId: text("owner_id"),
	level: text("level").default("TLC"), // New: ELC, TLC, ITGC
	type: text("type"), 
	nature: text("nature"),
	frequency: text("frequency"),
	riskRating: text("risk_rating"), // High, Medium, Low
	riskAssessment: jsonb("risk_assessment"),
	bpmStatus: text("bpm_status"),

	// New Worksheet Fields
	fsliCodes: jsonb("fsli_codes").$type<string[]>(),
	relatedControlIds: jsonb("related_control_ids").$type<string[]>().default([]), // New: Many-to-Many Linkage
	attachmentUrl: text("attachment_url"), // New: Policy Document URL
	businessProcess: text("business_process"),
	subProcess: text("sub_process"),
	location: text("location"),
	isFraudRelated: boolean("is_fraud_related").default(false),
	isKeyControl: boolean("is_key_control").default(false),
	ipos: jsonb("ipos").$type<any[]>(),
	assertions: jsonb("assertions").$type<any[]>(),
	cosoPrinciples: jsonb("coso_principles").$type<number[]>(),
	supportingDocs: text("supporting_docs"),
	reference: text("reference"),
	applicationId: text("application_id").references(() => applications.id),
	bpmProcessId: text("bpm_process_id").references(() => bpmProcesses.id),
	attributeQuestions: jsonb("attribute_questions"),
	executorRole: text("executor_role"),
	effectiveDate: timestamp("effective_date"),

	// CSA Standalone Metadata
	csaStatus: text("csa_status").default("Not Assessed"), // Not Assessed, Effective, Ineffective
	lastCsaDate: timestamp("last_csa_date"),

	// ITGC Specific Columns
	itgcDomain: text("itgc_domain"),	
	itgcAssertions: jsonb("itgc_assertions"),
	automatedSubNature: text("automated_sub_nature"),
	supportingApp: text("supporting_app"),
	itApplication: text("it_application"), // Match legacy field name
	eucComplexity: text("euc_complexity"),
	ipeType: text("ipe_type"),

	// Migration Metadata
	isMigrated: boolean("is_migrated").default(false),
	aiGuessedFields: jsonb("ai_guessed_fields").$type<string[]>().default([]),
}, (table) => {
	return {
		fsliCodesGinIdx: index("controls_fsli_codes_gin_idx").using("gin", table.fsliCodes),
		orgYearIdx: index("controls_org_year_idx").on(table.organizationId, table.year),
	};
});

export const bpmNodeRcms = pgTable("bpm_node_rcms", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	diagramId: text("diagram_id").notNull().references(() => bpmDiagrams.id, { onDelete: 'cascade' }),
	nodeId: text("node_id").notNull(), // The React Flow node ID
	rcmId: text("rcm_id").notNull().references(() => rcms.id, { onDelete: 'cascade' })
});

export const rcmControls = pgTable("rcm_controls", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	rcmId: text("rcm_id").notNull().references(() => rcms.id, { onDelete: 'cascade' }),
	controlId: text("control_id").notNull().references(() => controls.id, { onDelete: 'cascade' }),
	year: integer("year"),
	controlName: text("control_name"), // Column x: display name
	controlDescription: text("control_description"), // Column xi
	supportingDocs: text("supporting_docs"), // Column xii
	isKeyControl: boolean("is_key_control").default(false), // Column xiii
	
	// Regulatory Metadata (Lampiran 5 b)
	ipoC: text("ipo_c"),
	ipoA: text("ipo_a"),
	ipoV: text("ipo_v"),
	ipoRa: text("ipo_ra"),
	assertionE: text("assertion_e"),
	assertionC: text("assertion_c"),
	assertionA: text("assertion_a"),
	assertionCo: text("assertion_co"),
	assertionVa: text("assertion_va"),
	assertionRo: text("assertion_ro"),
	assertionPd: text("assertion_pd"),
	
	controlType: text("control_type"), // Column xxv: Preventif / Detektif
	controlNature: text("control_nature"), // Column xxvi: Manual, Otomatis, ITDM - EUC, ITDM - IPE, MRC
	frequency: text("frequency"), // Column xxviii
	supportingApp: text("supporting_app"), // Column xxix (Legacy Text)
	applicationId: text("application_id").references(() => applications.id), // New ID-based Link
	executingFunction: text("executing_function"), // Column xxx
	executorRole: text("executor_role"), // Column xxxi
	affectedFsliItem: text("affected_fsli_item"), // Column xxxii
	effectivePeriod: text("effective_period"), // Column xxxiii

	// ELC & ITGC Regulatory Metadata
	cosoPrinciples: jsonb("coso_principles"), // Array of numbers 1-17
	itgcDomain: text("itgc_domain"), // Access, Changes, Development, Operations
	itgcAssertions: jsonb("itgc_assertions"), // JSON mapping for IT assertions
	automatedControlType: text("automated_control_type"), // Column xxvii
}, (table) => {
	return {
		cosoPrinciplesGinIdx: index("rcm_controls_coso_principles_gin_idx").using("gin", table.cosoPrinciples),
	};
});

export const bpmExports = pgTable("bpm_exports", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	userId: text("user_id").notNull().references(() => user.id),
	diagramId: text("diagram_id").notNull().references(() => bpmDiagrams.id, { onDelete: 'cascade' }),
	filename: text("filename").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});
