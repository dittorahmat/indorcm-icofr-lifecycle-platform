import { text, integer, timestamp, boolean, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { pgTable } from "./types";

export const applications = pgTable("applications", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	statusITGC: text("status_itgc"),
	criticality: text("criticality"),
	isSignificant: boolean("is_significant").default(false),
	itgcAreas: jsonb("itgc_areas").$type<string[]>().default([]),
	businessOwners: jsonb("business_owners").$type<string[]>().default([]),
	applicationOwners: jsonb("application_owners").$type<string[]>().default([]),
	architectureDocUrl: text("architecture_doc_url"),
	architectureDocName: text("architecture_doc_name"),
});

export const applicationDocuments = pgTable("application_documents", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull(),
	applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: 'cascade' }),
	itgcArea: text("itgc_area").notNull(), // Access to Program and Data | Program Changes | Program Development | Computer Operations
	fileName: text("file_name").notNull(),
	fileUrl: text("file_url").notNull(),
	fileSize: integer("file_size"),
	mimeType: text("mime_type"),
	uploadedBy: text("uploaded_by"),
	uploadedByName: text("uploaded_by_name"),
	uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
	notes: text("notes"),
});
