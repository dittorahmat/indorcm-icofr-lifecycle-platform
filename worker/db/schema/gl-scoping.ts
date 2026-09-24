import { text, integer, timestamp, boolean, doublePrecision, jsonb, index } from "drizzle-orm/pg-core";
import { pgTable, ownerAcceptanceEnum } from "./types";
import { organization, businessEntities, user } from "./auth";
import { applications } from "./applications";

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
	year: integer("year"),
});

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
	materialityJustification: jsonb("materiality_justification"),
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

export const simulationAccountApplications = pgTable("simulation_account_applications", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	simulationId: text("simulation_id").notNull().references(() => simulations.id, { onDelete: 'cascade' }),
	accountCode: text("account_code").notNull(), // Menyimpan noGL
	applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: 'cascade' }),
});

export const accountAssertions = pgTable("account_assertions", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	fsliName: text("fsli_name").notNull(),
	noGL: text("no_gl").notNull(),
	year: integer("year"),
	
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
