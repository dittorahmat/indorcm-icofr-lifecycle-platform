ALTER TABLE "rcm_controls" ADD COLUMN "ipo_c" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "ipo_a" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "ipo_v" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "ipo_ra" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "assertion_e" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "assertion_c" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "assertion_a" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "assertion_co" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "assertion_va" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "assertion_ro" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "assertion_pd" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "control_type" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "control_nature" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "frequency" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "is_key_control" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "supporting_docs" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "executing_function" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "executor_role" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "affected_fsli_item" text;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD COLUMN "effective_period" text;