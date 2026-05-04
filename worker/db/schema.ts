import { pgTable, text, integer, timestamp, boolean, doublePrecision, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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
	snapshotId: text("snapshot_id").notNull().references(() => glSnapshots.id),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	ymd: text("ymd"),
	entityCode: text("entity_code"),
	noGL: text("no_gl"),
	glDesc: text("gl_desc"),
	currency: text("currency"),
	balance: doublePrecision("balance"),
	fsliCode: text("fsli_code"),
	fsliName: text("fsli_name"),
	category: text("category"),
	subKategori: text("sub_kategori"),
	assignedDepartmentIds: jsonb("assigned_department_ids").$type<string[]>().default([]),
	ownerAcceptance: ownerAcceptanceEnum("owner_acceptance"), // Accepted, Rejected, or null (Pending)
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
	glSnapshotId: text("gl_snapshot_id").references(() => glSnapshots.id),
	omValue: doublePrecision("om_value"),
	pmValue: doublePrecision("pm_value"),
	locationCount: integer("location_count"),
	omPercentage: doublePrecision("om_percentage"),
	haircutPercentage: doublePrecision("haircut_percentage"),
	basis: text("basis"),
	significantAccounts: jsonb("significant_accounts"), // Added to store identified accounts
	assessmentData: jsonb("assessment_data"),
	history: jsonb("history").$type<any[]>().default([]),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at"),
	createdBy: text("created_by").references(() => user.id),
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
	bpmStatus: text("bpm_status"),

	// New Worksheet Fields
	fsliCodes: jsonb("fsli_codes"),
	relatedControlIds: jsonb("related_control_ids").$type<string[]>().default([]), // New: Many-to-Many Linkage
	attachmentUrl: text("attachment_url"), // New: Policy Document URL
	businessProcess: text("business_process"),
	subProcess: text("sub_process"),
	location: text("location"),
	isFraudRelated: boolean("is_fraud_related").default(false),
	isKeyControl: boolean("is_key_control").default(false),
	ipo: jsonb("ipo"),
	assertions: jsonb("assertions"),
	supportingDocs: text("supporting_docs"),
	reference: text("reference"),
	applicationId: text("application_id").references(() => applications.id),
	bpmProcessId: text("bpm_process_id").references(() => bpmProcesses.id),
	attributeQuestions: jsonb("attribute_questions"),

	// CSA Standalone Metadata
	csaStatus: text("csa_status").default("Not Assessed"), // Not Assessed, Effective, Ineffective
	lastCsaDate: timestamp("last_csa_date"),

	// ITGC Specific Columns
	itgcDomain: text("itgc_domain"),	itgcAssertions: jsonb("itgc_assertions"),
	automatedControlType: text("automated_control_type"),
	supportingApp: text("supporting_app"),
});

export const csaRecords = pgTable("csa_records", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	controlId: text("control_id").references(() => controls.id), // Optional for aggregate CSA
	bpmProcessId: text("bpm_process_id").references(() => bpmProcesses.id), // New: Link to sub-process
	period: text("period").notNull(),
	assessmentDate: timestamp("assessment_date").notNull(),
	assessedBy: text("assessed_by").references(() => user.id),
	result: text("result").notNull(), // Effective, Ineffective, No Transaction
	comments: text("comments"),
	isBpmConfirmed: boolean("is_bpm_confirmed").default(false),


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
	organizationId: text("organization_id").notNull().references(() => organization.id),
	csaRecordId: text("csa_record_id").notNull().references(() => csaRecords.id, { onDelete: 'cascade' }),
	glRowId: text("gl_row_id").references(() => glRows.id), // Link to original transaction
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
	severity: text("severity"), // CD, SD, MW
	rescheduleReason: text("reschedule_reason"),
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
	riskCount: integer("risk_count").default(0),
	controlCount: integer("control_count").default(0),
	createdAt: timestamp("created_at").notNull(),
	createdBy: text("created_by").references(() => user.id),
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
	action: text("action").notNull(), // CREATE, UPDATE, DELETE, LOGIN
	entityType: text("entity_type").notNull(), // Control, RCM, GL
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
	fileUrl: text("file_url"), // R2 path/URL
	createdAt: timestamp("created_at").notNull().defaultNow(),
	createdBy: text("created_by").references(() => user.id),
});

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
	bpmProcessId: text("bpm_process_id").notNull().references(() => bpmProcesses.id, { onDelete: 'cascade' }),
	plannedDate: timestamp("planned_date").notNull(),
	type: text("type").notNull(), // CSA, TOD, TOE
	status: text("status").notNull().default("Not Started"), // Not Started, In Progress, Completed
	assignedTo: text("assigned_to").references(() => user.id),
	recurringFrequency: text("recurring_frequency"), // Monthly, Quarterly, etc.
	reminderConfig: jsonb("reminder_config"), // { value: number, unit: 'minute' | 'hour' | 'day' | 'month' }
	createdAt: timestamp("created_at").notNull().defaultNow(),
});


// --- RELATIONS ---

export const userRelations = relations(user, ({ many }) => ({
	members: many(member),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
	members: many(member),
	glSnapshots: many(glSnapshots),
}));

export const glSnapshotRelations = relations(glSnapshots, ({ many }) => ({
	rows: many(glRows),
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
