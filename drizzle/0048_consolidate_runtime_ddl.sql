-- Consolidates all runtime auto-DDL previously executed by
-- worker/db/index.ts fixDatabaseSchema() and worker/routes/users.ts /dev/fix-db
-- into a single versioned migration. Idempotent via IF NOT EXISTS.
ALTER TABLE "simulations" ADD COLUMN IF NOT EXISTS "significant_accounts" jsonb;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'en';
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "itgc_areas" jsonb DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "business_owners" jsonb DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "application_owners" jsonb DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "architecture_doc_url" text;
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "architecture_doc_name" text;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'info';
--> statement-breakpoint
ALTER TABLE "gl_snapshots" ADD COLUMN IF NOT EXISTS "year" integer;
--> statement-breakpoint
ALTER TABLE "gl_snapshots" ADD COLUMN IF NOT EXISTS "benchmarkFsliNames" jsonb;
--> statement-breakpoint
ALTER TABLE "account_assertions" ADD COLUMN IF NOT EXISTS "year" integer;
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "change_category" text;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "metadata" jsonb;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'completed';
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "indexing_progress" integer DEFAULT 100;
--> statement-breakpoint
ALTER TABLE "transaction_details" ADD COLUMN IF NOT EXISTS "bpm_process_id" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"layout" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
