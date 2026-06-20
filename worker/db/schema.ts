import { pgTable, text, integer, timestamp, boolean, doublePrecision, jsonb, pgEnum, index, customType } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Custom type for PostgreSQL tsvector and vector
const tsvector = customType<{ data: string }>({
	dataType() {
		return "tsvector";
	},
});

const vector = customType<{ data: number[]; config: { dimensions: number } }>({
	dataType(config) {
		return `vector(${config?.dimensions})`;
	},
	toDriver(value: number[]) {
		return `[${value.join(",")}]`;
	},
});

// --- BETTER AUTH TABLES ---

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").notNull(),
	image: text("image"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
	role: text("role"), // Line 1, Line 2, etc.
	level: text("level"), // Staff, Manager
	departmentId: text("departmentId"),
	language: text("language").default("en"),
	processOwnershipHistory: jsonb("process_ownership_history").$type<{ processId: string; role: string; endDate: number }[]>().default([]),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expiresAt").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId").notNull().references(() => user.id),
	activeOrganizationId: text("activeOrganizationId"),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId").notNull().references(() => user.id),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
	refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expiresAt").notNull(),
	createdAt: timestamp("createdAt"),
	updatedAt: timestamp("updatedAt"),
});

export const organization = pgTable("organization", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").unique(),
	logo: text("logo"),
	createdAt: timestamp("createdAt").notNull(),
	metadata: jsonb("metadata"),
    entityCode: text("entityCode"), // Kode_Entity dari CSV (misal: 0101)
});

export const businessEntities = pgTable("business_entities", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	code: text("code").notNull(),
	name: text("name").notNull(),
	parentId: text("parent_id").references((): any => businessEntities.id), // Self-referencing
	levelType: text("level_type"), // Holding, Subsidiary, Branch
});

export const member = pgTable("member", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	userId: text("userId").notNull().references(() => user.id),
	role: text("role").notNull(),
	createdAt: timestamp("createdAt").notNull(),
});

// --- BUSINESS TABLES (ICOFR) ---

export const departments = pgTable("departments", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	name: text("name").notNull(),
});

export const glSnapshots = pgTable("gl_snapshots", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	filename: text("filename").notNull(),
	uploadDate: timestamp("uploadDate").notNull(),
	status: text("status").notNull(), // Draft, Mapped
	isActive: boolean("isActive").default(false),
	benchmarkFsliNames: jsonb("benchmarkFsliNames"),
});

// Enum for owner acceptance status
export const ownerAcceptanceEnum = pgEnum("owner_acceptance", ["Accepted", "Rejected"]);

export const glRows = pgTable("gl_rows", {
	id: text("id").primaryKey(),
	snapshotId: text("snapshot_id").notNull().references(() => glSnapshots.id, { onDelete: 'cascade' }),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	ymd: text("ymd"),
	entityCode: text("entity_code"),
	parentEntityCode: text("parent_entity_code"),
	entityId: text("entity_id").references(() => businessEntities.id),
	noGL: text("no_gl"),
	glDesc: text("gl_desc"),
	currency: text("currency"),
	balance: doublePrecision("balance"),
	fsliCode: text("fsli_code"),
	fsliName: text("fsli_name"),
	category: text("category"),
	subKategori: text("sub_kategori"),
	fsliBalance: doublePrecision("fsli_balance"),
	assignedDepartmentIds: jsonb("assigned_department_ids").$type<string[]>().default([]),
	ownerAcceptance: ownerAcceptanceEnum("owner_acceptance"), // Accepted, Rejected, or null (Pending)
	noUrut: integer("no_urut"),
	mappingConfidence: doublePrecision("mapping_confidence"), // 0.0 to 1.0
});

