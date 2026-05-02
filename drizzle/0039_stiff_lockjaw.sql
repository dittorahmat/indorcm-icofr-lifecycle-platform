CREATE TABLE "csa_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"bpm_process_id" text NOT NULL,
	"planned_date" timestamp NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'Not Started' NOT NULL,
	"assigned_to" text,
	"recurring_frequency" text,
	"reminder_config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"read_status" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_assertions" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "action_plans" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "aggregate_deficiencies" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "applications" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "bpm_diagrams" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "bpm_node_rcms" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "bpm_processes" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "controls" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "csa_records" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "csa_samples" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "deficiencies" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "departments" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "gl_rows" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "gl_snapshots" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "materiality" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "member" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "rcm_controls" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "rcms" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "simulation_account_applications" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "simulations" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "test_records" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "account_assertions" DROP CONSTRAINT "account_assertions_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "action_plans" DROP CONSTRAINT "action_plans_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "aggregate_deficiencies" DROP CONSTRAINT "aggregate_deficiencies_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "bpm_diagrams" DROP CONSTRAINT "bpm_diagrams_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "bpm_node_rcms" DROP CONSTRAINT "bpm_node_rcms_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "bpm_processes" DROP CONSTRAINT "bpm_processes_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "controls" DROP CONSTRAINT "controls_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "csa_records" DROP CONSTRAINT "csa_records_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "csa_samples" DROP CONSTRAINT "csa_samples_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "deficiencies" DROP CONSTRAINT "deficiencies_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "departments" DROP CONSTRAINT "departments_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "gl_rows" DROP CONSTRAINT "gl_rows_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "gl_snapshots" DROP CONSTRAINT "gl_snapshots_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "materiality" DROP CONSTRAINT "materiality_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "member_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "rcm_controls" DROP CONSTRAINT "rcm_controls_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "rcms" DROP CONSTRAINT "rcms_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "simulation_account_applications" DROP CONSTRAINT "simulation_account_applications_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "simulations" DROP CONSTRAINT "simulations_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "test_records" DROP CONSTRAINT "test_records_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "csa_records" ALTER COLUMN "control_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "action_plans" ADD COLUMN "severity" text;--> statement-breakpoint
ALTER TABLE "action_plans" ADD COLUMN "reschedule_reason" text;--> statement-breakpoint
ALTER TABLE "bpm_processes" ADD COLUMN "bpm_code" text;--> statement-breakpoint
ALTER TABLE "csa_records" ADD COLUMN "bpm_process_id" text;--> statement-breakpoint
ALTER TABLE "csa_samples" ADD COLUMN "gl_row_id" text;--> statement-breakpoint
ALTER TABLE "csa_samples" ADD COLUMN "control_results" jsonb;--> statement-breakpoint
ALTER TABLE "csa_schedules" ADD CONSTRAINT "csa_schedules_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csa_schedules" ADD CONSTRAINT "csa_schedules_bpm_process_id_bpm_processes_id_fk" FOREIGN KEY ("bpm_process_id") REFERENCES "public"."bpm_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csa_schedules" ADD CONSTRAINT "csa_schedules_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_assertions" ADD CONSTRAINT "account_assertions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aggregate_deficiencies" ADD CONSTRAINT "aggregate_deficiencies_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bpm_diagrams" ADD CONSTRAINT "bpm_diagrams_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bpm_node_rcms" ADD CONSTRAINT "bpm_node_rcms_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bpm_processes" ADD CONSTRAINT "bpm_processes_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controls" ADD CONSTRAINT "controls_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csa_records" ADD CONSTRAINT "csa_records_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csa_records" ADD CONSTRAINT "csa_records_bpm_process_id_bpm_processes_id_fk" FOREIGN KEY ("bpm_process_id") REFERENCES "public"."bpm_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csa_samples" ADD CONSTRAINT "csa_samples_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csa_samples" ADD CONSTRAINT "csa_samples_gl_row_id_gl_rows_id_fk" FOREIGN KEY ("gl_row_id") REFERENCES "public"."gl_rows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deficiencies" ADD CONSTRAINT "deficiencies_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_rows" ADD CONSTRAINT "gl_rows_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_snapshots" ADD CONSTRAINT "gl_snapshots_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materiality" ADD CONSTRAINT "materiality_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rcm_controls" ADD CONSTRAINT "rcm_controls_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rcms" ADD CONSTRAINT "rcms_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_account_applications" ADD CONSTRAINT "simulation_account_applications_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_records" ADD CONSTRAINT "test_records_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;