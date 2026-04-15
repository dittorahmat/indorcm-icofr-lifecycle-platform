import { pgTable, text, integer, timestamp, boolean, doublePrecision, jsonb, pgEnum } from "drizzle-orm/pg-core";
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
	organizationId: text("organizationId").notNull().references(() => organization.id),
	userId: text("userId").notNull().references(() => user.id),
	role: text("role").notNull(),
	createdAt: timestamp("createdAt").notNull(),
});

// --- BUSINESS TABLES (ICOFR) ---

export const departments = pgTable("departments", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organization.id),
	name: text("name").notNull(),
});

export const glSnapshots = pgTable("gl_snapshots", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organization.id),
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
	organizationId: text("organizationId").notNull().references(() => organization.id),
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
	assignedDepartmentId: text("assigned_department_id").references(() => departments.id),
	ownerAcceptance: ownerAcceptanceEnum("owner_acceptance"), // Accepted, Rejected, or null (Pending)
});

export const materiality = pgTable("materiality", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organization.id),
	year: integer("year").notNull(),
	overallMateriality: doublePrecision("overall_materiality"),
	performanceMateriality: doublePrecision("performance_materiality"),
	benchmark: text("benchmark"),
	percentage: doublePrecision("percentage"),
	haircut: doublePrecision("haircut"),
});

export const simulations = pgTable("simulations", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organization.id),
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
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at"),
	createdBy: text("created_by").references(() => user.id),
});

export const bpmDiagrams = pgTable("bpm_diagrams", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organization.id),
	name: text("name").notNull(),
	subProcess: text("sub_process"),
	nodes: jsonb("nodes").$type<any[]>(),
	edges: jsonb("edges").$type<any[]>(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at"),
	createdBy: text("created_by").references(() => user.id),
});

export const bpmNodeRcms = pgTable("bpm_node_rcms", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organization.id),
	diagramId: text("diagram_id").notNull().references(() => bpmDiagrams.id, { onDelete: 'cascade' }),
	nodeId: text("node_id").notNull(), // The React Flow node ID
	rcmId: text("rcm_id").notNull().references(() => rcms.id, { onDelete: 'cascade' })
});

export const rcmControls = pgTable("rcm_controls", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organization.id),
	rcmId: text("rcm_id").notNull().references(() => rcms.id, { onDelete: 'cascade' }),
	controlId: text("control_id").notNull().references(() => controls.id, { onDelete: 'cascade' })
});

export const rcms = pgTable("rcms", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organization.id),
	process: text("process").notNull(),
	subProcess: text("sub_process").notNull(),
	riskDescription: text("risk_description").notNull(),
	status: text("status").notNull(), // Draft, Active, Pending Change Approval
	diagramId: text("diagram_id").references(() => bpmDiagrams.id),
	auditTrail: jsonb("audit_trail"), // Legacy support
});

export const controls = pgTable("controls", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organization.id),
	rcmId: text("rcm_id").references(() => rcms.id),
	departmentId: text("department_id").references(() => departments.id),
	code: text("code").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	ownerId: text("owner_id"),
	type: text("type"), 
	nature: text("nature"),
	frequency: text("frequency"),
	bpmStatus: text("bpm_status"),

	// New Worksheet Fields
	fsliCodes: jsonb("fsli_codes"),
	businessProcessLvl1: text("business_process_lvl1"),
	businessProcessLvl2: text("business_process_lvl2"),
	subProcess: text("sub_process"),
	location: text("location"),
	isFraudRelated: boolean("is_fraud_related").default(false),
	isKeyControl: boolean("is_key_control").default(false),
	ipo: jsonb("ipo"),
	assertions: jsonb("assertions"),
	supportingDocs: text("supporting_docs"),
	reference: text("reference"),
	applicationId: text("application_id").references(() => applications.id),
});

export const csaRecords = pgTable("csa_records", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organization.id),
	controlId: text("control_id").notNull().references(() => controls.id),
	period: text("period").notNull(),
	assessmentDate: timestamp("assessment_date").notNull(),
	assessedBy: text("assessed_by").references(() => user.id),
	result: text("result").notNull(), // Effective, Ineffective, No Transaction
	comments: text("comments"),

	// New Regulatory Fields (SK-5/2024)
	transReference: text("trans_reference"),
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
	itacExpectedResult: text("itac_expected_result"),
	itacActualResult: text("itac_actual_result"),

	// Line 2 Validation
	line2Status: text("line2_status"), // Pending, Validated, Rejected
	line2Comments: text("line2_comments"),
	line2ValidatedBy: text("line2_validated_by").references(() => user.id),
	line2ValidatedDate: timestamp("line2_validated_date"),
});

export const testRecords = pgTable("test_records", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organization.id),
	controlId: text("control_id").notNull().references(() => controls.id),
	testType: text("test_type").notNull(), // TOD, TOE
	method: text("method"),
	period: text("period").notNull(),
	testDate: timestamp("test_date").notNull(),
	testedBy: text("tested_by").references(() => user.id),
	result: text("result").notNull(), // Pass, Fail
	evaluationAttributes: jsonb("evaluation_attributes"),
});

export const deficiencies = pgTable("deficiencies", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organization.id),
	controlId: text("control_id").references(() => controls.id),
	description: text("description").notNull(),
	severity: text("severity").notNull(), // Control Deficiency, Significant, Material Weakness
	identifiedDate: timestamp("identified_date"),
	identifiedBy: text("identified_by"),
	status: text("status").notNull(), // Open, Closed
});

export const actionPlans = pgTable("action_plans", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organization.id),
	deficiencyId: text("deficiency_id").references(() => deficiencies.id),
	description: text("description").notNull(),
	ownerId: text("owner_id"),
	dueDate: timestamp("due_date"),
	status: text("status").notNull(),
});

export const applications = pgTable("applications", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organization.id),
	name: text("name").notNull(),
	description: text("description"),
	statusItgc: text("status_itgc"),
	criticality: text("criticality"),
});

export const bpmProcesses = pgTable("bpm_processes", {
	id: text("id").primaryKey(),
	organizationId: text("organizationId").notNull().references(() => organization.id),
	noGL: text("no_gl").notNull(),
	fsliName: text("fsli_name"),
	name: text("name").notNull(),
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