export const transactionDetails = pgTable("transaction_details", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	noGL: text("no_gl").notNull(),
	bpmProcessId: text("bpm_process_id"), // Explicit link to sub-process
	refNo: text("ref_no"),
	transDate: timestamp("trans_date"),
	description: text("description"),
	currency: text("currency"),
	dcFlag: text("dc_flag"), // D / C
	amount: doublePrecision("amount"),
}, (table) => {
	return {
		noGLIdx: index("trans_no_gl_idx").on(table.noGL),
		bpmProcessIdx: index("trans_bpm_process_idx").on(table.bpmProcessId),
	};
});

export const transactionUploads = pgTable("transaction_uploads", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	uploadedBy: text("uploaded_by").notNull().references(() => user.id),
	noGL: text("no_gl").notNull(),
	filename: text("filename"),
	rowCount: integer("row_count").default(0),
	createdAt: timestamp("created_at").defaultNow(),
});

export const materiality = pgTable("materiality", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	year: integer("year").notNull(),
	overallMateriality: doublePrecision("overall_materiality"),
	performanceMateriality: doublePrecision("performance_materiality"),
	benchmark: text("benchmark"),
	percentage: doublePrecision("percentage"),
	haircut: doublePrecision("haircut"),
});

export const simulations = pgTable("simulations", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	name: text("name").notNull(),
	year: integer("year").notNull(),
	status: text("status").notNull(), // Draft, Approved, Rejected
	glSnapshotId: text("gl_snapshot_id").references(() => glSnapshots.id, { onDelete: 'set null' }),
	omValue: doublePrecision("om_value"),
	pmValue: doublePrecision("pm_value"),
	locationCount: integer("location_count"),
	omPercentage: doublePrecision("om_percentage"),
	haircutPercentage: doublePrecision("haircut_percentage"),
	basis: text("basis"),
	workflowStatus: text("workflow_status").default("Draft"), // SimulationStatus
	workflowHistory: jsonb("workflow_history").$type<any[]>().default([]),
	significantAccounts: jsonb("significant_accounts"), // Added to store identified accounts
	assessmentData: jsonb("assessment_data"),
	history: jsonb("history").$type<any[]>().default([]),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at"),
	createdBy: text("created_by").references(() => user.id),
	locationThreshold: integer("location_threshold").default(80),
	locationResults: jsonb("location_results").$type<{
		entityCode: string;
		balance: number;
		contributionPercentage: number;
		cumulativePercentage: number;
		isSignificant: boolean;
	}[]>(),
}, (table) => {
	return {
		yearStatusIdx: index("year_status_idx").on(table.year, table.status, table.createdAt),
	};
});

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
});

