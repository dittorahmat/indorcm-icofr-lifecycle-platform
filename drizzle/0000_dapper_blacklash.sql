CREATE TYPE "public"."owner_acceptance" AS ENUM('Accepted', 'Rejected');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "action_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"deficiency_id" text,
	"description" text NOT NULL,
	"owner_id" text,
	"due_date" timestamp,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status_itgc" text,
	"criticality" text
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text,
	"user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"description_before" text,
	"description_after" text,
	"data_before" jsonb,
	"data_after" jsonb,
	"timestamp" timestamp DEFAULT now(),
	"effective_date" timestamp,
	"is_regulatory" boolean DEFAULT false,
	"approved_by" text
);
--> statement-breakpoint
CREATE TABLE "bpm_processes" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"no_gl" text NOT NULL,
	"fsli_name" text,
	"name" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "controls" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"rcm_id" text,
	"department_id" text,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_id" text,
	"type" text,
	"nature" text,
	"frequency" text,
	"bpm_status" text,
	"fsli_codes" jsonb,
	"business_process_lvl1" text,
	"business_process_lvl2" text,
	"sub_process" text,
	"location" text,
	"is_fraud_related" boolean DEFAULT false,
	"is_key_control" boolean DEFAULT false,
	"ipo" jsonb,
	"assertions" jsonb,
	"supporting_docs" text,
	"reference" text,
	"application_id" text
);
--> statement-breakpoint
CREATE TABLE "csa_records" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"control_id" text NOT NULL,
	"period" text NOT NULL,
	"assessment_date" timestamp NOT NULL,
	"assessed_by" text,
	"result" text NOT NULL,
	"comments" text
);
--> statement-breakpoint
CREATE TABLE "deficiencies" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"control_id" text,
	"description" text NOT NULL,
	"severity" text NOT NULL,
	"identified_date" timestamp,
	"identified_by" text,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gl_rows" (
	"id" text PRIMARY KEY NOT NULL,
	"snapshot_id" text NOT NULL,
	"organizationId" text NOT NULL,
	"ymd" text,
	"entity_code" text,
	"no_gl" text,
	"gl_desc" text,
	"currency" text,
	"balance" double precision,
	"fsli_code" text,
	"fsli_name" text,
	"category" text,
	"sub_kategori" text,
	"assigned_department_id" text,
	"owner_acceptance" "owner_acceptance"
);
--> statement-breakpoint
CREATE TABLE "gl_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"filename" text NOT NULL,
	"uploadDate" timestamp NOT NULL,
	"status" text NOT NULL,
	"isActive" boolean DEFAULT false,
	"benchmarkFsliNames" jsonb
);
--> statement-breakpoint
CREATE TABLE "materiality" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"year" integer NOT NULL,
	"overall_materiality" double precision,
	"performance_materiality" double precision,
	"benchmark" text,
	"percentage" double precision,
	"haircut" double precision
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"userId" text NOT NULL,
	"role" text NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"createdAt" timestamp NOT NULL,
	"metadata" jsonb,
	"entityCode" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "rcms" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"process" text NOT NULL,
	"sub_process" text NOT NULL,
	"risk_description" text NOT NULL,
	"status" text NOT NULL,
	"audit_trail" jsonb
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	"activeOrganizationId" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "simulations" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"name" text NOT NULL,
	"year" integer NOT NULL,
	"status" text NOT NULL,
	"gl_snapshot_id" text,
	"om_value" double precision,
	"pm_value" double precision,
	"location_count" integer,
	"om_percentage" double precision,
	"haircut_percentage" double precision,
	"basis" text,
	"assessment_data" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "test_records" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"control_id" text NOT NULL,
	"test_type" text NOT NULL,
	"method" text,
	"period" text NOT NULL,
	"test_date" timestamp NOT NULL,
	"tested_by" text,
	"result" text NOT NULL,
	"evaluation_attributes" jsonb
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"role" text,
	"level" text,
	"departmentId" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_deficiency_id_deficiencies_id_fk" FOREIGN KEY ("deficiency_id") REFERENCES "public"."deficiencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bpm_processes" ADD CONSTRAINT "bpm_processes_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bpm_processes" ADD CONSTRAINT "bpm_processes_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controls" ADD CONSTRAINT "controls_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controls" ADD CONSTRAINT "controls_rcm_id_rcms_id_fk" FOREIGN KEY ("rcm_id") REFERENCES "public"."rcms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controls" ADD CONSTRAINT "controls_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controls" ADD CONSTRAINT "controls_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csa_records" ADD CONSTRAINT "csa_records_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csa_records" ADD CONSTRAINT "csa_records_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csa_records" ADD CONSTRAINT "csa_records_assessed_by_user_id_fk" FOREIGN KEY ("assessed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deficiencies" ADD CONSTRAINT "deficiencies_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deficiencies" ADD CONSTRAINT "deficiencies_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_rows" ADD CONSTRAINT "gl_rows_snapshot_id_gl_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."gl_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_rows" ADD CONSTRAINT "gl_rows_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_rows" ADD CONSTRAINT "gl_rows_assigned_department_id_departments_id_fk" FOREIGN KEY ("assigned_department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_snapshots" ADD CONSTRAINT "gl_snapshots_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materiality" ADD CONSTRAINT "materiality_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rcms" ADD CONSTRAINT "rcms_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_gl_snapshot_id_gl_snapshots_id_fk" FOREIGN KEY ("gl_snapshot_id") REFERENCES "public"."gl_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_records" ADD CONSTRAINT "test_records_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_records" ADD CONSTRAINT "test_records_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_records" ADD CONSTRAINT "test_records_tested_by_user_id_fk" FOREIGN KEY ("tested_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;