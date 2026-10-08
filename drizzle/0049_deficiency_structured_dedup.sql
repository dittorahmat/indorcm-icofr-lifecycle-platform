-- Structured deficiency dedup key (arch-09 T1, ticket #10).
-- Replaces LIKE-%period% description matching with equality on
-- (organization_id, control_id, bpm_process_id, period, source).
-- Idempotent via IF NOT EXISTS. Existing rows keep NULL key columns and are
-- superseded by one structured row on the next trigger (see T4 backfill note).
ALTER TABLE "deficiencies" ADD COLUMN IF NOT EXISTS "bpm_process_id" text;--> statement-breakpoint
ALTER TABLE "deficiencies" ADD COLUMN IF NOT EXISTS "period" text;