export const csaSamples = pgTable("csa_samples", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").references(() => organization.id).notNull(),
	csaRecordId: text("csa_record_id").references(() => csaRecords.id, { onDelete: 'cascade' }),
	glRowId: text("gl_row_id"), // Link to original transaction/GL row (Flexi-link, no strict FK to allow both GL and TransDetails)
	sampleRef: text("sample_ref"),
	
	// Refactored Multi-Control Results
	// Format: { [controlId: string]: { implemented: boolean, evidenceUrl?: string } }
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

export const deficiencies = pgTable("deficiencies", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	controlId: text("control_id").references(() => controls.id),
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

export const wbsReports = pgTable("wbs_reports", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	reportDate: timestamp("report_date").notNull(),
	category: text("category").notNull(), // Financial Reporting, Corruption, etc.
	description: text("description").notNull(),
	impactMagnitude: doublePrecision("impact_magnitude"),
	status: text("status").notNull(), // Investigating, Confirmed, Closed
	source: text("source").default("Lini 1 - CSA"), // Lini 1 - CSA, Lini 2 - TOD Review, Lini 3 - Audit, etc
	isFinancialImpact: boolean("is_financial_impact").default(false),
	relatedDepartmentId: text("related_department_id"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	userId: text("user_id").notNull().references(() => user.id),
	message: text("message").notNull(),
	link: text("link"),
	type: text("type").$type<'info' | 'warning' | 'error' | 'success'>().default('info'),
	readStatus: boolean("read_status").default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const applications = pgTable("applications", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	name: text("name").notNull(),
	description: text("description"),
	statusITGC: text("status_itgc"),
	criticality: text("criticality"),
	isSignificant: boolean("is_significant").default(false),
	itgcAreas: jsonb("itgc_areas").$type<string[]>().default([]),
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
	workflowStatus: text("workflow_status"), // BPMWorkflowStatus
	workflowHistory: jsonb("workflow_history").$type<any[]>().default([]),
	createdAt: timestamp("created_at").notNull(),
	createdBy: text("created_by").references(() => user.id),
}, (table) => {
	return {
		orgBpmCodeIdx: index("bpm_processes_org_code_idx").on(table.organizationId, table.bpmCode),
		noGLIdx: index("bpm_processes_no_gl_idx").on(table.noGL),
		yearIdx: index("bpm_processes_year_idx").on(table.year),
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

export const accountAssertions = pgTable("account_assertions", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	fsliName: text("fsli_name").notNull(),
	noGL: text("no_gl").notNull(),
	
	assertionE: text("assertion_e"), // Y / N
	assertionC: text("assertion_c"),
	assertionA: text("assertion_a"),
	assertionCo: text("assertion_co"),
	assertionRo: text("assertion_ro"),
	assertionVa: text("assertion_va"),
	assertionPd: text("assertion_pd"),

	updatedAt: timestamp("updated_at"),
	updatedBy: text("updated_by").references(() => user.id),
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

// --- AUDIT TABLES ---

export const auditLogs = pgTable("audit_logs", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").references(() => organization.id),
	userId: text("user_id").references(() => user.id),
	action: text("action").notNull(), // CREATE, UPDATE, DELETE, LOGIN, MIGRATION_BASELINE
	entityType: text("entity_type").notNull(), // Control, RCM, GL, MigrationSession
	entityId: text("entity_id"),
	descriptionBefore: text("description_before"),
	descriptionAfter: text("description_after"),
	dataBefore: jsonb("data_before"),
	dataAfter: jsonb("data_after"),
	timestamp: timestamp("timestamp").defaultNow(),
	effectiveDate: timestamp("effective_date"),
	isRegulatory: boolean("is_regulatory").default(false), // Flag untuk Lampiran 6 SK-5
	approvedBy: text("approved_by"),
});

export const simulationAccountApplications = pgTable("simulation_account_applications", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	simulationId: text("simulation_id").notNull().references(() => simulations.id, { onDelete: 'cascade' }),
	accountCode: text("account_code").notNull(), // Menyimpan noGL
	applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: 'cascade' }),
});

// --- KNOWLEDGE BASE TABLES ---

export const documents = pgTable("documents", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").references(() => organization.id),
	title: text("title").notNull(),
	type: text("type").notNull(), // Internal, External
	category: text("category"), // SOP, Regulation, etc.
	content: text("content"), // Extracted text
	metadata: jsonb("metadata"),
	embedding: vector("embedding", { dimensions: 768 }), // Vector for AI semantic search
	ftsTokens: tsvector("fts_tokens"), // tsvector for full-text keyword search
	fileUrl: text("file_url"), // R2 path/URL
	createdAt: timestamp("created_at").notNull().defaultNow(),
	createdBy: text("created_by").references(() => user.id),
}, (table) => ({
	embeddingIdx: index("doc_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
	ftsIdx: index("doc_fts_idx").using("gin", table.ftsTokens),
}));

export const documentDepartments = pgTable("document_departments", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").references(() => organization.id),
	documentId: text("document_id").notNull().references(() => documents.id, { onDelete: 'cascade' }),
	departmentId: text("department_id").notNull().references(() => departments.id, { onDelete: 'cascade' }),
});

export const documentGls = pgTable("document_gls", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").references(() => organization.id),
	documentId: text("document_id").notNull().references(() => documents.id, { onDelete: 'cascade' }),
	glCode: text("gl_code").notNull(),
});

export const documentFslis = pgTable("document_fslis", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").references(() => organization.id),
	documentId: text("document_id").notNull().references(() => documents.id, { onDelete: 'cascade' }),
	fsliCode: text("fsli_code").notNull(),
});

