ALTER TABLE "action_plans" ADD COLUMN "related_function" text;--> statement-breakpoint
ALTER TABLE "action_plans" ADD COLUMN "pic_name" text;--> statement-breakpoint
ALTER TABLE "action_plans" ADD COLUMN "plan_description" text;--> statement-breakpoint
ALTER TABLE "action_plans" ADD COLUMN "activity_detail" text;--> statement-breakpoint
ALTER TABLE "action_plans" ADD COLUMN "remediated_control_description" text;--> statement-breakpoint
ALTER TABLE "action_plans" ADD COLUMN "target_date" timestamp;--> statement-breakpoint
ALTER TABLE "action_plans" ADD COLUMN "actual_completion_date" timestamp;--> statement-breakpoint
ALTER TABLE "action_plans" ADD COLUMN "is_approved_by_line2" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "action_plans" ADD COLUMN "is_before_year_end" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "deficiencies" ADD COLUMN "root_cause" text;--> statement-breakpoint
ALTER TABLE "deficiencies" ADD COLUMN "magnitude" double precision;--> statement-breakpoint
ALTER TABLE "deficiencies" ADD COLUMN "likelihood" text;