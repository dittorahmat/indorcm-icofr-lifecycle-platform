ALTER TABLE "controls" ADD COLUMN "itgc_domain" text;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "itgc_assertions" jsonb;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "automated_control_type" text;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "supporting_app" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "automated_control_type" text;