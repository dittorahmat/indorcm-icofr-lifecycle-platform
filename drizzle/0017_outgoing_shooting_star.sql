ALTER TABLE "controls" ADD COLUMN "attribute_questions" jsonb;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "is_bpm_confirmed" boolean DEFAULT false;