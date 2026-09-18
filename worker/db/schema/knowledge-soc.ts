import { text, integer, timestamp, boolean, doublePrecision, jsonb, index } from "drizzle-orm/pg-core";
import { pgTable, tsvector, vector } from "./types";
import { organization, user } from "./auth";
import { departments } from "./gl-scoping";

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
	changeCategory: text("change_category"),
});

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
	status: text("status").default("completed"), // processing, completed, failed
	indexingProgress: integer("indexing_progress").default(100),
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

export const userPreferences = pgTable("user_preferences", {
	userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
	layout: jsonb("layout").$type<any>(),
	notificationPreferences: jsonb("notification_preferences").$type<{
		inApp: boolean;
		email: boolean;
		slack: boolean;
		msTeams: boolean;
		genericWebhook: boolean;
	}>(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