export const documentChunks = pgTable("document_chunks", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").references(() => organization.id),
	documentId: text("document_id").notNull().references(() => documents.id, { onDelete: 'cascade' }),
	content: text("content").notNull(),
	embedding: vector("embedding", { dimensions: 768 }),
	ftsTokens: tsvector("fts_tokens"),
	metadata: jsonb("metadata"), // For storing page numbers, section headers, etc.
	createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
	embeddingIdx: index("chunk_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
	ftsIdx: index("chunk_fts_idx").using("gin", table.ftsTokens),
}));

export const systemLicenses = pgTable("system_licenses", {
	id: text("id").primaryKey(),
	licenseKey: text("license_key").notNull(),
	machineCode: text("machine_code").notNull(),
	activatedAt: timestamp("activated_at").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	lastHeartbeat: timestamp("last_heartbeat").notNull(),
	status: text("status").notNull(), // active, expired, tampered
});

export const vendors = pgTable("vendors", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	name: text("name").notNull(),
	serviceType: text("service_type"),
	contactPerson: text("contact_person"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const socReports = pgTable("soc_reports", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	vendorId: text("vendor_id").notNull().references(() => vendors.id, { onDelete: 'cascade' }),
	vendorName: text("vendor_name"), // Denormalized for UI ease
	reportType: text("report_type").notNull(), // SOC 1 Tipe 2, etc.
	periodStart: timestamp("period_start").notNull(),
	periodEnd: timestamp("period_end").notNull(),
	fileUrl: text("file_url"),
	status: text("status").notNull(), // Valid, Expired
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const socEvaluations = pgTable("soc_evaluations", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	socReportId: text("soc_report_id").notNull().references(() => socReports.id, { onDelete: 'cascade' }),
	
	// Mandatory 7 Criteria (Lampiran 3.2.c.5 Hal 40)
	attrA: boolean("attr_a").default(false),
	attrB: boolean("attr_b").default(false),
	attrC: boolean("attr_c").default(false),
	attrD: boolean("attr_d").default(false),
	attrE: boolean("attr_e").default(false),
	attrF: boolean("attr_f").default(false),
	attrG: boolean("attr_g").default(false),
	
	auditorOpinion: text("auditor_opinion"),
	evaluatedBy: text("evaluated_by").references(() => user.id),
	evaluatedAt: timestamp("evaluated_at").notNull().defaultNow(),
});

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

export const bpmExports = pgTable("bpm_exports", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	userId: text("user_id").notNull().references(() => user.id),
	diagramId: text("diagram_id").notNull().references(() => bpmDiagrams.id, { onDelete: 'cascade' }),
	filename: text("filename").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const migrationSessions = pgTable("migration_sessions", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	userId: text("user_id").notNull().references(() => user.id),
	year: integer("year").notNull(),
	status: text("status").notNull(), // Started, InProgress, Finalized, Cancelled
	type: text("type").notNull(), // TB, RCM, BOTH
	data: jsonb("data").$type<any>(), // Temporary storage for parsed Excel data
	reconstructionMetadata: jsonb("reconstruction_metadata").$type<any>(), // AI-guessed fields and scores
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at"),
});


// --- RELATIONS ---

export const userRelations = relations(user, ({ many }) => ({
	members: many(member),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
	members: many(member),
	glSnapshots: many(glSnapshots),
    businessEntities: many(businessEntities),
}));

export const businessEntityRelations = relations(businessEntities, ({ one, many }) => ({
	organization: one(organization, { fields: [businessEntities.organizationId], references: [organization.id] }),
	parent: one(businessEntities, { fields: [businessEntities.parentId], references: [businessEntities.id], relationName: "subEntities" }),
	children: many(businessEntities, { relationName: "subEntities" }),
	glRows: many(glRows),
}));

export const glSnapshotRelations = relations(glSnapshots, ({ many }) => ({
	rows: many(glRows),
}));

export const glRowRelations = relations(glRows, ({ one }) => ({
	snapshot: one(glSnapshots, { fields: [glRows.snapshotId], references: [glSnapshots.id] }),
	businessEntity: one(businessEntities, { fields: [glRows.entityId], references: [businessEntities.id] }),
}));

export const bpmProcessRelations = relations(bpmProcesses, ({ many }) => ({
	schedules: many(csaSchedules),
}));

export const csaScheduleRelations = relations(csaSchedules, ({ one }) => ({
	bpmProcess: one(bpmProcesses, { fields: [csaSchedules.bpmProcessId], references: [bpmProcesses.id] }),
	assignee: one(user, { fields: [csaSchedules.assignedTo], references: [user.id] }),
}));

export const simulationAccountApplicationsRelations = relations(simulationAccountApplications, ({ one }) => ({
	simulation: one(simulations, { fields: [simulationAccountApplications.simulationId], references: [simulations.id] }),
	application: one(applications, { fields: [simulationAccountApplications.applicationId], references: [applications.id] }),
}));

export const csaRecordRelations = relations(csaRecords, ({ many, one }) => ({
	samples: many(csaSamples),
	control: one(controls, { fields: [csaRecords.controlId], references: [controls.id] }),
	assessedByUser: one(user, { fields: [csaRecords.assessedBy], references: [user.id] }),
}));

export const csaSampleRelations = relations(csaSamples, ({ one }) => ({
	csaRecord: one(csaRecords, { fields: [csaSamples.csaRecordId], references: [csaRecords.id] }),
}));

export const vendorRelations = relations(vendors, ({ many }) => ({
	reports: many(socReports),
}));

export const socReportRelations = relations(socReports, ({ one, many }) => ({
	vendor: one(vendors, { fields: [socReports.vendorId], references: [vendors.id] }),
	evaluations: many(socEvaluations),
}));

export const socEvaluationRelations = relations(socEvaluations, ({ one }) => ({
	report: one(socReports, { fields: [socEvaluations.socReportId], references: [socReports.id] }),
	evaluator: one(user, { fields: [socEvaluations.evaluatedBy], references: [user.id] }),
}));

export const testRecordRelations = relations(testRecords, ({ many, one }) => ({
	samples: many(testSamples),
	control: one(controls, { fields: [testRecords.controlId], references: [controls.id] }),
	testedByUser: one(user, { fields: [testRecords.testedBy], references: [user.id] }),
}));

export const testSampleRelations = relations(testSamples, ({ one }) => ({
	testRecord: one(testRecords, { fields: [testSamples.testRecordId], references: [testRecords.id] }),
}));

export const todEvaluationRelations = relations(todEvaluations, ({ one }) => ({
	csaRecord: one(csaRecords, { fields: [todEvaluations.csaId], references: [csaRecords.id] }),
	control: one(controls, { fields: [todEvaluations.controlId], references: [controls.id] }),
	evaluator: one(user, { fields: [todEvaluations.evaluatorId], references: [user.id] }),
}));

export const rcmRelations = relations(rcms, ({ many }) => ({
	mappings: many(rcmControls),
}));

export const rcmControlRelations = relations(rcmControls, ({ one }) => ({
	rcm: one(rcms, { fields: [rcmControls.rcmId], references: [rcms.id] }),
	control: one(controls, { fields: [rcmControls.controlId], references: [controls.id] }),
}));

export const controlRelations = relations(controls, ({ many }) => ({
	rcmMappings: many(rcmControls),
	todEvaluations: many(todEvaluations),
}));
