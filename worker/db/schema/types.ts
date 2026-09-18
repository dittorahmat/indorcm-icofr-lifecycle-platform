import { customType, pgSchema } from "drizzle-orm/pg-core";

export const icofrSchema = pgSchema("icofr");
export const pgTable = icofrSchema.table;
export const pgEnum = icofrSchema.enum;

// Custom type for PostgreSQL tsvector and vector
export const tsvector = customType<{ data: string }>({
	dataType() {
		return "tsvector";
	},
});

export const vector = customType<{ data: number[]; config: { dimensions: number } }>({
	dataType(config) {
		return `vector(${config?.dimensions})`;
	},
	toDriver(value: number[]) {
		return `[${value.join(",")}]`;
	},
});

// Enum for owner acceptance status
export const ownerAcceptanceEnum = icofrSchema.enum("owner_acceptance", ["Accepted", "Rejected"]);
