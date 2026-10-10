-- Trigram/GIN/btree search indexes (grill-with-docs Q4-Q6, ADR-0003).
-- Kills Seq Scan on ILIKE '%...%' (Trigram Search via pg_trgm) and year-prefix
-- LIKE 'YYYY%' on csa_records.period (btree). Suffix LIKE '%-noGL' on rcms.id
-- keeps its semantics and becomes trigram-indexable.
-- Requires: CREATE EXTENSION pg_trgm (NOT here — run scripts/db-extensions.sql
-- as superuser BEFORE drizzle-kit push; the app role may lack that privilege).
-- Idempotent via IF NOT EXISTS.
CREATE INDEX IF NOT EXISTS "rcms_org_idx" ON "rcms" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rcms_sub_process_trgm_idx" ON "rcms" USING gin ("sub_process" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rcms_id_trgm_idx" ON "rcms" USING gin ("id" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "controls_fsli_codes_gin_idx" ON "controls" USING gin ("fsli_codes");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rcm_controls_coso_principles_gin_idx" ON "rcm_controls" USING gin ("coso_principles");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bpm_processes_name_trgm_idx" ON "bpm_processes" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_title_trgm_idx" ON "documents" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "csa_records_org_period_idx" ON "csa_records" USING btree ("organization_id","period");
