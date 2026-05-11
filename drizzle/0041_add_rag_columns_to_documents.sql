ALTER TABLE "controls" ADD COLUMN "risk_rating" text;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "risk_assessment" jsonb;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "ipos" jsonb;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "coso_principles" jsonb;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "executor_role" text;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "effective_date" timestamp;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "automated_sub_nature" text;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "it_application" text;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "euc_complexity" text;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "ipe_type" text;--> statement-breakpoint
ALTER TABLE "deficiencies" ADD COLUMN "corrective_action_taken" text;--> statement-breakpoint
ALTER TABLE "deficiencies" ADD COLUMN "remediation_evidence" text;--> statement-breakpoint
ALTER TABLE "deficiencies" ADD COLUMN "compensating_control_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "embedding" vector(768);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "fts_tokens" "tsvector";--> statement-breakpoint
ALTER TABLE "gl_rows" ADD COLUMN "no_urut" integer;--> statement-breakpoint
ALTER TABLE "simulations" ADD COLUMN "location_threshold" integer DEFAULT 80;--> statement-breakpoint
ALTER TABLE "simulations" ADD COLUMN "location_results" jsonb;--> statement-breakpoint
ALTER TABLE "soc_reports" ADD COLUMN "vendor_name" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "process_ownership_history" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
CREATE INDEX "doc_embedding_idx" ON "documents" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "doc_fts_idx" ON "documents" USING gin ("fts_tokens");--> statement-breakpoint
ALTER TABLE "controls" DROP COLUMN "ipo";--> statement-breakpoint
ALTER TABLE "controls" DROP COLUMN "automated_control_type";