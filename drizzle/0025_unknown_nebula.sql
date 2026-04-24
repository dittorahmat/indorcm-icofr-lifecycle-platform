ALTER TABLE "rcm_controls" ADD COLUMN "coso_principles" jsonb;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "itgc_domain" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "itgc_assertions" jsonb;