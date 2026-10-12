import { text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { pgTable } from "./types";
import { organization } from "./auth";

export const aiCacheEntries = pgTable("ai_cache_entries", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organization.id),
  cacheKey: text("cache_key").notNull(),
  layer: text("layer").notNull(),
  payload: jsonb("payload").notNull(),
  kbVersion: text("kb_version").notNull().default(""),
  simulationId: text("simulation_id").notNull().default(""),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  orgKeyIdx: index("ai_cache_org_key_idx").on(table.organizationId, table.cacheKey),
  expiryIdx: index("ai_cache_expiry_idx").on(table.expiresAt),
}));
