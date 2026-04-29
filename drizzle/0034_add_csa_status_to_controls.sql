ALTER TABLE "controls" ADD COLUMN "csa_status" text DEFAULT 'Not Assessed';--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "last_csa_date" timestamp;