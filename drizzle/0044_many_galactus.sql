CREATE TABLE "wbs_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"report_date" timestamp NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"impact_magnitude" double precision,
	"status" text NOT NULL,
	"source" text DEFAULT 'Lini 1 - CSA',
	"is_financial_impact" boolean DEFAULT false,
	"related_department_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tod_evaluations" ALTER COLUMN "csa_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "action_plans" ADD COLUMN "workflow_status" text DEFAULT 'Ineffective';--> statement-breakpoint
ALTER TABLE "action_plans" ADD COLUMN "workflow_history" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "bpm_processes" ADD COLUMN "workflow_status" text;--> statement-breakpoint
ALTER TABLE "bpm_processes" ADD COLUMN "workflow_history" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "deficiencies" ADD COLUMN "source" text DEFAULT 'Lini 1 - CSA';--> statement-breakpoint
ALTER TABLE "wbs_reports" ADD CONSTRAINT "wbs_reports_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;