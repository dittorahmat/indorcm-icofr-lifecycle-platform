ALTER TABLE "deficiencies" ADD COLUMN "exposure_value" double precision;--> statement-breakpoint
ALTER TABLE "deficiencies" ADD COLUMN "assertions" jsonb;--> statement-breakpoint
ALTER TABLE "deficiencies" ADD COLUMN "pre_assessment" jsonb;